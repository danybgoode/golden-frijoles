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
  // Each filtered job names the changes output that gates it, and its own `if:` reads that same output.
  const filtered = /--filtered ([a-z0-9_,=-]+)/
    .exec(gate)[1]
    .split(',')
    .map((p) => p.split('='));
  assert.deepEqual(filtered.map(([j]) => j).sort(), ['verify-flags', 'verify-outbox']);
  for (const [j, out] of filtered) {
    const start = yml.indexOf(`\n  ${j}:`);
    const next = /\n {2}[A-Za-z0-9_-]+:/g;
    next.lastIndex = start + 3;
    const body = yml.slice(start, next.exec(yml)?.index);
    assert.match(
      body,
      new RegExp(`if: needs\\.changes\\.outputs\\.${out} == 'true'`),
      `${j}'s if: reads ${out}`
    );
    assert.match(
      yml,
      new RegExp(`${out}: \\$\\{\\{ steps\\.diff\\.outputs\\.${out} \\}\\}`),
      `changes exports ${out}`
    );
  }
});

const FILTERED = { 'verify-outbox': 'verify_outbox', 'verify-flags': 'verify_flags' };
const withVerify = (outbox, flags, outboxResult, flagsResult, docsOnly = 'false') => {
  const n = needs(docsOnly, docsOnly === 'true' ? 'skipped' : 'success', {
    'verify-outbox': job(outboxResult),
    'verify-flags': job(flagsResult),
  });
  n.changes.outputs.verify_outbox = outbox;
  n.changes.outputs.verify_flags = flags;
  return n;
};

test('green: a verify job skipped by its own path filter', () => {
  assert.equal(decideGate(withVerify('false', 'false', 'skipped', 'skipped'), SKIPPABLE, FILTERED).ok, true);
  assert.equal(decideGate(withVerify('true', 'false', 'success', 'skipped'), SKIPPABLE, FILTERED).ok, true);
  assert.equal(
    decideGate(withVerify('false', 'false', 'skipped', 'skipped', 'true'), SKIPPABLE, FILTERED).ok,
    true
  );
});

test('red: a verify job skipped although its filter matched, or failed', () => {
  assert.equal(decideGate(withVerify('true', 'false', 'skipped', 'skipped'), SKIPPABLE, FILTERED).ok, false);
  assert.equal(decideGate(withVerify('true', 'true', 'success', 'failure'), SKIPPABLE, FILTERED).ok, false);
});

test('red: a filter output that is missing or not true/false, and a filtered job missing from needs', () => {
  assert.equal(
    decideGate(withVerify(undefined, 'false', 'skipped', 'skipped'), SKIPPABLE, FILTERED).ok,
    false
  );
  assert.equal(decideGate(withVerify('', 'false', 'skipped', 'skipped'), SKIPPABLE, FILTERED).ok, false);
  const n = withVerify('false', 'false', 'skipped', 'skipped');
  delete n['verify-flags'];
  assert.equal(decideGate(n, SKIPPABLE, FILTERED).ok, false);
});

test('a filter skip never excuses an unrelated job, and the docs rule never excuses a verify job', () => {
  const n = withVerify('false', 'false', 'skipped', 'skipped');
  n['e2e-api'] = job('skipped');
  assert.equal(decideGate(n, SKIPPABLE, FILTERED).ok, false);
  assert.equal(
    decideGate(withVerify('true', 'true', 'skipped', 'skipped', 'true'), SKIPPABLE, FILTERED).ok,
    false
  );
});
