import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readTenantRecord } from './helpers/authed-fixture'
import { isFunnelTrendEnabled } from './helpers/gates'

// funnel-truth S2.4 (D14, amended) — a member sees the project's segments on Journeys: everyone first, then each defined
// one with its rule and its share of the last 30 days' active people. Behind bets.funnel_trend_enabled (off: no section).

test('a member sees everyone and each defined segment with its rule and share', async ({ page }) => {
  const record = readTenantRecord()
  if (!record?.slug || !record.projectId) throw new Error('the segments page needs the auth-setup project')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  const db = createClient(url, key, { auth: { persistSession: false } })
  const segmentKey = `spec-seg-${Date.now()}`
  const defined = await db
    .from('segments')
    .insert({ project_id: record.projectId, key: segmentKey, event: 'spec_report', min_count: 3, days: 14 })
  if (defined.error) throw new Error(`could not define the segment: ${defined.error.message}`)
  try {
    const response = await page.goto(`/app/journeys/${record.slug}`)
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
    await db.from('segments').delete().eq('project_id', record.projectId).eq('key', segmentKey)
  }
})
