import { test, expect } from '@playwright/test'
import { isFunnelTrendEnabled } from './helpers/gates'
import { disposableSession } from './helpers/disposable-session'

// funnel-truth S2.4 (D14, amended) — a member sees the project's segments on Journeys: everyone first, then each defined
// one with its rule and its share of the last 30 days' active people. Behind bets.funnel_trend_enabled (off: no section).
// A disposable member and project (verifier, #379): the shared auth-setup project's Journeys is measured by the visual
// gate in parallel, and a segment there would change its default state.

test('a member sees everyone and each defined segment with its rule and share', async ({ browser }) => {
  const session = await disposableSession(browser, 'owner')
  try {
    const { db, page } = session
    const project = await session.addProject('member', 'segments')
    const segmentKey = `spec-seg-${Date.now()}`
    const defined = await db
      .from('segments')
      .insert({ project_id: project.id, key: segmentKey, event: 'spec_report', min_count: 3, days: 14 })
    if (defined.error) throw new Error(`could not define the segment: ${defined.error.message}`)

    const response = await page.goto(`/app/journeys/${project.slug}`)
    if (response?.status() === 404)
      test.skip(true, 'Journeys is behind journeys.projections_enabled, off on this server')
    expect(response?.status()).toBe(200)
    await expect(page.locator('main h1')).toHaveText('Journeys') // CONTROL: the page rendered
    const section = page.getByRole('region', { name: 'Segments' })
    if (!isFunnelTrendEnabled()) {
      await expect(section, 'dark: no segments section').toHaveCount(0)
      return
    }
    const rows = section.locator('.ds-table-row')
    await expect(rows.filter({ hasText: /^everyone/ })).toContainText('100%')
    const row = rows.filter({ hasText: segmentKey })
    await expect(row).toContainText('spec_report at least 3× in 14 days')
    await expect(row).toContainText(/% \(\d+ of \d+\)|nobody was active/)
  } finally {
    await session.cleanup()
  }
})
