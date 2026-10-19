import { test, expect } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { serviceClient } from './helpers/disposable-session'
import { specWorkspaceId } from './helpers/spec-workspace'
import { FIXTURE_EMAIL_DOMAIN, FIXTURE_PREFIX } from './helpers/fixture-sweep'

// landing-launch-experiment D8 (verifier, #408) — a member who once accepted analytics signs in from /login, a
// marketing page where Clarity runs. Their console must arrive in a NEW document: a client-side push would render
// /app inside the recording before anything could stop it. The marker proves the document changed — "the scripts were
// gone eventually" (what the browser spec checks) would pass even if /app had rendered under the recorder first.

const THIRD_PARTY = /googletagmanager\.com|google-analytics\.com|clarity\.ms/i

test('signing in after Accept lands the console in a fresh document with no third-party script', async ({
  browser,
}) => {
  const db = serviceClient()
  const email = `${FIXTURE_PREFIX}+consent-${randomBytes(6).toString('hex')}${FIXTURE_EMAIL_DOMAIN}`
  const password = `pw-${randomBytes(12).toString('hex')}`
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
  const userId = data.user.id
  // A project up front, so the sign-in lands on /app without provisioning.
  const workspaceId = await specWorkspaceId(db, 'consent spec')
  const slug = `consent-e2e-${randomBytes(5).toString('hex')}`
  const { data: project, error: projectError } = await db
    .from('projects')
    .insert({ slug, api_key_hash: null, workspace_id: workspaceId })
    .select('id')
    .single()
  if (projectError || !project) throw new Error(`project: ${projectError?.message}`)
  await db.from('project_members').insert({ user_id: userId, project_id: project.id, role: 'owner' })

  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  await context.route(THIRD_PARTY, (route) => route.fulfill({ status: 204, body: '' }))
  const page = await context.newPage()
  try {
    await page.goto('/login')
    await page
      .getByRole('dialog', { name: 'Cookie settings' })
      .getByRole('button', { name: 'Accept' })
      .click()
    await expect
      .poll(() =>
        page.$$eval('script[src]', (nodes) =>
          nodes.some((n) => /clarity\.ms/.test((n as HTMLScriptElement).src))
        )
      )
      .toBe(true)
    await page.evaluate(() => ((window as unknown as { __consentDoc?: string }).__consentDoc = 'login'))

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL((url) => url.pathname.startsWith('/app'), { timeout: 30_000 })
    await page.waitForLoadState('load')

    expect(
      await page.evaluate(() => (window as unknown as { __consentDoc?: string }).__consentDoc)
    ).toBeUndefined()
    const scripts = await page.$$eval('script[src]', (nodes) =>
      nodes.map((n) => (n as HTMLScriptElement).src).filter((src) => /googletagmanager|clarity\.ms/.test(src))
    )
    expect(scripts).toEqual([])
  } finally {
    await context.close()
    await db.from('project_members').delete().eq('project_id', project.id)
    await db.from('projects').delete().eq('id', project.id)
    await db.from('workspace_members').delete().eq('workspace_id', workspaceId)
    await db.from('workspaces').delete().eq('id', workspaceId)
    await db.auth.admin.deleteUser(userId)
  }
})
