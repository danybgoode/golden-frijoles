#!/usr/bin/env node
// verify-nightly — what the nightly deep check found, filed; and Jev's verify-depth calls, logged
// (verify-module S2.1–S2.3, epic README D7, D9, D10). Run by .github/workflows/verify-nightly.yml after
// `verify/quint/check.sh --rows … --itf-dir …`; never on a pull request.
//
//   node scripts/verify-nightly.mjs --rows <rows.tsv> --itf-dir <dir> [--no-shadow] [--dry-run]
//
// Findings (D7). A row that expected [ok] and got [violation] is a finding. It goes to ONE branch per invariant,
// `claude/verify-<invariant>`: a raw seed with the trace's summary, plus the trace. Already filed = that branch exists
// on the remote (a repeat pushes to it and opens a PR only if none is open), or the seed is already on main (nothing
// to do). A row with no result, or an expected violation that went missing, is the CHECK breaking, not a finding: the
// run goes red and files nothing for it. A green night writes nothing. Nothing is ever pushed to main.
//
// Shadow (D9, D10). Every PR merged into main since the log's `since`, not yet logged, gets Jev's verify-depth call
// next to the builder's `Verify depth:` label (and an `off` rule label when it touches no spec path; logged rows are
// backfilled the same way, verify-labels S1.1), appended to verify/jev-shadow.jsonl on `claude/verify-jev-shadow`
// (rebuilt from main each night, carrying the rows main doesn't have yet). The first time the counted rows reach 30,
// one Telegram ping, a marker and an owed line ride in the same PR.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
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
  ruleLabel,
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
// An invariant name becomes a git ref and a file name, so only a plain identifier may (agy security lens, #387).
export const SAFE_INVARIANT = /^[A-Za-z][A-Za-z0-9]{0,63}$/;
// Every row field that reaches a ref or a path is checked, not just the invariant (agy security lens, #387 round 2).
export const SAFE_MODULE = /^[a-z][a-z0-9_]{0,63}$/;
export const SAFE_MODES = ['sim', 'bmc'];
export const safeRow = (r) =>
  SAFE_INVARIANT.test(r.invariant ?? '') && SAFE_MODULE.test(r.module ?? '') && SAFE_MODES.includes(r.mode);

/** A trace is read only from inside the run's --itf-dir: a row's itf column never names any other file. */
export const insideDir = (dir, path) => {
  if (!dir || !path) return false;
  const base = resolve(dir) + sep;
  return resolve(path).startsWith(base);
};
export const findingSlug = (row) => `verify-${kebab(row.invariant)}`;
export const findingBranch = (row) => `claude/${findingSlug(row)}`;
export const seedPath = (row) => `Roadmap/00-ideas/seeds/${findingSlug(row)}.md`;
export const tracePath = (row) =>
  `verify/quint/traces/nightly-${row.mode}-${row.module}-${row.invariant}.itf.json`;

/**
 * One filing per invariant: a real violation usually shows in a sim row AND a bmc row, often in both timing modes,
 * and they belong in one seed (verifier #387). An unsafe name is not filed; it is reported as broken.
 */
export function groupFindings(findings) {
  const groups = new Map();
  const unsafe = [];
  for (const r of findings) {
    if (!safeRow(r)) unsafe.push(r);
    else groups.set(r.invariant, [...(groups.get(r.invariant) ?? []), r]);
  }
  return { groups: [...groups.entries()].map(([invariant, rows]) => ({ invariant, rows })), unsafe };
}

/**
 * What to do with one invariant tonight. A seed already on main is filed, whatever branches survive the merge (this
 * repo keeps merged branches, so checking the branch first re-filed a merged finding every night — verifier #387).
 * Rows without a trace are not filed and turn the run red.
 *   → { state: 'on-main' | 'branch' | 'new', file: rows to file, untraced: rows with no trace }
 */
