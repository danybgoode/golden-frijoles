import { test, expect } from '@playwright/test'
import { randomBytes, randomUUID } from 'node:crypto'
import { ACCOUNT_CONFIRMED_EVENT, LANDING_SIGNAL_KEY, SIGNUP_STARTED_EVENT } from '@/lib/self-track-events'
import { ACQUISITION_VARIANT_COOKIE } from '@/lib/landing-variant'
import { VISITOR_COOKIE } from '@/lib/marketing-paths'
import { serviceClient } from './helpers/disposable-session'
import { FIXTURE_EMAIL_DOMAIN, FIXTURE_PREFIX } from './helpers/fixture-sweep'

// landing-launch-experiment · Sprint 1, Story 1.2 (epic D4, D5) — a person who came through the landing signs in for
// the first time: the workspace provisioned for them records the variant they last saw, and the two guardrail events
// land under their visitor id while the activation funnel keeps their user id. Drives the real sign-in form, so it
// reaches `/app/provision`, the path every password sign-up takes (the auth callback shares its code, D4).

test('the landing visitor, their signup and their workspace share one identity (D4, D5)', async ({
  browser,
}) => {
  test.skip(!process.env.SELF_PROJECT_API_KEY?.trim(), 'needs the seeded self project')
  const db = serviceClient()
  const email = `${FIXTURE_PREFIX}+landing-${randomBytes(6).toString('hex')}${FIXTURE_EMAIL_DOMAIN}`
  const password = `pw-${randomBytes(12).toString('hex')}`
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`)
  const userId = data.user.id
  const vid = randomUUID()

  const baseURL = test.info().project.use.baseURL ?? 'http://localhost:3000'
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  // `b` on purpose: no flag is served on this server, so only the cookie can put a `b` on the workspace — which proves
  // the callback recorded the cookie, not a fresh evaluation.
  await context.addCookies([
    { name: VISITOR_COOKIE, value: vid, url: baseURL },
    { name: ACQUISITION_VARIANT_COOKIE, value: 'b', url: baseURL, httpOnly: true },
  ])
  const page = await context.newPage()
  try {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/\/app\/setup\/connect\//, { timeout: 30_000 })

    const { data: workspace } = await db
      .from('workspaces')
      .select('acquisition_variant')
      .eq('created_by', userId)
      .single()
    expect(workspace?.acquisition_variant).toBe('b')

    await expect
      .poll(
        async () => {
          const { data: rows } = await db
            .from('events')
            .select('event, feature_id, user_id')
            .in('user_id', [vid, userId])
          return (rows ?? [])
            .map((row) => `${row.user_id === vid ? 'visitor' : 'user'}:${row.event}:${row.feature_id}`)
            .sort()
        },
        { timeout: 10_000 }
      )
      .toEqual(
        expect.arrayContaining([
          `visitor:${SIGNUP_STARTED_EVENT}:${LANDING_SIGNAL_KEY}`,
          `visitor:${ACCOUNT_CONFIRMED_EVENT}:${LANDING_SIGNAL_KEY}`,
          `user:${ACCOUNT_CONFIRMED_EVENT}:activation`,
        ])
      )
    // The activation funnel keeps the user id: no visitor-keyed copy may ever land in it (D4).
    const { data: stray } = await db
      .from('events')
      .select('event')
      .eq('user_id', vid)
      .eq('feature_id', 'activation')
    expect(stray ?? []).toEqual([])
  } finally {
    await context.close()
    const { data: projects } = await db.from('projects').select('id').eq('created_by', userId)
    const ids = (projects ?? []).map((row) => row.id as string)
    if (ids.length) {
      await db.from('project_members').delete().in('project_id', ids)
      await db.from('api_keys').delete().in('project_id', ids)
      await db.from('projects').delete().in('id', ids)
    }
    await db.from('workspace_members').delete().eq('user_id', userId)
    await db.from('workspaces').delete().eq('created_by', userId)
    await db.auth.admin.deleteUser(userId)
  }
})
