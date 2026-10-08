import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problemsFor, compareVersions, DEPRECATIONS, oldCommandLines } from './check-deprecations.mjs';

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

test('an old command in shipped text is caught; prose about the name, tokens and records are not', () => {
  const bad = [
    'README.md:3:run `gf login` first',
    'skills/x/SKILL.md:9:  gf-kit config set a b',
    'apps/web/a.tsx:2:<code>gf flags kill x</code>',
  ];
  assert.deepEqual(oldCommandLines(bad), bad);
  assert.deepEqual(
    oldCommandLines([
      'packages/cli/src/invoked-as.ts:4:the old name gf keeps working',
      "apps/web/lib/cli-tokens.ts:26:const TOKEN_PREFIX = 'gf_pat_'",
      'skills/CHANGELOG.md:12:- `gf login` opens the browser',
      'scripts/jev-eval.fixtures.json:4:`gf login`, ',
      'README.md:1:run `frijoles login`',
      '',
    ]),
    []
  );
});
