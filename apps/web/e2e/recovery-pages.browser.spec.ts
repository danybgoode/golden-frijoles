import { test, expect } from '@playwright/test'

test('unknown page renders the Golden Frijoles recovery scene on desktop and mobile', async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 840 })
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'This bean wandered off.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to Golden Frijoles' })).toHaveAttribute('href', '/')
    await expect(page.locator('[data-recovery-code="404"]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
})