export function findingDecision({ rows, branchExists, seedOnMain, traceExists }) {
  const state = seedOnMain ? 'on-main' : branchExists ? 'branch' : 'new';
  if (state === 'on-main') return { state, file: [], untraced: [] };
  return {
    state,
    file: rows.filter((r) => r.itf && traceExists(r.itf)),
    untraced: rows.filter((r) => !r.itf || !traceExists(r.itf)),
  };
}

/**
 * The traces a finding branch still carries for this invariant that tonight's rows no longer produce — removed on an
 * update, so the seed and its traces never disagree (verifier #387).
 */
export function staleTraces(existing, invariant, current) {
  const keep = new Set(current.map((p) => p.split('/').pop()));
  return existing.filter(
    (f) => f.startsWith('nightly-') && f.endsWith(`-${invariant}.itf.json`) && !keep.has(f)
  );
}

/** Red when the check broke or a finding could not be filed; green otherwise. main() always exits with this. */
export const nightlyExitCode = ({ broken, red }) => (broken.length > 0 || red ? 1 : 0);

/**
 * How the shadow branch is published: rebuilt from main and force-pushed every night, so rows main has are never
 * duplicated and rows only the branch has are carried by planShadow, never lost to a stale base.
 */
export const SHADOW_PUBLISH = { branch: SHADOW_BRANCH, from: 'origin/main', force: true };

export function seedText({ invariant, rows }, summaries, { date, runUrl }) {
  const first = rows[0];
  const lines = rows
    .map(
      (r) =>
        `- \`${r.mode}\` \`${r.module}\`, depth ${r.depth}: expected \`${r.expected}\`, got \`${r.got}\` — trace \`${tracePath(r)}\``
    )
    .join('\n');
  const traces = rows
    .map((r, i) => `### \`${r.mode}\` · \`${r.module}\`\n\n\`\`\`\n${summaries[i].trim()}\n\`\`\``)
    .join('\n\n');
  return `---
title: "Nightly model check: ${invariant} violated"
slug: ${findingSlug(first)}
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

# Raw — the nightly model check found \`${invariant}\` violated

Filed by \`verify-nightly.yml\` (verify-module S2.1) on ${date}. Run: ${runUrl}

${lines}

**Before anything else, decide which is wrong: the code or the model.** The model mirrors the functions pinned in
\`verify/pins.json\`; a model that no longer describes the code is fixed in \`verify/\`, and a real bug is shaped from
here with \`refine\`. Re-print a trace with \`node verify/quint/summarize-itf.mjs <trace>\`.

## The counterexamples, one step per line

${traces}
`;
}

// ── Shadow ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Plan tonight's shadow update. PURE apart from `ask` (Jev) and `diffOf` (git), both injected.
 *   main    — { log: {since, rows} | null, marker: object | null }       what main has
 *   branch  — { log: {since, rows} | null, marker: object | null } | null what the open shadow branch has
 *   merged  — gh's merged PRs
 * Returns { skip } when the log isn't set up on main, null when nothing is new and no ping is owed, else
 * { log, marker, ping, report, fresh }
 * — `ping` true only the first time the counted rows reach the threshold with no marker on main or the branch.
 */
