import { test, expect } from '@playwright/test'
import { CLARITY_PROJECT_ID, GA4_MEASUREMENT_ID } from '@/lib/analytics-ids'

// landing-launch-experiment · Sprint 1, Story 1.1 (epic D8) — deny by default, as the server sends it. No page's HTML
// may carry a third-party analytics tag: they load only in the browser, after a yes, on a marketing page
// (`consent.browser.spec.ts` drives that half).

const THIRD_PARTY = /googletagmanager\.com|google-analytics\.com|clarity\.ms/i

for (const path of ['/', '/methodology', '/talk', '/login', '/install']) {
  test(`${path} ships no third-party analytics before consent`, async ({ request }) => {
    const res = await request.get(path)
    expect(res.status()).toBeLessThan(400)
    const html = await res.text()
    expect(html).not.toMatch(THIRD_PARTY)
    expect(html).not.toContain(GA4_MEASUREMENT_ID)
    expect(html).not.toContain(CLARITY_PROJECT_ID)
  })
}

// traffic-relaunch D1 — the middleware turns Cloudflare's country into one word on a marketing page, and only there.
function regionCookie(setCookie: string | undefined): string | null {
  const match = /(?:^|\n|,\s*)gf_cr=([^;]*)/.exec(setCookie ?? '')
  return match ? match[1] : null
}

for (const [country, mode] of [
  ['MX', 'load'],
  ['US', 'load'],
  ['DE', 'ask'],
  ['GB', 'ask'],
  ['BR', 'ask'],
  ['CA', 'ask'],
  ['XX', 'ask'],
] as const) {
  test(`a visitor from ${country} gets gf_cr=${mode}`, async ({ request }) => {
    const res = await request.get('/', { headers: { 'CF-IPCountry': country } })
    expect(res.status()).toBe(200)
    expect(regionCookie(res.headers()['set-cookie'])).toBe(mode)
    // The country itself never travels back.
    expect(res.headers()['set-cookie'] ?? '').not.toContain(country === 'XX' ? 'gf_cr=XX' : `=${country}`)
  })
}

test('no country header reads as unknown: ask', async ({ request }) => {
  const res = await request.get('/methodology')
  expect(regionCookie(res.headers()['set-cookie'])).toBe('ask')
})

test('off the marketing paths no region cookie is set', async ({ request }) => {
  const res = await request.get('/install', { headers: { 'CF-IPCountry': 'MX' } })
  expect(regionCookie(res.headers()['set-cookie'])).toBeNull()
})
