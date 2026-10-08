import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

// account-from-the-terminal · Sprint 2, Story 2.2 — `frijoles login` through the browser, over HTTP
// (epic D6–D8). The confirm step is a signed-in Server Action; here it is driven through the same
// SQL function the action calls (`decide_cli_device_code`), so this spec covers every HTTP answer the
// CLI can get. The signed-in page itself is exercised by `cli-device-login.authed.spec.ts`.

function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function disposableUser() {
  const client = db()
  const email = `device-spec-${randomBytes(6).toString('hex')}@example.test`
  const { data, error } = await client.auth.admin.createUser({ email, email_confirm: true })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  // Deleting the user cascades to its device codes and CLI tokens.
  return {
    userId: data.user.id,
    email,
    cleanup: async () => void (await client.auth.admin.deleteUser(data.user.id)),
  }
}

async function start(request: APIRequestContext) {
  const res = await request.post('/api/v1/cli/device', { data: { label: 'spec-laptop (linux)' } })
  expect(res.status()).toBe(200)
  return (await res.json()) as {
    deviceCode: string
    userCode: string
    verificationUrl: string
    expiresIn: number
    interval: number
  }
}

const poll = (request: APIRequestContext, deviceCode: unknown) =>
  request.post('/api/v1/cli/device/token', { data: { deviceCode } })

test('start hands out a secret device code, a readable user code and the page that confirms it', async ({
  request,
  baseURL,
}) => {
  const started = await start(request)
  expect(started.deviceCode).toMatch(/^gf_dev_[A-Za-z0-9_-]{43}$/)
  expect(started.userCode).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
  expect(started.verificationUrl).toBe(`${baseURL}/cli/connect?code=${started.userCode}`)
  expect(started.expiresIn).toBe(600)
  expect(started.interval).toBe(5)
})

test('an unconfirmed code is pending; nothing is minted without a confirm', async ({ request }) => {
  const started = await start(request)
  const res = await poll(request, started.deviceCode)
  expect(res.status()).toBe(200)
  expect(await res.json()).toMatchObject({ ok: true, status: 'pending' })
})

test('confirmed → the first poll gets a working token, the next is refused as used', async ({ request }) => {
  const user = await disposableUser()
  try {
    const started = await start(request)
    const { data: decided } = await db().rpc('decide_cli_device_code', {
      p_user_code: started.userCode,
      p_user_id: user.userId,
      p_approve: true,
    })
    expect(decided).toBe('approved')

    const first = await poll(request, started.deviceCode)
    expect(first.status()).toBe(200)
    const body = (await first.json()) as { status: string; token: string }
    expect(body.status).toBe('approved')
    expect(body.token).toMatch(/^gf_pat_/)

    // The token is real: it signs the CLI in as the person who confirmed.
    const whoami = await request.get('/api/v1/cli/whoami', {
      headers: { authorization: `Bearer ${body.token}` },
    })
    expect(whoami.status()).toBe(200)
    expect(((await whoami.json()) as { account: { email: string } }).account.email).toBe(user.email)

    // Single use. (Two polls per code per interval are allowed, so this one is not rate-limited.)
    const second = await poll(request, started.deviceCode)
    expect(second.status()).toBe(404)
    expect(await second.json()).toMatchObject({ ok: false, code: 'not_found', reason: 'used' })
  } finally {
    await user.cleanup()
  }
})

test('declined in the browser → the terminal is told so, and nothing is minted', async ({ request }) => {
  const user = await disposableUser()
  try {
    const started = await start(request)
    await db().rpc('decide_cli_device_code', {
      p_user_code: started.userCode,
      p_user_id: user.userId,
      p_approve: false,
    })
    const res = await poll(request, started.deviceCode)
    expect(res.status()).toBe(404)
    expect(await res.json()).toMatchObject({ reason: 'denied' })
    const { count } = await db()
      .from('cli_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.userId)
    expect(count).toBe(0)
  } finally {
    await user.cleanup()
  }
})

test('an expired code is refused at both ends', async ({ request }) => {
  const user = await disposableUser()
  try {
    const deviceCode = `gf_dev_${randomBytes(32).toString('base64url')}`
    const userCode =
      'XPRD-' +
      randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .replace(/[01IO]/g, 'Z')
        .slice(0, 4)
    const { error } = await db()
      .from('cli_device_codes')
      .insert({
        device_code_hash: createHash('sha256').update(deviceCode).digest('hex'),
        user_code: userCode.replace(/[^A-HJ-NP-Z2-9-]/g, 'Z'),
        label: 'spec',
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      })
    expect(error).toBeNull()
    // The browser end: confirming an expired code is refused in the same statement that would write.
    const { data: decided } = await db().rpc('decide_cli_device_code', {
      p_user_code: userCode.replace(/[^A-HJ-NP-Z2-9-]/g, 'Z'),
      p_user_id: user.userId,
      p_approve: true,
    })
    expect(decided).toBe('expired')
    // The terminal end.
    const res = await poll(request, deviceCode)
    expect(await res.json()).toMatchObject({ code: 'not_found', reason: 'expired' })
  } finally {
    await user.cleanup()
  }
})

test('a malformed or unknown device code is one indistinguishable refusal', async ({ request }) => {
  for (const deviceCode of ['nope', 42, `gf_dev_${randomBytes(32).toString('base64url')}`]) {
    const res = await poll(request, deviceCode)
    expect(res.status()).toBe(404)
    expect(await res.json()).toMatchObject({ reason: 'unknown' })
  }
})

test('/cli/connect without a code points back at the terminal; with one, signed out, offers sign-in', async ({
  request,
}) => {
  const bare = await request.get('/cli/connect')
  expect(bare.status()).toBe(200)
  expect(await bare.text()).toContain('frijoles login')

  const started = await start(request)
  const page = await request.get(`/cli/connect?code=${started.userCode}`)
  expect(page.status()).toBe(200)
  const html = await page.text()
  expect(html).toContain(started.userCode)
  expect(html).toContain('Continue with Google')
  expect(html).toContain('Nothing happens.')
})

// S2.1 — the Google button renders on the door while `auth.terminal_sign_in_enabled` is on (born ON;
// the test project has no such flag, which is the born-ON default by the seam's rule).
test('/login offers Continue with Google above the password form', async ({ request }) => {
  const res = await request.get('/login')
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html.indexOf('Continue with Google')).toBeGreaterThan(-1)
  expect(html.indexOf('Continue with Google')).toBeLessThan(html.indexOf('type="password"'))
})
