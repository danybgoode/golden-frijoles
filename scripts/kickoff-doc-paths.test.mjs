// kickoff-doc-paths.test.mjs — no shipped doc or generator names `node skills/groom/…` again
// (kickoff-generator-path S2.2, lock C6).
//
// `skills/groom/` exists only inside the plugin's own folder, so a doc that tells a reader to run
// `node skills/groom/emit-epic-kickoff.mjs` hands them a MODULE_NOT_FOUND everywhere else. Nine docs did, and the
// generator's own one-sprint hint did too. The runnable forms are `/build <slug>` and
// `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>`. This fixes the class: any `node skills/groom/` in
// what a reader copies from goes red, whatever script it names.
//
// Exempt BY PATH, never by judgment: epic folders (`Roadmap/<NN-area>/<slug>/`, records of shipped work) and
// `Roadmap/00-ideas/` (seeds quote the bug as evidence). Plugin-relative code paths (`../skills/groom/`, the mod's
// bundled generator) are not the pattern, so they never match.
//
// A root spec, not a skills-ci one: the subtree split holds no root Roadmap/. It runs in `npm run test:unit`.
// Run: node --test scripts/kickoff-doc-paths.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** `node skills/groom/…`, `node "skills/groom/…`, `node ./skills/groom/…` — the plugin path run as if it were here. */
export const FORBIDDEN = /\bnode\s+["']?(?:\.\/)?skills\/groom\//;

/** What a reader copies from: [directory, file filter]. */
export const SCANNED = [
  ['Roadmap', () => true],
  ['skills/Roadmap', () => true],
  ['skills/template', () => true],
  // The plugin's shipped skill docs — its code holds plugin-relative paths legitimately, its prose must not.
  ['skills/plugins/golden-frijoles/skills', (rel) => rel.endsWith('.md')],
];

const TEXT = /\.(md|mjs|js|cjs|ts|tsx|json|ya?ml|txt|sh)$/;

/** True when `rel` (POSIX, from the repo root) is exempt by path. */
export function isExempt(rel) {
  return /(^|\/)Roadmap\/00-ideas\//.test(rel) || /(^|\/)Roadmap\/\d{2}-[^/]+\/[^/]+\//.test(rel);
}

/** Pure over `files` ([{ rel, text }]) — every line that names the forbidden form. */
export function findForbidden(files) {
  const hits = [];
  for (const { rel, text } of files) {
    if (isExempt(rel)) continue;
    text.split('\n').forEach((line, i) => {
      if (FORBIDDEN.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  return hits;
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.test(name)) out.push(p);
  }
  return out;
}

function shippedFiles() {
  return SCANNED.flatMap(([dir, keep]) =>
    walk(join(ROOT, dir))
      .map((p) => relative(ROOT, p).split(sep).join('/'))
      .filter((rel) => keep(rel))
      .map((rel) => ({ rel, text: readFileSync(join(ROOT, rel), 'utf8') }))
  );
}

test('no shipped doc or generator names `node skills/groom/` (the tree, now)', () => {
  const files = shippedFiles();
  assert.ok(files.length > 50, `scanned only ${files.length} file(s) — a scan root moved?`);
  assert.ok(files.some((f) => f.rel === 'Roadmap/WAYS-OF-WORKING.template.md'), 'the WAYS-OF-WORKING template is scanned');
  assert.ok(files.some((f) => f.rel === 'skills/template/scripts/emit-epic-kickoff.mjs'), 'the generator source is scanned');
  assert.ok(files.some((f) => f.rel === 'skills/plugins/golden-frijoles/skills/groom/SKILL.md'), 'groom’s SKILL.md is scanned');
  assert.deepEqual(findForbidden(files), [], 'name `/build <slug>` or `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` instead');
});

test('the guard fires on the forms the docs used to carry', () => {
  for (const line of [
    'Run `node skills/groom/emit-epic-kickoff.mjs --epic <slug>` to start.',
    'node skills/groom/emit-kickoff.mjs --epic <epic-slug> --sprint <N>',
    'node "skills/groom/emit-epic-kickoff.mjs" --epic x',
    'node ./skills/groom/scaffold-epic.mjs --slug x',
  ])
    assert.equal(findForbidden([{ rel: 'skills/template/Roadmap/SESSION-KICKOFFS.md', text: line }]).length, 1, line);
  assert.equal(
    findForbidden([{ rel: 'skills/template/scripts/emit-epic-kickoff.mjs', text: "`tool: node skills/groom/emit-kickoff.mjs --epic ${slug}`" }]).length,
    1,
    'a generator output string is caught too'
  );
});

test('it does not fire on the plugin-relative path, the runnable forms, or exempt folders', () => {
  const quiet = [
    { rel: 'skills/plugins/golden-frijoles/hooks/build-view.mjs', text: "new URL('../skills/groom/vendor/emit-epic-kickoff.mjs', import.meta.url)" },
    { rel: 'skills/plugins/golden-frijoles/skills/groom/SKILL.md', text: 'node "$GROOM/vendor/emit-epic-kickoff.mjs" --epic <epic-slug>' },
    { rel: 'Roadmap/WAYS-OF-WORKING.md', text: '`npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>`' },
    { rel: 'Roadmap/09-platform-infra/kickoff-generator-path/README.md', text: 'node skills/groom/emit-epic-kickoff.mjs' },
    { rel: 'Roadmap/00-ideas/seeds/kickoff-generator-path.md', text: 'node skills/groom/emit-epic-kickoff.mjs' },
  ];
  assert.deepEqual(findForbidden(quiet), []);
  assert.equal(isExempt('Roadmap/WAYS-OF-WORKING.md'), false, 'a top-level Roadmap doc is not exempt');
  assert.equal(isExempt('skills/template/Roadmap/SESSION-KICKOFFS.md'), false);
});
