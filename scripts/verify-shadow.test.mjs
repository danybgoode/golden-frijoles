import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLabel,
  parseLog,
  serialiseLog,
  pendingPrs,
  shadowRow,
  ruleLabel,
  labelOf,
  report,
  formatReport,
  pingText,
  decidePing,
  owedLine,
  addOwedLine,
  jevRequest,
} from './verify-shadow.mjs';
import { kindOf, markerFor, DEFAULT_OWNERS } from './owed-ledger.mjs';

test('the label: exactly one depth after "Verify depth:"; the unfilled template line is unlabelled', () => {
  assert.equal(parseLabel('## Summary\n\nVerify depth: light\n'), 'light');
  assert.equal(parseLabel('- **Verify depth:** `deep`'), 'deep');
  assert.equal(parseLabel('verify depth: Standard.'), 'standard');
  assert.equal(parseLabel('Verify depth: off | light | standard | deep'), null);
  assert.equal(parseLabel('Verify depth: light\nVerify depth: deep'), null, 'two answers is no answer');
  assert.equal(parseLabel('Verify depth: maybe'), null);
  assert.equal(parseLabel(''), null);
  assert.equal(parseLabel(null), null);
});

test('the log round-trips its header and rows', () => {
  const log = { since: '2026-10-17T00:00:00Z', rows: [{ pr: 1, jev: 'off', builder_label: null }] };
  assert.deepEqual(parseLog(serialiseLog(log)), log);
  assert.deepEqual(parseLog(''), { since: null, rows: [] });
});

test("pending: merged since the start, not an agent's claude/ data PR, not already logged, oldest first", () => {
  const merged = [
    { number: 5, mergedAt: '2026-10-20T00:00:00Z', headRefName: 'feat/x' },
    { number: 4, mergedAt: '2026-10-19T00:00:00Z', headRefName: 'claude/verify-jev-shadow' },
    { number: 6, mergedAt: '2026-10-19T01:00:00Z', headRefName: 'claude/build-order-sync' },
    { number: 3, mergedAt: '2026-10-18T00:00:00Z', headRefName: 'feat/y' },
    { number: 2, mergedAt: '2026-10-17T12:00:00Z', headRefName: 'feat/z' },
    { number: 1, mergedAt: '2026-10-16T00:00:00Z', headRefName: 'feat/old' },
  ];
  const got = pendingPrs(merged, { since: '2026-10-17T00:00:00Z', logged: [{ pr: 3 }] }).map((p) => p.number);
  assert.deepEqual(got, [2, 5]);
  assert.deepEqual(pendingPrs(merged, { since: null, logged: [] }), [], 'no start, nothing is asked');
});

test('a row: Jev failing is jev null with the reason; an off-list answer is null too', () => {
  const pr = { number: 7, mergedAt: 't' };
  assert.deepEqual(shadowRow(pr, { ok: true, answers: { verify_depth: { choice: 'light' } } }, 'light'), {
    pr: 7,
    merged_at: 't',
    jev: 'light',
    builder_label: 'light',
  });
  assert.equal(shadowRow(pr, { ok: false, error: 'timeout' }, 'deep').jev_error, 'timeout');
  assert.equal(shadowRow(pr, { ok: true, answers: { verify_depth: { choice: 'huge' } } }, null).jev, null);
});

test('the request asks ONE question (verify depth), and caps the diff', () => {
  const { req, truncated } = jevRequest({ title: 't', stat: 's', diff: 'x'.repeat(70_000) });
  assert.deepEqual(Object.keys(req.questions), ['verify_depth']);
  assert.equal(truncated, true);
  assert.match(req.state.pullRequest.diff, /diff truncated/);
});

test('report: counted needs both a label and a Jev call; exact and within one level', () => {
  const r = report([
    { jev: 'light', builder_label: 'light' },
    { jev: 'standard', builder_label: 'light' },
    { jev: 'deep', builder_label: 'light' },
    { jev: 'light', builder_label: null },
    { jev: null, builder_label: 'off' },
  ]);
  assert.deepEqual(
    {
      logged: r.logged,
      unlabelled: r.unlabelled,
      jevMissing: r.jevMissing,
      counted: r.counted,
      exact: r.exact,
      withinOne: r.withinOne,
    },
    { logged: 5, unlabelled: 1, jevMissing: 1, counted: 3, exact: 1, withinOne: 2 }
  );
});

