// Real git, no network: a bare repo in a temp dir stands in for origin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { LOG_BRANCH_VERCEL_JSON, appendLineToBranch, readLogFromBranch } from './log-branch.mjs';

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'log-branch-'));
  const origin = join(root, 'origin.git');
  const work = join(root, 'work');
  git(root, 'init', '-q', '--bare', origin);
  git(root, 'init', '-q', work);
  git(work, 'remote', 'add', 'origin', origin);
  git(work, 'config', 'user.email', 'test@example.com');
  git(work, 'config', 'user.name', 'test');
  return { root, origin, work };
}

test('every log commit carries a vercel.json that turns deployments off, beside the log', (t) => {
  const { root, origin, work } = fixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const branch = 'claude/test-log';

  assert.equal(
    appendLineToBranch({ cwd: work, branch, path: 'a.jsonl', line: '{"n":1}\n', message: 'one' }),
    true
  );
  assert.equal(
    appendLineToBranch({ cwd: work, branch, path: 'a.jsonl', line: '{"n":2}\n', message: 'two' }),
    true
  );

  assert.deepEqual(git(origin, 'ls-tree', '--name-only', branch).trim().split('\n'), [
    'a.jsonl',
    'vercel.json',
  ]);
  assert.equal(git(origin, 'show', `${branch}:vercel.json`), LOG_BRANCH_VERCEL_JSON);
  assert.deepEqual(JSON.parse(LOG_BRANCH_VERCEL_JSON), { git: { deploymentEnabled: false } });
  assert.equal(readLogFromBranch({ cwd: work, branch, path: 'a.jsonl' }), '{"n":1}\n{"n":2}\n');
  assert.equal(git(origin, 'rev-list', '--count', branch).trim(), '2');
});
