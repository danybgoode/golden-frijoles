#!/usr/bin/env node
// verify-pins — a model can't drift from the code it mirrors (verify-module S1.2, epic README D3).
//
//   node scripts/verify-pins.mjs            # check: exit 0 in step, 1 drift, 2 could not look
//   node scripts/verify-pins.mjs --write    # re-pin every hash in verify/pins.json
//
// verify/pins.json names, per group, the model files and the code they mirror: SQL functions (the body from the
// LATEST migration that CREATEs each) and TS declarations (`file#name`). It stores one sha256 per entry. Code is
// hashed NORMALISED — comments stripped, whitespace collapsed — so a comment-only edit is not drift; a model is
// hashed as bytes. Any mismatch fails and names the side that moved. A mirrored function that cannot be found is
// drift too, never a skip: the code moved, and the model now describes something that is gone.
//
// Zero deps: it runs in the static gate before `npm ci`.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PINS_PATH = 'verify/pins.json';
export const MIGRATIONS_DIR = 'apps/web/supabase/migrations';

// The groups that must exist, each with a model and at least one mirrored target. Without this, deleting a group
// from `targets` (and its hashes) would make the check vacuously green (Codex, PR #386).
export const REQUIRED_GROUPS = ['outbox', 'flags'];

const sha = (text) => createHash('sha256').update(text).digest('hex');

/** Couldn't look — its own exit code, so it never reads as a verdict. */
export class CannotLook extends Error {}

/**
 * Strip comments and collapse whitespace, leaving string literals intact. `line` is the line-comment opener
 * (`//` for TS, `--` for SQL); `block` is whether `/* … *\/` comments exist. Quotes are the string delimiters.
 */