test('the rule label: no spec file is off; a spec file, or files git could not list, labels nothing', () => {
  assert.equal(ruleLabel([]), 'off');
  assert.equal(ruleLabel(['packages/sdk/src/flags.ts']), null);
  assert.equal(ruleLabel(null), null, 'unknown is never off');
  assert.equal(ruleLabel(undefined), null);
  const pr = { number: 9, mergedAt: 't' };
  const ok = { ok: true, answers: { verify_depth: { choice: 'deep' } } };
  assert.equal(shadowRow(pr, ok, null, []).rule_label, 'off');
  assert.equal(shadowRow(pr, ok, null, ['apps/web/lib/retry-policy.ts']).rule_label, null);
  assert.ok(
    !('rule_label' in shadowRow(pr, ok, null, null)),
    'unknown leaves the key out, so a later night retries'
  );
  assert.equal(shadowRow(pr, ok, null, []).builder_label, null, 'the rule never writes the builder label');
});

test('a rule label counts (D1); the builder wins when both exist; the report splits the sources', () => {
  assert.equal(labelOf({ builder_label: 'light', rule_label: 'off' }), 'light');
  assert.equal(labelOf({ builder_label: null, rule_label: 'off' }), 'off');
  assert.equal(labelOf({ builder_label: null, rule_label: null }), null);
  const r = report([
    { jev: 'light', builder_label: 'light', rule_label: 'off' }, // builder, exact
    { jev: 'off', builder_label: null, rule_label: 'off' }, // rule, exact
    { jev: 'deep', builder_label: null, rule_label: 'off' }, // rule, three levels off
    { jev: 'standard', builder_label: null, rule_label: null }, // touches the spec, no label: not counted
    { jev: null, builder_label: null, rule_label: 'off' }, // no Jev: not counted, not in the non-off rate
  ]);
  assert.equal(r.counted, 3);
  assert.equal(r.unlabelled, 1);
  assert.deepEqual(r.builder, { counted: 1, exact: 1, withinOne: 1 });
  assert.deepEqual(r.rule, { counted: 2, exact: 1, withinOne: 1 });
  assert.equal(r.zeroSpec, 3, 'the builder-labelled zero-spec row is in the rate too');
  assert.equal(r.zeroSpecNonOff, 2);
  assert.match(
    formatReport(r),
    /by builder label 1\/1 exact.*off by rule \(no spec path\) 1\/2 exact.*other than off 2\/3 times/
  );
  assert.match(
    pingText(r),
    /3 labelled PRs \(1 by the builder, 2 off by rule\)/,
    'the ping names the rule share'
  );
  assert.match(owedLine(r, 'd'), /1 by the builder, 2 off by rule/);
});

test('decidePing: at the threshold and only without a marker', () => {
  assert.equal(decidePing({ counted: 29, markerExists: false }), false);
  assert.equal(decidePing({ counted: 30, markerExists: false }), true);
  assert.equal(decidePing({ counted: 31, markerExists: true }), false);
});

test('the owed line is judgment-kind, read by the ledger, and lands once under Gaps / follow-ups', () => {
  const line = owedLine({ counted: 30, exact: 18, withinOne: 29 }, '2026-12-01');
  assert.equal(kindOf({ text: line }), 'judgment');
  assert.match(line, markerFor(DEFAULT_OWNERS));
  const retro = '# R\n\n## What we learned\n\nx\n\n## Gaps / follow-ups\n<!-- c -->\n- one\n\n## After\n';
  const once = addOwedLine(retro, line);
  assert.equal(addOwedLine(once, line), once, 'idempotent');
  assert.ok(once.indexOf(line) > once.indexOf('- one') && once.indexOf(line) < once.indexOf('## After'));
  const last = addOwedLine('# R\n\n## Gaps / follow-ups\n- one\n', line);
  assert.ok(last.endsWith(`- one\n${line}\n`));
  assert.match(addOwedLine('# R\n', line), /## Gaps \/ follow-ups\n\n- \*\*Owed/);
});
