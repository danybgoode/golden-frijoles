import { test } from 'node:test';
import assert from 'node:assert/strict';
import { violations, VERCEL_HOST } from './check-brand-host.mjs';

test('a real Vercel host is caught, in prose, a URL or a workflow fallback', () => {
  for (const line of [
    'README.md:13:**Live** at `https://golden-beans-gamma.vercel.app`.',
    ".github/workflows/x.yml:4:  URL: ${{ vars.SITE_URL || 'https://old-app.vercel.app' }}",
    'Roadmap/x/sprint-1.md:9:**Preview:** `gb-git-feat-x-team-projects.vercel.app`',
  ]) {
    assert.deepEqual(violations([line]), [line]);
  }
});

test('placeholders, the bare platform name and the brand domain pass', () => {
  assert.deepEqual(
    violations([
      'a.md:1:a `<deployment>.vercel.app` URL',
      'a.md:2:previews serve `*.vercel.app`',
      'a.md:3:stay on the `vercel.app` domain',
      'a.md:4:https://goldenfrijoles.com/install',
      '',
    ]),
    []
  );
});

test('the site-URL rule tests are allowed; the same line anywhere else is not', () => {
  const line = "VERCEL_URL: 'gb-abc123.vercel.app',";
  assert.deepEqual(violations([`apps/web/lib/site-url-resolve.test.ts:54:${line}`]), []);
  assert.equal(violations([`apps/web/lib/site-url-resolve.ts:54:${line}`]).length, 1);
});

test('the pattern needs a host label in front', () => {
  assert.ok(VERCEL_HOST.test('x.vercel.app'));
  assert.ok(!VERCEL_HOST.test('.vercel.app'));
});
