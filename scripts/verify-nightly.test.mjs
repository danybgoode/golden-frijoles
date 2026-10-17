import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify,
  findingBranch,
  findingDecision,
  groupFindings,
  parseRows,
  planShadow,
  seedPath,
  seedText,
  shadowWrites,
  staleTraces,
  nightlyExitCode,
  SHADOW_PUBLISH,
  tracePath,
} from './verify-nightly.mjs';

const row = (o) => ({ mode: 'bmc', module: 'outbox_timed', depth: '10', seconds: '1', itf: '', ...o });

test('classify: an [ok] row that went [violation] is a finding; anything else off-table is the check breaking', () => {
  const rows = [
    row({ invariant: 'noVanish', expected: '[ok]', got: '[ok]', status: 'match' }),
    row({ invariant: 'noOrphan', expected: '[ok]', got: '[violation]', status: 'MISMATCH' }),
    row({ invariant: 'sendsBounded', expected: '[violation]', got: '[ok]', status: 'MISMATCH' }),
    row({ invariant: 'attemptsBounded', expected: '[ok]', got: 'none', status: 'MISMATCH' }),
  ];
  const { findings, broken } = classify(rows);
  assert.deepEqual(
    findings.map((r) => r.invariant),
    ['noOrphan']
  );
  assert.deepEqual(
    broken.map((r) => r.invariant),
    ['sendsBounded', 'attemptsBounded']
  );
});

test('classify: a green night has nothing to file; no rows at all is broken, never green', () => {
  assert.deepEqual(classify([row({ invariant: 'a', expected: '[ok]', got: '[ok]', status: 'match' })]), {
    findings: [],
    broken: [],
  });
  assert.equal(classify([]).broken.length, 1);
});

test("check.sh's --rows format parses, including the trace column", () => {
  const [r] = parseRows(
    'bmc\toutbox_timed\tnoOrphan\t10\t[ok]\t[violation]\tMISMATCH\t42\t/tmp/t.itf.json\n'
  );
  assert.deepEqual(r, {
    mode: 'bmc',
    module: 'outbox_timed',
    invariant: 'noOrphan',
    depth: '10',
    expected: '[ok]',
    got: '[violation]',
    status: 'MISMATCH',
    seconds: '42',
    itf: '/tmp/t.itf.json',
  });
});

test('already filed: a seed on main files nothing, EVEN while its merged branch survives (verifier #387)', () => {
  const rows = [row({ invariant: 'noOrphan', itf: '/t/a' })];
  const has = () => true;
  assert.equal(
    findingDecision({ rows, branchExists: true, seedOnMain: true, traceExists: has }).state,
    'on-main'
  );
  assert.deepEqual(
    findingDecision({ rows, branchExists: true, seedOnMain: true, traceExists: has }).file,
    []
  );
  assert.equal(
    findingDecision({ rows, branchExists: false, seedOnMain: true, traceExists: has }).state,
    'on-main'
  );
  assert.equal(
    findingDecision({ rows, branchExists: true, seedOnMain: false, traceExists: has }).state,
    'branch'
  );
  assert.equal(
    findingDecision({ rows, branchExists: false, seedOnMain: false, traceExists: has }).state,
    'new'
  );
});

test('a row with no trace is not filed and is reported (the run goes red); the traced rows still file', () => {
  const rows = [
    row({ invariant: 'noOrphan', itf: '/t/a' }),
    row({ invariant: 'noOrphan', mode: 'sim', itf: '' }),
  ];
  const d = findingDecision({
    rows,
    branchExists: false,
    seedOnMain: false,
    traceExists: (p) => p === '/t/a',
  });
  assert.equal(d.file.length, 1);
  assert.equal(d.untraced.length, 1);
});

