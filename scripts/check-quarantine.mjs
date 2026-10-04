#!/usr/bin/env node
// check-quarantine — a known flake may stop blocking merges, but never quietly and never forever (ci-diet D7, D13).
//
// A quarantined test carries the tag AND an annotation naming its owner and expiry:
//   test('…', { tag: '@quarantine', annotation: { type: 'quarantine', description: 'owner=Daniel expires=2026-11-03' } }, …)
// The blocking e2e jobs run `--grep-invert @quarantine`; ci.yml's `quarantine` job runs `--grep @quarantine` and
// reports without blocking. THIS check is what keeps that honest: it fails on a quarantine past its date, more than
// MAX_DAYS out (Jev's shadow-expiry cap: a far date is a permanent quarantine wearing an expiry), missing its owner or
// date, or a tag without the annotation (or the reverse). It reads Playwright's own test list, never the source.
//
//   node scripts/check-quarantine.mjs            exit 1 on any problem; prints the quarantine table either way
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const MAX_DAYS = 30;
const DESCRIPTION = /^owner=(\S+) expires=(\d{4}-\d{2}-\d{2})$/;

const addDays = (ymd, n) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Flatten `playwright test --list --reporter=json` into one entry per spec (projects merged). */
export function entriesFromListJson(json) {
  const out = new Map();
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const key = `${spec.file}:${spec.line}`;
      const entry = out.get(key) ?? {
        id: `${spec.file}:${spec.line} › ${spec.title}`,
        tags: new Set(),
        notes: new Set(),
      };
      for (const t of spec.tags ?? []) entry.tags.add(t);
      for (const test of spec.tests ?? [])
        for (const a of test.annotations ?? [])
          if (a.type === 'quarantine') entry.notes.add(a.description ?? '');
      out.set(key, entry);
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const s of json.suites ?? []) walk(s);
  return [...out.values()].map((e) => ({ id: e.id, tagged: e.tags.has('quarantine'), notes: [...e.notes] }));
}

/** Pure. Returns { quarantined: [{ id, owner, expires }], problems: string[] }. `today` is UTC YYYY-MM-DD. */
export function checkQuarantine(entries, today) {
  const cap = addDays(today, MAX_DAYS);
  const quarantined = [];
  const problems = [];
  for (const e of entries) {
    if (!e.tagged && e.notes.length === 0) continue;
    if (!e.tagged) {
      problems.push(`${e.id}: has a quarantine annotation but no @quarantine tag, so it still blocks`);
      continue;
    }
    if (e.notes.length !== 1) {
      problems.push(
        `${e.id}: @quarantine needs exactly one annotation { type: 'quarantine', description: 'owner=<who> expires=YYYY-MM-DD' }`
      );
      continue;
    }
    const m = DESCRIPTION.exec(e.notes[0]);
    if (!m) {
      problems.push(`${e.id}: annotation "${e.notes[0]}" is not "owner=<who> expires=YYYY-MM-DD"`);
      continue;
    }
    const [, owner, expires] = m;
    quarantined.push({ id: e.id, owner, expires });
    if (expires < today)
      problems.push(`${e.id}: quarantine expired ${expires} (owner ${owner}) — fix it, or delete it`);
    else if (expires > cap) problems.push(`${e.id}: expires ${expires}, more than ${MAX_DAYS} days out`);
  }
  return { quarantined, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let entries;
  try {
    const raw = execFileSync(
      'node_modules/.bin/playwright',
      ['test', '--config=apps/web/playwright.config.ts', '--list', '--reporter=json'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    );
    entries = entriesFromListJson(JSON.parse(raw));
  } catch (e) {
    process.stderr.write(`check-quarantine: could not list the tests — ${e.message.split('\n')[0]}\n`);
    process.exit(1);
  }
  const { quarantined, problems } = checkQuarantine(entries, new Date().toISOString().slice(0, 10));
  const table = [
    `### Quarantined tests: ${quarantined.length}`,
    '',
    ...(quarantined.length
      ? [
          '| test | owner | expires |',
          '|---|---|---|',
          ...quarantined.map((q) => `| ${q.id} | ${q.owner} | ${q.expires} |`),
        ]
      : ['none']),
    ...(problems.length ? ['', ...problems.map((p) => `- ✗ ${p}`)] : []),
    '',
  ].join('\n');
  process.stdout.write(table);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
  process.exit(problems.length ? 1 : 0);
}
