import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGateEnv, readGateEnv } from './gate-env.mjs';

const root = join(fileURLToPath(import.meta.url), '../../..');

test('parses gates, skipping comments and blanks', () => {
  assert.deepEqual(parseGateEnv('# c\n\nA_ENABLED=true\n  B_ENABLED=false  \n'), {
    A_ENABLED: 'true',
    B_ENABLED: 'false',
  });
});

test('a mistyped value, a non-gate key, a duplicate and an empty file all throw', () => {
  assert.throws(() => parseGateEnv('A_ENABLED=ture'), /expected KEY_ENABLED=true\|false/);
  assert.throws(() => parseGateEnv('A_ENABLED="true"'), /expected/);
  assert.throws(() => parseGateEnv('SITE_URL=true'), /expected/);
  assert.throws(() => parseGateEnv('A_ENABLED=true\nA_ENABLED=false'), /set twice/);
  assert.throws(() => parseGateEnv('# nothing\n'), /no gates/);
});

test('the committed ON and OFF files name the same gates, and OFF turns every one off', () => {
  const on = readGateEnv(join(root, 'ci/gates.on.env'));
  const off = readGateEnv(join(root, 'ci/gates.off.env'));
  assert.deepEqual(Object.keys(on).sort(), Object.keys(off).sort());
  assert.ok(Object.values(off).every((v) => v === 'false'));
});
