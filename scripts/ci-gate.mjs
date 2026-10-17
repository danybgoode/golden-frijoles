#!/usr/bin/env node
// ci-gate — the ONE check a ruleset requires (ci-diet D3, D10).
//
// Green only when every job `gate` needs succeeded, or was skipped BECAUSE the `changes` job said the PR is docs-only
// and the job is one the docs rule may skip. cancelled, failure, and any skip the rule did not order are red. So is
// anything this script cannot read: a gate that passes when confused is not a gate.
//
// A path-filtered job (verify-module D5) may also be skipped, but only when `changes` set its own output to
// `false`: `--filtered verify-outbox=verify_outbox` reads `changes.outputs.verify_outbox`.
//
//   NEEDS='${{ toJSON(needs) }}' node scripts/ci-gate.mjs --skippable e2e-api,e2e-authed,design-contract \
//     --filtered verify-outbox=verify_outbox,verify-flags=verify_flags
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Decide the gate. `needs` is GitHub's `needs` context ({ job: { result, outputs } }).
 * Returns { ok, rows: [{ job, result, verdict }] , problems: string[] }.
 */
export function decideGate(needs, skippable, filtered = {}) {
  const problems = [];
  const rows = [];
  if (!needs || typeof needs !== 'object' || Array.isArray(needs) || Object.keys(needs).length === 0) {
    return { ok: false, rows, problems: ['no needs context'] };
  }
  const changes = needs.changes;
  const docsOnly = changes?.outputs?.docs_only;
  if (changes?.result !== 'success') problems.push(`changes: ${changes?.result ?? 'missing'} (must succeed)`);
  else if (docsOnly !== 'true' && docsOnly !== 'false') problems.push(`changes: docs_only is "${docsOnly}"`);
  for (const job of skippable) if (!(job in needs)) problems.push(`${job}: named skippable but not in needs`);
  for (const [job, output] of Object.entries(filtered)) {
    if (!(job in needs)) problems.push(`${job}: named filtered but not in needs`);
    const v = changes?.outputs?.[output];
    if (v !== 'true' && v !== 'false') problems.push(`changes: ${output} is "${v}"`);
  }

  for (const [job, value] of Object.entries(needs)) {
    const result = value?.result;
    let verdict;
    if (result === 'success') verdict = 'ok';
    else if (result === 'skipped' && docsOnly === 'true' && skippable.includes(job))
      verdict = 'ok (docs-only skip)';
    else if (result === 'skipped' && job in filtered && changes?.outputs?.[filtered[job]] === 'false')
      verdict = 'ok (path filter skip)';
    else verdict = 'RED';
    rows.push({ job, result: result ?? 'missing', verdict });
    if (verdict === 'RED') problems.push(`${job}: ${result ?? 'missing'}`);
  }
  return { ok: problems.length === 0, rows, problems, docsOnly };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--skippable');
  const skippable = i > 0 ? (process.argv[i + 1] ?? '').split(',').filter(Boolean) : [];
  const f = process.argv.indexOf('--filtered');
  const filtered = Object.fromEntries(
    (f > 0 ? (process.argv[f + 1] ?? '').split(',').filter(Boolean) : []).map((pair) => pair.split('='))
  );
  let needs;
  try {
    needs = JSON.parse(process.env.NEEDS ?? '');
  } catch {
    needs = null;
  }
  const { ok, rows, problems, docsOnly } = decideGate(needs, skippable, filtered);
  const table = [
    `### gate: ${ok ? 'green' : 'RED'} (docs_only=${docsOnly ?? '?'})`,
    '',
    '| job | result | verdict |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.job} | ${r.result} | ${r.verdict} |`),
    ...(problems.length ? ['', ...problems.map((p) => `- ${p}`)] : []),
    '',
  ].join('\n');
  process.stdout.write(table);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
  for (const p of problems) process.stdout.write(`::error::gate: ${p}\n`);
  process.exit(ok ? 0 : 1);
}
