import { expect, test, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import type { FlagDefinition } from '@golden-frijoles/sdk'
import {
  cleanupExperimentProjects,
  requireLocalSupabaseApiUrl,
  requireTestDatabaseUrl,
} from './helpers/test-db-cleanup'
import { specWorkspaceId } from './helpers/spec-workspace'

// landing-launch-experiment · Sprint 6, Story 6.4 — `frijoles experiments` end to end, through the CLI route only: an
// agent creates, starts, reads and decides an A/B test with NO traffic and a metric that has never fired (Daniel,
// 2026-10-20: low volume never blocks a test or its record), and the roll-out lands in production.

const FLAG_KEY = 'landing.variant_b_enabled'
const SERVED: FlagDefinition = {
  valueType: 'boolean',
  description: 'Landing B',
  defaultVariantKey: 'off',
  variants: [
    { key: 'off', value: false },
    { key: 'on', value: true },
  ],
  rules: [],
  metadata: { source: 'fixture' },
}
const PATH = '/api/v1/cli/experiments'

function db(): SupabaseClient {
  requireTestDatabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set')
  return createClient(requireLocalSupabaseApiUrl(), key, { auth: { persistSession: false } })
}
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

type Fixture = { projectId: string; owner: string; slug: string; token: string }
const projects: string[] = []
const users: string[] = []

async function person(client: SupabaseClient): Promise<{ userId: string; token: string }> {
  const { data, error } = await client.auth.admin.createUser({
    email: `cli-exp-${Date.now()}-${randomBytes(4).toString('hex')}@example.test`,
    password: 'local-only-cli-experiments',
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`user fixture: ${error?.message}`)
  users.push(data.user.id)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const minted = await client
    .from('cli_tokens')
    .insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  if (minted.error) throw new Error(`token fixture: ${minted.error.message}`)
  return { userId: data.user.id, token }
}

async function fixture(client: SupabaseClient): Promise<Fixture> {
  const { userId, token } = await person(client)
  const slug = `cli-exp-${Date.now()}-${randomBytes(3).toString('hex')}`
  const { data: project, error } = await client
    .from('projects')
    .insert({ workspace_id: await specWorkspaceId(client), slug, api_key_hash: `h-${crypto.randomUUID()}` })
    .select('id')
    .single()
  if (error || !project) throw new Error(`project fixture: ${error?.message}`)
  projects.push(project.id as string)
  await client.from('project_members').insert({ project_id: project.id, user_id: userId, role: 'owner' })
  // The feature, live in Production, through the product's own RPCs.
  const { data: version, error: versionError } = await client.rpc('create_flag_definition_version', {
    p_project_id: project.id,
    p_flag_key: FLAG_KEY,
    p_definition: SERVED,
    p_reason: 'fixture',
    p_actor_user_id: userId,
  })
  if (versionError) throw new Error(`flag fixture: ${versionError.message}`)
  const activation = await client.rpc('set_flag_activation', {
    p_project_id: project.id,
    p_environment: 'production',
    p_flag_id: version[0].flag_id,
    p_version_id: version[0].version_id,
    p_expected_snapshot_version: 0,
    p_reason: 'fixture',
    p_actor_user_id: userId,
  })
  if (activation.error) throw new Error(`activation fixture: ${activation.error.message}`)
  return { projectId: project.id as string, owner: userId, slug, token }
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` })
async function post(request: APIRequestContext, token: string, data: Record<string, unknown>) {
  const response = await request.post(PATH, { headers: auth(token), data })
  return { status: response.status(), body: (await response.json()) as Record<string, any> }
}
async function get(request: APIRequestContext, token: string, query: Record<string, string>) {
  const response = await request.get(`${PATH}?${new URLSearchParams(query)}`, { headers: auth(token) })
  return { status: response.status(), body: (await response.json()) as Record<string, any> }
}

// The answers `frijoles experiments create --flag … --metric …` builds (packages/cli/src/commands/experiments.ts).
const answers = {
  template: 'copy',
  flagKey: FLAG_KEY,
  why: 'funnel',
  direction: 'increase',
  metric: 'start_prompt_copied',
  guardrails: ['signup_started'],
  breakdowns: [],
  mde: 10,
  who: { mode: 'everyone', conditions: [], allocation: 100 },
  entity: 'visitor',
  versions: ['Current', 'New version'],
  split: 50,
  weeks: 4,
  endsOn: 'open',
}

test.describe('frijoles experiments (S6.4)', () => {
  test.skip(process.env.EXPERIMENT_BUILDER_ENABLED !== 'true', 'runs against the server with the builder on')
  // Lazily, in beforeAll: a describe body runs while specs are only being LISTED (the quarantine check has no DB URL).
  let client: SupabaseClient
  test.beforeAll(() => {
    client = db()
  })
  test.afterAll(async () => {
    await cleanupExperimentProjects(projects)
    await Promise.all(users.map((id) => client.auth.admin.deleteUser(id)))
  })

  test('no traffic, a metric that never fired: create → start → show → decide ship + roll out, all from the CLI', async ({
    request,
  }) => {
    const fx = await fixture(client)
    const created = await post(request, fx.token, { command: 'create', project: fx.slug, answers })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    expect(created.body, JSON.stringify(created.body.checks)).toMatchObject({
      ok: true,
      failing: 0,
      version: 1,
    })
    const key = created.body.experimentKey as string

    const started = await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    expect(started.status, JSON.stringify(started.body)).toBe(200)
    expect(started.body).toMatchObject({ ok: true, serving: true, weights: [50, 50] })

    const listed = await get(request, fx.token, { project: fx.slug })
    expect(listed.body.experiments).toEqual([expect.objectContaining({ key, version: 1, status: 'running' })])

    const shown = await get(request, fx.token, { project: fx.slug, experiment: key })
    expect(shown.body).toMatchObject({ status: 'running', readout: { state: 'waiting', chance: null } })
    expect(shown.body.readout.verdict.actions).toEqual(['rollout', 'keep', 'pause', 'stop'])
    expect(shown.body.readout.progress.plannedDays).toBeNull() // no end date (S6.2)

    const decided = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'ship',
      reason: 'Launch call: ship B now and keep reading it',
      rollout: true,
    })
    expect(decided.status, JSON.stringify(decided.body)).toBe(200)
    expect(decided.body).toMatchObject({
      outcome: 'ship_treatment',
      chosenVariantKey: 'on',
      rollout: { ok: true },
    })
    const after = await get(request, fx.token, { project: fx.slug, experiment: key })
    expect(after.body.status).toBe('decided')
  })

  test('stop, then keep: a decision without a roll-out', async ({ request }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    const stopped = await post(request, fx.token, { command: 'stop', project: fx.slug, experiment: key })
    expect(stopped.body).toMatchObject({ ok: true, status: 'stopped' })
    const kept = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'keep',
      reason: 'Not now',
    })
    expect(kept.body).toMatchObject({
      ok: true,
      outcome: 'keep_control',
      chosenVariantKey: 'off',
      rollout: null,
    })
  })

  test('a member who is not an owner can read but not write (owner-gated, like the console)', async ({
    request,
  }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    const member = await person(client)
    await client
      .from('project_members')
      .insert({ project_id: fx.projectId, user_id: member.userId, role: 'member' })
    expect((await get(request, member.token, { project: fx.slug })).status).toBe(200)
    expect((await get(request, member.token, { project: fx.slug, experiment: key })).status).toBe(200)
    for (const body of [
      { command: 'create', answers },
      { command: 'start', experiment: key },
      { command: 'stop', experiment: key },
      { command: 'decide', experiment: key, outcome: 'keep', reason: 'not mine to decide' },
    ])
      expect((await post(request, member.token, { project: fx.slug, ...body })).status, body.command).toBe(
        404
      )
    expect((await get(request, fx.token, { project: fx.slug, experiment: key })).body.status).toBe('draft')
  })

  test('a version that does not exist is refused BEFORE a live test is stopped', async ({ request }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    const typo = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'ship',
      variant: 'onn',
      reason: 'typo',
    })
    expect(typo.status).toBe(400)
    expect((await get(request, fx.token, { project: fx.slug, experiment: key })).body.status).toBe('running')
  })

  // S6.6 — what Production serves for the flag: does it carry this test's split?
  async function servesSplit(fx: Fixture, key: string): Promise<boolean> {
    const { data: registry } = await client
      .from('flag_registries')
      .select('id')
      .eq('project_id', fx.projectId)
      .eq('key', FLAG_KEY)
      .single()
    const { data: active } = await client
      .from('flag_environment_activations')
      .select('version_id')
      .eq('project_id', fx.projectId)
      .eq('flag_id', registry!.id)
      .eq('environment', 'production')
      .single()
    const { data: version } = await client
      .from('flag_definition_versions')
      .select('definition')
      .eq('id', active!.version_id)
      .single()
    return (version!.definition as FlagDefinition).metadata?.experiment_key === key
  }

  test('pause takes the split off and keeps the test running; resume serves it again; a paused test can be rolled out', async ({
    request,
  }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    expect(await servesSplit(fx, key)).toBe(true)

    const paused = await post(request, fx.token, { command: 'pause', project: fx.slug, experiment: key })
    expect(paused.body).toMatchObject({ ok: true, status: 'paused', serving: false })
    expect(await servesSplit(fx, key)).toBe(false)
    const shownPaused = await get(request, fx.token, { project: fx.slug, experiment: key })
    expect(shownPaused.body).toMatchObject({ status: 'running', readout: { state: 'paused' } })
    expect(shownPaused.body.readout.verdict.actions).toContain('retry-serving')

    const resumed = await post(request, fx.token, { command: 'resume', project: fx.slug, experiment: key })
    expect(resumed.body).toMatchObject({ ok: true, status: 'running', serving: true })
    expect(await servesSplit(fx, key)).toBe(true)

    await post(request, fx.token, { command: 'pause', project: fx.slug, experiment: key })
    const shipped = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'ship',
      reason: 'ship it from the pause',
      rollout: true,
    })
    expect(shipped.body, JSON.stringify(shipped.body)).toMatchObject({ ok: true, rollout: { ok: true } })
  })

  test('delete takes the split off Production and retires the test; a decided one is kept', async ({
    request,
  }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    const deleted = await post(request, fx.token, { command: 'delete', project: fx.slug, experiment: key })
    expect(deleted.body).toMatchObject({ ok: true, status: 'deleted', versions: [1] })
    expect(await servesSplit(fx, key)).toBe(false)
    expect((await get(request, fx.token, { project: fx.slug, experiment: key })).body.status).toBe('invalid')
    expect(
      (await post(request, fx.token, { command: 'delete', project: fx.slug, experiment: key })).status
    ).toBe(409)

    const kept = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: kept })
    await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: kept,
      outcome: 'keep',
      reason: 'done',
    })
    const refused = await post(request, fx.token, { command: 'delete', project: fx.slug, experiment: kept })
    expect(refused.status).toBe(409)
    expect(refused.body.error).toMatch(/decided/)
  })

  test('shipping the control by name is refused before a live test is stopped', async ({ request }) => {
    const fx = await fixture(client)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    await post(request, fx.token, { command: 'start', project: fx.slug, experiment: key })
    const control = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'ship',
      variant: 'off',
      reason: 'x',
    })
    expect(control.status).toBe(400)
    expect((await get(request, fx.token, { project: fx.slug, experiment: key })).body.status).toBe('running')
  })

  test('a stranger, and a reason left out, are refused and change nothing', async ({ request }) => {
    const fx = await fixture(client)
    const stranger = await person(client)
    const refused = await post(request, stranger.token, { command: 'create', project: fx.slug, answers })
    expect(refused.status).toBe(404)
    expect((await get(request, stranger.token, { project: fx.slug })).status).toBe(404)
    const key = (await post(request, fx.token, { command: 'create', project: fx.slug, answers })).body
      .experimentKey as string
    const noReason = await post(request, fx.token, {
      command: 'decide',
      project: fx.slug,
      experiment: key,
      outcome: 'keep',
    })
    expect(noReason.status).toBe(400)
    expect((await get(request, fx.token, { project: fx.slug, experiment: key })).body.status).toBe('draft')
    const unknown = await post(request, fx.token, { command: 'delete-everything', project: fx.slug })
    expect(unknown.status).toBe(400)
  })
})
