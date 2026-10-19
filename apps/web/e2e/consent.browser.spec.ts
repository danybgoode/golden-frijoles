import { test, expect, type Page } from '@playwright/test'

// landing-launch-experiment · Sprint 1, Story 1.1 (epic D8) — the visitor decides, and only on marketing pages.

const THIRD_PARTY = /googletagmanager\.com|google-analytics\.com|clarity\.ms/i

function thirdPartyRequests(page: Page): string[] {
  const seen: string[] = []
  page.on('request', (req) => {
    if (THIRD_PARTY.test(req.url())) seen.push(req.url())
  })
  return seen
}

async function thirdPartyScripts(page: Page): Promise<string[]> {
  return page.$$eval('script[src]', (nodes) =>
    nodes
      .map((node) => (node as HTMLScriptElement).src)
      .filter((src) => /googletagmanager|clarity\.ms/.test(src))
  )
}

test('the banner asks first, and Decline loads nothing — before or after a reload', async ({ page }) => {
  const seen = thirdPartyRequests(page)
  await page.goto('/')
  const banner = page.getByRole('dialog', { name: 'Cookie settings' })
  await expect(banner).toBeVisible()
  expect(await thirdPartyScripts(page)).toEqual([])
  await banner.getByRole('button', { name: 'Decline' }).click()
  await expect(banner).toBeHidden()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toBeHidden()
  expect(await thirdPartyScripts(page)).toEqual([])
  expect(seen).toEqual([])
})

test('Accept loads GA4 and Clarity on the landing, and the footer reopens the choice', async ({ page }) => {
  await page.route(THIRD_PARTY, (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/')
  await page.getByRole('dialog', { name: 'Cookie settings' }).getByRole('button', { name: 'Accept' }).click()
  await expect
    .poll(() => thirdPartyScripts(page))
    .toEqual(
      expect.arrayContaining([
        expect.stringContaining('googletagmanager.com'),
        expect.stringContaining('clarity.ms'),
      ])
    )
  await page.getByRole('button', { name: 'Cookie settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toBeVisible()
})

test('even after Accept, /install never loads them (its page holds a minted connector URL)', async ({
  page,
}) => {
  const seen = thirdPartyRequests(page)
  await page.route(THIRD_PARTY, (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/')
  await page.getByRole('dialog', { name: 'Cookie settings' }).getByRole('button', { name: 'Accept' }).click()
  await page.goto('/install')
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toHaveCount(0)
  expect(await thirdPartyScripts(page)).toEqual([])
  seen.length = 0
  await page.reload()
  expect(seen).toEqual([])
})

test('a client-side navigation off the allow-list drops the recorder with the document', async ({ page }) => {
  await page.route(THIRD_PARTY, (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/')
  await page.getByRole('dialog', { name: 'Cookie settings' }).getByRole('button', { name: 'Accept' }).click()
  await expect.poll(() => thirdPartyScripts(page)).not.toEqual([])
  // A soft navigation, the way a <Link> would do it: the same document unless the manager reloads it.
  await page.evaluate(() =>
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push('/install')
  )
  await page.waitForURL('**/install')
  // The manager reloads the document; a read that lands mid-reload is "not yet", never a pass.
  await expect
    .poll(() => thirdPartyScripts(page).catch(() => ['(navigating)']), { timeout: 10_000 })
    .toEqual([])
})
