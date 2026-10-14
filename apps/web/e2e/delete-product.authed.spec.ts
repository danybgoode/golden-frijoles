import { test, expect, type Locator } from '@playwright/test'
import { disposableSession } from './helpers/disposable-session'

// many-products · Sprint 2, Story 2.1 (Roadmap/02-commercial/many-products — D9).
//
// "Delete product" on the owner's Keys page: a typed confirmation, then the SAME soft delete as
// `frijoles projects delete`. Signed in as a DISPOSABLE person who owns a home product and a second one to delete
// (never the shared fixture user — a second product for them would change what every other authed spec sees).

async function hydrated(form: Locator) {
  // Never type into a form React has not yet hydrated (new-product.authed.spec.ts).
  await expect
    .poll(() => form.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactFiber$'))), {
      timeout: 15_000,
    })
    .toBe(true)
}

test('Delete product: refused until the name is typed, then soft-deletes, lands on the portfolio and the product is gone', async ({
  browser,
}) => {
  test.setTimeout(90_000)
  const session = await disposableSession(browser, 'owner')
  const { page, db } = session
  try {
    const doomed = await session.addProject('owner', 'delete-product doomed')

    await page.goto(`/app/setup/cli/${doomed.slug}`)
    await page.getByRole('button', { name: 'Delete product' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(doomed.slug)
    await hydrated(dialog.locator('form'))

    // Wrong name: the confirm button is disabled, and Enter in the field submits nothing.
    const confirmButton = dialog.getByRole('button', { name: 'Delete', exact: true })
    await dialog.getByLabel(/Type .* to confirm/).fill(`${doomed.slug}x`)
    await expect(confirmButton).toBeDisabled()
    await dialog.getByLabel(/Type .* to confirm/).press('Enter')
    await expect(page).toHaveURL(new RegExp(`/app/setup/cli/${doomed.slug}$`))
    const { data: untouched } = await db.from('projects').select('deleted_at').eq('id', doomed.id).single()
    expect(untouched?.deleted_at).toBeNull()

    // The right name enables it; deleting lands on the portfolio.
    await dialog.getByLabel(/Type .* to confirm/).fill(doomed.slug)
    await expect(confirmButton).toBeEnabled()
    await confirmButton.click()
    await expect(page).toHaveURL(/\/app\/portfolio/, { timeout: 30_000 })

    const { data: deleted } = await db.from('projects').select('deleted_at').eq('id', doomed.id).single()
    expect(deleted?.deleted_at).not.toBeNull()

    // Gone from the portfolio, and its own pages no longer open.
    await expect(page.locator('main')).not.toContainText(doomed.slug)
    const gone = await page.goto(`/app/setup/cli/${doomed.slug}`)
    expect(gone?.status()).toBe(404)
  } finally {
    await session.cleanup()
  }
})
