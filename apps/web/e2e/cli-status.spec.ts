// setup-instruments-connects D2/D3 — `GET /api/v1/cli/status`: one project's first and latest product event, for a member.
// Runs on the gate-ON server (ci/gates.on.env: FIRST_EVENT_BAND_ENABLED=true); the OFF server answers 404.
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { isFirstEventBandEnabled } from './helpers/gates'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const newCliToken = () => `gf_pat_${randomBytes(32).toString('base64url')}`
function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** A brand-new account with a CLI token and no project: its first project has never received an event. */
async function freshAccount(): Promise<{ token: string; cleanup: () => Promise<void> }> {
  const client = db()
  const { data, error } = await client.auth.admin.createUser({
    email: `status-spec-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const userId = data.user.id
  const token = newCliToken()
  const { error: tokenError } = await client
    .from('cli_tokens')
    .insert({ user_id: userId, token_hash: sha256(token), label: 'spec' })
  if (tokenError) throw new Error(`could not insert a cli token: ${tokenError.message}`)
  return {
    token,
    cleanup: async () => {
      await client.from('project_members').delete().eq('user_id', userId)
      await client.auth.admin.deleteUser(userId)
    },
  }
}

test.describe('the CLI first-event status', () => {
  test.skip(!isFirstEventBandEnabled(), 'runs on the gate-ON server; first-event-dark.spec.ts covers OFF')
  test("waiting until a product event lands; the SDK's own events do not count; then the first and latest", async ({
    request,
  }) => {
    const account = await freshAccount()
    try {
      const auth = { authorization: `Bearer ${account.token}` }
      const created = await request.post('/api/v1/cli/projects', { headers: auth, data: {} })
      expect(created.status()).toBe(200)
      const project = ((await created.json()) as { slug: string }).slug
      const status = async () => {
        const res = await request.get(`/api/v1/cli/status?project=${project}`, { headers: auth })
        expect(res.status(), 'a 404 here means FIRST_EVENT_BAND_ENABLED is off on this server').toBe(200)
        return (await res.json()) as {
          firstEvent: { event: string } | null
          latestEvent: { event: string } | null
          todayMessage: string | null
        }
      }
      expect(await status()).toMatchObject({ firstEvent: null, latestEvent: null, todayMessage: 'waiting' })

      const minted = await request.post('/api/v1/cli/keys', {
        headers: auth,
        data: { project, type: 'ingest', label: 'status spec' },
      })
      expect(minted.status()).toBe(200)
      const key = ((await minted.json()) as { key: string }).key
      const track = (event: string) =>
        request.post('/api/v1/track', {
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          data: { userId: 'spec-user', event },
        })
      expect((await track('signed_up')).status()).toBeLessThan(300)
      expect((await track('order_placed')).status()).toBeLessThan(300)
      const after = await status()
      expect(after.firstEvent?.event).toBe('signed_up')
      expect(after.latestEvent?.event).toBe('order_placed')
      expect(after.todayMessage, 'Today would say the first event arrived').toBe('arrived')
    } finally {
      await account.cleanup()
    }
  })

  test('a project the caller is not a member of is the same 404 as one that does not exist', async ({
    request,
  }) => {
    const account = await freshAccount()
    try {
      for (const project of ['project-one', 'definitely-not-a-project']) {
        const res = await request.get(`/api/v1/cli/status?project=${project}`, {
          headers: { authorization: `Bearer ${account.token}` },
        })
        expect(res.status(), project).toBe(404)
      }
    } finally {
      await account.cleanup()
    }
  })
})
