import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemsFor, compareVersions, DEPRECATIONS } from './check-deprecations.mjs';

const row = {
  alias: 'gf',
  replacement: 'frijoles',
  manifest: 'packages/cli/package.json',
  removeBy: '2026-12-31',
  removeIn: '1.1.0',
};
const both = { frijoles: './dist/bin.js', gf: './dist/bin.js' };

test('inside the window: no problems', () => {
  assert.deepEqual(problemsFor(row, { version: '1.0.0', bin: both }, '2026-10-08'), []);
  assert.deepEqual(problemsFor(row, { version: '1.0.0', bin: both }, '2026-12-31'), []);
});

test('the day after the date, the alias is red', () => {
  const p = problemsFor(row, { version: '1.0.0', bin: both }, '2027-01-01');
  assert.equal(p.length, 1);
  assert.match(p[0], /due for removal on 2026-12-31/);
});

test('reaching the promised version is red, whatever the date', () => {
  for (const version of ['1.1.0', '1.1.0-rc.1', '2.0.0']) {
    assert.equal(problemsFor(row, { version, bin: both }, '2026-10-08').length, 1, version);
  }
});

test('a retired alias is fine; a missing replacement never is', () => {
  assert.deepEqual(problemsFor(row, { version: '1.1.0', bin: { frijoles: 'x' } }, '2027-06-01'), []);
  assert.match(
    problemsFor(row, { version: '1.0.0', bin: { gf: 'x' } }, '2026-10-08')[0],
    /replacement `frijoles` is not in bin/
  );
});

test('versions compare numerically', () => {
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('0.8.0', '1.1.0'), -1);
  assert.equal(compareVersions('1.1.0', '1.1.0'), 0);
});

test('every row names both removal promises', () => {
  for (const r of DEPRECATIONS)
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.removeBy) && /^\d+\.\d+\.\d+$/.test(r.removeIn), r.alias);
});