export async function planShadow({ main, branch, merged, ask, diffOf }) {
  if (!main.log?.since) return { skip: `${LOG_PATH} has no "since" header on main` };
  const onMain = new Set(main.log.rows.map((r) => r.pr));
  const carried = (branch?.log?.rows ?? []).filter((r) => !onMain.has(r.pr));
  // A main row the branch already gave a rule label keeps it, so a night with nothing new writes nothing even before
  // the shadow PR merges (verifier, #435).
  const branchLabel = new Map(
    (branch?.log?.rows ?? []).filter((r) => 'rule_label' in r).map((r) => [r.pr, r.rule_label])
  );
  const mainRows = main.log.rows.map((r) =>
    !('rule_label' in r) && branchLabel.has(r.pr) ? { ...r, rule_label: branchLabel.get(r.pr) } : r
  );
  // A row logged before rule labels existed (or whose spec files could not be read) gets its rule label now, from
  // the same diff a fresh row uses. Idempotent: a row that has the key is never recomputed (verify-labels S1.1).
  let backfilled = 0;
  const byNumber = new Map(merged.map((p) => [p.number, p]));
  const logged = [...mainRows, ...carried].map((row) => {
    if ('rule_label' in row || !byNumber.has(row.pr)) return row;
    const { specFiles } = diffOf(byNumber.get(row.pr));
    if (!Array.isArray(specFiles)) return row;
    backfilled++;
    return { ...row, rule_label: ruleLabel(specFiles) };
  });
  const fresh = [];
  for (const pr of pendingPrs(merged, { since: main.log.since, logged })) {
    const { specFiles, ...state } = diffOf(pr);
    const { req } = jevRequest({ title: pr.title, ...state });
    fresh.push(shadowRow(pr, await ask(req), parseLabel(pr.body), specFiles));
  }
  const rows = [...logged, ...fresh];
  const r = report(rows);
  const marker = main.marker ?? branch?.marker ?? null;
  const ping = decidePing({ counted: r.counted, markerExists: Boolean(marker) });
  // Nothing new, nothing backfilled and no ping owed: nothing to write. An undelivered ping is retried even on a night
  // with no merge.
  if (fresh.length === 0 && backfilled === 0 && !ping) return null;
  return { log: { since: main.log.since, rows }, marker, ping, report: r, fresh, backfilled };
}

/**
 * After the ping (if any): the marker to keep, and whether the marker + owed line must be written to the branch.
 * The marker exists only once a ping was DELIVERED; it rides the shadow branch until main has it.
 */
