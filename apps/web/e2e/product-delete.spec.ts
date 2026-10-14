import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

// many-products · Sprint 2, Stories 2.1 + 2.2 (lock D9, D10) — delete a product, then purge it.
//
// What only the routes and the database can show:
//   • delete is owner-only (member and stranger get the one not_found) and needs the name repeated;
//   • at once, the product leaves every list and its ingest key, connector URL and share link stop working;
//   • its name stays taken until purge — even to its owner;
//   • the public project refuses delete;
//   • purge refuses before 30 days (naming the date), and after it removes the product THROUGH an append-only ledger
//     (report_artifacts), which only a cascade may delete.

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
const slugFor = (prefix: string) => `${prefix}-${randomBytes(4).toString('hex')}`

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

type Person = { id: string; auth: Record<string, string> }

async function person(client: SupabaseClient, label: string): Promise<Person> {
  const { data, error } = await client.auth.admin.createUser({
    email: `${label}-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const { error: tokenError } = await client
    .from('cli_tokens')
    .insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  if (tokenError) throw new Error(`could not insert a cli token: ${tokenError.message}`)
  return { id: data.user.id, auth: { authorization: `Bearer ${token}` } }
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

const mcp = (request: APIRequestContext, token: string) =>
  request.post(`/api/v1/public/mcp/c/${token}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  })

const track = (request: APIRequestContext, key: string) =>
  request.post('/api/v1/track', {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    data: { userId: 'spec-user', event: 'spec_event' },
  })

test('delete: owner only, gone at once, every credential dead, name still taken; purge waits 30 days', async ({
  request,
}) => {
  const client = db()
  const owner = await person(client, 'del-owner')
  const member = await person(client, 'del-member')
  const stranger = await person(client, 'del-stranger')
  try {
    const slug = slugFor('del')
    expect((await request.post('/api/v1/cli/projects', { headers: owner.auth, data: { slug } })).status()).toBe(200)
    const { data: project } = await client.from('projects').select('id').eq('slug', slug).single()
    await client.from('project_members').insert({ project_id: project!.id, user_id: member.id, role: 'member' })

    // Three credentials, each through its own seam.
    const minted = await request.post('/api/v1/cli/keys', {
      headers: owner.auth,
      data: { project: slug, type: 'ingest', label: 'delete spec' },
    })
    const ingestKey = ((await minted.json()) as { key: string }).key
    const { data: connector } = await client
      .from('connector_tokens')
      .select('token')
      .eq('project_id', project!.id)
      .single()
    const shareToken = `gbs_${randomBytes(32).toString('base64url')}`
    await client.from('api_keys').insert({
      project_id: project!.id,
      key_hash: sha256(shareToken),
      label: 'delete spec share',
      scope: 'share',
      share_lens: 'team',
    })
    // An append-only ledger row, through the real push: purge must get through it (D10).
    const pushed = await request.post('/api/v1/roadmap/push', {
      headers: { Authorization: `Bearer ${ingestKey}` },
      data: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: { commit: 'abc1234', ref: 'main' },
        items: [{ name: 'A spec epic', slug: 'a-spec-epic', grain: 'Epic', status: 'Shipped', area: '01 Growth' }],
      },
    })
    expect(pushed.status()).toBeLessThan(300)

    expect((await track(request, ingestKey)).status()).toBeLessThan(300)
    const unknownConnector = (await mcp(request, `gb_connector_${'0'.repeat(32)}`)).status()
    const liveConnector = (await mcp(request, connector!.token)).status()
    const unknownShare = (await request.get(`/s/gbs_${randomBytes(32).toString('base64url')}`)).status()
    const liveShare = (await request.get(`/s/${shareToken}`)).status()

    // Owner only, and the name must be repeated.
    const del = (who: Person, confirm: string) =>
      request.post('/api/v1/cli/projects/delete', { headers: who.auth, data: { slug, confirm } })
    for (const who of [member, stranger]) {
      const res = await del(who, slug)
      expect(res.status()).toBe(404)
      expect(await res.json()).toMatchObject({ code: 'not_found' })
    }
    expect((await del(owner, 'something-else')).status()).toBe(400)
    const done = await del(owner, slug)
    expect(done.status()).toBe(200)
    expect(await done.json()).toMatchObject({ ok: true, deleted: true, slug })

    // Gone from every list, and every read that names it.
    for (const who of [owner, member]) {
      const listed = (await (await request.get('/api/v1/cli/projects', { headers: who.auth })).json()) as {
        projects: Array<{ slug: string }>
      }
      expect(listed.projects.map((p) => p.slug)).not.toContain(slug)
    }
    expect((await request.get(`/api/v1/cli/status?project=${slug}`, { headers: owner.auth })).status()).toBe(404)
    expect((await del(owner, slug)).status()).toBe(404)

    // Every credential it issued is dead, and looks like one that never existed.
    expect((await track(request, ingestKey)).status()).toBe(401)
    const deadConnector = (await mcp(request, connector!.token)).status()
    expect(deadConnector).toBe(unknownConnector)
    if (liveConnector !== unknownConnector) expect(deadConnector).not.toBe(liveConnector)
    const deadShare = (await request.get(`/s/${shareToken}`)).status()
    expect(deadShare).toBe(unknownShare)
    if (liveShare !== unknownShare) expect(deadShare).not.toBe(liveShare)

    // The name stays taken — even to its owner — until purge.
    expect((await request.post('/api/v1/cli/projects', { headers: owner.auth, data: { slug } })).status()).toBe(409)

    // Purge refuses before 30 days, naming the date; a stranger is told nothing.
    const purge = (who: Person) =>
      request.post('/api/v1/cli/projects/purge', { headers: who.auth, data: { slug, confirm: slug } })
    const early = await purge(owner)
    expect(early.status()).toBe(409)
    const earlyBody = (await early.json()) as { code: string; purgeAfter: string; error: string }
    expect(earlyBody.code).toBe('conflict')
    expect(earlyBody.error).toContain(earlyBody.purgeAfter.slice(0, 10))
    expect((await purge(stranger)).status()).toBe(404)
    expect((await purge(member)).status()).toBe(404)

    // 31 days later (moved in the database, the clock purge judges by), it goes — through the ledger.
    await client
      .from('projects')
      .update({ deleted_at: new Date(Date.now() - 31 * 86_400_000).toISOString() })
      .eq('id', project!.id)
    const later = await purge(owner)
    expect(later.status()).toBe(200)
    expect(await later.json()).toMatchObject({ ok: true, purged: true, slug })
    const { data: gone } = await client.from('projects').select('id').eq('id', project!.id)
    expect(gone).toEqual([])
    const { data: artifacts } = await client.from('report_artifacts').select('id').eq('project_id', project!.id)
    expect(artifacts).toEqual([])

    // And the name is free again.
    expect((await request.post('/api/v1/cli/projects', { headers: owner.auth, data: { slug } })).status()).toBe(200)
  } finally {
    await cleanup(client, [owner.id, member.id, stranger.id])
  }
})

