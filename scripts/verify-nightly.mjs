#!/usr/bin/env node
// verify-nightly — what the nightly deep check found, filed; and Jev's verify-depth calls, logged
// (verify-module S2.1–S2.3, epic README D7, D9, D10). Run by .github/workflows/verify-nightly.yml after
// `verify/quint/check.sh --rows … --itf-dir …`; never on a pull request.
//
//   node scripts/verify-nightly.mjs --rows <rows.tsv> [--no-shadow] [--dry-run]
//
// Findings (D7). A row that expected [ok] and got [violation] is a finding. It goes to ONE branch per invariant,
// `claude/verify-<invariant>`: a raw seed with the trace's summary, plus the trace. Already filed = that branch exists
// on the remote (a repeat pushes to it and opens a PR only if none is open), or the seed is already on main (nothing
// to do). A row with no result, or an expected violation that went missing, is the CHECK breaking, not a finding: the
// run goes red and files nothing for it. A green night writes nothing. Nothing is ever pushed to main.
//
// Shadow (D9, D10). Every PR merged into main since the log's `since`, not yet logged, gets Jev's verify-depth call
// next to the builder's `Verify depth:` label, appended to verify/jev-shadow.jsonl on `claude/verify-jev-shadow`
// (rebuilt from main each night, carrying the rows main doesn't have yet). The first time the counted rows reach 30,
// one Telegram ping, a marker and an owed line ride in the same PR.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOG_PATH,
  MARKER_PATH,
  SHADOW_BRANCH,
  PATHS,
  parseLabel,
  parseLog,
  serialiseLog,
  pendingPrs,
  jevRequest,
  shadowRow,
  report,
  formatReport,
  decidePing,
  pingText,
  owedLine,
  addOwedLine,
} from './verify-shadow.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const RETRO_PATH = 'Roadmap/09-platform-infra/verify-module/RETROSPECTIVE.md';
const GENERATED = [
  'Roadmap/00-ideas/BUILD-ORDER.md',
  'Roadmap/00-ideas/OWED-LEDGER.md',
  'Roadmap/00-ideas/OWED-LEDGER.json',
];

// ── Findings ──────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUMNS = ['mode', 'module', 'invariant', 'depth', 'expected', 'got', 'status', 'seconds', 'itf'];

