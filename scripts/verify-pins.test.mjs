import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { extractSql, extractTs, normalise, run, shapeProblems, REQUIRED_GROUPS } from './verify-pins.mjs';

// A tiny repo with one group: a model, one SQL function across two migrations, one TS function. Each test pins it,
// moves one side, and reads the verdict — the mutation check S1.2 asks for, in both directions.
const SQL_OLD = `CREATE OR REPLACE FUNCTION claim_deliveries(p UUID) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE event_deliveries SET status = 'in_flight' WHERE id = p; -- the claim
END;
$$;
`;
const SQL_NEW = SQL_OLD.replace("'in_flight'", "'in_flight', attempt_count = attempt_count + 1");
const TS = `import x from 'y'

// leading comment
export function nextState(a: number): string {
  // the rule
  return a > 1 ? 'dead' : 'failed' // inline
}

export const MAX_ATTEMPTS = 6
`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'verify-pins-'));
  const put = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  put('apps/web/supabase/migrations/20260101000000_a.sql', SQL_OLD);
  put('apps/web/lib/dispatch.ts', TS);
  put('verify/quint/outbox.qnt', 'module outbox {}\n');
  put(
    'verify/pins.json',
    JSON.stringify({
      targets: {
        outbox: {
          model: ['verify/quint/outbox.qnt'],
          sql: ['claim_deliveries'],
          ts: { 'apps/web/lib/dispatch.ts': ['nextState', 'MAX_ATTEMPTS'] },
        },
      },
      hashes: {},
    })
  );
  const lines = [];
  const check = () => {
    lines.length = 0;
    return run({ root, log: (l) => lines.push(l), required: ['outbox'] });
  };
  assert.equal(run({ root, write: true, log: () => {}, required: ['outbox'] }), 0);
  assert.equal(check(), 0, 'a freshly pinned tree is in step');
  return { root, put, check, out: () => lines.join('\n') };
}

test('a comment-only or whitespace-only edit on the code side is not drift', () => {
  const f = fixture();
  f.put(
    'apps/web/lib/dispatch.ts',
    TS.replace('// the rule', '// the rule, explained at length').replace('return', 'return  ')
  );
  f.put(
    'apps/web/supabase/migrations/20260101000000_a.sql',
    SQL_OLD.replace('-- the claim', '-- the claim, now with a longer note')
  );
  assert.equal(f.check(), 0, f.out());
});

