#!/usr/bin/env node
// ci-gate — the ONE check a ruleset requires (ci-diet D3, D10).
//
// Green only when every job `gate` needs succeeded, or was skipped BECAUSE the `changes` job said the PR is docs-only
// and the job is one the docs rule may skip. cancelled, failure, and any skip the rule did not order are red. So is
// anything this script cannot read: a gate that passes when confused is not a gate.
//
//   NEEDS='${{ toJSON(needs) }}' node scripts/ci-gate.mjs --skippable e2e-api,e2e-authed,design-contract
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Decide the gate. `needs` is GitHub's `needs` context ({ job: { result, outputs } }).
 * Returns { ok, rows: [{ job, result, verdict }] , problems: string[] }.
 */
export function decideGate(needs, skippable) {
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

  for (const [job, value] of Object.entries(needs)) {
    const result = value?.result;
    let verdict;
    if (result === 'success') verdict = 'ok';
    else if (result === 'skipped' && docsOnly === 'true' && skippable.includes(job))
      verdict = 'ok (docs-only skip)';
    else verdict = 'RED';
    rows.push({ job, result: result ?? 'missing', verdict });
    if (verdict === 'RED') problems.push(`${job}: ${result ?? 'missing'}`);
  }
  return { ok: problems.length === 0, rows, problems, docsOnly };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--skippable');
  const skippable = i > 0 ? (process.argv[i + 1] ?? '').split(',').filter(Boolean) : [];
  let needs;
  try {
    needs = JSON.parse(process.env.NEEDS ?? '');
  } catch {
    needs = null;
  }
  const { ok, rows, problems, docsOnly } = decideGate(needs, skippable);
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
