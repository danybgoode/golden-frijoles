#!/usr/bin/env node
// check-brand-host — no Vercel deployment host in the repo; the brand domain is goldenfrijoles.com (launch-trust-sweep S1.2).
//
// The app already refuses the Vercel host at runtime (`getSiteUrl()`, AGENTS rule 5). This guards the rest of the repo
// — docs, workflows, tests — where a pasted deployment URL silently ships a second public address (and the Vercel team
// name with it). Reads every tracked file through `git grep`, so a new folder is covered without being listed.
//
// Allowed: the files that test the site-URL rule itself, where a preview host is the input under test. Write a host
// you need to describe as `<deployment>.vercel.app` (a placeholder never matches).
//
//   node scripts/check-brand-host.mjs     exit 1 and list each line on any match
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** One DNS label followed by `.vercel.app`: a real host. `<deployment>.vercel.app` and `*.vercel.app` do not match. */
export const VERCEL_HOST = /[a-z0-9][a-z0-9-]*\.vercel\.app/i;

export const ALLOWED_FILES = new Set([
  'apps/web/lib/site-url-resolve.test.ts', // preview hosts are the input the resolver is tested on
  'scripts/check-brand-host.test.mjs', // the guard's own fixtures
]);

/** `git grep -n` output lines → the violations, allow-list applied. */
export function violations(grepLines) {
  return grepLines.filter((line) => {
    const file = line.slice(0, line.indexOf(':'));
    return line.length > 0 && !ALLOWED_FILES.has(file) && VERCEL_HOST.test(line.slice(file.length));
  });
}

function main() {
  let out = '';
  try {
    out = execFileSync('git', ['grep', '-n', '-I', '-i', '-E', VERCEL_HOST.source, '--', '.'], {
      encoding: 'utf8',
    });
  } catch (error) {
    if (error.status !== 1) throw error; // 1 = no match; anything else is a broken read, not a pass
  }
  const found = violations(out.split('\n'));
  if (found.length === 0) {
    console.log('✓ brand host: no Vercel deployment host outside the site-URL tests');
    return;
  }
  console.error(
    `✗ brand host: ${found.length} Vercel deployment host(s). Use https://goldenfrijoles.com, or`
  );
  console.error('  `<deployment>.vercel.app` when describing the rule:');
  for (const line of found) console.error(`  ${line.slice(0, 200)}`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
