import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { Client } from 'pg'
import { HUB_ENGAGEMENT_SIGNAL_KEY, OWED_VIEWED_EVENT } from '@/lib/self-track-events'
import { isOwedOnScreenEnabled } from './helpers/gates'
import { disposableSession } from './helpers/disposable-session'
import {
  OWED_EPIC,
  OWED_FILE,
  OWED_LINE,
  OWED_QUIET_EPIC,
  OWED_REPO,
  addQuietProduct,
  pushOwedRoadmap,
  owedFixtureRows,
  removeProducts,
} from './helpers/owed-fixture'

// owed-on-screen S2.4 — the LIT half: a member of a project whose push carries an `owed` block sees it on the board, the
// epic page and the portfolio. Its twin, `owed-on-screen-dark.authed.spec.ts`, asserts the same pages with the flag off;
// exactly one of the two runs against a given server (they skip on the gate, as scenario-authoring does).
//
// Signed in as a DISPOSABLE person who owns the project the fixture is pushed to: giving the shared fixture user a
// different roadmap, or a second product, would change what every other authed spec reads (workspaces, 2026-10-01).
// The signed-out side of this boundary is hub.spec.ts's owed test (the public project, serial file, latest wins).

const SELF_PROJECT_SLUG =
  process.env.SELF_PROJECT_SLUG?.trim() || process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'

/** The `owed_viewed` rows the self tenant holds for one person — the person is the user subject (one-bet-wired). */
async function viewedRows(userId: string): Promise<Array<{ feature_id: string | null }>> {
  const dbUrl = process.env.SUPABASE_DB_URL
  // Fail loud: a skipped measurement check reads exactly like a passed one.
  if (!dbUrl)
    throw new Error('needs SUPABASE_DB_URL — the self tenant must be reachable to read owed_viewed back')
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    const { rows } = await client.query(
      `select e.feature_id from events e join projects p on p.id = e.project_id
        where e.event = $1 and e.user_id = $2 and p.slug = $3`,
      [OWED_VIEWED_EVENT, userId, SELF_PROJECT_SLUG]
    )
    return rows
  } finally {
    await client.end()
  }
}

test('a member sees the owed checks on the board, the epic page and the portfolio', async ({ browser }) => {
  test.skip(
    !isOwedOnScreenEnabled(),
    'the lit half needs HUB_OWED_ENABLED=true; the dark twin covers the other server'
  )
  const session = await disposableSession(browser, 'owner')
  const extraProjects: string[] = []
  try {
    const { db, userId, page } = session
    const marker = `OWED-${randomBytes(4).toString('hex')}`
    const rows = owedFixtureRows(marker)

    const { data: home, error } = await db
      .from('project_members')
      .select('projects(id, slug, workspace_id)')
      .eq('user_id', userId)
      .single()
    if (error || !home) throw new Error(`home project: ${error?.message}`)
    const project = home.projects as unknown as { id: string; slug: string; workspace_id: string }
    await pushOwedRoadmap(db, project.id, marker)

    const quiet = await addQuietProduct(db, userId, project.workspace_id)
    extraProjects.push(quiet.id)
    const quietSlug = quiet.slug

    // ── The board: one band, three groups, a line that opens its epic ────────────────────────────────────────────────
    await page.goto(`/hub/${project.slug}/board`)
    const band = page.locator('[data-owed-band]')
    await expect(band.locator('.ds-band-title')).toContainText('Waiting on you')
    await expect(band.locator('.ds-band-who')).toHaveText(String(rows.length))
    await expect(band.locator('.ds-band-sub')).toContainText('as of abc1234')
    await expect(band.locator('[data-owed-group="waiting"] h4')).toHaveText('Waiting on you · 1')
    await expect(band.locator('[data-owed-group="agentCould"] h4')).toHaveText(
      'An agent could, with a smoke account · 1'
    )
    await expect(band.locator('[data-owed-group="unsorted"] h4')).toHaveText('Not sorted yet · 1')
    // Each group holds the right check, and says its kind in words.
    await expect(band.locator('[data-owed-group="waiting"]')).toContainText(rows[0].text)
    await expect(band.locator('[data-owed-group="waiting"]')).toContainText('A decision only you can make')
    await expect(band.locator('[data-owed-group="agentCould"]')).toContainText(rows[1].text)
    // An attached line names its epic and links to it; an unattached one names its file instead.
    const epicLink = band.locator('[data-owed-group="waiting"] a[data-owed-epic]')
    await expect(epicLink).toHaveText(OWED_EPIC)
    await expect(epicLink).toHaveAttribute('href', `/hub/${project.slug}/epic/${OWED_EPIC}`)
    const loose = band.locator('[data-owed-group="unsorted"]')
    await expect(loose.locator('a[data-owed-epic]')).toHaveCount(0)
    await expect(loose).toContainText('apps/web/e2e/owed-fixture.spec.ts:3')

    // ── The epic page ────────────────────────────────────────────────────────────────────────────────────────────────
    await epicLink.click()
    await expect(page).toHaveURL(new RegExp(`/hub/${project.slug}/epic/${OWED_EPIC}$`))
    const section = page.locator('[data-owed-section]')
    await expect(section.locator('h2')).toHaveText('Owed')
    // Only THIS epic's checks: the board's third line belongs to no epic.
    await expect(section.locator('.ds-task')).toHaveCount(2)
    await expect(section).toContainText(rows[0].text)
    await expect(section).not.toContainText(rows[2].text)
    await expect(section.getByRole('link', { name: `${OWED_FILE}:${OWED_LINE}` })).toHaveAttribute(
      'href',
      `${OWED_REPO}${OWED_FILE}#L${OWED_LINE}`
    )
    // An epic that owes nothing has no section at all, not an empty one.
    await page.goto(`/hub/${project.slug}/epic/${OWED_QUIET_EPIC}`)
    await expect(page.locator('main h1')).toHaveText('An epic that owes nothing')
    await expect(page.locator('[data-owed-section]')).toHaveCount(0)

    // ── The portfolio ────────────────────────────────────────────────────────────────────────────────────────────────
    await page.goto('/app/portfolio')
    const table = page.locator('main [data-portfolio-state="portfolio"]')
    await expect(table.locator(`[data-product="${project.slug}"]`)).toBeVisible()
    await expect(table.locator(`[data-product="${quietSlug}"]`)).toBeVisible()
    await expect(table.locator('[data-cell="owed"]')).toHaveText([`${rows.length} owed`])
    // …and it sits on the pushed product's row, not the quiet one's.
    await expect(
      page
        .getByRole('row')
        .filter({ has: page.locator(`[data-product="${project.slug}"]`) })
        .locator('[data-cell="owed"]')
    ).toHaveText(`${rows.length} owed`)

    // ── Measured: the member's own user id, on the engagement signal ────────────────────────────────────────────────
    // Three page views rendered a check (board, epic page, portfolio); the quiet epic page rendered none and fired none.
    await expect.poll(async () => (await viewedRows(userId)).length, { timeout: 15_000 }).toBe(3)
    for (const row of await viewedRows(userId)) expect(row.feature_id).toBe(HUB_ENGAGEMENT_SIGNAL_KEY)
  } finally {
    await removeProducts(session.db, extraProjects)
    await session.cleanup()
  }
})
