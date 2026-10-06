import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { serviceClient } from './helpers/disposable-session'
import { FIXTURE_EMAIL_DOMAIN, FIXTURE_PREFIX } from './helpers/fixture-sweep'

// connect-page · Sprint 1 — a brand-new account, signed in through the real form with NO project yet,
// is provisioned by `/app/provision` and lands on Connect (D2): no one-time key on screen (D3), and the
// connector URL it was handed can already change things as its owner (D1).

test('a new account lands on Connect, sees no key, and its URL already acts as its owner', async ({
  browser,
}) => {
  const db = serviceClient()
  const email = `${FIXTURE_PREFIX}+connect-${randomBytes(6).toString('hex')}${FIXTURE_EMAIL_DOMAIN}`
  const password = `pw-${randomBytes(12).toString('hex')}`
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`could not create a user: ${error?.message}`)
  const userId = data.user.id
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()
  try {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await page.waitForURL(/\/app\/setup\/connect\//, { timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: 'Connect' })).toBeVisible()
    await expect(page.getByText(/not shown again/i)).toHaveCount(0)
    await expect(page.getByText(/read and change .* as you/)).toBeVisible()

    const slug = new URL(page.url()).pathname.split('/').pop()!
    const { data: project } = await db.from('projects').select('id').eq('slug', slug).single()
    const { data: token } = await db
      .from('connector_tokens')
      .select('created_by')
      .eq('project_id', project!.id)
      .is('revoked_at', null)
      .single()
    expect(token?.created_by).toBe(userId)

    // An old onboarding link follows to Connect.
    await page.goto(`/app/onboarding/${slug}`)
    await expect(page).toHaveURL(new RegExp(`/app/setup/connect/${slug}$`))
  } finally {
    await context.close()
    const { data: owned } = await db.from('projects').select('id, workspace_id').eq('created_by', userId)
    for (const project of owned ?? []) {
      await db.from('projects').delete().eq('id', project.id)
      await db.from('workspaces').delete().eq('id', project.workspace_id)
    }
    await db.auth.admin.deleteUser(userId)
  }
})