export function normalise(text, { line, block = true, quotes }) {
  let out = '';
  for (let i = 0; i < text.length;) {
    const c = text[i];
    if (quotes.includes(c)) {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === '\\' && c !== "'" ? 2 : 1;
      // SQL's '' escape is two adjacent strings, which this reads correctly as two.
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (text.startsWith(line, i)) {
      while (i < text.length && text[i] !== '\n') i++;
    } else if (block && text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 2;
    } else {
      out += c;
      i++;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * The source of one top-level TS declaration: `function name`, `async function name`, `const name` (optionally
 * exported). Prettier formats this repo, so a multi-line declaration ends at the first line that is exactly `}`;
 * a one-line `const` ends at its line. null when absent or ambiguous.
 */
export function extractTs(source, name) {
  const decl = new RegExp(`^(?:export )?(?:async )?(?:function\\*? |const )${name}\\b`, 'gm');
  const starts = [...source.matchAll(decl)].map((m) => m.index);
  if (starts.length !== 1) return null;
  const start = starts[0];
  const firstLineEnd = source.indexOf('\n', start);
  const firstLine = source.slice(start, firstLineEnd < 0 ? undefined : firstLineEnd);
  if (/^(?:export )?const /.test(firstLine) && !/[{([]\s*$/.test(firstLine)) return firstLine;
  const close = source.slice(start).search(/^\}[ \t]*$/m);
  return close < 0 ? null : source.slice(start, start + close + 1);
}

/** The full `CREATE … FUNCTION name(…) … $tag$ … $tag$ …;` statement at `at`, or null. */
function sqlStatementAt(sql, at) {
  const open = /\$([A-Za-z_]*)\$/g;
  open.lastIndex = at;
  const m = open.exec(sql);
  if (!m) return null;
  const closeAt = sql.indexOf(m[0], m.index + m[0].length);
  if (closeAt < 0) return null;
  const semi = sql.indexOf(';', closeAt + m[0].length);
  return sql.slice(at, semi < 0 ? undefined : semi + 1);
}

/**
 * The latest definition of a SQL function across the migrations: the last `CREATE [OR REPLACE] FUNCTION name(` in
 * the last file (filename order = apply order) that has one. Returns { file, text } or null.
 */
export function extractSql(migrations, name) {
  const create = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(?:public\\.)?${name}\\s*\\(`, 'gi');
  for (const { file, sql } of [...migrations].sort((a, b) => (a.file < b.file ? 1 : -1))) {
    // A commented-out CREATE is not a definition: search the comment-free text's positions in the original.
    const hits = [...sql.matchAll(create)].filter((m) => !isInLineComment(sql, m.index));
    if (hits.length === 0) continue;
    const text = sqlStatementAt(sql, hits.at(-1).index);
    return text ? { file, text } : null;
  }
  return null;
}

const isInLineComment = (sql, at) => sql.slice(sql.lastIndexOf('\n', at) + 1, at).includes('--');

/** Every entry's current hash, from the targets pins.json names. `read(path)` returns text; throws CannotLook. */
export function currentHashes(targets, { read, migrations }) {
  const out = {};
  for (const [group, t] of Object.entries(targets)) {
    const hashes = {};
    for (const path of t.model ?? []) hashes[`model:${path}`] = sha(read(path));
    for (const name of t.sql ?? []) {
      const found = extractSql(migrations, name);
      hashes[`sql:${name}`] = found
        ? { hash: sha(normalise(found.text, { line: '--', quotes: ["'"] })), from: found.file }
        : null;
    }
    for (const [file, names] of Object.entries(t.ts ?? {})) {
      const source = read(file);
      for (const name of names) {
        const text = extractTs(source, name);
        hashes[`ts:${file}#${name}`] = text
          ? sha(normalise(text, { line: '//', quotes: ["'", '"', '`'] }))
          : null;
      }
    }
    out[group] = hashes;
  }
  return out;
}

const hashOf = (v) => (v && typeof v === 'object' ? v.hash : v);

/** What is wrong with the targets' shape: a required group missing, or a group with no model or no code. */
export function shapeProblems(targets, required = REQUIRED_GROUPS) {
  const problems = [];
  for (const group of new Set([...required, ...Object.keys(targets)])) {
    const t = targets[group];
    const code = (t?.sql?.length ?? 0) + Object.values(t?.ts ?? {}).reduce((n, names) => n + names.length, 0);
    if (!t) problems.push(`${group}: a required group is missing from targets`);
    else if (!t.model?.length || code === 0)
      problems.push(`${group}: a group needs a model and at least one mirrored function`);
  }
  return problems;
}

/** Compare pinned to current. Returns { ok, problems: string[] } — one problem per group that drifted. */
export function compare(pinned, current) {
  const problems = [];
  for (const group of Object.keys(pinned ?? {}))
    if (!(group in current)) problems.push(`${group}:\n  pinned but no longer a target group — re-pin`);
  for (const [group, now] of Object.entries(current)) {
    const was = pinned?.[group] ?? {};
    const missing = Object.keys(now).filter((k) => now[k] === null);
    const moved = Object.keys(now).filter((k) => now[k] !== null && hashOf(now[k]) !== was[k]);
    const stale = Object.keys(was).filter((k) => !(k in now));
    const modelMoved = moved.filter((k) => k.startsWith('model:'));
    const codeMoved = moved.filter((k) => !k.startsWith('model:'));
    const lines = [];
    for (const k of missing)
      lines.push(`  ${k}: not found — the code moved; point the pin at it, or update the model`);
    if (codeMoved.length && !modelMoved.length)
      lines.push(
        `  the code moved alone (${codeMoved.join(', ')}): update the model, or re-pin if the change doesn't affect it`
      );
    else if (modelMoved.length && !codeMoved.length)
      lines.push(`  the model moved alone (${modelMoved.join(', ')}): re-pin after re-running the check`);
    else if (moved.length)
      lines.push(`  both sides moved (${moved.join(', ')}): re-run the check, then re-pin`);
    for (const k of stale) lines.push(`  ${k}: pinned but no longer a target — re-pin`);
    if (lines.length) problems.push(`${group}:\n${lines.join('\n')}`);
  }
  return { ok: problems.length === 0, problems };
}

function load(root) {
  const read = (path) => {
    try {
      return readFileSync(join(root, path), 'utf8');
    } catch (e) {
      throw new CannotLook(`${path}: ${e.code ?? e.message}`);
    }
  };
  let pins;
  try {
    pins = JSON.parse(read(PINS_PATH));
  } catch (e) {
    throw e instanceof CannotLook ? e : new CannotLook(`${PINS_PATH}: unparseable (${e.message})`);
  }
  if (!pins?.targets || typeof pins.targets !== 'object') throw new CannotLook(`${PINS_PATH}: no "targets"`);
  let files;
  try {
    files = readdirSync(join(root, MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql'));
  } catch (e) {
    throw new CannotLook(`${MIGRATIONS_DIR}: ${e.code ?? e.message}`);
  }
  const migrations = files.map((file) => ({ file, sql: read(join(MIGRATIONS_DIR, file)) }));
  return { pins, current: currentHashes(pins.targets, { read, migrations }) };
}

/** Run it. Returns the exit code; `log` gets every line. */
export function run({ root = ROOT, write = false, log = console.log, required = REQUIRED_GROUPS } = {}) {
  let pins, current;
  try {
    ({ pins, current } = load(root));
  } catch (e) {
    if (!(e instanceof CannotLook)) throw e;
    log(`verify-pins: could not look — ${e.message}`);
    return 2;
  }
  const shape = shapeProblems(pins.targets, required);
  if (shape.length) {
    log(`verify-pins: ${PINS_PATH} cannot check what it no longer names:\n  ${shape.join('\n  ')}`);
    return 1;
  }
  if (write) {
    const missing = Object.entries(current).flatMap(([g, h]) =>
      Object.keys(h)
        .filter((k) => h[k] === null)
        .map((k) => `${g} ${k}`)
    );
    if (missing.length) {
      log(`verify-pins: cannot pin what is not there:\n  ${missing.join('\n  ')}`);
      return 1;
    }
    const hashes = Object.fromEntries(
      Object.entries(current).map(([g, h]) => [
        g,
        Object.fromEntries(Object.entries(h).map(([k, v]) => [k, hashOf(v)])),
      ])
    );
    writeFileSync(join(root, PINS_PATH), `${JSON.stringify({ ...pins, hashes }, null, 2)}\n`);
    log(`verify-pins: re-pinned ${PINS_PATH}`);
    return 0;
  }
  const { ok, problems } = compare(pins.hashes, current);
  if (ok) {
    const sqlFrom = Object.values(current)
      .flatMap((h) => Object.entries(h))
      .filter(([k]) => k.startsWith('sql:'))
      .map(([k, v]) => `${k.slice(4)}@${v.from.slice(0, 14)}`);
    log(`verify-pins: every model is in step with the code it mirrors (${sqlFrom.join(', ')})`);
    return 0;
  }
  log(`verify-pins: DRIFT — a model and the code it mirrors no longer match.\n${problems.join('\n')}`);
  log(
    `Re-pin with \`node scripts/verify-pins.mjs --write\` once the model is right (verify/README.md, rule 1).`
  );
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(run({ write: process.argv.includes('--write') }));
}
