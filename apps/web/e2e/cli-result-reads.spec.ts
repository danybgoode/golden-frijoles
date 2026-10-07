import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Client as PgClient } from 'pg'
import { createHash, randomBytes } from 'node:crypto'
import { requireTestDatabaseUrl } from './helpers/test-db-cleanup'
import { specWorkspaceId } from './helpers/spec-workspace'

// result-record · Story 3.1 (D14, D15) — the two reads an agent fetches a result through:
// `GET /api/v1/cli/north-star/readings` and `GET /api/v1/cli/experiments/decision`.
//
// New request-path reads on an auth boundary, so this spec is about WHO reads WHICH project: a member reads their own,
// a member of one project gets 404 on another (never 403), and what is read is the same data the platform already
// holds — readings pushed through the ingest-key route, a decision recorded through the ledger's own RPC.

const PROJECT_ONE_KEY = 'local-test-key-do-not-use-in-prod'
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
    email: `cli-result-${unique()}@example.test`,
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

async function addMember(userId: string, projectId: string, role: 'owner' | 'member') {
  const { error } = await db()
    .from('project_members')
    .insert({ user_id: userId, project_id: projectId, role })
  if (error) throw new Error(`could not add the test membership: ${error.message}`) // a missing one would fake a 404
}

async function projectId(slug: string): Promise<string> {
  const { data } = await db().from('projects').select('id').eq('slug', slug).single()
  if (!data) throw new Error(`no seeded project ${slug}`)
  return data.id as string
}

async function get(request: APIRequestContext, token: string, path: string) {
  const response = await request.get(path, { headers: { authorization: `Bearer ${token}` } })
  return { status: response.status(), body: await response.json() }
}

test.describe('the CLI result reads', () => {
  test('readings: a member reads an input’s readings, latest on or before `to`; elsewhere is 404', async ({
    request,
  }) => {
    const { userId, token } = await seedUser()
    try {
      await addMember(userId, await projectId('project-one'), 'owner')
      const metric = `spec_rr_${unique()}`
      const input = `${metric}_input`
      const synced = await request.post('/api/v1/cli/north-star', {
        headers: { authorization: `Bearer ${token}` },
        data: {
          project: 'project-one',
          sync: {
            metric: { key: metric, name: 'Spec' },
            inputs: [{ key: input, name: 'Spec input', valueSource: 'external_push' }],
          },
        },
      })
      expect(synced.status()).toBe(200)
      const pushed = await request.post(`/api/v1/inputs/${input}/values`, {
        headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
        data: {
          values: [
            { occurredOn: '2026-10-01', value: 61 },
            { occurredOn: '2026-11-01', value: 68 },
            { occurredOn: '2026-11-05', value: 72 },
          ],
        },
      })
      expect(pushed.status()).toBe(200)

      const all = await get(
        request,
        token,
        `/api/v1/cli/north-star/readings?project=project-one&input=${input}`
      )
      expect(all.status).toBe(200)
      expect(all.body).toMatchObject({ ok: true, project: 'project-one', input: { key: input } })
      expect(all.body.readings.map((r: { date: string }) => r.date)).toEqual([
        '2026-10-01',
        '2026-11-01',
        '2026-11-05',
      ])
      expect(all.body.latest).toEqual({ date: '2026-11-05', value: 72 })

      const cut = await get(
        request,
        token,
        `/api/v1/cli/north-star/readings?project=project-one&input=${input}&to=2026-11-04`
      )
      expect(cut.body.latest).toEqual({ date: '2026-11-01', value: 68 })

      const unknown = await get(
        request,
        token,
        `/api/v1/cli/north-star/readings?project=project-one&input=nope_${unique()}`
      )
      expect([unknown.status, unknown.body.code]).toEqual([404, 'not_found'])
      const badCut = await get(
        request,
        token,
        `/api/v1/cli/north-star/readings?project=project-one&input=${input}&to=4-Nov`
      )
      expect([badCut.status, badCut.body.code]).toEqual([400, 'invalid'])
      // Not a member of project-two: the same 404 as a project that does not exist — never a 403.
      const foreign = await get(
        request,
        token,
        `/api/v1/cli/north-star/readings?project=project-two&input=${input}`
      )
      expect([foreign.status, foreign.body.code]).toEqual([404, 'not_found'])
    } finally {
      await db().from('project_members').delete().eq('user_id', userId)
      await db().auth.admin.deleteUser(userId)
    }
  })

  test('decision: a member reads an experiment’s decision record by key; elsewhere is 404', async ({
    request,
  }) => {
    const client = db()
    const { userId, token } = await seedUser()
    const { data: project, error } = await client
      .from('projects')
      .insert({
        workspace_id: await specWorkspaceId(client),
        slug: `cli-result-${unique()}`,
        api_key_hash: `h-${crypto.randomUUID()}`,
      })
      .select('id, slug')
      .single()
    if (error || !project) throw new Error(`could not create project fixture: ${error?.message}`)
    try {
      await addMember(userId, project.id, 'owner')
      const key = `spec-exp-${unique()}`
      const created = await client.rpc('create_experiment_version', {
        p_project_id: project.id,
        p_experiment_key: key,
        p_definition: {
          hypothesis: 'Clearer copy lifts completions.',
          assignmentEntityType: 'merchant',
          eligibility: { description: 'Everyone in the spec.', tags: { region: 'mx' } },
          variants: [
            { key: 'control', weight: 1 },
            { key: 'new-copy', weight: 1 },
          ],
          controlVariantKey: 'control',
          primaryMetric: { event: 'spec_completed', direction: 'increase' },
          guardrailMetrics: [],
          segmentFields: ['region'],
          plannedWindow: { startAt: '2026-07-01T00:00:00.000Z', endAt: '2026-08-01T00:00:00.000Z' },
          minimumSamplePerVariant: 10,
        },
        p_actor_user_id: userId,
      })
      if (created.error || !created.data?.[0])
        throw new Error(`could not create version: ${created.error?.message}`)

      const read = await get(
        request,
        token,
        `/api/v1/cli/experiments/decision?project=${project.slug}&experiment=${key}`
      )
      expect(read.status).toBe(200)
      expect(read.body).toMatchObject({ ok: true, project: project.slug, key, version: 1 })
      expect(read.body.decisions.state).toBe('undecided')

      const missing = await get(
        request,
        token,
        `/api/v1/cli/experiments/decision?project=${project.slug}&experiment=nope-${unique()}`
      )
      expect([missing.status, missing.body.code]).toEqual([404, 'not_found'])
      const noVersion = await get(
        request,
        token,
        `/api/v1/cli/experiments/decision?project=${project.slug}&experiment=${key}&version=9`
      )
      expect([noVersion.status, noVersion.body.code]).toEqual([404, 'not_found'])
      const foreign = await get(
        request,
        token,
        `/api/v1/cli/experiments/decision?project=project-two&experiment=${key}`
      )
      expect([foreign.status, foreign.body.code]).toEqual([404, 'not_found'])
    } finally {
      // Experiment rows are retained evidence: remove this spec's own project the way experiment-decisions does.
      const postgres = new PgClient({ connectionString: requireTestDatabaseUrl() })
      await postgres.connect()
      try {
        await postgres.query('DELETE FROM public.experiment_lifecycle_audit WHERE project_id = $1', [
          project.id,
        ])
        await postgres.query('DELETE FROM public.projects WHERE id = $1', [project.id])
      } finally {
        await postgres.end()
      }
      await client.from('project_members').delete().eq('user_id', userId)
      await client.auth.admin.deleteUser(userId)
    }
  })
})
