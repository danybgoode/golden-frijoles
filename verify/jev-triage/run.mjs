#!/usr/bin/env node
// verify-spike S1.3 — Jev triage, in SHADOW: nothing gates on these answers, they are only logged.
//
//   node verify/jev-triage/run.mjs            # asks Jev, writes answers.json
//   node verify/jev-triage/run.mjs --report   # the nightly's shadow log: labelled count + agreement (verify-module S2.2),
//                                             # split by builder / rule label, plus the backtest (verify-labels S1.3)
//   node verify/jev-triage/run.mjs --backtest # asks Jev on the backtest's rows — refused until the labels are signed off
//
// For each merged PR that touched the outbox or the flag evaluator, Jev gets the two specs' one-line
// summaries plus the PR's title and its diff on those paths, and answers the four triage questions.
// Egress: honours jev.config.json (`egress` must be true) and TYPESAFE_API_KEY, through the same
// askJev() every other Jev caller uses. The code sent is this public repository's own history.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
if (process.argv.includes('--report')) {
  // Reads only; asks nothing. The log on THIS checkout: rows still in the open shadow PR are not counted until it merges.
  const { readFileSync, existsSync } = await import('node:fs');
  const shadow = await import(resolve(root, 'scripts/verify-shadow.mjs'));
  const path = resolve(root, shadow.LOG_PATH);
  if (!existsSync(path)) {
    console.error(`${shadow.LOG_PATH} not found — the nightly has not logged anything here yet`);
    process.exit(2);
  }
  console.log(shadow.formatReport(shadow.report(shadow.parseLog(readFileSync(path, 'utf8')).rows)));
  const bpath = resolve(root, shadow.BACKTEST_PATH);
  if (existsSync(bpath)) {
    const bt = shadow.parseBacktest(readFileSync(bpath, 'utf8'));
    console.log(shadow.formatBacktest(shadow.backtestReport(bt.rows), bt.header));
  }
  process.exit(0);
}
if (process.argv.includes('--backtest')) {
  // The same request the nightly sends (title, file stat, spec-path diff against the first parent), one question.
  const { readFileSync, writeFileSync: write } = await import('node:fs');
  const shadow = await import(resolve(root, 'scripts/verify-shadow.mjs'));
  const { askJev, loadJevConfig } = await import(resolve(root, 'scripts/lib/jev.mjs'));
  const bpath = resolve(root, shadow.BACKTEST_PATH);
  const bt = shadow.parseBacktest(readFileSync(bpath, 'utf8'));
  const plan = shadow.backtestToAsk(bt);
  if (plan.refuse) {
    console.error(`${plan.refuse} — nothing was asked`);
    process.exit(2);
  }
  if (loadJevConfig({ root }).egress !== true) {
    console.error('jev.egress is not true — refusing to send anything. Nothing was asked.');
    process.exit(2);
  }
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 }).toString();
  for (const row of plan.rows) {
    const { req } = shadow.jevRequest({
      title: row.title,
      stat: git('diff', '--stat', `${row.sha}^1`, row.sha).slice(0, 20_000),
      diff: git('diff', `${row.sha}^1`, row.sha, '--', ...shadow.PATHS),
    });
    const res = await askJev(req, { timeoutMs: 30_000 });
    const answered = shadow.shadowRow({ number: row.pr, mergedAt: row.merged_at }, res, null);
    row.jev = answered.jev;
    if (answered.jev_error) row.jev_error = answered.jev_error;
    else delete row.jev_error;
    console.log(
      `backtest: ${row.sha.slice(0, 7)} #${row.pr ?? '—'} hindsight=${row.hindsight_label} jev=${row.jev ?? `— (${row.jev_error})`}`
    );
  }
  write(bpath, shadow.serialiseBacktest(bt));
  console.log(shadow.formatBacktest(shadow.backtestReport(bt.rows), bt.header));
  process.exit(0);
}
const { askJev, loadJevConfig, DEFAULT_MODEL } = await import(resolve(root, 'scripts/lib/jev.mjs'));
const { PATHS, DIFF_BUDGET, SPECS, QUESTIONS } = await import(resolve(here, 'questions.mjs'));

const config = loadJevConfig({ root });
if (config.egress !== true) {
  console.error('jev.egress is not true — refusing to send anything. Nothing was asked.');
  process.exit(2);
}

// The PRs, newest first: every merged commit on main that touched these paths (git log, 2026-09-29).
const PRS = [
  '7f81540',
  '20cecfb',
  '0a0beb0',
  'b473d13',
  'c258a18',
  'bc1abba',
  '9977c5a',
  '015eae4',
  'ce65993',
];

const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 }).toString();

const results = [];
for (const sha of PRS) {
  const title = git('log', '-1', '--format=%s', sha).trim();
  // Against the FIRST parent: `git show` on a merge commit prints a combined diff, which is empty
  // for a clean merge — two of these PRs landed as merge commits and would otherwise send no code.
  const stat = git('diff', '--stat', `${sha}^1`, sha, '--', ...PATHS).trim();
  let diff = git('diff', `${sha}^1`, sha, '--', ...PATHS);
  const truncated = diff.length > DIFF_BUDGET;
  if (truncated) diff = `${diff.slice(0, DIFF_BUDGET)}\n… [diff truncated at ${DIFF_BUDGET} chars]`;
  const state = { specs: SPECS, pullRequest: { title, filesChanged: stat, diff } };
  const started = Date.now();
  const res = await askJev({ state, questions: QUESTIONS }, { timeoutMs: 30_000 });
  const ms = Date.now() - started;
  const row = res.ok
    ? {
        sha,
        title,
        truncated,
        ms,
        model: res.model,
        touches_spec: res.answers.touches_spec?.noul ?? null,
        counterexample_class: res.answers.counterexample_class?.choice ?? null,
        obligation_difficulty: res.answers.obligation_difficulty?.choice ?? null,
        verify_depth: res.answers.verify_depth?.choice ?? null,
        usage: res.usage,
      }
    : { sha, title, truncated, ms, error: res.error ?? res.state };
  console.log(JSON.stringify(row));
  results.push(row);
}
writeFileSync(
  resolve(here, 'answers.json'),
  `${JSON.stringify({ askedAt: new Date().toISOString(), model: DEFAULT_MODEL, questions: QUESTIONS, results }, null, 2)}\n`
);