/** check.sh's --rows file: one tab-separated row per check. */
export const parseRows = (tsv) =>
  String(tsv ?? '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => Object.fromEntries(l.split('\t').map((v, i) => [COLUMNS[i], v])));

/**
 * findings = a property that should hold and doesn't. broken = the check itself failed: no result, or an expected
 * violation (a residual, a witness, the F2 teeth row) not found. No rows at all is broken too: a check that ran
 * nothing has not passed.
 */
export function classify(rows) {
  const findings = rows.filter(
    (r) => r.status === 'MISMATCH' && r.expected === '[ok]' && r.got === '[violation]'
  );
  const broken = rows.filter((r) => r.status !== 'match' && !findings.includes(r));
  if (rows.length === 0) broken.push({ invariant: '(none)', got: 'no rows — check.sh ran nothing' });
  return { findings, broken };
}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const findingSlug = (row) => `verify-${kebab(row.invariant)}`;
export const findingBranch = (row) => `claude/${findingSlug(row)}`;
export const seedPath = (row) => `Roadmap/00-ideas/seeds/${findingSlug(row)}.md`;
export const tracePath = (row) => `verify/quint/traces/nightly-${row.module}-${row.invariant}.itf.json`;

/** 'new' (open a branch), 'branch' (push to it), or 'on-main' (filed and merged: nothing to do). */
export const filingState = ({ branchExists, seedOnMain }) =>
  branchExists ? 'branch' : seedOnMain ? 'on-main' : 'new';

export function seedText(row, summary, { date, runUrl }) {
  return `---
title: "Nightly model check: ${row.invariant} violated in ${row.module}"
slug: ${findingSlug(row)}
status: raw
area: "09"
type: bug
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: ${date}
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — the nightly deep check found \`${row.invariant}\` violated

Filed by \`verify-nightly.yml\` (verify-module S2.1) on ${date}: the exhaustive check (\`${row.mode}\`, depth ${row.depth})
expected \`${row.expected}\` for \`${row.invariant}\` in \`${row.module}\` and got \`${row.got}\`.
Run: ${runUrl}

**Before anything else, decide which is wrong: the code or the model.** The model mirrors the functions pinned in
\`verify/pins.json\`; a model that no longer describes the code is fixed in \`verify/\`, and a real bug is shaped from
here with \`refine\`. The trace is \`${tracePath(row)}\`; re-print it with
\`node verify/quint/summarize-itf.mjs ${tracePath(row)}\`.

## The counterexample, one step per line

\`\`\`
${summary.trim()}
\`\`\`
`;
}

// ── Shadow ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Plan tonight's shadow update. PURE apart from `ask` (Jev) and `diffOf` (git), both injected.
 *   main    — { log: {since, rows} | null, marker: object | null }       what main has
 *   branch  — { log: {since, rows} | null, marker: object | null } | null what the open shadow branch has
 *   merged  — gh's merged PRs
 * Returns { skip } when the log isn't set up on main, null when no PR is new, else { log, marker, ping, report, fresh }
 * — `ping` true only the first time the counted rows reach the threshold with no marker on main or the branch.
 */
export async function planShadow({ main, branch, merged, ask, diffOf }) {
  if (!main.log?.since) return { skip: `${LOG_PATH} has no "since" header on main` };
  const onMain = new Set(main.log.rows.map((r) => r.pr));
  const carried = (branch?.log?.rows ?? []).filter((r) => !onMain.has(r.pr));
  const logged = [...main.log.rows, ...carried];
  const fresh = [];
  for (const pr of pendingPrs(merged, { since: main.log.since, logged })) {
    const { req } = jevRequest({ title: pr.title, ...diffOf(pr) });
    fresh.push(shadowRow(pr, await ask(req), parseLabel(pr.body)));
  }
  if (fresh.length === 0) return null;
  const rows = [...logged, ...fresh];
  const r = report(rows);
  const marker = main.marker ?? branch?.marker ?? null;
  const ping = decidePing({ counted: r.counted, markerExists: Boolean(marker) });
  return { log: { since: main.log.since, rows }, marker, ping, report: r, fresh };
}

// ── Side effects ──────────────────────────────────────────────────────────────────────────────────────────────────

function makeSh(dryRun) {
  const run = (cmd, args, opts = {}) =>
    execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...opts });
  const tryRun = (cmd, args) => {
    try {
      return run(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return null;
    }
  };
  const write = (cmd, args) => {
    if (dryRun) return console.log(`[dry-run] ${cmd} ${args.join(' ')}`);
    return run(cmd, args, { stdio: 'inherit' });
  };
  return { run, tryRun, write };
}

const put = (path, text) => {
  mkdirSync(dirname(join(ROOT, path)), { recursive: true });
  writeFileSync(join(ROOT, path), text);
};

/** Commit `paths` onto `branch`, push, and open a PR unless one is open. Leaves HEAD detached at `home`. */
function publish(sh, { branch, from, force, paths, message, title, body, home, dryRun }) {
  if (dryRun)
    return console.log(`[dry-run] would commit ${paths.add.join(', ')} to ${branch} (from ${from})`);
  sh.run('git', ['switch', '-q', '--force-create', branch, from]);
  try {
    for (const write of paths.write) write();
    sh.run('node', ['scripts/build-order.mjs'], { stdio: 'ignore' });
    sh.run('node', ['scripts/owed-ledger.mjs'], { stdio: 'ignore' });
    sh.run('git', ['add', '--', ...paths.add, ...GENERATED.filter((p) => existsSync(join(ROOT, p)))]);
    if (sh.run('git', ['diff', '--cached', '--name-only']).trim() === '') {
      console.log(`${branch}: nothing new to commit`);
      return;
    }
    sh.run('git', [
      '-c',
      'user.name=github-actions[bot]',
      '-c',
      'user.email=41898282+github-actions[bot]@users.noreply.github.com',
      'commit',
      '-q',
      '-m',
      message,
    ]);
    sh.write('git', ['push', ...(force ? ['--force'] : []), 'origin', `HEAD:refs/heads/${branch}`]);
    const open = sh.run('gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number']);
    if (JSON.parse(open).length === 0) {
      sh.write('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--body', body]);
    } else console.log(`${branch}: PR #${JSON.parse(open)[0].number} is open — updated it`);
  } finally {
    sh.run('git', ['switch', '-q', '--detach', home]);
  }
}

