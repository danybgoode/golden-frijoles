import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedFiles, isDocsOnly, verifyFilters } from './ci-changes.mjs';

// A hook exports GIT_DIR and friends, which override cwd: an unsealed fixture would rewrite the real repo
// (git-fixtures-sealed.test.mjs).
const GIT_ENV_TO_CLEAR = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_COMMON_DIR',
];
function sealedEnv() {
  const env = { ...process.env };
  for (const k of GIT_ENV_TO_CLEAR) delete env[k];
  return env;
}

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
    const env = sealedEnv();
    const git = (...a) => execFileSync('git', a, { cwd: dir, env, encoding: 'utf8' }).trim();
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
    const files = changedFiles(base, 'HEAD', dir, env);
    assert.deepEqual(files.sort(), ['Roadmap/a.md', 'apps/a.ts']);
    assert.equal(isDocsOnly(files), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('an uncomputable diff throws, which the CLI turns into docs_only=false', () => {
  assert.throws(() => changedFiles('0000000', 'HEAD'));
});

test('verify filters: the outbox paths, the evaluator paths, and the wiring that governs both', () => {
  const v = (files) => verifyFilters(files);
  assert.deepEqual(v(['Roadmap/x.md']), { verify_outbox: false, verify_flags: false });
  assert.deepEqual(v(['apps/web/lib/delivery-dispatch.ts']), { verify_outbox: true, verify_flags: false });
  assert.deepEqual(v(['apps/web/supabase/migrations/20990101000000_anything.sql']), {
    verify_outbox: true,
    verify_flags: false,
  });
  assert.deepEqual(v(['apps/web/app/api/internal/dispatch-deliveries/route.ts']).verify_outbox, true);
  assert.deepEqual(v(['verify/quint/outbox.qnt']), { verify_outbox: true, verify_flags: false });
  assert.deepEqual(v(['packages/sdk/src/flags.ts']), { verify_outbox: false, verify_flags: true });
  assert.deepEqual(v(['verify/lean/Flageval/Model.lean', 'verify/diff-test/run.mjs']).verify_flags, true);
  assert.deepEqual(v(['.github/workflows/ci.yml']), { verify_outbox: true, verify_flags: true });
  assert.deepEqual(v(['verify/pins.json']), { verify_outbox: true, verify_flags: true });
});

test('verify filters: lookalikes do not match, and the gate seam lib/flags.ts is not the evaluator', () => {
  const v = (files) => verifyFilters(files);
  assert.deepEqual(v(['apps/web/lib/flags.ts']), { verify_outbox: false, verify_flags: false });
  assert.deepEqual(v(['packages/sdk/src/flags.test.ts']), { verify_outbox: false, verify_flags: false });
  assert.deepEqual(v(['apps/web/lib/delivery-dispatch.test.ts']), {
    verify_outbox: false,
    verify_flags: false,
  });
  assert.deepEqual(v(['verify/README.md']), { verify_outbox: false, verify_flags: false });
});

test('verify filters: an empty diff is unsure, so both run', () => {
  assert.deepEqual(verifyFilters([]), { verify_outbox: true, verify_flags: true });
});
