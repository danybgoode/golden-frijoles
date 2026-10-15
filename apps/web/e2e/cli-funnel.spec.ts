import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { specWorkspaceId } from './helpers/spec-workspace'

// funnel-truth S1.4 (D8) — `GET /api/v1/cli/funnel?project=&feature=&by=`: a feature's funnel by cohort period, for an
// agent. A new request-path read on an auth boundary, so this spec is about WHO reads WHICH project (a member reads
// their own; a non-member gets 404, never 403) and about the rows themselves (a gap is a real zero, the newest period
// is maturing, a bad `by` or an unknown feature is named, not guessed).

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
    email: `cli-funnel-${unique()}@example.test`,
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

test.describe('the CLI funnel read', () => {
  test('a member reads the trend rows; elsewhere is 404; a bad `by` and an unknown feature are named', async ({
    request,
  }) => {
    const client = db()
    const { userId, token } = await seedUser()
    const slug = `cli-funnel-${unique()}`
    const { data: project, error } = await client
      .from('projects')
      .insert({
        workspace_id: await specWorkspaceId(client),
        slug,
        api_key_hash: `h-${crypto.randomUUID()}`,
      })
      .select('id')
      .single()
    if (error || !project) throw new Error(`could not create project fixture: ${error?.message}`)
    try {
      const member = await client
        .from('project_members')
        .insert({ user_id: userId, project_id: project.id, role: 'member' })
      if (member.error) throw new Error(`could not add the membership: ${member.error.message}`)
      const feature = `spec_trend_${unique()}`
      const created = await client.from('features').insert({
        project_id: project.id,
        key: feature,
        enabled: true,
        target_event: 'spec_got_it',
        adopted_event: 'spec_adopted',
        retained_event: null,
        retention_days: 7,
        description: 'Disposable feature for the trend read.',
      })
      if (created.error) throw new Error(`could not seed the feature: ${created.error.message}`)
      // Explicit timestamps (a shared now() would collapse the order). a: got it in July and adopted; b: got it in
      // September, did not adopt; August has nobody (a real zero).
      const row = (user: string, event: string, at: string) => ({
        project_id: project.id,
        user_id: user,
        event,
        feature_id: feature,
        created_at: `${at}T10:00:00Z`,
      })
      const seeded = await client
        .from('events')
        .insert([
          row('a', 'spec_got_it', '2026-07-03'),
          row('a', 'spec_adopted', '2026-07-04'),
          row('b', 'spec_got_it', '2026-09-02'),
        ])
      if (seeded.error) throw new Error(`could not seed events: ${seeded.error.message}`)

      const read = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=${feature}&by=month`)
      expect(read.status).toBe(200)
      expect(read.body).toMatchObject({ ok: true, project: slug, feature, by: 'month' })
      expect(read.body.trend.state).toBe('measured')
      const periods = read.body.trend.periods as Array<Record<string, unknown>>
      expect(periods.slice(0, 3).map((p) => [p.label, p.state, p.exposed, p.adopted])).toEqual([
        ['2026-07', 'read', 1, 1],
        ['2026-08', 'read', 0, 0],
        ['2026-09', 'read', 1, 0],
      ])
      expect(periods[0]).toHaveProperty('adoptedWithoutExposure', 0)
      expect(periods[0].maturing).toBe(false)
      expect(periods[periods.length - 1].maturing).toBe(true) // the current period is always maturing

      // `by` absent is month; week starts at the Monday holding the first exposure.
      const dflt = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=${feature}`)
      expect(dflt.body.by).toBe('month')
      const weeks = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=${feature}&by=week`)
      expect([weeks.body.by, weeks.body.trend.periods[0].label]).toEqual(['week', '2026-06-29'])

      const badBy = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=${feature}&by=year`)
      expect([badBy.status, badBy.body.code]).toEqual([400, 'invalid'])
      const noFeature = await get(request, token, `/api/v1/cli/funnel?project=${slug}`)
      expect([noFeature.status, noFeature.body.code]).toEqual([400, 'invalid'])
      const unknown = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=nope_${unique()}`)
      expect([unknown.status, unknown.body.code]).toEqual([404, 'not_found'])

      // Nobody exposed yet: the state says so, rather than a table of zeros.
      const empty = `spec_empty_${unique()}`
      await client.from('features').insert({
        project_id: project.id,
        key: empty,
        enabled: true,
        target_event: 'spec_never',
        adopted_event: null,
        retained_event: null,
        retention_days: 7,
        description: 'Never exposed.',
      })
      const none = await get(request, token, `/api/v1/cli/funnel?project=${slug}&feature=${empty}`)
      expect(none.body.trend).toEqual({ state: 'not_exposed' })

      // Not a member of project-two: the same 404 as a project that does not exist — never a 403.
      const foreign = await get(request, token, `/api/v1/cli/funnel?project=project-two&feature=${feature}`)
      expect([foreign.status, foreign.body.code]).toEqual([404, 'not_found'])
      const ghost = await get(
        request,
        token,
        `/api/v1/cli/funnel?project=no-such-${unique()}&feature=${feature}`
      )
      expect([ghost.status, ghost.body.code]).toEqual([404, 'not_found'])
    } finally {
      await client.from('project_members').delete().eq('user_id', userId)
      await client.from('projects').delete().eq('id', project.id)
      await client.auth.admin.deleteUser(userId)
    }
  })
})
