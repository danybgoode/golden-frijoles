import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { specWorkspaceId } from './helpers/spec-workspace'

// traffic-relaunch S1.4 (D7) — `GET /api/v1/cli/events?project=&event=&days=&by=`: how many times one event fired, per
// day. A new request-path read on an auth boundary, so this spec is about WHO reads WHICH project (a member reads their
// own; a non-member gets 404, never 403) and about the counts themselves (per UTC day, per tag value, the window holds,
// bad input is named).

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')
const unique = () => randomBytes(4).toString('hex')

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function seedUser(): Promise<{ userId: string; token: string }> {
  const client = db()
  const { data, error } = await client.auth.admin.createUser({
    email: `cli-events-${unique()}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const { error: tokenError } = await client
    .from('cli_tokens')
    .insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  if (tokenError) throw new Error(`could not mint the test CLI token: ${tokenError.message}`)
  return { userId: data.user.id, token }
}

async function get(request: APIRequestContext, token: string, path: string) {
  const response = await request.get(path, { headers: { authorization: `Bearer ${token}` } })
  return { status: response.status(), body: await response.json() }
}

test.describe('the CLI event count', () => {
  test('a member counts one event per day and per tag; elsewhere is 404; bad input is named', async ({
    request,
  }) => {
    const client = db()
    const { userId, token } = await seedUser()
    const slug = `cli-events-${unique()}`
    const { data: project, error } = await client
      .from('projects')
      .insert({ workspace_id: await specWorkspaceId(client), slug, api_key_hash: `h-${crypto.randomUUID()}` })
      .select('id')
      .single()
    if (error || !project) throw new Error(`could not create project fixture: ${error?.message}`)
    try {
      const member = await client
        .from('project_members')
        .insert({ user_id: userId, project_id: project.id, role: 'member' })
      if (member.error) throw new Error(`could not add the membership: ${member.error.message}`)
      // Two days ago and yesterday, explicit timestamps, inside the default 30-day window; one older than 7 days.
      const day = (ago: number) => new Date(Date.now() - ago * 86_400_000).toISOString().slice(0, 10)
      const row = (event: string, ago: number, tags: Record<string, string>) => ({
        project_id: project.id,
        user_id: `v-${unique()}`,
        event,
        created_at: `${day(ago)}T12:00:00Z`,
        tags,
      })
      const seeded = await client
        .from('events')
        .insert([
          row('landing_visited', 2, { source: 'tiktok' }),
          row('landing_visited', 1, { source: 'tiktok' }),
          row('landing_visited', 1, { source: 'google.com' }),
          row('landing_visited', 1, {}),
          row('landing_visited', 20, { source: 'tiktok' }),
          row('something_else', 1, { source: 'tiktok' }),
        ])
      if (seeded.error) throw new Error(`could not seed events: ${seeded.error.message}`)

      const all = await get(request, token, `/api/v1/cli/events?project=${slug}&event=landing_visited`)
      expect(all.status).toBe(200)
      expect(all.body).toMatchObject({
        ok: true,
        project: slug,
        event: 'landing_visited',
        days: 30,
        byTag: null,
        total: 5,
        truncated: false,
      })
      expect(all.body.rows).toEqual([
        { day: day(20), count: 1 },
        { day: day(2), count: 1 },
        { day: day(1), count: 3 },
      ])

      const week = await get(
        request,
        token,
        `/api/v1/cli/events?project=${slug}&event=landing_visited&days=7&by=source`
      )
      expect(week.body.total).toBe(4)
      expect(week.body.rows).toEqual([
        { day: day(2), value: 'tiktok', count: 1 },
        { day: day(1), value: '(none)', count: 1 },
        { day: day(1), value: 'google.com', count: 1 },
        { day: day(1), value: 'tiktok', count: 1 },
      ])

      for (const bad of ['&days=0', '&days=91', '&days=x', '&by=Source', "&by=tags->>'x'"]) {
        const r = await get(request, token, `/api/v1/cli/events?project=${slug}&event=landing_visited${bad}`)
        expect([r.status, r.body.code], bad).toEqual([400, 'invalid'])
      }
      const noEvent = await get(request, token, `/api/v1/cli/events?project=${slug}`)
      expect([noEvent.status, noEvent.body.code]).toEqual([400, 'invalid'])

      // Not a member of project-two: the same 404 as a project that does not exist — never a 403.
      const foreign = await get(
        request,
        token,
        `/api/v1/cli/events?project=project-two&event=landing_visited`
      )
      expect([foreign.status, foreign.body.code]).toEqual([404, 'not_found'])
      const ghost = await get(
        request,
        token,
        `/api/v1/cli/events?project=no-such-${unique()}&event=landing_visited`
      )
      expect([ghost.status, ghost.body.code]).toEqual([404, 'not_found'])
      const anonymous = await request.get(`/api/v1/cli/events?project=${slug}&event=landing_visited`)
      expect(anonymous.status()).toBe(401)
    } finally {
      await client.from('events').delete().eq('project_id', project.id)
      await client.from('project_members').delete().eq('user_id', userId)
      await client.from('projects').delete().eq('id', project.id)
      await client.auth.admin.deleteUser(userId)
    }
  })
})
