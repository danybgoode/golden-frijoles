import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

// many-products · Sprint 1, Stories 1.1 + 1.2 (lock D1–D3) — a founder makes a second product by name.
//
// What only the route and the database can show:
//   • POST /api/v1/cli/projects { slug } CREATES, in the caller's OWN workspace, beside the signup product;
//   • the answer for a name you own, someone else's, a reserved one and a malformed one;
//   • a token made for ONE product cannot make siblings;
//   • the signup guard still holds: two signup rows for one creator collide on `projects_one_per_creator_idx`,
//     while a non-signup row (`from_signup = false`) does not.

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

const slugFor = (prefix: string) => `${prefix}-${randomBytes(4).toString('hex')}`

type Person = { id: string; auth: Record<string, string>; token: string }

async function person(client: SupabaseClient, label: string, scopeProjectId: string | null = null): Promise<Person> {
  const { data, error } = await client.auth.admin.createUser({
    email: `${label}-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  return { id: data.user.id, ...(await tokenFor(client, data.user.id, scopeProjectId)) }
}

async function tokenFor(client: SupabaseClient, userId: string, projectId: string | null) {
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const { error } = await client
    .from('cli_tokens')
    .insert({ user_id: userId, token_hash: sha256(token), label: 'spec', project_id: projectId })
  if (error) throw new Error(`could not insert a cli token: ${error.message}`)
  return { token, auth: { authorization: `Bearer ${token}` } }
}

async function cleanup(client: SupabaseClient, userIds: string[]) {
  for (const id of userIds) {
    await client.from('projects').delete().eq('created_by', id)
    await client.from('project_members').delete().eq('user_id', id)
    await client.from('workspace_members').delete().eq('user_id', id)
    await client.from('workspaces').delete().eq('created_by', id)
    await client.auth.admin.deleteUser(id)
  }
}

test.describe('frijoles projects create — a product by name (many-products S1.2)', () => {
  test('creates in the caller\'s own workspace; again is "already yours"; a second one coexists', async ({
    request,
  }) => {
    const client = db()
    const founder = await person(client, 'mp-founder')
    try {
      const first = slugFor('mp-one')
      const created = await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: first } })
      expect(created.status()).toBe(200)
      expect(await created.json()).toMatchObject({ ok: true, created: true, slug: first })

      const again = await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: first } })
      expect(again.status()).toBe(200)
      expect(await again.json()).toMatchObject({ ok: true, created: false, slug: first })

      const second = slugFor('mp-two')
      const other = await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: second } })
      expect(other.status()).toBe(200)
      expect(await other.json()).toMatchObject({ created: true, slug: second })

      // Both are the founder's, as OWNER, in the ONE workspace the founder created — never a second one.
      const { data: rows } = await client
        .from('projects')
        .select('slug, from_signup, workspace_id, created_by')
        .in('slug', [first, second])
      expect(rows).toHaveLength(2)
      for (const row of rows ?? []) {
        expect(row.from_signup).toBe(false)
        expect(row.created_by).toBe(founder.id)
      }
      const { data: workspaces } = await client.from('workspaces').select('id').eq('created_by', founder.id)
      expect(workspaces).toHaveLength(1)
      expect(new Set((rows ?? []).map((row) => row.workspace_id))).toEqual(new Set([workspaces![0].id]))

      const listed = await request.get('/api/v1/cli/projects', { headers: founder.auth })
      const slugs = ((await listed.json()) as { projects: Array<{ slug: string; role: string }> }).projects
      expect(slugs).toEqual(
        expect.arrayContaining([
          { slug: first, role: 'owner' },
          { slug: second, role: 'owner' },
        ])
      )
    } finally {
      await cleanup(client, [founder.id])
    }
  })

  test("someone else's name is a conflict — a member who is not its owner gets the same", async ({ request }) => {
    const client = db()
    const owner = await person(client, 'mp-owner')
    const member = await person(client, 'mp-member')
    const stranger = await person(client, 'mp-stranger')
    try {
      const slug = slugFor('mp-held')
      expect(
        (await request.post('/api/v1/cli/projects', { headers: owner.auth, data: { slug } })).status()
      ).toBe(200)
      const { data: row } = await client.from('projects').select('id').eq('slug', slug).single()
      await client.from('project_members').insert({ project_id: row!.id, user_id: member.id, role: 'member' })

      for (const caller of [stranger, member]) {
        const res = await request.post('/api/v1/cli/projects', { headers: caller.auth, data: { slug } })
        expect(res.status()).toBe(409)
        expect(await res.json()).toMatchObject({ ok: false, code: 'conflict' })
      }
      // Nothing changed hands.
      const { data: members } = await client.from('project_members').select('user_id, role').eq('project_id', row!.id)
      expect(members).toEqual(
        expect.arrayContaining([
          { user_id: owner.id, role: 'owner' },
          { user_id: member.id, role: 'member' },
        ])
      )
      expect(members).toHaveLength(2)
    } finally {
      await cleanup(client, [owner.id, member.id, stranger.id])
    }
  })

  test('a malformed, missing or reserved name is invalid, and nothing is written', async ({ request }) => {
    const client = db()
    const founder = await person(client, 'mp-invalid')
    try {
      for (const data of [{}, { slug: '' }, { slug: 'My Product' }, { slug: 'MyProd' }, { slug: ' spaced ' }, { slug: 'ab' }, { slug: 'golden-frijoles' }, { slug: 'app' }]) {
        const res = await request.post('/api/v1/cli/projects', { headers: founder.auth, data })
        expect(res.status(), JSON.stringify(data)).toBe(400)
        expect(await res.json()).toMatchObject({ ok: false, code: 'invalid' })
      }
      const { data: rows } = await client.from('projects').select('id').eq('created_by', founder.id)
      expect(rows).toEqual([])
    } finally {
      await cleanup(client, [founder.id])
    }
  })

  test('the cap: past the workspace\'s product_limit a create is a conflict naming it, and nothing is written', async ({
    request,
  }) => {
    const client = db()
    const founder = await person(client, 'mp-cap')
    try {
      const first = slugFor('mp-cap')
      expect(
        (await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: first } })).status()
      ).toBe(200)
      // The ceiling is DATA on the founder's own workspace: one UPDATE, no deploy.
      const { data: workspace } = await client.from('workspaces').select('id').eq('created_by', founder.id).single()
      await client.from('workspaces').update({ product_limit: 1 }).eq('id', workspace!.id)

      const second = slugFor('mp-cap-over')
      const refused = await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: second } })
      expect(refused.status()).toBe(409)
      const body = (await refused.json()) as { code: string; reason: string; error: string }
      expect(body).toMatchObject({ code: 'conflict', reason: 'limit' })
      expect(body.error).toMatch(/limit is 1/)
      const { data: none } = await client.from('projects').select('id').eq('slug', second)
      expect(none).toEqual([])

      // Re-running a name you already own is not a new product, so the cap does not refuse it.
      const again = await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: first } })
      expect(await again.json()).toMatchObject({ ok: true, created: false })
    } finally {
      await cleanup(client, [founder.id])
    }
  })

  test('a token made for ONE product cannot make siblings; its own name answers "already yours"', async ({
    request,
  }) => {
    const client = db()
    const founder = await person(client, 'mp-scoped')
    try {
      const own = slugFor('mp-scope')
      expect(
        (await request.post('/api/v1/cli/projects', { headers: founder.auth, data: { slug: own } })).status()
      ).toBe(200)
      const { data: row } = await client.from('projects').select('id').eq('slug', own).single()
      const scoped = await tokenFor(client, founder.id, row!.id)

      const sibling = slugFor('mp-sibling')
      const refused = await request.post('/api/v1/cli/projects', { headers: scoped.auth, data: { slug: sibling } })
      expect(refused.status()).toBe(404)
      expect(await refused.json()).toMatchObject({ ok: false, code: 'not_found' })
      const { data: none } = await client.from('projects').select('id').eq('slug', sibling)
      expect(none).toEqual([])

      const same = await request.post('/api/v1/cli/projects', { headers: scoped.auth, data: { slug: own } })
      expect(await same.json()).toMatchObject({ ok: true, created: false, slug: own })
    } finally {
      await cleanup(client, [founder.id])
    }
  })
})

test.describe('the signup guard (many-products S1.1, lock D1)', () => {
  test('two SIGNUP rows for one creator collide on the index; a non-signup row beside them does not', async () => {
    const client = db()
    const { data, error } = await client.auth.admin.createUser({
      email: `mp-race-${randomBytes(6).toString('hex')}@example.test`,
      email_confirm: true,
    })
    if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
    const userId = data.user.id
    try {
      const { data: workspace } = await client
        .from('workspaces')
        .insert({ name: 'race spec', created_by: userId })
        .select('id')
        .single()
      // The running signup path never names `from_signup`: the DEFAULT is what guards it (D1's either-order property).
      const signup = () =>
        client
          .from('projects')
          .insert({ slug: slugFor('mp-race'), created_by: userId, workspace_id: workspace!.id })
          .select('id')
          .single()
      const [a, b] = await Promise.all([signup(), signup()])
      const failures = [a, b].filter((result) => result.error)
      expect(failures).toHaveLength(1)
      expect(failures[0].error?.code).toBe('23505')
      expect(`${failures[0].error?.message} ${failures[0].error?.details ?? ''}`).toContain(
        'projects_one_per_creator_idx'
      )

      const later = await client
        .from('projects')
        .insert({ slug: slugFor('mp-later'), created_by: userId, workspace_id: workspace!.id, from_signup: false })
        .select('id')
        .single()
      expect(later.error).toBeNull()
    } finally {
      await cleanup(client, [userId])
    }
  })

})
