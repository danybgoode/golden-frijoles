import { test, expect } from '@playwright/test'

// landing-launch-experiment · S4.4 (D28) — signed in, with checkout on (this server's gates), both landing arms offer Growth
// as a POST form to checkout, never a link: a prefetch or crawler must never start a checkout (codex, #412). The signed-out
// answer is landing-variants.spec.ts; the decision itself is lib/billing-view.test.ts → growthCta (verifier, #419).
test('signed in, both arms render Get Growth as a POST form to checkout', async ({ page }) => {
  for (const path of ['/?variant=a', '/?variant=b']) {
    await page.goto(path)
    const form = page.locator('#pricing form[action="/api/v1/billing/checkout"]')
    await expect(form, path).toHaveCount(1)
    await expect(form, path).toHaveAttribute('method', 'post')
    await expect(form.getByRole('button', { name: /Get Growth/ }), path).toBeVisible()
    await expect(page.locator('#pricing a', { hasText: 'Get Growth' }), path).toHaveCount(0)
  }
})
