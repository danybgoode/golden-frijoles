#!/usr/bin/env node
// ci-changes — does this PR change only docs? (ci-diet D2 as amended by C7, D10)
//
// The e2e jobs are skipped ONLY when every changed file is docs. Exclusion, never an inclusion list: when in doubt,
// everything runs. A diff that cannot be computed, or an empty one, is "not docs".
//
//   node scripts/ci-changes.mjs <base-sha> <head-sha>     → prints docs_only=true|false (append to $GITHUB_OUTPUT)
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
  try {
    if (!base || !head) throw new Error('usage: ci-changes.mjs <base-sha> <head-sha>');
    const files = changedFiles(base, head);
    docsOnly = isDocsOnly(files);
    process.stderr.write(`ci-changes: ${files.length} changed file(s); docs_only=${docsOnly}\n`);
    for (const f of files.filter((f) => !isDocsPath(f)).slice(0, 10))
      process.stderr.write(`  not docs: ${f}\n`);
  } catch (e) {
    process.stderr.write(`ci-changes: ${e.message.split('\n')[0]} — running everything\n`);
  }
  process.stdout.write(`docs_only=${docsOnly}\n`);
}
