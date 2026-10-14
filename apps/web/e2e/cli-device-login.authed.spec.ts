import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm page, signed in (epic D8). The
// terminal half is played by `page.request` (same server, no browser cookies needed for the device
// endpoints); the person half is a real click on the real Server Action.
//
// many-products D4 (2026-10-14): Allow signs in the ACCOUNT — no product is picked, and the token is account-wide.

test('a signed-in person allows the code and the terminal gets an ACCOUNT-WIDE token; Cancel mints nothing', async ({
  page,
}) => {
  const started = await page.request.post('/api/v1/cli/device', {
    data: { label: 'authed-spec (linux)', repo: 'no-such-repo' },
  })
  expect(started.status()).toBe(200)
  const { deviceCode, userCode } = (await started.json()) as { deviceCode: string; userCode: string }

  await page.goto(`/cli/connect?code=${userCode}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Let your agent work on your products?')
  await expect(page.getByText(userCode)).toBeVisible()
  await expect(page.getByText('authed-spec (linux)')).toBeVisible()
  await expect(page.getByText(/It will be able to: plan, flag and measure for every product you belong to/)).toBeVisible()

  // Rendering the page decided nothing.
  const before = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  expect(await before.json()).toMatchObject({ status: 'pending' })

  // Login asks for no product: a brand-new repo has none to pick, and picking an old one is how it got linked wrong.
  await expect(page.getByLabel('Product')).toHaveCount(0)

  await page.getByRole('button', { name: 'Allow' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your agent is connected')

  const after = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  const body = (await after.json()) as { status: string; token: string }
  expect(body.status).toBe('approved')
  expect(body.token).toMatch(/^gf_pat_/)

  // The token is account-wide: no product on its row, and it reaches every product the person belongs to.
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  const hash = createHash('sha256').update(body.token).digest('hex')
  const { data: row } = await createClient(url, key, { auth: { persistSession: false } })
    .from('cli_tokens')
    .select('project_id')
    .eq('token_hash', hash)
    .single()
  expect(row).toEqual({ project_id: null })
  const whoami = await page.request.get('/api/v1/cli/whoami', {
    headers: { Authorization: `Bearer ${body.token}` },
  })
  expect(((await whoami.json()) as { projects: { slug: string }[] }).projects.length).toBeGreaterThan(0)

  // Cancel, on a fresh code.
  const second = (await (await page.request.post('/api/v1/cli/device', { data: { label: 'x' } })).json()) as {
    deviceCode: string
    userCode: string
  }
  await page.goto(`/cli/connect?code=${second.userCode}`)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing was signed in')
  const declined = await page.request.post('/api/v1/cli/device/token', {
    data: { deviceCode: second.deviceCode },
  })
  expect(await declined.json()).toMatchObject({ reason: 'denied' })

})
