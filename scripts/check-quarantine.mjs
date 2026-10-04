#!/usr/bin/env node
// check-quarantine — a known flake may stop blocking merges, but never quietly and never forever (ci-diet D7, D13).
//
// A quarantined test carries the tag AND an annotation naming its owner and expiry:
//   test('…', { tag: '@quarantine', annotation: { type: 'quarantine', description: 'owner=Daniel expires=2026-11-03' } }, …)
// The blocking e2e jobs run `--grep-invert @quarantine`; ci.yml's `quarantine` job runs `--grep @quarantine` against
// the ON server and reports without blocking. THIS check keeps that honest. It fails on:
//   - a quarantine past its date, or more than MAX_DAYS out (Jev's shadow-expiry cap: a far date is a permanent
//     quarantine wearing an expiry), or a date that is not a real day;
//   - a missing owner or date, or the tag without the annotation (or the reverse);
//   - a test the quarantine job cannot run: one in the `browser` project, or in a file ci.yml runs against the OFF
//     server (excluding it there would silently stop asserting its dark contract).
// It reads Playwright's own test list, never the source.
//
//   node scripts/check-quarantine.mjs            exit 1 on any problem; prints the quarantine table either way
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const MAX_DAYS = 30;
const DESCRIPTION = /^owner=(\S+) expires=(\d{4}-\d{2}-\d{2})$/;
const RUNNABLE_PROJECTS = new Set(['api', 'authed']);

const addDays = (ymd, n) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** A YYYY-MM-DD that names a real calendar day (2026-10-32 and 2026-02-30 do not). */
const isRealDay = (ymd) => {
  const t = Date.parse(`${ymd}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === ymd;
};

/** Flatten `playwright test --list --reporter=json` into one entry per spec (projects merged). */
export function entriesFromListJson(json) {
  const out = new Map();
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) {
      const key = `${spec.file}:${spec.line}`;
      const entry = out.get(key) ?? {
        id: `${spec.file}:${spec.line} › ${spec.title}`,
        file: spec.file,
        tags: new Set(),
        notes: new Set(),
        projects: new Set(),
      };
      for (const t of spec.tags ?? []) entry.tags.add(t);
      for (const test of spec.tests ?? []) {
        if (test.projectName) entry.projects.add(test.projectName);
        for (const a of test.annotations ?? [])
          if (a.type === 'quarantine') entry.notes.add(a.description ?? '');
      }
      out.set(key, entry);
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const s of json.suites ?? []) walk(s);
  return [...out.values()].map((e) => ({
    id: e.id,
    file: e.file,
    projects: [...e.projects],
    tagged: e.tags.has('quarantine'),
    notes: [...e.notes],
  }));
}

/** The spec files ci.yml names explicitly: only the OFF-server pass names files, everything else runs a project. */
export function offServerFiles(ciYml) {
  return [...new Set([...ciYml.matchAll(/apps\/web\/e2e\/([\w.-]+\.spec\.ts)/g)].map((m) => m[1]))];
}

/**
 * Pure. Returns { quarantined: [{ id, owner, expires }], problems: string[] }. `today` is UTC YYYY-MM-DD.
 * `forbiddenFiles`: spec files the quarantine job cannot run (offServerFiles of ci.yml).
 */
export function checkQuarantine(entries, today, { forbiddenFiles = [] } = {}) {
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
    if (!m || !isRealDay(m[2])) {
      problems.push(
        `${e.id}: annotation "${e.notes[0]}" is not "owner=<who> expires=YYYY-MM-DD" (a real date)`
      );
      continue;
    }
    const [, owner, expires] = m;
    quarantined.push({ id: e.id, owner, expires });
    const stray = (e.projects ?? []).filter((p) => !RUNNABLE_PROJECTS.has(p));
    if (stray.length)
      problems.push(
        `${e.id}: project ${stray.join(', ')} — the quarantine job runs only api and authed tests`
      );
    if (forbiddenFiles.includes(e.file))
      problems.push(`${e.id}: ${e.file} runs against the OFF server, which the quarantine job does not boot`);
    if (expires < today)
      problems.push(`${e.id}: quarantine expired ${expires} (owner ${owner}) — fix it, or delete it`);
    else if (expires > cap) problems.push(`${e.id}: expires ${expires}, more than ${MAX_DAYS} days out`);
  }
  return { quarantined, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let entries;
  try {
    // Listing loads every spec, and some read Supabase env at import time. Nothing connects while listing, so
    // placeholders stand in where the env is unset (the static job has no Supabase).
    const env = {
      ...process.env,
      SUPABASE_URL: process.env.SUPABASE_URL || 'http://list.invalid',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'list-only',
    };
    const raw = execFileSync(
      'node_modules/.bin/playwright',
      ['test', '--config=apps/web/playwright.config.ts', '--list', '--reporter=json'],
      { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }
    );
    entries = entriesFromListJson(JSON.parse(raw));
  } catch (e) {
    process.stderr.write(`check-quarantine: could not list the tests — ${e.message.split('\n')[0]}\n`);
    if (e.stderr) process.stderr.write(String(e.stderr).slice(-4000));
    if (e.stdout) process.stderr.write(String(e.stdout).slice(-2000));
    process.exit(1);
  }
  const forbiddenFiles = offServerFiles(readFileSync('.github/workflows/ci.yml', 'utf8'));
  const { quarantined, problems } = checkQuarantine(entries, new Date().toISOString().slice(0, 10), {
    forbiddenFiles,
  });
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