test('the public project refuses delete', async ({ request }) => {
  const client = db()
  const owner = await person(client, 'del-public')
  const demo = process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
  try {
    const { data: project } = await client.from('projects').select('id').eq('slug', demo).maybeSingle()
    test.skip(!project, `the public project ${demo} is not seeded on this server`)
    await client.from('project_members').insert({ project_id: project!.id, user_id: owner.id, role: 'owner' })
    const res = await request.post('/api/v1/cli/projects/delete', {
      headers: owner.auth,
      data: { slug: demo, confirm: demo },
    })
    expect(res.status()).toBe(400)
    const { data: still } = await client.from('projects').select('deleted_at').eq('id', project!.id).single()
    expect(still).toEqual({ deleted_at: null })
  } finally {
    await client.from('project_members').delete().eq('user_id', owner.id)
    await cleanup(client, [owner.id])
  }
})

test('deleting the product your signup made frees the signup slot (it is not adopted back)', async () => {
  const client = db()
  const { data } = await client.auth.admin.createUser({
    email: `del-signup-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  const userId = data.user!.id
  try {
    const { data: workspace } = await client
      .from('workspaces')
      .insert({ name: 'signup spec', created_by: userId })
      .select('id')
      .single()
    const first = slugFor('del-signup')
    const { data: project } = await client
      .from('projects')
      .insert({ slug: first, created_by: userId, workspace_id: workspace!.id })
      .select('id')
      .single()
    await client.from('project_members').insert({ project_id: project!.id, user_id: userId, role: 'owner' })
    const { data: outcome } = await client.rpc('delete_project', { p_slug: first, p_user_id: userId, p_protected: [] })
    expect(outcome).toBe('deleted')
    // A new signup row for the same person now inserts: the deleted one no longer holds the slot.
    const again = await client
      .from('projects')
      .insert({ slug: slugFor('del-signup'), created_by: userId, workspace_id: workspace!.id })
      .select('id')
      .single()
    expect(again.error).toBeNull()
  } finally {
    await cleanup(client, [userId])
  }
})

test('delete_project and purge_deleted_project are service-role only (a function-level denial)', async () => {
  const url = process.env.SUPABASE_URL!
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  test.skip(!anonKey, 'no anon key on this runner')
  const anon = createClient(url, anonKey!, { auth: { persistSession: false } })
  for (const [fn, args] of [
    ['delete_project', { p_slug: 'x-y-z', p_user_id: crypto.randomUUID(), p_protected: [] }],
    ['purge_deleted_project', { p_slug: 'x-y-z', p_user_id: crypto.randomUUID() }],
  ] as const) {
    const { error } = await anon.rpc(fn, args)
    expect(error?.code, fn).toBe('42501') // permission denied for function — the body never ran
  }
})
