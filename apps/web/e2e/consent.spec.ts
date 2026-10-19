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
