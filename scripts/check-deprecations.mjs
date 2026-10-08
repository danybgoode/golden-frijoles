#!/usr/bin/env node
// check-deprecations — a deprecated name may keep working for a while, but never quietly and never forever (plugin-1-0 D3).
//
// The CLI was renamed `gf` → `frijoles` (oh-my-zsh's git plugin aliases `gf` to `git fetch`), and the kit `gf-kit` →
// `frijoles-kit`. The old names stay in `bin` so scripts and CI jobs keep running, with a notice. This check is the
// expiry: it goes red once a row's date has passed, or once its package reaches the version that promised the removal,
// while the old name is still published. Same shape as check-quarantine: a dated red on every PR forces the decision.
//
//   node scripts/check-deprecations.mjs     exit 1 on an expired alias; prints the table either way
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every published alias with a removal promise. Removing the alias from `bin` is how a row is retired. */
export const DEPRECATIONS = [
  {
    alias: 'gf',
    replacement: 'frijoles',
    manifest: 'packages/cli/package.json',
    removeBy: '2026-12-31',
    removeIn: '1.1.0',
  },
  {
    alias: 'gf-kit',
    replacement: 'frijoles-kit',
    manifest: 'skills/kit/package.json',
    removeBy: '2026-12-31',
    removeIn: '1.1.0',
  },
];

/** A typed old command: `gf <verb>` or `gf-kit <verb>`. Prose about the name itself ("the old name gf") does not match. */
export const OLD_COMMAND =
  /(?<![\w\-/.$])gf(?:-kit)? (?:login|logout|init|setup|flags|whoami|doctor|projects|keys|config|north-star|experiments|help|--version|--help|--list)\b/;

/** Shipped text: where a reader meets a command. Roadmap history and the release notes are records, not instructions. */
export const SHIPPED = [
  'skills/plugins',
  'skills/template',
  'skills/kit',
  'skills/scripts',
  'skills/README.md',
  'apps/web',
  'packages',
  'scripts',
  'README.md',
  'CONTRIBUTING.md',
  'AGENTS.md',
];
export const TEXT_ALLOWED = [
  /CHANGELOG\.md:/,
  /supabase\/migrations\//, // applied migrations are history; a COMMENT ON string is stored in the database
  /jev-eval(\.lint)?\.fixtures\.json:/, // replayed seed text with fixed baselines; rewriting it would move scores
  /^scripts\/check-deprecations(\.test)?\.mjs:/,
];

/** `git grep -n` lines → the ones that still teach an old command. */
export function oldCommandLines(grepLines) {
  return grepLines.filter(
    (line) =>
      line && OLD_COMMAND.test(line.slice(line.indexOf(':') + 1)) && !TEXT_ALLOWED.some((re) => re.test(line))
  );
}

/** -1 · 0 · 1 for two `x.y.z` versions (a pre-release suffix is ignored: 1.1.0-rc.1 already promised the removal). */
export function compareVersions(a, b) {
  const pa = a.split('-')[0].split('.').map(Number);
  const pb = b.split('-')[0].split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0) ? -1 : 1;
  return 0;
}

/** The problems with one row, given its manifest and today's date (YYYY-MM-DD). Empty = fine. */
export function problemsFor(row, manifest, today) {
  const bin = manifest.bin ?? {};
  const problems = [];
  if (!(row.replacement in bin))
    problems.push(`${row.manifest}: the replacement \`${row.replacement}\` is not in bin`);
  if (!(row.alias in bin)) return problems; // retired: the row can be deleted
  if (today > row.removeBy)
    problems.push(
      `\`${row.alias}\` was due for removal on ${row.removeBy}; delete it from ${row.manifest} bin`
    );
  if (compareVersions(manifest.version, row.removeIn) >= 0)
    problems.push(
      `\`${row.alias}\` was promised gone in ${row.removeIn}, and ${row.manifest} is ${manifest.version}`
    );
  return problems;
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const problems = [];
  for (const row of DEPRECATIONS) {
    const manifest = JSON.parse(readFileSync(join(ROOT, row.manifest), 'utf8'));
    const found = problemsFor(row, manifest, today);
    problems.push(...found);
    const state = !(row.alias in (manifest.bin ?? {})) ? 'retired' : found.length ? 'NEEDS ACTION' : 'ok';
    console.log(
      `  ${row.alias} → ${row.replacement}  remove by ${row.removeBy} or in ${row.removeIn}  (${manifest.version}) ${state}`
    );
  }
  let grep = '';
  try {
    grep = execFileSync('git', ['grep', '-n', '-I', '-P', OLD_COMMAND.source, '--', ...SHIPPED], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    if (error.status !== 1) throw error; // 1 = no match; anything else is a broken read, not a pass
  }
  for (const line of oldCommandLines(grep.split('\n')))
    problems.push(`old command in shipped text: ${line.slice(0, 160)}`);
  if (problems.length === 0)
    return console.log(
      '✓ deprecations: every alias is inside its window, and no shipped text teaches an old command'
    );
  for (const p of problems) console.error(`✗ ${p}`);
  process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