function fileFindings(sh, findings, ctx) {
  for (const row of findings) {
    const branch = findingBranch(row);
    const branchExists = Boolean(sh.tryRun('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch]));
    const seedOnMain = sh.tryRun('git', ['cat-file', '-e', `origin/main:${seedPath(row)}`]) !== null;
    const state = filingState({ branchExists, seedOnMain });
    console.log(`finding: ${row.module} ${row.invariant} (${row.mode}, depth ${row.depth}) — ${state}`);
    if (state === 'on-main') continue;
    if (!row.itf || !existsSync(row.itf)) {
      console.log(
        `  no trace at "${row.itf}" — filing without one is filing nothing useful; the run goes red`
      );
      ctx.red = true;
      continue;
    }
    if (branchExists) sh.run('git', ['fetch', '-q', 'origin', `+${branch}:refs/remotes/origin/${branch}`]);
    const trace = readFileSync(row.itf, 'utf8');
    const summary = sh.run('node', ['verify/quint/summarize-itf.mjs', row.itf]);
    publish(sh, {
      branch,
      from: branchExists ? `origin/${branch}` : 'origin/main',
      force: false,
      home: ctx.home,
      dryRun: ctx.dryRun,
      paths: {
        write: [() => put(tracePath(row), trace), () => put(seedPath(row), seedText(row, summary, ctx))],
        add: [tracePath(row), seedPath(row)],
      },
      message: `chore(verify): nightly — ${row.invariant} violated in ${row.module} (${ctx.date}) [risk LOW]`,
      title: `verify: nightly model check found ${row.invariant} violated (${row.module})`,
      body:
        `The nightly deep check (\`verify-nightly.yml\`, verify-module S2.1) found \`${row.invariant}\` violated in ` +
        `\`${row.module}\` at depth ${row.depth}. This PR adds a raw seed and the trace; it changes no code.\n\n` +
        `Run: ${ctx.runUrl}\n\nDecide first: is the code wrong, or the model? (seed: \`${seedPath(row)}\`)\n\n` +
        'Verify depth: off\n',
    });
  }
}

async function shadow(sh, ctx) {
  const show = (ref, path) => sh.tryRun('git', ['show', `${ref}:${path}`]);
  const branchExists = Boolean(
    sh.tryRun('git', ['ls-remote', '--exit-code', '--heads', 'origin', SHADOW_BRANCH])
  );
  if (branchExists)
    sh.run('git', ['fetch', '-q', 'origin', `+${SHADOW_BRANCH}:refs/remotes/origin/${SHADOW_BRANCH}`]);
  const read = (ref) => ({
    log: show(ref, LOG_PATH) === null ? null : parseLog(show(ref, LOG_PATH)),
    marker: show(ref, MARKER_PATH) === null ? null : JSON.parse(show(ref, MARKER_PATH)),
  });
  const main = read('origin/main');
  const branch = branchExists ? read(`origin/${SHADOW_BRANCH}`) : null;

  const { askJev, loadJevConfig } = await import('./lib/jev.mjs');
  if (loadJevConfig({ root: ROOT }).egress !== true || !process.env.TYPESAFE_API_KEY) {
    console.log(
      'shadow: Jev cannot be asked (egress off or no TYPESAFE_API_KEY) — nothing logged; tomorrow retries'
    );
    return;
  }
  const merged = JSON.parse(
    sh.run('gh', [
      'pr',
      'list',
      '--base',
      'main',
      '--state',
      'merged',
      '--limit',
      '100',
      '--json',
      'number,title,body,mergedAt,headRefName,mergeCommit',
    ])
  );
  const diffOf = (pr) => {
    const mc = pr.mergeCommit?.oid;
    if (!mc) return { stat: '', diff: '' };
    return {
      stat: sh.tryRun('git', ['diff', '--stat', `${mc}^1`, mc]) ?? '',
      diff: sh.tryRun('git', ['diff', `${mc}^1`, mc, '--', ...PATHS]) ?? '',
    };
  };
  const plan = await planShadow({
    main,
    branch,
    merged,
    diffOf,
    ask: (req) => askJev(req, { timeoutMs: 30_000 }),
  });
  if (plan?.skip) return console.log(`shadow: ${plan.skip} — nothing logged`);
  if (!plan) return console.log('shadow: no newly merged PRs to log');
  for (const r of plan.fresh)
    console.log(`shadow: #${r.pr} jev=${r.jev ?? `— (${r.jev_error})`} builder=${r.builder_label ?? '—'}`);
  console.log(formatReport(plan.report));

  let marker = plan.marker;
  if (plan.ping) {
    const delivered = await ctx.notify(pingText(plan.report));
    if (delivered) marker = { pinged_at: ctx.date, ...plan.report };
    else console.log('shadow: the 30 ping was NOT delivered — no marker, so tomorrow tries again');
  }
  const write = [() => put(LOG_PATH, serialiseLog(plan.log))];
  const add = [LOG_PATH];
  // The marker and its owed line travel together, and are re-applied each night until the shadow PR merges.
  if (marker && !main.marker) {
    write.push(() => put(MARKER_PATH, `${JSON.stringify(marker, null, 2)}\n`));
    write.push(() =>
      put(
        RETRO_PATH,
        addOwedLine(
          existsSync(join(ROOT, RETRO_PATH)) ? readFileSync(join(ROOT, RETRO_PATH), 'utf8') : '',
          owedLine(marker, marker.pinged_at)
        )
      )
    );
    add.push(MARKER_PATH, RETRO_PATH);
  }
  publish(sh, {
    branch: SHADOW_BRANCH,
    from: 'origin/main',
    force: true,
    home: ctx.home,
    dryRun: ctx.dryRun,
    paths: { write, add },
    message: `chore(verify): Jev verify-depth shadow log — ${plan.log.rows.length} PR(s) (${ctx.date}) [risk LOW]`,
    title: 'verify: Jev verify-depth shadow log (nightly)',
    body:
      "The nightly appends Jev's verify-depth call for each newly merged PR beside the builder's `Verify depth:` " +
      'label (verify-module S2.2). Data only: nothing gates on it and nothing comments.\n\n' +
      `${formatReport(plan.report)}\n\nRun: ${ctx.runUrl}\n\nVerify depth: off\n`,
  });
}

/** The ping, delivered or not. Never throws; no secrets is "not delivered", so no marker is written. */
async function notify(text, { sha, runUrl }) {
  const { buildNotification, send } = await import('./telegram-notify.mjs');
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CICD_CHAT_ID?.trim();
  if (!botToken || !chatId) return false;
  const payload = buildNotification({
    chatId,
    repo: 'golden-frijoles',
    sha,
    icon: '🔬',
    subject: text,
    meta: '',
    status: '',
    url: runUrl,
    linkLabel: 'the nightly run',
  });
  const res = await send(botToken, payload);
  if (!res?.ok) console.log(`shadow: Telegram refused the ping: ${res?.description}`);
  return Boolean(res?.ok);
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const dryRun = args.includes('--dry-run');
  const sh = makeSh(dryRun);
  const home = sh.run('git', ['rev-parse', 'HEAD']).trim();
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : '(local run)';
  const ctx = { home, runUrl, dryRun, date: new Date().toISOString().slice(0, 10), red: false };
  ctx.notify = (text) =>
    dryRun ? (console.log(`[dry-run] ping: ${text}`), false) : notify(text, { sha: home, runUrl });
  sh.run('git', ['fetch', '-q', 'origin', '+main:refs/remotes/origin/main']);

  const rowsPath = opt('--rows');
  const rows = rowsPath && existsSync(rowsPath) ? parseRows(readFileSync(rowsPath, 'utf8')) : [];
  const { findings, broken } = classify(rows);
  console.log(`deep check: ${rows.length} row(s), ${findings.length} finding(s), ${broken.length} broken`);
  for (const b of broken)
    console.log(`  BROKEN: ${b.module ?? ''} ${b.invariant} expected ${b.expected ?? '—'} got ${b.got}`);
  fileFindings(sh, findings, ctx);
  if (!args.includes('--no-shadow')) await shadow(sh, ctx);
  if (broken.length || ctx.red) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(`verify-nightly: ${e.stack ?? e}`);
    process.exit(1);
  });
}
