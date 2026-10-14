import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

// agent-legible-horizon D1 — `GET /api/v1/cli/horizon`: a product's horizon, headless, for a MEMBER only. Drives the
// real push (POST /api/v1/roadmap/push with the product's own ingest key) so the read is checked against what a
// founder's `roadmap-push` actually stores.

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const slugFor = (prefix: string) => `${prefix}-${randomBytes(4).toString('hex')}`

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function person(client: SupabaseClient, label: string) {
  const { data, error } = await client.auth.admin.createUser({
    email: `${label}-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  await client.from('cli_tokens').insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  return { id: data.user.id, auth: { authorization: `Bearer ${token}` } }
}

async function cleanup(client: SupabaseClient, ids: string[]) {
  for (const id of ids) {
    await client.from('projects').delete().eq('created_by', id)
    await client.from('project_members').delete().eq('user_id', id)
    await client.from('workspace_members').delete().eq('user_id', id)
    await client.from('workspaces').delete().eq('created_by', id)
    await client.auth.admin.deleteUser(id)
  }
}

test('a member reads the horizon headless: nothing pushed, then the destinations and what lights each', async ({
  request,
}) => {
  const client = db()
  const owner = await person(client, 'hz-owner')
  const stranger = await person(client, 'hz-stranger')
  try {
    const slug = slugFor('hz')
    expect(
      (await request.post('/api/v1/cli/projects', { headers: owner.auth, data: { slug } })).status()
    ).toBe(200)
    const read = () => request.get(`/api/v1/cli/horizon?project=${slug}`, { headers: owner.auth })

    // Nothing pushed yet: said, not an error.
    const before = await read()
    expect(before.status()).toBe(200)
    expect(await before.json()).toMatchObject({ ok: true, project: slug, pushed: false, destinations: [] })

    // A stranger gets the uniform not-found, never the horizon.
    const refused = await request.get(`/api/v1/cli/horizon?project=${slug}`, { headers: stranger.auth })
    expect(refused.status()).toBe(404)

    const minted = await request.post('/api/v1/cli/keys', {
      headers: owner.auth,
      data: { project: slug, type: 'ingest', label: 'horizon spec' },
    })
    const key = ((await minted.json()) as { key: string }).key
    const pushed = await request.post('/api/v1/roadmap/push', {
      headers: { Authorization: `Bearer ${key}` },
      data: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: { commit: 'abc1234', ref: 'main' },
        horizon: [
          { id: 'front-door', title: 'The front door', description: 'Where a stranger starts.' },
          { id: 'later', title: 'Later', description: 'Not yet.' },
        ],
        items: [
          {
            name: 'Signup',
            slug: 'signup',
            grain: 'Epic',
            status: 'Shipped',
            area: '01 Growth',
            destinations: ['front-door'],
          },
          {
            name: 'Pricing',
            slug: 'pricing',
            grain: 'Epic',
            status: 'Building',
            area: '01 Growth',
            destinations: ['front-door'],
          },
        ],
      },
    })
    expect(pushed.status()).toBeLessThan(300)

    const after = (await (await read()).json()) as {
      pushed: boolean
      sourceCommit: string
      destinations: Array<{ id: string; status: string; litBy: Array<{ slug: string; shipped: boolean }> }>
    }
    expect(after.pushed).toBe(true)
    expect(after.sourceCommit).toBe('abc1234')
    expect(after.destinations.map((destination) => [destination.id, destination.status])).toEqual([
      ['front-door', 'partial'],
      ['later', 'coming'],
    ])
    expect(after.destinations[0].litBy).toEqual([
      { slug: 'signup', name: 'Signup', shipped: true },
      { slug: 'pricing', name: 'Pricing', shipped: false },
    ])
  } finally {
    await cleanup(client, [owner.id, stranger.id])
  }
})
