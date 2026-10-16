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
 * Split source into code / string / comment segments, so nothing inside a string is read as a comment or a bracket.
 * TS: '…' and "…" with backslash escapes; `…` templates whose ${…} expressions are code again; regex literals (a `/`
 * where an operand cannot stand: after an operator, an opening bracket or a keyword like `return`); // and /* *\/
 * comments. SQL: '…' with '' as its escape, "…" identifiers, -- and /* *\/ comments.
 */
export function segments(text, lang) {
  const ts = lang === 'ts';
  const out = [];
  let buf = '';
  let type = 'code';
  let tail = ''; // the recent code, with every string/regex shown as `x` (an operand): decides what a `/` is
  let depth = 0; // brace depth, TS only: a `}` at a depth where a ${ opened returns to its template
  const templates = [];
  const emit = (next) => {
    if (buf) out.push({ type, text: buf });
    buf = '';
    type = next;
  };
  let i = 0;
  const readTemplate = () => {
    // buf holds the template's opening (` or }); read to its end or to the next ${.
    while (i < text.length) {
      const c = text[i];
      if (c === '\\') {
        buf += text.slice(i, i + 2);
        i += 2;
      } else if (c === '`') {
        buf += c;
        i++;
        emit('code');
        tail += 'x';
        return;
      } else if (c === '$' && text[i + 1] === '{') {
        buf += '${';
        i += 2;
        emit('code');
        templates.push(depth++);
        tail += '(';
        return;
      } else {
        buf += c;
        i++;
      }
    }
    emit('code');
  };
  const regexMayStart = () =>
    /(?:^|[(,=:[!&|?{};+\-*%<>~^])\s*$/.test(tail) ||
    /\b(?:return|typeof|case|do|else|in|of|void|yield|await|throw|delete|instanceof)\s*$/.test(tail);
  while (i < text.length) {
    const c = text[i];
    const two = text.slice(i, i + 2);
    if (two === (ts ? '//' : '--') || two === '/*') {
      emit('comment');
      const end = two === '/*' ? text.indexOf('*/', i + 2) : text.indexOf('\n', i);
      const stop = end < 0 ? text.length : two === '/*' ? end + 2 : end;
      buf = text.slice(i, stop);
      i = stop;
      emit('code');
    } else if (c === "'" || c === '"') {
      emit('string');
      let j = i + 1;
      while (j < text.length) {
        if (ts && text[j] === '\\') j += 2;
        else if (text[j] === c && !ts && text[j + 1] === c) j += 2;
        else if (text[j] === c || (ts && text[j] === '\n')) break;
        else j++;
      }
      buf = text.slice(i, j + 1);
      i = j + 1;
      emit('code');
      tail += 'x';
    } else if (ts && c === '`') {
      emit('string');
      buf = '`';
      i++;
      readTemplate();
    } else if (ts && c === '/' && regexMayStart()) {
      emit('string');
      let j = i + 1;
      let inClass = false;
      while (j < text.length && text[j] !== '\n') {
        if (text[j] === '\\') j++;
        else if (text[j] === '[') inClass = true;
        else if (text[j] === ']') inClass = false;
        else if (text[j] === '/' && !inClass) break;
        j++;
      }
      j++;
      while (/[a-z]/.test(text[j] ?? '')) j++;
      buf = text.slice(i, j);
      i = j;
      emit('code');
      tail += 'x';
    } else if (ts && c === '}' && templates.length && templates.at(-1) === depth - 1) {
      depth--;
      templates.pop();
      emit('string');
      buf = '}';
      i++;
      readTemplate();
    } else {
      if (ts && c === '{') depth++;
      if (ts && c === '}') depth--;
      buf += c;
      tail = (tail + c).slice(-40);
      i++;
    }
  }
  emit('code');
  return out;
}

/** Comments stripped, whitespace in CODE collapsed; strings kept byte for byte. */
export const normalise = (text, lang) =>
  segments(text, lang)
    .filter((s) => s.type !== 'comment')
    .map((s) => (s.type === 'code' ? s.text.replace(/\s+/g, ' ') : s.text))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The source of one top-level TS declaration: `function name`, `async function name`, `const name` (optionally
 * exported). It ends at the first newline outside every bracket, string and comment whose next line is not
 * indented — Prettier indents every continuation — so a multi-line arrow `const`, an inline param type closing at
 * column 0 and a template literal with a bare `}` line are all read whole. null when absent or ambiguous.
 */
export function extractTs(source, name) {
  const decl = new RegExp(`^(?:export )?(?:async )?(?:function\\*? |const )${name}\\b`, 'gm');
  const starts = [...source.matchAll(decl)].map((m) => m.index);
  if (starts.length !== 1) return null;
  const rest = source.slice(starts[0]);
  let at = 0;
  let depth = 0;
  for (const seg of segments(rest, 'ts')) {
    if (seg.type === 'code') {
      for (let k = 0; k < seg.text.length; k++) {
        const c = seg.text[k];
        if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) depth--;
        else if (c === '\n' && depth === 0 && !/[ \t]/.test(rest[at + k + 1] ?? ''))
          return rest.slice(0, at + k);
      }
    }
    at += seg.text.length;
  }
  return depth === 0 ? rest.trimEnd() : null;
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

/** The [start, end) ranges of a SQL text's comments: a CREATE or DROP inside one is not a statement. */
function commentRanges(sql) {
  const ranges = [];
  let at = 0;
  for (const seg of segments(sql, 'sql')) {
    if (seg.type === 'comment') ranges.push([at, at + seg.text.length]);
    at += seg.text.length;
  }
  return ranges;
}

/**
 * The latest definition of a SQL function across the migrations (filename order = apply order): the last
 * `CREATE [OR REPLACE] FUNCTION [public.]["]name["](` outside a comment. A `DROP FUNCTION name` after it means the
 * function is gone, so null — the model now describes something that isn't there. Returns { file, text } or null.
 */
export function extractSql(migrations, name) {
  const ident = `(?:public\\.)?"?${name}"?`;
  const create = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+${ident}\\s*\\(`, 'gi');
  const drop = new RegExp(`DROP\\s+FUNCTION\\s+(?:IF\\s+EXISTS\\s+)?${ident}(?![\\w"])`, 'gi');
  let latest = null; // { order, index, file, sql } of the last CREATE
  let dropped = null; // { order, index } of the last DROP
  const ordered = [...migrations].sort((a, b) => (a.file < b.file ? -1 : 1));
  ordered.forEach(({ file, sql }, order) => {
    const ranges = commentRanges(sql);
    const live = (m) => !ranges.some(([s, e]) => m.index >= s && m.index < e);
    for (const m of [...sql.matchAll(create)].filter(live)) latest = { order, index: m.index, file, sql };
    for (const m of [...sql.matchAll(drop)].filter(live)) dropped = { order, index: m.index };
  });
  if (!latest) return null;
  if (
    dropped &&
    (dropped.order > latest.order || (dropped.order === latest.order && dropped.index > latest.index))
  )
    return null;
  const text = sqlStatementAt(latest.sql, latest.index);
  return text ? { file: latest.file, text } : null;
}

/** Every entry's current hash, from the targets pins.json names. `read(path)` returns text; throws CannotLook. */
export function currentHashes(targets, { read, migrations }) {
  const out = {};
  for (const [group, t] of Object.entries(targets)) {
    const hashes = {};
    for (const path of t.model ?? []) hashes[`model:${path}`] = sha(read(path));
    for (const name of t.sql ?? []) {
      const found = extractSql(migrations, name);
      hashes[`sql:${name}`] = found ? { hash: sha(normalise(found.text, 'sql')), from: found.file } : null;
    }
    for (const [file, names] of Object.entries(t.ts ?? {})) {
      const source = read(file);
      for (const name of names) {
        const text = extractTs(source, name);
        hashes[`ts:${file}#${name}`] = text ? sha(normalise(text, 'ts')) : null;
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
