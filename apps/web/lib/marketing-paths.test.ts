// landing-launch-experiment D2 + D8 — the marketing allow-list, and that the middleware matcher covers exactly it.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MARKETING_MATCHERS, VISITOR_COOKIE_ATTRIBUTES, isMarketingPath } from './marketing-paths.ts'

test('marketing pages are on the list; member, share and install pages never are (D8)', () => {
  for (const path of ['/', '/methodology', '/methodology/why', '/talk', '/signup', '/login'])
    assert.equal(isMarketingPath(path), true, path)
  for (const path of [
    '/app',
    '/app/flags/x',
    '/hub/golden-frijoles',
    '/s/abc',
    '/install',
    '/cli/connect',
    '/auth/callback',
    '/api/v1/public/self-visit',
    '/talking',
    '/methodologyx',
  ])
    assert.equal(isMarketingPath(path), false, path)
})

test('the middleware matcher lists every marketing matcher, and still covers /app and /cli (D2)', () => {
  const source = readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8')
  const matcher = source.match(/matcher:\s*\[([^\]]*)\]/)
  assert.ok(matcher, 'no matcher literal in middleware.ts')
  const entries = [...matcher[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  assert.deepEqual(
    entries.filter((e) => !e.startsWith('/app') && !e.startsWith('/cli')).sort(),
    [...MARKETING_MATCHERS].sort()
  )
  assert.ok(entries.includes('/app/:path*') && entries.includes('/cli/:path*'))
})

test('the visitor cookie stays readable by the beacon (not httpOnly) and lasts a year', () => {
  assert.equal(VISITOR_COOKIE_ATTRIBUTES.httpOnly, false)
  assert.equal(VISITOR_COOKIE_ATTRIBUTES.maxAge, 31_536_000)
})
