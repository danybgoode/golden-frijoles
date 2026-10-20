import { test, expect } from '@playwright/test'

// landing-launch-experiment · Sprint 4 — the Terms and the Privacy notice are public, render their sections from
// lib/legal.ts, and link to each other (Stripe Checkout, the portal and the footer link here).
for (const [path, title, other] of [
  ['/terms', 'Terms of Service', '/privacy'],
  ['/privacy', 'Privacy notice', '/terms'],
] as const) {
  test(`${path} is public and complete`, async ({ request }) => {
    const res = await request.get(path)
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain(`<h1>${title}</h1>`)
    expect(html).toContain('Last updated 2026-10-20')
    expect(html).toContain(`href="${other}"`)
  })
}

test('the landing footer links both legal pages', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).toContain('href="/terms"')
  expect(html).toContain('href="/privacy"')
})
