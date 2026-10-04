#!/usr/bin/env node
// gate-env — the ONE reader of ci/gates.{on,off}.env (ci-diet D4).
//
// ci.yml appends its output to $GITHUB_ENV before each server boots; run-local-e2e.mjs imports readGateEnv.
// One parser, so CI and the local runner cannot read the same file differently. Strict on purpose: a line that
// is not a comment, blank, or KEY=true|false throws, because a mistyped gate is the "the server and the test
// disagree" bug this file exists to end.
//
//   node scripts/lib/gate-env.mjs ci/gates.on.env >> "$GITHUB_ENV"
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LINE = /^([A-Z][A-Z0-9_]*_ENABLED)=(true|false)$/;

/** Parse a gate file's text into { KEY: 'true' | 'false' }. Throws on any malformed or duplicate line. */
export function parseGateEnv(text, source = 'gate file') {
  const gates = {};
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const m = LINE.exec(line);
    if (!m) throw new Error(`${source}:${i + 1}: expected KEY_ENABLED=true|false, got "${line}"`);
    if (m[1] in gates) throw new Error(`${source}:${i + 1}: ${m[1]} is set twice`);
    gates[m[1]] = m[2];
  });
  if (Object.keys(gates).length === 0) throw new Error(`${source}: no gates`);
  return gates;
}

export function readGateEnv(path) {
  return parseGateEnv(readFileSync(path, 'utf8'), path);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) {
    process.stderr.write('usage: node scripts/lib/gate-env.mjs <ci/gates.*.env>\n');
    process.exit(2);
  }
  try {
    for (const [k, v] of Object.entries(readGateEnv(path))) process.stdout.write(`${k}=${v}\n`);
  } catch (e) {
    process.stderr.write(`gate-env: ${e.message}\n`);
    process.exit(1);
  }
}
