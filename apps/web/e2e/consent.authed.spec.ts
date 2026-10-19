import { test, expect, type Browser, type Page } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { serviceClient } from './helpers/disposable-session'
import { specWorkspaceId } from './helpers/spec-workspace'
import { FIXTURE_EMAIL_DOMAIN, FIXTURE_PREFIX } from './helpers/fixture-sweep'
import { CONSENT_STORAGE_KEY, serializeConsent } from '@/lib/consent'

// landing-launch-experiment · Sprint 1, Story 1.1 (epic D8) — the visitor decides, only on marketing pages, and a page
// off the allow-list never renders inside a document that loaded the recorder. In the `authed` project because CI runs
// it (the opt-in `browser` project is local-only — verifier, #408); every test uses its own empty context.
//
// Where "never" is the claim, the specs use a TRIPWIRE that survives a reload (sessionStorage), not "the scripts were
// gone eventually": a soft navigation followed by the backstop reload ends with no scripts too, and that is exactly
// the hole the tripwire exists to catch (verifier, #408, round 2).

const THIRD_PARTY = /googletagmanager\.com|google-analytics\.com|clarity\.ms/i

async function freshPage(browser: Browser, consent?: 'granted'): Promise<Page> {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  await context.route(THIRD_PARTY, (route) => route.fulfill({ status: 204, body: '' }))
  if (consent)
    await context.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_STORAGE_KEY, serializeConsent(consent, new Date())]
    )
  return context.newPage()
}

async function thirdPartyScripts(page: Page): Promise<string[]> {
  return page.$$eval('script[src]', (nodes) =>
    nodes
      .map((node) => (node as HTMLScriptElement).src)
      .filter((src) => /googletagmanager|clarity\.ms/.test(src))
  )
}

/** Any soft navigation from now on in THIS tab is recorded where a reload cannot erase it. */
async function armSoftNavigationTripwire(page: Page) {
  await page.evaluate(() => {
    const push = history.pushState.bind(history)
    history.pushState = (...args: Parameters<History['pushState']>) => {
      sessionStorage.setItem('gf_soft_nav', String(args[2]))
      return push(...args)
    }
  })
}

test('the banner asks first, and Decline loads nothing — before or after a reload', async ({ browser }) => {
  const page = await freshPage(browser)
  const seen: string[] = []
  page.on('request', (req) => {
    if (THIRD_PARTY.test(req.url())) seen.push(req.url())
  })
  await page.goto('/')
  const banner = page.getByRole('dialog', { name: 'Cookie settings' })
  await expect(banner).toBeVisible()
  expect(await thirdPartyScripts(page)).toEqual([])
  await banner.getByRole('button', { name: 'Decline' }).click()
  await expect(banner).toBeHidden()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toBeHidden()
  expect(await thirdPartyScripts(page)).toEqual([])
  expect(seen).toEqual([])
  await page.context().close()
})

test('Accept loads GA4 and Clarity on the landing, and the footer reopens the choice', async ({
  browser,
}) => {
  const page = await freshPage(browser)
  await page.goto('/')
  await page.getByRole('dialog', { name: 'Cookie settings' }).getByRole('button', { name: 'Accept' }).click()
  await expect
    .poll(() => thirdPartyScripts(page))
    .toEqual(
      expect.arrayContaining([
        expect.stringContaining('googletagmanager.com'),
        expect.stringContaining('clarity.ms'),
      ])
    )
  await page.getByRole('button', { name: 'Cookie settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toBeVisible()
  await page.context().close()
})

test('a document that began off the allow-list never loads them, even on a marketing page or after Back', async ({
  browser,
}) => {
  const page = await freshPage(browser, 'granted')
  await page.goto('/install')
  expect(await thirdPartyScripts(page)).toEqual([])
  // A soft navigation onto the allow-list (the footer's <Link href="/methodology">): same document, first path /install.
  await page.evaluate(() =>
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push('/methodology')
  )
  await page.waitForURL('**/methodology')
  await page.waitForTimeout(500)
  expect(await thirdPartyScripts(page)).toEqual([])
  await page.goBack()
  await page.waitForURL('**/install')
  expect(await thirdPartyScripts(page)).toEqual([])
  await page.context().close()
})

test('after a yes on the landing, a link to an off-list page is a full load, never a soft one', async ({
  browser,
}) => {
  const page = await freshPage(browser, 'granted')
  await page.goto('/')
  await expect.poll(() => thirdPartyScripts(page)).not.toEqual([])
  // An internal link to an off-list page, the shape a <Link> renders: the guard must turn the click into a full load.
  await page.evaluate(() => {
    const link = document.createElement('a')
    link.href = '/install'
    link.textContent = 'to install'
    link.id = 'spec-off-list'
    link.addEventListener('click', (event) => {
      // What next/link does on a plain click — unless the guard already prevented the default.
      if (event.defaultPrevented) return
      event.preventDefault()
      ;(window as unknown as { next: { router: { push(href: string): void } } }).next.router.push('/install')
    })
    document.body.appendChild(link)
  })
  await armSoftNavigationTripwire(page)
  await page.click('#spec-off-list')
  await page.waitForURL('**/install')
  await page.waitForLoadState('load')
  expect(await page.evaluate(() => sessionStorage.getItem('gf_soft_nav'))).toBeNull()
  expect(await thirdPartyScripts(page)).toEqual([])
  await page.context().close()
})

test('signing in after Accept lands the console in a fresh document (no soft navigation)', async ({
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

  const page = await freshPage(browser, 'granted')
  try {
    await page.goto('/login')
    await expect.poll(() => thirdPartyScripts(page)).not.toEqual([])
    await armSoftNavigationTripwire(page)
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL((url) => url.pathname.startsWith('/app'), { timeout: 30_000 })
    await page.waitForLoadState('load')
    expect(await page.evaluate(() => sessionStorage.getItem('gf_soft_nav'))).toBeNull()
    expect(await thirdPartyScripts(page)).toEqual([])
  } finally {
    await page.context().close()
    await db.from('project_members').delete().eq('project_id', project.id)
    await db.from('projects').delete().eq('id', project.id)
    await db.from('workspace_members').delete().eq('workspace_id', workspaceId)
    await db.from('workspaces').delete().eq('id', workspaceId)
    await db.auth.admin.deleteUser(userId)
  }
})