test('the TS code moving alone fails, telling you to update the model or re-pin', () => {
  const f = fixture();
  f.put('apps/web/lib/dispatch.ts', TS.replace('a > 1', 'a > 2'));
  assert.equal(f.check(), 1);
  assert.match(
    f.out(),
    /code moved alone \(ts:apps\/web\/lib\/dispatch\.ts#nextState\): update the model, or re-pin/
  );
});

test('a one-line const moving fails too', () => {
  const f = fixture();
  f.put('apps/web/lib/dispatch.ts', TS.replace('MAX_ATTEMPTS = 6', 'MAX_ATTEMPTS = 7'));
  assert.equal(f.check(), 1);
  assert.match(f.out(), /#MAX_ATTEMPTS/);
});

test('a NEW migration redefining a mirrored function is drift (the latest definition is what is pinned)', () => {
  const f = fixture();
  f.put('apps/web/supabase/migrations/20260201000000_b.sql', SQL_NEW);
  assert.equal(f.check(), 1);
  assert.match(f.out(), /code moved alone \(sql:claim_deliveries\)/);
});

test('a new migration that re-creates the same body (comments aside) is not drift', () => {
  const f = fixture();
  f.put(
    'apps/web/supabase/migrations/20260201000000_b.sql',
    `-- re-grant pass\n${SQL_OLD.replace('-- the claim', '')}`
  );
  assert.equal(f.check(), 0, f.out());
});

test('the model moving alone fails, telling you to re-pin after re-running the check', () => {
  const f = fixture();
  f.put('verify/quint/outbox.qnt', 'module outbox { val x = 1 }\n');
  assert.equal(f.check(), 1);
  assert.match(f.out(), /model moved alone \(model:verify\/quint\/outbox\.qnt\): re-pin after re-running/);
});

test('a mirrored function that disappears is drift, never a skip', () => {
  const f = fixture();
  f.put('apps/web/lib/dispatch.ts', TS.replace('function nextState', 'function nextStatus'));
  assert.equal(f.check(), 1);
  assert.match(f.out(), /#nextState: not found/);
  assert.equal(
    run({ root: f.root, write: true, log: () => {}, required: ['outbox'] }),
    1,
    '--write refuses to pin what is not there'
  );
});

test('re-pinning after a real change puts the tree back in step', () => {
  const f = fixture();
  f.put('apps/web/lib/dispatch.ts', TS.replace('a > 1', 'a > 2'));
  assert.equal(run({ root: f.root, write: true, log: () => {}, required: ['outbox'] }), 0);
  assert.equal(f.check(), 0);
  assert.ok(JSON.parse(readFileSync(join(f.root, 'verify/pins.json'), 'utf8')).hashes.outbox);
});

test('an unreadable pins file or a missing file is "could not look" (2), not a verdict', () => {
  const f = fixture();
  f.put('verify/pins.json', '{ nope');
  assert.equal(f.check(), 2);
  const g = fixture();
  g.put(
    'verify/pins.json',
    JSON.stringify({ targets: { outbox: { model: ['verify/quint/gone.qnt'] } }, hashes: {} })
  );
  assert.equal(g.check(), 2);
});

test('extractTs: an inline param type closing with `})` at column 0 does not end the function', () => {
  const src =
    'export function f(input: {\n  a: number\n}): number {\n  return input.a\n}\n\nfunction g() {}\n';
  assert.equal(
    extractTs(src, 'f'),
    'export function f(input: {\n  a: number\n}): number {\n  return input.a\n}'
  );
  assert.equal(extractTs(src, 'missing'), null);
});

test('extractSql: the last CREATE in the latest file wins; a commented-out CREATE is ignored', () => {
  const migrations = [
    { file: '2_b.sql', sql: `-- CREATE OR REPLACE FUNCTION claim_deliveries( was here\n` },
    { file: '1_a.sql', sql: SQL_OLD },
  ];
  assert.equal(extractSql(migrations, 'claim_deliveries').file, '1_a.sql');
  assert.equal(extractSql(migrations, 'claim_deliveries_other'), null);
});

test('normalise keeps comment markers that are inside strings', () => {
  assert.equal(normalise("a // x\n 'b//c' /* q */ d", { line: '//', quotes: ["'"] }), "a 'b//c' d");
  assert.equal(normalise("x = '--not' -- yes", { line: '--', quotes: ["'"] }), "x = '--not'");
});

test('emptying the targets (or dropping a group) fails, never passes vacuously', () => {
  const f = fixture();
  f.put('verify/pins.json', JSON.stringify({ targets: {}, hashes: {} }));
  assert.equal(f.check(), 1);
  assert.match(f.out(), /outbox: a required group is missing/);
  const g = fixture();
  const pins = JSON.parse(readFileSync(join(g.root, 'verify/pins.json'), 'utf8'));
  g.put(
    'verify/pins.json',
    JSON.stringify({ ...pins, targets: { outbox: { model: pins.targets.outbox.model } } })
  );
  assert.equal(g.check(), 1);
  assert.match(g.out(), /needs a model and at least one mirrored function/);
});

test('a group pinned but removed from targets is drift', () => {
  const f = fixture();
  const pins = JSON.parse(readFileSync(join(f.root, 'verify/pins.json'), 'utf8'));
  f.put(
    'verify/pins.json',
    JSON.stringify({ ...pins, hashes: { ...pins.hashes, gone: { 'model:x': 'abc' } } })
  );
  assert.equal(f.check(), 1);
  assert.match(f.out(), /gone:\n {2}pinned but no longer a target group/);
});

test('the real check requires both groups', () => {
  assert.deepEqual(REQUIRED_GROUPS, ['outbox', 'flags']);
  assert.equal(shapeProblems({ outbox: { model: ['m'], sql: ['f'] } }).length, 1);
});
