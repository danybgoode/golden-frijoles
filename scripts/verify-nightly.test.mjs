import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classify,
  filingState,
  findingBranch,
  parseRows,
  planShadow,
  seedPath,
  seedText,
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

test('already filed: a branch on the remote is updated; a seed on main files nothing; else a new branch', () => {
  assert.equal(filingState({ branchExists: false, seedOnMain: false }), 'new');
  assert.equal(filingState({ branchExists: true, seedOnMain: false }), 'branch');
  assert.equal(filingState({ branchExists: true, seedOnMain: true }), 'branch');
  assert.equal(filingState({ branchExists: false, seedOnMain: true }), 'on-main');
});

test('one branch and one seed per invariant, kebab-cased, never main', () => {
  const r = row({ invariant: 'noSendAfterTerminal' });
  assert.equal(findingBranch(r), 'claude/verify-no-send-after-terminal');
  assert.equal(seedPath(r), 'Roadmap/00-ideas/seeds/verify-no-send-after-terminal.md');
  const seed = seedText(r, 'step 1\nstep 2\n', { date: '2026-10-20', runUrl: 'https://example.test/run' });
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

test('29 → 30 → 31 labelled PRs: exactly one ping, at 30', async () => {
  // Night by night, the way the nightly runs it: the shadow PR stays open, so the branch carries the rows and,
  // once the ping is delivered, the marker.
  const main = { log: { since: SINCE, rows: [] }, marker: null };
  let branch = null;
  const merged = [];
  const pings = [];
  for (let n = 1; n <= 31; n++) {
    merged.push(pr(n));
    if (n < 29) continue; // the first 28 merge before the nights this test watches
    const plan = await planShadow({ main, branch, merged: [...merged], diffOf, ask });
    if (plan.ping) pings.push(plan.report.counted);
    branch = { log: plan.log, marker: plan.ping ? { pinged_at: 'd', ...plan.report } : plan.marker };
  }
  assert.deepEqual(pings, [30]);
  assert.equal(branch.log.rows.length, 31);
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
