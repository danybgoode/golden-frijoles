import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedFiles, isDocsOnly } from './ci-changes.mjs';

test('the sprint-2 cases: docs, mixed, root md, a workflow, an empty diff', () => {
  assert.equal(isDocsOnly(['Roadmap/x.md']), true);
  assert.equal(isDocsOnly(['Roadmap/x.md', 'apps/web/a.ts']), false);
  assert.equal(isDocsOnly(['README.md']), true);
  assert.equal(isDocsOnly(['.github/workflows/ci.yml']), false);
  assert.equal(isDocsOnly([]), false);
});

test('anything under Roadmap/ is docs, whatever its extension', () => {
  assert.equal(isDocsOnly(['Roadmap/00-ideas/BUILD-ORDER.md', 'Roadmap/x/data.json']), true);
});

test('markdown the e2e jobs read is NOT docs (lock C7)', () => {
  assert.equal(isDocsOnly(['apps/web/design-system/MEASURED-SPEC.md']), false);
  assert.equal(isDocsOnly(['apps/web/design-system/APPROVED.md']), false);
  assert.equal(isDocsOnly(['packages/sdk/README.md']), false);
  assert.equal(isDocsOnly(['skills/plugins/x/SKILL.md', 'AGENTS.md']), true);
});

test('lookalikes are not docs', () => {
  assert.equal(isDocsOnly(['Roadmapx/a.ts']), false);
  assert.equal(isDocsOnly(['notes.md.ts']), false);
  assert.equal(isDocsOnly(['docs/README.MD']), false);
});

test('a code file renamed into Roadmap/ still lists its old path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ci-changes-'));
  try {
    const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' }).trim();
    git('init', '-q', '-b', 'main');
    git('config', 'user.email', 't@t');
    git('config', 'user.name', 't');
    mkdirSync(join(dir, 'apps'));
    writeFileSync(join(dir, 'apps/a.ts'), 'export const a = 1\n'.repeat(20));
    git('add', '.');
    git('commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    mkdirSync(join(dir, 'Roadmap'));
    git('mv', 'apps/a.ts', 'Roadmap/a.md');
    git('commit', '-qm', 'move');
    const files = changedFiles(base, 'HEAD', dir);
    assert.deepEqual(files.sort(), ['Roadmap/a.md', 'apps/a.ts']);
    assert.equal(isDocsOnly(files), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an uncomputable diff throws, which the CLI turns into docs_only=false', () => {
  assert.throws(() => changedFiles('0000000', 'HEAD'));
});
