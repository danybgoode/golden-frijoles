import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// landing-launch-experiment · Sprint 3, Story 3.4 (epic D13, D18) — A is the control, so its markup is pinned: the A/B
// pick on `/` must change nothing a visitor in A receives. The fixture was generated on this branch and checked against
// a server built from `main` before the A/B pick (the run log in sprint-3.md), so "unchanged" means unchanged against
// main, not against itself. Regenerate deliberately: `UPDATE_LANDING_A=1` (and say why in the PR).
//
// Normalised before comparing, and ONLY for what differs per run or per host: script tags and React's streaming markers,
// the origin the server builds URLs from (rule #5's SITE_URL differs per environment), and React's generated ids.

const FIXTURE = join(__dirname, '_fixtures', 'landing-a.html')

function normalise(html: string): string {
  const body = html.slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  return body
    .replace(/<script\b[\s\S]*?<\/script>/g, '')
    .replace(/<!--\/?\$\??-->|<template[^>]*><\/template>/g, '')
    .replace(
      /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?|https:\/\/[a-z0-9.-]+\.vercel\.app|https:\/\/goldenfrijoles\.com/g,
      'ORIGIN'
    )
    .replace(/(id|for|aria-[a-z]+)="[^"]*_R_[^"]*"/g, '$1="RID"')
    .replace(/>\s+</g, '><')
}

test('A renders with no trace of B, and its markup is unchanged (D13)', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).not.toContain('class="lb"')
  const markup = normalise(html)
  if (process.env.UPDATE_LANDING_A === '1') writeFileSync(FIXTURE, markup)
  expect(markup).toBe(readFileSync(FIXTURE, 'utf8'))
})

test('`?variant=b` renders B off production (D11); `?variant=a` renders A', async ({ request }) => {
  const b = await (await request.get('/?variant=b')).text()
  expect(b).toContain('class="lb"')
  expect(b).toContain('id="loop"')
  expect(b).toContain('id="pricing"')
  const a = await (await request.get('/?variant=a')).text()
  expect(a).not.toContain('class="lb"')
})

// landing-launch-experiment · Sprint 5, Story 5.2 (D21) — B's founder note and third tier both lead to `/talk`, and
// `/talk` is the "Set up with us" page they promise.
test("B's offer links land on /talk, which is Set up with us", async ({ request }) => {
  const b = await (await request.get('/?variant=b')).text()
  expect(b.match(/href="\/talk"/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  const res = await request.get('/talk')
  expect(res.status()).toBe(200)
  const talk = await res.text()
  expect(talk).toContain('Set up with us')
  expect(talk).toContain('from $1,500')
})
