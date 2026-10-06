import { test, expect } from '@playwright/test'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm page, signed in (epic D8). The
// terminal half is played by `page.request` (same server, no browser cookies needed for the device
// endpoints); the person half is a real click on the real Server Action.

test('a signed-in person confirms the code and the terminal gets a token; "not mine" mints nothing', async ({
  page,
}) => {
  const started = await page.request.post('/api/v1/cli/device', { data: { label: 'authed-spec (linux)' } })
  expect(started.status()).toBe(200)
  const { deviceCode, userCode } = (await started.json()) as { deviceCode: string; userCode: string }

  await page.goto(`/cli/connect?code=${userCode}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Same code as your terminal?')
  await expect(page.getByText(userCode)).toBeVisible()
  await expect(page.getByText('authed-spec (linux)')).toBeVisible()

  // Rendering the page decided nothing.
  const before = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  expect(await before.json()).toMatchObject({ status: 'pending' })

  await page.getByRole('button', { name: 'Yes, sign my terminal in' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You are signed in')

  const after = await page.request.post('/api/v1/cli/device/token', { data: { deviceCode } })
  const body = (await after.json()) as { status: string; token: string }
  expect(body.status).toBe('approved')
  expect(body.token).toMatch(/^gf_pat_/)

  // The other button, on a fresh code.
  const second = (await (await page.request.post('/api/v1/cli/device', { data: { label: 'x' } })).json()) as {
    deviceCode: string
    userCode: string
  }
  await page.goto(`/cli/connect?code=${second.userCode}`)
  await page.getByRole('button', { name: /No, this isn.t mine/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nothing was signed in')
  const declined = await page.request.post('/api/v1/cli/device/token', {
    data: { deviceCode: second.deviceCode },
  })
  expect(await declined.json()).toMatchObject({ reason: 'denied' })
})
