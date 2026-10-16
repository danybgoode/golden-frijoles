#!/usr/bin/env node
// ci-changes — does this PR change only docs? (ci-diet D2 as amended by C7, D10)
//
// The e2e jobs are skipped ONLY when every changed file is docs. Exclusion, never an inclusion list: when in doubt,
// everything runs. A diff that cannot be computed, or an empty one, is "not docs".
//
// It also answers the verify jobs' path filters (verify-module D4): does this PR touch the delivery outbox, or the
// flag evaluator? Same posture — unsure (no diff, an error) ⇒ true, so the model check runs.
//
//   node scripts/ci-changes.mjs <base-sha> <head-sha>     → prints docs_only=, verify_outbox=, verify_flags=
//                                                           (true|false; append to $GITHUB_OUTPUT)
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Docs = under Roadmap/, or a .md outside apps/ and packages/ (what the e2e jobs build and read: design-system's
 * MEASURED-SPEC.md and APPROVED.md are inputs to the design-contract job, lock C7).
 */
export function isDocsPath(path) {
  if (path.startsWith('Roadmap/')) return true;
  if (!path.endsWith('.md')) return false;
  return !path.startsWith('apps/') && !path.startsWith('packages/');
}

/** True only for a non-empty list of docs paths. */
export function isDocsOnly(files) {
  return files.length > 0 && files.every(isDocsPath);
}

/**
 * What each verify job mirrors, as path prefixes (a trailing `/`) or exact paths. Any migration counts for the outbox:
 * a function can be redefined in a migration of any name. The CI wiring itself counts for both, so a change to the
 * filter or the gate runs the jobs it governs.
 */
const VERIFY_SHARED = [
  'verify/pins.json',
  'scripts/verify-pins.mjs',
  '.github/workflows/ci.yml',
  'scripts/ci-changes.mjs',
  'scripts/ci-gate.mjs',
];
export const VERIFY_FILTERS = {
  verify_outbox: [
    'apps/web/supabase/migrations/',
    'apps/web/lib/delivery-dispatch.ts',
    'apps/web/lib/retry-policy.ts',
    'apps/web/lib/deliveries.ts',
    'apps/web/lib/webhook-delivery.ts',
    'apps/web/app/api/internal/dispatch-deliveries/',
    'verify/quint/',
    ...VERIFY_SHARED,
  ],
  verify_flags: [
    'packages/sdk/src/flags.ts',
    'packages/sdk/src/bucketing.ts',
    'verify/lean/',
    'verify/diff-test/',
    ...VERIFY_SHARED,
  ],
};

const matches = (path, pattern) => (pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern);

/** { verify_outbox, verify_flags } for a list of changed paths. An empty list is unsure: everything runs. */
export function verifyFilters(files) {
  return Object.fromEntries(
    Object.entries(VERIFY_FILTERS).map(([out, patterns]) => [
      out,
      files.length === 0 || files.some((f) => patterns.some((p) => matches(f, p))),
    ])
  );
}

/**
 * The changed paths between base and head. `--no-renames` lists both sides of a rename, so a code file moved into
 * Roadmap/ still shows its old path. `-z` keeps unusual filenames intact.
 */
export function changedFiles(base, head, cwd = process.cwd(), env = process.env) {
  const out = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${base}...${head}`], {
    cwd,
    env,
    encoding: 'utf8',
  });
  return out.split('\0').filter(Boolean);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [base, head] = process.argv.slice(2);
  let docsOnly = false;
  let filters = Object.fromEntries(Object.keys(VERIFY_FILTERS).map((k) => [k, true]));
  try {
    if (!base || !head) throw new Error('usage: ci-changes.mjs <base-sha> <head-sha>');
    const files = changedFiles(base, head);
    docsOnly = isDocsOnly(files);
    filters = verifyFilters(files);
    process.stderr.write(`ci-changes: ${files.length} changed file(s); docs_only=${docsOnly}\n`);
    for (const f of files.filter((f) => !isDocsPath(f)).slice(0, 10))
      process.stderr.write(`  not docs: ${f}\n`);
  } catch (e) {
    process.stderr.write(`ci-changes: ${e.message.split('\n')[0]} — running everything\n`);
  }
  process.stdout.write(`docs_only=${docsOnly}\n`);
  for (const [k, v] of Object.entries(filters)) process.stdout.write(`${k}=${v}\n`);
}
