import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decideGate } from './ci-gate.mjs';

const SKIPPABLE = ['e2e-api', 'e2e-authed', 'design-contract'];
const job = (result, outputs = {}) => ({ result, outputs });
const needs = (docsOnly, e2e, overrides = {}) => ({
  changes: job('success', { docs_only: docsOnly }),
  'typecheck-build': job('success'),
  'e2e-api': job(e2e),
  'e2e-authed': job(e2e),
  'design-contract': job(e2e),
  ...overrides,
});

test('green: a code PR where everything succeeded', () => {
  assert.equal(decideGate(needs('false', 'success'), SKIPPABLE).ok, true);
});

test('green: a docs-only PR whose e2e jobs the rule skipped', () => {
  assert.equal(decideGate(needs('true', 'skipped'), SKIPPABLE).ok, true);
});

test('red: a failed test', () => {
  assert.equal(decideGate(needs('false', 'success', { 'e2e-api': job('failure') }), SKIPPABLE).ok, false);
});

test('red: a cancelled job, docs-only or not', () => {
  assert.equal(
    decideGate(needs('false', 'success', { 'e2e-authed': job('cancelled') }), SKIPPABLE).ok,
    false
  );
  assert.equal(decideGate(needs('true', 'skipped', { 'e2e-authed': job('cancelled') }), SKIPPABLE).ok, false);
});

test('red: a skip the rule did not order', () => {
  assert.equal(decideGate(needs('false', 'skipped'), SKIPPABLE).ok, false);
});

test('red: the static job may never be skipped, even on a docs-only PR', () => {
  assert.equal(
    decideGate(needs('true', 'skipped', { 'typecheck-build': job('skipped') }), SKIPPABLE).ok,
    false
  );
});

test('red: changes failed, was skipped, or gave no answer', () => {
  for (const changes of [
    job('failure'),
    job('skipped'),
    job('success', {}),
    job('success', { docs_only: 'yes' }),
  ]) {
    assert.equal(decideGate(needs('true', 'skipped', { changes }), SKIPPABLE).ok, false);
  }
});

test('red: no needs at all, or a skippable job missing from needs', () => {
  assert.equal(decideGate(null, SKIPPABLE).ok, false);
  assert.equal(decideGate([], SKIPPABLE).ok, false);
  assert.equal(decideGate(needs('false', 'success', { 'e2e-api': null }), SKIPPABLE).ok, false);
  assert.equal(decideGate({}, SKIPPABLE).ok, false);
  const n = needs('true', 'skipped');
  delete n['design-contract'];
  assert.equal(decideGate(n, SKIPPABLE).ok, false);
});

test('ci.yml: gate needs every other job, and --skippable names exactly the e2e jobs', () => {
  const yml = readFileSync(join(fileURLToPath(import.meta.url), '../../.github/workflows/ci.yml'), 'utf8');
  // Any job id GitHub accepts (letters, digits, _ and -), quoted or not, with or without a trailing comment.
  const jobs = [
    ...yml.slice(yml.indexOf('\njobs:')).matchAll(/^ {2}['"]?([A-Za-z0-9_-]+)['"]?\s*:\s*(#.*)?$/gm),
  ].map((m) => m[1]);
  const gate = yml.slice(yml.indexOf('\n  gate:'));
  const inline = /needs:\s*\[([^\]]*)\]/.exec(gate);
  assert.ok(inline, "gate's needs must stay an inline [list] so this pin can read it");
  const needsList = /needs:\s*\[([^\]]*)\]/
    .exec(gate)[1]
    .split(',')
    .map((s) => s.trim());
  const nonBlocking = ['quarantine']; // deliberately outside the gate; ci.yml says why above the job
  assert.deepEqual(needsList.sort(), jobs.filter((j) => j !== 'gate' && !nonBlocking.includes(j)).sort());
  assert.match(gate, /if: always\(\)/);
  const skippable = /--skippable ([a-z0-9,-]+)/.exec(gate)[1].split(',');
  assert.deepEqual(skippable.sort(), [...SKIPPABLE].sort());
});
