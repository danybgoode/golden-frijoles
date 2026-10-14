import { test, expect, type Locator } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { disposableSession } from './helpers/disposable-session'

// many-products · Sprint 1, Story 1.5 (Roadmap/02-commercial/many-products — D8, D2).
//
// `+ New product` on the portfolio head: a slug in, the SAME create as `frijoles projects create` out, landing on the new
// product's Connect page. Signed in as a DISPOSABLE person (never the shared fixture user: a second product for them
// would send every other authed spec's `/app` to the portfolio — LEARNINGS, workspaces 2026-10-01).

async function hydrated(form: Locator) {
  // Never type into a form React has not yet hydrated: the submit would be a native GET (portfolio.authed.spec.ts).
  await expect
    .poll(() => form.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactFiber$'))), {
      timeout: 15_000,
    })
    .toBe(true)
}

test('New product: creates a product in my own workspace and lands on its Connect page; a held or reserved name creates nothing', async ({
  browser,
}) => {
  test.setTimeout(90_000)
  const session = await disposableSession(browser, 'owner')
  const { page, db, userId } = session
  const slug = `np-e2e-${randomBytes(4).toString('hex')}`
  const takenSlug = `np-taken-${randomBytes(4).toString('hex')}`
  const slugRows = (value: string) => db.from('projects').select('id, workspace_id').eq('slug', value)
  try {
    // Someone else's product: a real row with no member of mine.
    // (In the home product's workspace: `workspace_id` is NOT NULL, and nothing here reads which one.)
    const { data: home } = await db.from('project_members').select('projects(workspace_id)').eq('user_id', userId).single()
    const workspaceId = (home?.projects as unknown as { workspace_id: string }).workspace_id
    const { error: heldError } = await db
      .from('projects')
      .insert({ slug: takenSlug, api_key_hash: null, workspace_id: workspaceId })
    if (heldError) throw new Error(`held project: ${heldError.message}`)

    await page.goto('/app/portfolio')
    await expect(page.locator('main h1')).toHaveText('Portfolio')
    const open = async () => {
      await page.getByRole('button', { name: '+ New product' }).first().click()
      const dialog = page.getByRole('dialog', { name: 'New product' })
      await expect(dialog).toBeVisible()
      await hydrated(dialog.locator('form'))
      return dialog
    }

    // A reserved name and a name someone else holds: each shows a sentence and creates nothing.
    let dialog = await open()
    // Each waits for ITS OWN sentence: the field keeps the last error, so "any text" would pass on the previous attempt's
    // while this one is still in flight (and a pending button ignores the next click).
    const refusals: Array<[string, RegExp]> = [
      ['golden-frijoles', /reserved name/],
      [takenSlug, /is taken/],
    ]
    for (const [refused, sentence] of refusals) {
      await dialog.getByLabel('Product name').fill(refused)
      await dialog.getByRole('button', { name: 'Create product' }).click()
      await expect(dialog.locator('.ds-field-error')).toHaveText(sentence, { timeout: 15_000 })
      await expect(page).toHaveURL(/\/app\/portfolio/)
    }
    const { data: stillHeld } = await slugRows(takenSlug)
    expect(stillHeld).toHaveLength(1) // the stranger's row, untouched — and nothing of mine beside it
    const { data: mine } = await db.from('project_members').select('project_id').eq('user_id', userId)
    expect(mine).toHaveLength(1) // only the home product the session started with

    // The name is mine to take: lands on Connect, as the owner.
    await dialog.getByLabel('Product name').fill(slug)
    await dialog.getByRole('button', { name: 'Create product' }).click()
    await expect(page).toHaveURL(new RegExp(`/app/setup/connect/${slug}$`), { timeout: 30_000 })
    const { data: created } = await slugRows(slug)
    expect(created).toHaveLength(1)
    const { data: membership } = await db
      .from('project_members')
      .select('role')
      .eq('user_id', userId)
      .eq('project_id', created![0].id)
      .single()
    expect(membership?.role).toBe('owner')
  } finally {
    const { data: made } = await slugRows(slug)
    const madeIds = (made ?? []).map((row) => row.id as string)
    const madeWorkspaces = [...new Set((made ?? []).map((row) => row.workspace_id as string))]
    if (madeIds.length) {
      await db.from('project_members').delete().in('project_id', madeIds)
      await db.from('projects').delete().in('id', madeIds)
    }
    await db.from('projects').delete().eq('slug', takenSlug)
    // The workspace the create claimed for this person — their own, made for them.
    for (const id of madeWorkspaces) {
      await db.from('workspace_members').delete().eq('workspace_id', id)
      await db.from('workspaces').delete().eq('id', id)
    }
    await session.cleanup()
  }
})
