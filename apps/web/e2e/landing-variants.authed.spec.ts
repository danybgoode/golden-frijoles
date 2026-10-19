import { test, expect } from '@playwright/test'
import { assertMobileClean } from './helpers/mobile-heuristics'

// landing-launch-experiment · Sprint 3, Story 3.4 — the mobile sweep over BOTH variants, in a project CI runs (the
// `browser` project's public sweep, which also lists `/?variant=b`, is local-only). Each on an empty context: the
// landing is anonymous, and a signed-in session must not change what it renders.
for (const target of [
  { label: 'landing A', path: '/' },
  { label: 'landing B', path: '/?variant=b' },
]) {
  test(`${target.label} is mobile-clean`, async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    const res = await page.goto(target.path)
    expect(res?.status()).toBe(200)
    await assertMobileClean(page, target.label)
    await context.close()
  })
}
