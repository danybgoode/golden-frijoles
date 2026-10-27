import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { decideLabelCheck, specFilesBetween, FIX } from './verify-label.mjs';

const UNFILLED = 'Verify depth: off | light | standard | deep';

test('red only for a non-claude/ PR that touches a spec path with no single depth', () => {
  const spec = ['apps/web/lib/retry-policy.ts'];
  assert.equal(
    decideLabelCheck({ headRef: 'feat/x', specFiles: [], body: UNFILLED }).ok,
    true,
    'zero-spec: off by rule'
  );
  assert.equal(
    decideLabelCheck({ headRef: 'feat/x', specFiles: spec, body: 'Verify depth: light' }).ok,
    true
  );
  assert.equal(decideLabelCheck({ headRef: 'feat/x', specFiles: spec, body: UNFILLED }).ok, false);
  assert.equal(decideLabelCheck({ headRef: 'feat/x', specFiles: spec, body: null }).ok, false);
  assert.equal(
    decideLabelCheck({ headRef: 'feat/x', specFiles: spec, body: 'Verify depth: light\nVerify depth: deep' })
      .ok,
    false,
    'two answers is no answer'
  );
  assert.equal(decideLabelCheck({ headRef: 'claude/verify-jev-shadow', specFiles: spec, body: '' }).ok, true);
  assert.match(decideLabelCheck({ headRef: 'feat/x', specFiles: spec, body: '' }).reason, /retry-policy\.ts/);
});

test('unsure which files changed asks for the label; it never skips', () => {
  assert.equal(decideLabelCheck({ headRef: 'feat/x', specFiles: null, body: '' }).ok, false);
  assert.equal(decideLabelCheck({ headRef: 'feat/x', specFiles: null, body: 'Verify depth: off' }).ok, true);
  assert.equal(specFilesBetween(null, 'HEAD'), null);
  assert.equal(specFilesBetween('not-a-sha', 'HEAD'), null);
});

test('the spec files come from the same pathspecs the nightly diffs (glob across directories included)', () => {
  // ddc6076^..ddc6076 changes verify/ and scripts/ only; ce65993 (#15) added the outbox migration and dispatcher.
  const root = new URL('..', import.meta.url).pathname;
  const has = (sha) => {
    try {
      execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: root, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  if (!has('ce65993')) return; // a shallow clone: nothing to compare against
  assert.deepEqual(specFilesBetween('ce65993^1', 'ce65993', root), [
    'apps/web/lib/delivery-dispatch.ts',
    'apps/web/supabase/migrations/20260722110000_delivery_outbox.sql',
  ]);
  assert.deepEqual(specFilesBetween('0a0beb0^1', '0a0beb0', root), ['packages/sdk/src/flags.ts']);
});

test('the workflow: re-runs on edit, pull_request only, read-only, the body through env, the job named for the ruleset', () => {
  const yml = readFileSync(new URL('../.github/workflows/verify-label.yml', import.meta.url), 'utf8');
  assert.match(yml, /types: \[opened, edited, synchronize, reopened\]/);
  assert.doesNotMatch(yml, /^\s*pull_request_target:/m);
  assert.match(yml, /permissions:\n  contents: read/);
  assert.match(yml, /PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}/);
  assert.doesNotMatch(yml, /run:.*\$\{\{/, 'no expression is interpolated into a shell line');
  assert.match(yml, /\n  verify-label:\n    name: verify-label\n/);
  assert.match(
    yml,
    /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/,
    "the base's copy of the check runs, never the PR's"
  );
  assert.match(FIX, /Verify depth: off\|light\|standard\|deep/);
});

test('the template says when the label is required', () => {
  const t = readFileSync(new URL('../.github/PULL_REQUEST_TEMPLATE.md', import.meta.url), 'utf8');
  assert.match(t, /Required when the PR touches a spec\s+path/);
});
