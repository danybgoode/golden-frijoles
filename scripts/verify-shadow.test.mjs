import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLabel,
  parseLog,
  serialiseLog,
  pendingPrs,
  shadowRow,
  report,
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

test('pending: merged since the start, not a nightly data PR, not already logged, oldest first', () => {
  const merged = [
    { number: 5, mergedAt: '2026-10-20T00:00:00Z', headRefName: 'feat/x' },
    { number: 4, mergedAt: '2026-10-19T00:00:00Z', headRefName: 'claude/verify-jev-shadow' },
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
  assert.deepEqual(r, { logged: 5, unlabelled: 1, jevMissing: 1, counted: 3, exact: 1, withinOne: 2 });
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
