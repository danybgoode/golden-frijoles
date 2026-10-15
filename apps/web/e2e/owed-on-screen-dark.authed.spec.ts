import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { isOwedOnScreenEnabled } from './helpers/gates'
import { disposableSession } from './helpers/disposable-session'
import { OWED_EPIC, addQuietProduct, pushOwedRoadmap, removeProducts } from './helpers/owed-fixture'

// owed-on-screen S2.4 — the DARK half: with `hub.owed_enabled` off, a member whose push carries owed checks sees the
// board, the epic page and the portfolio exactly as before. The twin of `owed-on-screen.authed.spec.ts` (same fixture,
// same person shape); this one skips against a server with the flag on, as scenario-authoring-dark does, so it runs on a
// dark local run (point PLAYWRIGHT_BASE_URL at the server built from ci/gates.off.env).

test('with the flag off, a member sees no owed band, section or count', async ({ browser }) => {
  test.skip(isOwedOnScreenEnabled(), 'dedicated dark-path pass requires HUB_OWED_ENABLED=false')
  const session = await disposableSession(browser, 'owner')
  const extraProjects: string[] = []
  try {
    const { db, userId, page } = session
    const marker = `OWED-${randomBytes(4).toString('hex')}`
    const { data: home, error } = await db
      .from('project_members')
      .select('projects(id, slug, workspace_id)')
      .eq('user_id', userId)
      .single()
    if (error || !home) throw new Error(`home project: ${error?.message}`)
    const project = home.projects as unknown as { id: string; slug: string; workspace_id: string }
    await pushOwedRoadmap(db, project.id, marker)
    extraProjects.push((await addQuietProduct(db, userId, project.workspace_id)).id)

    // CONTROL first: the pages render with their content, so an error page cannot pass the absence checks below.
    await page.goto(`/hub/${project.slug}/board`)
    await expect(page.locator('main h1')).toHaveText('Board')
    await expect(page.locator('.ds-board-card', { hasText: 'An epic that still owes' })).toBeVisible()
    await expect(page.locator('[data-owed-band]')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText('Waiting on you')
    await expect(page.locator('main')).not.toContainText(marker)

    await page.goto(`/hub/${project.slug}/epic/${OWED_EPIC}`)
    await expect(page.locator('main h1')).toHaveText('An epic that still owes')
    await expect(page.locator('[data-owed-section]')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(marker)

    // CONTROL: the portfolio rendered both products, so a missing count is the flag's doing and not an empty page's.
    await page.goto('/app/portfolio')
    await expect(page.locator('main [data-portfolio-state="portfolio"] [data-product]')).toHaveCount(2)
    await expect(page.locator('[data-cell="owed"]')).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/\d+ owed/)
  } finally {
    await removeProducts(session.db, extraProjects)
    await session.cleanup()
  }
})
