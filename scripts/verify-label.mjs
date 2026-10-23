#!/usr/bin/env node
// verify-label — a PR that touches a spec path carries its builder's `Verify depth:` label (verify-labels S1.4, D3/D4).
//
// Run by .github/workflows/verify-label.yml on opened / edited / synchronize / reopened, so fixing the body re-runs it
// without a push. The workflow runs the BASE branch's copy of this file and only diffs the PR's head. Red only when ALL of: the head is not an agent's `claude/` data branch, the PR changes a file under
// verify/jev-triage/questions.mjs → PATHS (the same pathspecs the nightly diffs), and the body has no single depth
// (`parseLabel`). Every other PR is labelled `off` by rule in the shadow log and is never asked. Unsure which files
// changed (git failed) counts as touching the spec: the label is asked for, never silently skipped.
//
//   BASE=<sha> HEAD=<sha> HEAD_REF=<branch> PR_BODY=<body> node scripts/verify-label.mjs
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { PATHS, parseLabel } from './verify-shadow.mjs';
import { isMain } from './lib/is-main.mjs';

export const FIX =
  'This PR touches a spec path (verify/jev-triage/questions.mjs → PATHS). Edit the PR body so it has exactly one ' +
  'line `Verify depth: off|light|standard|deep` (rubric in .github/PULL_REQUEST_TEMPLATE.md); this check re-runs on edit.';

/**
 * The decision. `specFiles` = the PATHS files the PR changes, or null when they could not be listed (unsure ⇒ treated
 * as touching the spec). → { ok, reason }
 */
export function decideLabelCheck({ headRef, specFiles, body }) {
  if (String(headRef ?? '').startsWith('claude/'))
    return { ok: true, reason: "an agent's claude/ data branch: not labelled (verify-module D9)" };
  if (Array.isArray(specFiles) && specFiles.length === 0)
    return { ok: true, reason: 'touches no spec path: off by rule (verify-labels D1)' };
  const label = parseLabel(body);
  const touched = Array.isArray(specFiles) ? specFiles.join(', ') : 'unknown (git could not list the files)';
  if (label) return { ok: true, reason: `labelled ${label}; spec files: ${touched}` };
  return { ok: false, reason: `no Verify depth label; spec files: ${touched}` };
}

/** The PATHS files changed between base and head (three-dot, as ci-changes.mjs diffs), or null on any git error. */
export function specFilesBetween(base, head, cwd = process.cwd()) {
  try {
    if (!base || !head) return null;
    const out = execFileSync(
      'git',
      ['diff', '--name-only', '--no-renames', `${base}...${head}`, '--', ...PATHS],
      {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return out.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

if (isMain(import.meta.url)) {
  const { BASE, HEAD, HEAD_REF, PR_BODY } = process.env;
  const { ok, reason } = decideLabelCheck({
    headRef: HEAD_REF,
    specFiles: specFilesBetween(BASE, HEAD),
    body: PR_BODY,
  });
  const line = `verify-label: ${ok ? 'green' : 'RED'}: ${reason}`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  if (!ok) console.log(`::error::${FIX}`);
  process.exit(ok ? 0 : 1);
}