test('one filing per invariant: sim + bmc rows and both modules land in ONE seed, with a trace each', () => {
  const findings = [
    row({ invariant: 'noOrphan', mode: 'sim', module: 'outbox_timed' }),
    row({ invariant: 'noOrphan', mode: 'bmc', module: 'outbox_timed' }),
    row({ invariant: 'noOrphan', mode: 'sim', module: 'outbox_untimed' }),
    row({ invariant: 'noVanish', mode: 'sim', module: 'outbox_timed' }),
  ];
  const { groups } = groupFindings(findings);
  assert.deepEqual(
    groups.map((g) => [g.invariant, g.rows.length]),
    [
      ['noOrphan', 3],
      ['noVanish', 1],
    ]
  );
  const paths = groups[0].rows.map(tracePath);
  assert.equal(
    new Set(paths).size,
    3,
    'the mode is in the trace name, so sim and bmc never overwrite each other'
  );
  const seed = seedText(groups[0], ['s1', 's2', 's3'], { date: '2026-10-20', runUrl: 'u' });
  for (const p of paths) assert.ok(seed.includes(p));
  assert.match(seed, /### `sim` · `outbox_untimed`\n\n```\ns3\n```/);
});

test('an invariant name that is not a plain identifier is never turned into a ref or a path', () => {
  const { groups, unsafe } = groupFindings([row({ invariant: '../../main' }), row({ invariant: 'a:b' })]);
  assert.equal(groups.length, 0);
  assert.equal(unsafe.length, 2);
});

test('one branch and one seed per invariant, kebab-cased, never main', () => {
  const r = row({ invariant: 'noSendAfterTerminal' });
  assert.equal(findingBranch(r), 'claude/verify-no-send-after-terminal');
  assert.equal(seedPath(r), 'Roadmap/00-ideas/seeds/verify-no-send-after-terminal.md');
  const seed = seedText({ invariant: r.invariant, rows: [r] }, ['step 1\nstep 2\n'], {
    date: 'd',
    runUrl: 'u',
  });
  assert.match(seed, /^---\ntitle: .*\nslug: verify-no-send-after-terminal\nstatus: raw\n/);
  assert.match(seed, /```\nstep 1\nstep 2\n```/);
});

// ── the shadow plan and the one ping ───────────────────────────────────────────────────────────────────────────────

const SINCE = '2026-10-17T00:00:00Z';
const pr = (n) => ({
  number: n,
  title: `PR ${n}`,
  body: 'Verify depth: light',
  mergedAt: `2026-11-${String(1 + (n % 28)).padStart(2, '0')}T00:00:${String(n % 60).padStart(2, '0')}Z`,
  headRefName: `feat/${n}`,
});
const ask = async () => ({ ok: true, answers: { verify_depth: { choice: 'light' } } });
const diffOf = () => ({ stat: '', diff: '' });

test('no header on main: skip, ask nothing', async () => {
  let asked = 0;
  const plan = await planShadow({
    main: { log: null, marker: null },
    branch: null,
    merged: [pr(1)],
    diffOf,
    ask: async () => (asked++, ask()),
  });
  assert.ok(plan.skip);
  assert.equal(asked, 0);
});

test('no newly merged PR: nothing to write', async () => {
  const plan = await planShadow({
    main: { log: { since: SINCE, rows: [{ pr: 1, jev: 'light', builder_label: 'light' }] }, marker: null },
    branch: null,
    merged: [pr(1)],
    diffOf,
    ask,
  });
  assert.equal(plan, null);
});

test('the branch carries rows main lacks; nothing is asked twice', async () => {
  let asked = 0;
  const plan = await planShadow({
    main: { log: { since: SINCE, rows: [{ pr: 1 }] }, marker: null },
    branch: { log: { since: SINCE, rows: [{ pr: 1 }, { pr: 2 }] }, marker: null },
    merged: [pr(1), pr(2), pr(3)],
    diffOf,
    ask: async () => (asked++, ask()),
  });
  assert.equal(asked, 1);
  assert.deepEqual(
    plan.log.rows.map((r) => r.pr),
    [1, 2, 3]
  );
});

// One night the way shadow() runs it: plan, deliver (or not), then shadowWrites decides the marker the branch keeps.
async function night({ main, branch, merged, delivered = true }) {
  const plan = await planShadow({ main, branch, merged: [...merged], diffOf, ask });
  if (!plan) return { branch, pinged: false };
  const { marker, writeMarker } = shadowWrites({ plan, mainMarker: main.marker, delivered, date: 'd' });
  return {
    branch: { log: plan.log, marker: writeMarker ? marker : null },
    pinged: plan.ping && delivered,
    plan,
  };
}

test('29 → 30 → 31 labelled PRs: exactly one ping, at 30', async () => {
  const main = { log: { since: SINCE, rows: [] }, marker: null };
  let branch = null;
  const merged = [];
  const pings = [];
  for (let n = 1; n <= 31; n++) {
    merged.push(pr(n));
    if (n < 29) continue; // the first 28 merge before the nights this test watches
    const out = await night({ main, branch, merged });
    if (out.pinged) pings.push(out.plan.report.counted);
    branch = out.branch;
  }
  assert.deepEqual(pings, [30]);
  assert.equal(branch.log.rows.length, 31);
  assert.equal(branch.marker.counted, 30, 'the marker records the count it pinged at');
});

test('an undelivered ping writes no marker, and is retried the next night even with no new merge', async () => {
  const main = { log: { since: SINCE, rows: [] }, marker: null };
  const merged = Array.from({ length: 30 }, (_, i) => pr(i + 1));
  const first = await night({ main, branch: null, merged, delivered: false });
  assert.equal(first.pinged, false);
  assert.equal(first.branch.marker, null);
  const second = await night({ main, branch: first.branch, merged, delivered: true });
  assert.equal(second.pinged, true, 'nothing new merged, but the owed ping is retried');
  assert.ok(second.branch.marker);
  const third = await night({ main, branch: second.branch, merged });
  assert.equal(third.pinged, false);
});

test('shadowWrites: once main has the marker, the branch stops re-writing it', () => {
  const plan = { ping: false, marker: { pinged_at: 'd' }, report: {} };
  assert.equal(
    shadowWrites({ plan, mainMarker: { pinged_at: 'd' }, delivered: false, date: 'x' }).writeMarker,
    false
  );
  assert.equal(shadowWrites({ plan, mainMarker: null, delivered: false, date: 'x' }).writeMarker, true);
});

test('a marker already on main never pings again, whatever the count', async () => {
  const rows = Array.from({ length: 40 }, (_, i) => ({ pr: i + 1, jev: 'light', builder_label: 'light' }));
  const plan = await planShadow({
    main: { log: { since: SINCE, rows }, marker: { pinged_at: 'd' } },
    branch: null,
    merged: [pr(41)],
    diffOf,
    ask,
  });
  assert.equal(plan.ping, false);
});

test('verify-nightly.yml runs on a schedule or by hand only, never on a PR, with its own timeout', async () => {
  const { readFileSync } = await import('node:fs');
  const yml = readFileSync(new URL('../.github/workflows/verify-nightly.yml', import.meta.url), 'utf8');
  const on = yml.slice(yml.indexOf('\non:'), yml.indexOf('\npermissions:'));
  assert.match(on, /\n {2}schedule:/);
  assert.match(on, /\n {2}workflow_dispatch:/);
  assert.doesNotMatch(on, /pull_request|push:/);
  assert.match(yml, /timeout-minutes: \d+/);
  assert.match(yml, /node scripts\/verify-nightly\.mjs --rows/);
});

test('an updated finding branch drops the traces tonight no longer produces, and only for this invariant', () => {
  const existing = [
    'nightly-bmc-outbox_timed-noOrphan.itf.json',
    'nightly-sim-outbox_timed-noOrphan.itf.json',
    'nightly-sim-outbox_timed-noVanish.itf.json',
    'stranded-timed.itf.json',
  ];
  const current = [tracePath(row({ invariant: 'noOrphan', mode: 'sim' }))];
  assert.deepEqual(staleTraces(existing, 'noOrphan', current), [
    'nightly-bmc-outbox_timed-noOrphan.itf.json',
  ]);
});

test('the exit code: red on a broken check or an unfiled finding, green otherwise', () => {
  assert.equal(nightlyExitCode({ broken: [], red: false }), 0);
  assert.equal(nightlyExitCode({ broken: [{}], red: false }), 1);
  assert.equal(nightlyExitCode({ broken: [], red: true }), 1);
});

test('the call sites: main() exits with nightlyExitCode; the shadow is published by SHADOW_PUBLISH; filing never forces', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('./verify-nightly.mjs', import.meta.url), 'utf8');
  assert.deepEqual(SHADOW_PUBLISH, { branch: 'claude/verify-jev-shadow', from: 'origin/main', force: true });
  assert.match(src, /process\.exit\(nightlyExitCode\(\{ broken, red: ctx\.red \}\)\)/);
  assert.match(src, /publish\(sh, \{\n\s+\.\.\.SHADOW_PUBLISH,/);
  assert.equal((src.match(/force: true/g) ?? []).length, 1, 'only SHADOW_PUBLISH force-pushes');
  assert.match(src, /\[`HEAD:refs\/heads\/\$\{branch\}`\]|`HEAD:refs\/heads\/\$\{branch\}`/);
});
