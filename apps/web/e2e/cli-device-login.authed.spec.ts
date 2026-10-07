import { test, expect } from '@playwright/test'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm page, signed in (epic D8). The
// terminal half is played by `page.request` (same server, no browser cookies needed for the device
// endpoints); the person half is a real click on the real Server Action.

test('a signed-in person allows the code for one product and the terminal gets a token for it; Cancel mints nothing', async ({
  page,
}) => {
  const started = await page.request.post('/api/v1/cli/device', {
    data: { label: 'authed-spec (linux)', repo: 'no-such-repo' },
  })
  expect(started.status()).toBe(200)
  const { deviceCode, userCode } = (await started.json()) as { deviceCode: string; userCode: string }

  await page.goto(`/cli/connect?code=${userCode}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Let your agent work on your product?')
  await expect(page.getByText(userCode)).toBeVisible()
  await expect(page.getByText('authed-spec (linux)')).toBeVisible()
  await expect(page.getByText(/It will be able to: plan, flag and measure for that product/)).toBeVisible()

  // Rendering the page decided nothing.
  const before = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  expect(await before.json()).toMatchObject({ status: 'pending' })

  const product = page.getByLabel('Product')
  const picked = await product.inputValue()
  expect(picked).not.toBe('')

  await page.getByRole('button', { name: 'Allow' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your agent is connected')

  const after = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  const body = (await after.json()) as { status: string; token: string }
  expect(body.status).toBe('approved')
  expect(body.token).toMatch(/^gf_pat_/)

  // The token reaches the product that was picked, and only it.
  const whoami = await page.request.get('/api/v1/cli/whoami', {
    headers: { Authorization: `Bearer ${body.token}` },
  })
  expect(((await whoami.json()) as { projects: { slug: string }[] }).projects.map((p) => p.slug)).toEqual([
    picked,
  ])

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

  // A product that is not yours cannot be picked, even by editing the form: nothing is decided or minted.
  const third = (await (await page.request.post('/api/v1/cli/device', { data: { label: 'y' } })).json()) as {
    deviceCode: string
    userCode: string
  }
  await page.goto(`/cli/connect?code=${third.userCode}`)
  await product.evaluate((select: HTMLSelectElement) => {
    select.add(new Option('not-mine-e2e', 'not-mine-e2e'))
    select.value = 'not-mine-e2e'
  })
  await page.getByRole('button', { name: 'Allow' }).click()
  await expect(page.getByText('That product is not one of yours.', { exact: false })).toBeVisible()
  const refused = await page.request.post('/api/v1/cli/device/token', {
    data: { deviceCode: third.deviceCode },
  })
  expect(await refused.json()).toMatchObject({ status: 'pending' })
})
