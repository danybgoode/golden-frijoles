import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { specWorkspaceId } from './helpers/spec-workspace'

// funnel-truth S2.1 (D9, D10) — `/api/v1/cli/segments`: an owner defines a segment, a member lists it with its share of
// the last 30 days' active people, a non-member gets 404, and `everyone` cannot be defined. Then the table itself: anon
// and authenticated are refused by PRIVILEGE (a permission error), not by an RLS filter that would answer "no rows".

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')
const unique = () => randomBytes(4).toString('hex')

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function seedUser(client: SupabaseClient): Promise<{ userId: string; token: string }> {
  const { data, error } = await client.auth.admin.createUser({
    email: `cli-segments-${unique()}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const minted = await client
    .from('cli_tokens')
    .insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  if (minted.error) throw new Error(`could not mint the test CLI token: ${minted.error.message}`)
  return { userId: data.user.id, token }
}

const call = async (
  request: APIRequestContext,
  token: string,
  method: 'GET' | 'POST',
  path: string,
  data?: unknown
) => {
  const response =
    method === 'GET'
      ? await request.get(path, { headers: { authorization: `Bearer ${token}` } })
      : await request.post(path, { headers: { authorization: `Bearer ${token}` }, data })
  return { status: response.status(), body: await response.json() }
}

test('an owner defines a segment, a member lists it with its share, elsewhere is 404, everyone is reserved', async ({
  request,
}) => {
  const client = db()
  const owner = await seedUser(client)
  const member = await seedUser(client)
  const outsider = await seedUser(client)
  const slug = `cli-seg-${unique()}`
  const { data: project, error } = await client
    .from('projects')
    .insert({ workspace_id: await specWorkspaceId(client), slug, api_key_hash: `h-${crypto.randomUUID()}` })
    .select('id')
    .single()
  if (error || !project) throw new Error(`could not create project fixture: ${error?.message}`)
  try {
    for (const [userId, role] of [
      [owner.userId, 'owner'],
      [member.userId, 'member'],
    ] as const) {
      const added = await client
        .from('project_members')
        .insert({ user_id: userId, project_id: project.id, role })
      if (added.error) throw new Error(`could not add the membership: ${added.error.message}`)
    }
    // Four active people in the last 30 days; two of them ran a report at least twice: 50%.
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString()
    const rows = [
      ['a', 'report_run', 50],
      ['a', 'report_run', 40],
      ['b', 'report_run', 30],
      ['b', 'report_run', 20],
      ['c', 'report_run', 10], // once: not in
      ['d', 'page_viewed', 5],
      ['system:server', 'report_run', 5],
      ['system:server', 'report_run', 4],
    ].map(([user, event, h]) => ({
      project_id: project.id,
      user_id: user,
      event,
      tags: {},
      created_at: hoursAgo(h as number),
    }))
    const seeded = await client.from('events').insert(rows)
    if (seeded.error) throw new Error(`could not seed events: ${seeded.error.message}`)

    const segment = { key: 'power-users', event: 'report_run', minCount: 2, days: 30 }
    const byMember = await call(request, member.token, 'POST', '/api/v1/cli/segments', {
      project: slug,
      segment,
    })
    expect(byMember.status, 'a member who is not an owner cannot define').toBe(404)

    const defined = await call(request, owner.token, 'POST', '/api/v1/cli/segments', {
      project: slug,
      segment,
    })
    expect(defined.status, JSON.stringify(defined.body)).toBe(200)
    expect(defined.body).toMatchObject({
      created: true,
      segment: { key: 'power-users', share: 0.5, members: 2, base: 4 },
    })
    const again = await call(request, owner.token, 'POST', '/api/v1/cli/segments', {
      project: slug,
      segment: { ...segment, minCount: 1 },
    })
    expect(again.body).toMatchObject({ created: false, segment: { minCount: 1, share: 0.75 } })

    const reserved = await call(request, owner.token, 'POST', '/api/v1/cli/segments', {
      project: slug,
      segment: { ...segment, key: 'everyone' },
    })
    expect(reserved.status).toBe(400)
    expect(reserved.body.error).toMatch(/built-in segment/)

    const listed = await call(request, member.token, 'GET', `/api/v1/cli/segments?project=${slug}`)
    expect(listed.status).toBe(200)
    expect(listed.body.segments.map((s: { key: string }) => s.key)).toEqual(['everyone', 'power-users'])

    const elsewhere = await call(request, outsider.token, 'GET', `/api/v1/cli/segments?project=${slug}`)
    expect(elsewhere.status, 'a non-member is told the project does not exist').toBe(404)
  } finally {
    await client.from('projects').delete().eq('id', project.id)
    for (const u of [owner, member, outsider]) await client.auth.admin.deleteUser(u.userId)
  }
})

test('the segments table refuses anon and authenticated by privilege, not by an empty RLS answer', async () => {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('SUPABASE_URL and the anon key must be set to run this spec')
  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const read = await anon.from('segments').select('key').limit(1)
  expect(read.error?.code, 'anon must hit a permission error (42501), not an RLS-filtered empty list').toBe(
    '42501'
  )
  const write = await anon
    .from('segments')
    .insert({ project_id: crypto.randomUUID(), key: 'x', event: 'e', min_count: 1, days: 1 })
  expect(write.error?.code).toBe('42501')

  // authenticated: a real signed-in user's JWT, through the same PostgREST.
  const client = db()
  const email = `seg-authn-${unique()}@example.test`
  const password = `pw-${randomBytes(12).toString('hex')}`
  const { data, error } = await client.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  try {
    const user = createClient(url, anonKey, { auth: { persistSession: false } })
    const signedIn = await user.auth.signInWithPassword({ email, password })
    if (signedIn.error) throw new Error(`could not sign in: ${signedIn.error.message}`)
    const asUser = await user.from('segments').select('key').limit(1)
    expect(asUser.error?.code).toBe('42501')
  } finally {
    await client.auth.admin.deleteUser(data.user.id)
  }
})