export function shadowWrites({ plan, mainMarker, delivered, date }) {
  const marker = plan.ping && delivered ? { pinged_at: date, ...plan.report } : plan.marker;
  return { marker, writeMarker: Boolean(marker) && !mainMarker };
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
    for (const gone of paths.remove?.() ?? []) sh.run('git', ['rm', '-q', '--', gone]);
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
  const { groups, unsafe } = groupFindings(findings);
  for (const r of unsafe) {
    console.log(`finding with an unsafe invariant name "${r.invariant}" — not filed; the run goes red`);
    ctx.red = true;
  }
  for (const group of groups) {
    const head = group.rows[0];
    const branch = findingBranch(head);
    const decision = findingDecision({
      rows: group.rows,
      branchExists: Boolean(sh.tryRun('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch])),
      seedOnMain: sh.tryRun('git', ['cat-file', '-e', `origin/main:${seedPath(head)}`]) !== null,
      traceExists: (p) => insideDir(ctx.itfDir, p) && existsSync(p),
    });
    console.log(`finding: ${group.invariant} (${group.rows.length} row(s)) — ${decision.state}`);
    for (const r of decision.untraced) {
      console.log(`  no trace for ${r.mode} ${r.module} at "${r.itf}" — not filed; the run goes red`);
      ctx.red = true;
    }
    if (decision.file.length === 0) continue;
    if (decision.state === 'branch')
      sh.run('git', ['fetch', '-q', 'origin', `+${branch}:refs/remotes/origin/${branch}`]);
    const filed = { invariant: group.invariant, rows: decision.file };
    const traces = filed.rows.map((r) => readFileSync(r.itf, 'utf8'));
    const summaries = filed.rows.map((r) => sh.run('node', ['verify/quint/summarize-itf.mjs', r.itf]));
    publish(sh, {
      branch,
      from: decision.state === 'branch' ? `origin/${branch}` : 'origin/main',
      force: false,
      home: ctx.home,
      dryRun: ctx.dryRun,
      paths: {
        write: [
          ...filed.rows.map((r, i) => () => put(tracePath(r), traces[i])),
          () => put(seedPath(head), seedText(filed, summaries, ctx)),
        ],
        add: [...filed.rows.map(tracePath), seedPath(head)],
        remove: () => {
          const dir = 'verify/quint/traces';
          const existing = existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)) : [];
          return staleTraces(existing, group.invariant, filed.rows.map(tracePath)).map((f) => `${dir}/${f}`);
        },
      },
      message: `chore(verify): nightly — ${group.invariant} violated (${ctx.date}) [risk LOW]`,
      title: `verify: nightly model check found ${group.invariant} violated`,
      body:
        `The nightly model check (\`verify-nightly.yml\`, verify-module S2.1) found \`${group.invariant}\` violated ` +
        `in ${filed.rows.length} row(s). This PR adds a raw seed and the traces; it changes no code.\n\n` +
        `Run: ${ctx.runUrl}\n\nDecide first: is the code wrong, or the model? (seed: \`${seedPath(head)}\`)\n\n` +
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
      'shadow: Jev cannot be asked (egress off or no TYPESAFE_API_KEY) — nothing logged; the next run retries'
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
    if (!mc) return { stat: '', diff: '', specFiles: null };
    const names = sh.tryRun('git', ['diff', '--name-only', `${mc}^1`, mc, '--', ...PATHS]);
    return {
      // The spec files it touched, for the rule label; null (not []) when git could not say (verify-labels S1.1).
      specFiles: names === null ? null : names.split('\n').filter(Boolean),
      // Capped: Jev's whole state has a budget, and a 500-file stat would crowd out the diff that matters.
      stat: (sh.tryRun('git', ['diff', '--stat', `${mc}^1`, mc]) ?? '').slice(0, 20_000),
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
    console.log(
      `shadow: #${r.pr} jev=${r.jev ?? `— (${r.jev_error})`} builder=${r.builder_label ?? '—'} rule=${r.rule_label ?? '—'}`
    );
  if (plan.backfilled) console.log(`shadow: ${plan.backfilled} logged row(s) given a rule label`);
  console.log(formatReport(plan.report));

  const delivered = plan.ping ? await ctx.notify(pingText(plan.report)) : false;
  if (plan.ping && !delivered)
    console.log('shadow: the 30 ping was NOT delivered — no marker, so the next run tries again');
  const { marker, writeMarker } = shadowWrites({ plan, mainMarker: main.marker, delivered, date: ctx.date });
  const write = [() => put(LOG_PATH, serialiseLog(plan.log))];
  const add = [LOG_PATH];
  // The marker and its owed line travel together, and are re-applied each night until the shadow PR merges.
  if (writeMarker) {
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
    ...SHADOW_PUBLISH,
    home: ctx.home,
    dryRun: ctx.dryRun,
    paths: { write, add },
    message: `chore(verify): Jev verify-depth shadow log — ${plan.log.rows.length} PR(s) (${ctx.date}) [risk LOW]`,
    title: 'verify: Jev verify-depth shadow log (nightly)',
    body:
      "The nightly appends Jev's verify-depth call for each newly merged PR beside the builder's `Verify depth:` " +
      'label (verify-module S2.2), and labels a PR that touches no spec path `off` by rule (verify-labels D1). Data only: nothing gates on it and nothing comments.\n\n' +
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

  ctx.itfDir = opt('--itf-dir');
  const rowsPath = opt('--rows');
  const rows = rowsPath && existsSync(rowsPath) ? parseRows(readFileSync(rowsPath, 'utf8')) : [];
  const { findings, broken } = classify(rows);
  console.log(`deep check: ${rows.length} row(s), ${findings.length} finding(s), ${broken.length} broken`);
  for (const b of broken)
    console.log(`  BROKEN: ${b.module ?? ''} ${b.invariant} expected ${b.expected ?? '—'} got ${b.got}`);
  fileFindings(sh, findings, ctx);
  if (!args.includes('--no-shadow')) await shadow(sh, ctx);
  process.exit(nightlyExitCode({ broken, red: ctx.red }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(`verify-nightly: ${e.stack ?? e}`);
    process.exit(1);
  });
}
