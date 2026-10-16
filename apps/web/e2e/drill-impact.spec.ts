// drill-impact-for-agents S1.1–S1.3 — a drill bound to an experiment, the owner door onto impact capture, and the
// capture riding the stop. Against real PostgREST, the owner RPCs (migration 20261018100000) and the CLI route.
// The route half runs only on the server whose gate file switches scenario authoring ON (the OFF pass is
// cli-scenarios.spec.ts's dark branch); the function boundary half runs on both.
import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Client as PgClient } from 'pg'
import { createHash, randomBytes } from 'node:crypto'
import { requireTestDatabaseUrl } from './helpers/test-db-cleanup'
import { OWNER_IMPACT_REASON, ownerImpactIdempotencyKey } from '@/lib/scenario-impact-request'

test.describe.configure({ mode: 'serial' })

const ACTOR = 'user_DrillImpactSpec'
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

const userIds: string[] = []
const projectIds: string[] = []

async function person(client: SupabaseClient, label: string) {
  const { data, error } = await client.auth.admin.createUser({
    email: `${label}-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  userIds.push(data.user.id)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  await client.from('cli_tokens').insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  return { id: data.user.id, auth: { authorization: `Bearer ${token}` } }
}

const closedFaultFlag = {
  valueType: 'json',
  description: 'Disposable drill-impact fault payload.',
  defaultVariantKey: 'control',
  variants: [
    { key: 'control', value: { kind: 'none' } },
    { key: 'delay', value: { kind: 'delay', delayMs: 25 } },
  ],
  rules: [],
}

/** A project the owner made through the CLI, with a key-verified target (the owner token check needs a live app). */
async function drillProject(
  request: APIRequestContext,
  client: SupabaseClient,
  owner: { id: string; auth: Record<string, string> }
) {
  const created = await request.post('/api/v1/cli/projects', {
    headers: owner.auth,
    data: { slug: `impact-${randomBytes(4).toString('hex')}` },
  })
  expect(created.status()).toBe(200)
  const slug = ((await created.json()) as { slug: string }).slug
  const { data: row } = await client.from('projects').select('id').eq('slug', slug).single()
  const projectId = row!.id as string
  projectIds.push(projectId)
  const adminKey = `gb_key_${randomBytes(16).toString('hex')}`
  const minted = await client.rpc('create_flag_admin_key', {
    p_project_id: projectId,
    p_environment: 'production',
    p_key_hash: sha256(adminKey),
    p_label: 'drill impact spec',
    p_expires_at: null,
    p_actor_user_id: owner.id,
  })
  expect(minted.error).toBeNull()
  const challenge = sha256(`challenge-${randomBytes(8).toString('hex')}`)
  const registered = await client.rpc('register_scenario_target', {
    p_key_hash: sha256(adminKey),
    p_target_key: 'site.probe',
    p_target_kind: 'miyagi_resilience_probe_v1',
    p_origin: 'https://drill-impact.example.test',
    p_ownership_challenge_hash: challenge,
    p_reason: 'register spec target',
    p_external_actor_id: ACTOR,
  })
  expect(registered.error).toBeNull()
  const verified = await client.rpc('verify_scenario_target', {
    p_key_hash: sha256(adminKey),
    p_target_id: registered.data![0].target_id,
    p_expected_challenge_hash: challenge,
    p_reason: 'spec ownership challenge',
    p_external_actor_id: ACTOR,
  })
  expect(verified.data?.[0]?.status).toBe('verified')
  return { slug, projectId, adminKey }
}

async function faultFlag(client: SupabaseClient, projectId: string, ownerId: string, key: string) {
  const { data, error } = await client.rpc('create_flag_definition_version', {
    p_project_id: projectId,
    p_flag_key: key,
    p_definition: closedFaultFlag,
    p_reason: 'drill impact spec flag',
    p_actor_user_id: ownerId,
  })
  if (error || !data?.[0]) throw new Error(`could not create the fault flag: ${error?.message}`)
  return data[0] as { flag_id: string; version_id: string; version: number }
}

/** An experiment bound to one fault flag version; `running` starts it, otherwise it stays a draft. */
async function experiment(
  client: SupabaseClient,
  projectId: string,
  ownerId: string,
  key: string,
  flag: { flag_id: string; version_id: string },
  running: boolean
) {
  const now = Date.now()
  const { data, error } = await client.rpc('create_experiment_version', {
    p_project_id: projectId,
    p_experiment_key: key,
    p_definition: {
      hypothesis: 'A bounded drill fault changes the probe outcome.',
      assignmentEntityType: 'synthetic_probe',
      eligibility: { description: 'Synthetic probes only.' },
      variants: [
        { key: 'control', weight: 1 },
        { key: 'delay', weight: 1 },
      ],
      controlVariantKey: 'control',
      primaryMetric: { event: 'probe_completed', direction: 'increase' },
      guardrailMetrics: [],
      segmentFields: [],
      plannedWindow: {
        startAt: new Date(now - 60_000).toISOString(),
        endAt: new Date(now + 30 * 60_000).toISOString(),
      },
      minimumSamplePerVariant: 1,
    },
    p_actor_user_id: ownerId,
  })
  if (error || !data?.[0]) throw new Error(`could not create the experiment: ${error?.message}`)
  const version = data[0] as { experiment_id: string; version_id: string; version: number }
  const bound = await client.rpc('bind_experiment_flag_version', {
    p_project_id: projectId,
    p_experiment_id: version.experiment_id,
    p_experiment_version_id: version.version_id,
    p_flag_id: flag.flag_id,
    p_flag_version_id: flag.version_id,
    p_actor_user_id: ownerId,
  })
  if (bound.error) throw new Error(`could not bind the experiment: ${bound.error.message}`)
  if (running) {
    const started = await client.rpc('transition_experiment_version', {
      p_project_id: projectId,
      p_experiment_id: version.experiment_id,
      p_version_id: version.version_id,
      p_target_status: 'running',
      p_actor_user_id: ownerId,
    })
    if (started.error) throw new Error(`could not start the experiment: ${started.error.message}`)
  }
  return version
}

const post = (request: APIRequestContext, auth: Record<string, string>, data: Record<string, unknown>) =>
  request.post('/api/v1/cli/scenarios', { headers: auth, data })

async function launchAndStop(
  request: APIRequestContext,
  client: SupabaseClient,
  auth: Record<string, string>,
  project: { slug: string; projectId: string },
  scenarioKey: string,
  beforeStop?: (runId: string, version: number) => Promise<void>
) {
  const launched = await post(request, auth, {
    project: project.slug,
    command: 'launch',
    scenarioKey,
    reason: 'spec',
  })
  expect(launched.status(), await launched.text()).toBe(200)
  const runId = ((await launched.json()) as { run_id: string }).run_id
  const { data: run } = await client
    .from('scenario_runs')
    .select('scenario_version_id')
    .eq('id', runId)
    .single()
  const { data: version } = await client
    .from('scenario_definition_versions')
    .select('version')
    .eq('id', run!.scenario_version_id)
    .single()
  await beforeStop?.(runId, Number(version!.version))
  const stopped = await post(request, auth, { project: project.slug, command: 'stop', runId, reason: 'spec' })
  expect(stopped.status(), await stopped.text()).toBe(200)
  return { runId, body: (await stopped.json()) as { impact?: Record<string, unknown> } }
}

test.afterAll(async () => {
  const pg = new PgClient({ connectionString: requireTestDatabaseUrl() })
  await pg.connect()
  try {
    if (projectIds.length > 0) {
      await pg.query('BEGIN')
      await pg.query('DELETE FROM public.audit_log WHERE project_id = ANY($1::uuid[])', [projectIds])
      await pg.query('DELETE FROM public.projects WHERE id = ANY($1::uuid[])', [projectIds])
      for (const table of [
        'scenario_impact_evidence',
        'scenario_lifecycle_audit',
        'flag_lifecycle_audit',
        'experiment_flag_binding_audit',
      ])
        await pg.query(`DELETE FROM public.${table} WHERE project_id = ANY($1::uuid[])`, [projectIds])
      await pg.query('COMMIT')
    }
  } catch (error) {
    await pg.query('ROLLBACK')
    throw error
  } finally {
    await pg.end()
  }
  const client = db()
  for (const id of userIds) await client.auth.admin.deleteUser(id)
})

test('S1.2: the owner impact functions are service-role only, owner only, and refuse an external-cohort run', async ({
  request,
}) => {
  const pg = new PgClient({ connectionString: requireTestDatabaseUrl() })
  await pg.connect()
  try {
    for (const signature of [
      'public.owner_get_scenario_impact_source(uuid,uuid,uuid,timestamp with time zone)',
      'public.owner_record_scenario_impact_evidence(uuid,uuid,uuid,jsonb,text,uuid)',
    ]) {
      const privilege = await pg.query<{ anon: boolean; authenticated: boolean; service_role: boolean }>(
        `SELECT has_function_privilege('anon', $1, 'EXECUTE') AS anon,
                has_function_privilege('authenticated', $1, 'EXECUTE') AS authenticated,
                has_function_privilege('service_role', $1, 'EXECUTE') AS service_role`,
        [signature]
      )
      expect(privilege.rows[0], signature).toEqual({ anon: false, authenticated: false, service_role: true })
    }
  } finally {
    await pg.end()
  }

  const client = db()
  const owner = await person(client, 'impact-owner')
  const member = await person(client, 'impact-member')
  const stranger = await person(client, 'impact-stranger')
  const project = await drillProject(request, client, owner)
  await client
    .from('project_members')
    .insert({ project_id: project.projectId, user_id: member.id, role: 'member' })
  const flag = await faultFlag(client, project.projectId, owner.id, 'site.external_fault')
  // An external-cohort drill exists only through the credential path; a draft run of it is enough to be refused.
  const definition = await client.rpc('create_scenario_definition_version', {
    p_key_hash: sha256(project.adminKey),
    p_scenario_key: 'external-drill',
    p_definition: {
      contractVersion: 1,
      kind: 'resilience',
      targetKey: 'site.probe',
      environment: 'production',
      cohort: 'external',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      limits: { requestCap: 3, concurrencyCap: 1, leaseTtlSeconds: 10 },
      guardrails: { abortAfterFailures: 1, maxErrorRateBasisPoints: 10_000 },
      flag: { key: 'site.external_fault', definitionVersion: flag.version },
    },
    p_reason: 'spec external drill',
    p_external_actor_id: ACTOR,
  })
  expect(definition.error).toBeNull()
  const run = await client.rpc('create_scenario_run', {
    p_key_hash: sha256(project.adminKey),
    p_scenario_version_id: definition.data![0].scenario_version_id,
    p_reason: 'spec external run',
    p_external_actor_id: ACTOR,
  })
  expect(run.error).toBeNull()
  const runId = run.data![0].run_id as string
  const asOf = new Date().toISOString()
  const source = (actor: string) =>
    client.rpc('owner_get_scenario_impact_source', {
      p_project_id: project.projectId,
      p_actor_user_id: actor,
      p_run_id: runId,
      p_as_of: asOf,
    })
  // A member and a stranger are refused at the function, before anything about the run is read.
  // The message, not just the code: the external-cohort refusal below is 42501 too, and must not be what passes here.
  for (const who of [member, stranger]) {
    const refused = await source(who.id)
    expect(refused.error?.code).toBe('42501')
    expect(refused.error?.message).toMatch(/requires project ownership/)
    const recorded = await client.rpc('owner_record_scenario_impact_evidence', {
      p_project_id: project.projectId,
      p_actor_user_id: who.id,
      p_run_id: runId,
      p_evidence: {},
      p_reason: 'spec',
      p_idempotency_key: crypto.randomUUID(),
    })
    expect(recorded.error?.code).toBe('42501')
    expect(recorded.error?.message).toMatch(/requires project ownership/)
  }
  // The owner is refused too, for this run: owner authoring never reaches an external cohort.
  const external = await source(owner.id)
  expect(external.error?.code).toBe('42501')
  expect(external.error?.message).toMatch(/external cohort/)

  // A request role cannot execute either, called with the real arguments so a refusal is EXECUTE being denied.
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  test.skip(!url || !anonKey, 'needs SUPABASE_ANON_KEY to exercise the anon role')
  const anon = createClient(url!, anonKey!, { auth: { persistSession: false } })
  for (const [fn, args] of [
    [
      'owner_get_scenario_impact_source',
      { p_project_id: project.projectId, p_actor_user_id: owner.id, p_run_id: runId, p_as_of: asOf },
    ],
    [
      'owner_record_scenario_impact_evidence',
      {
        p_project_id: project.projectId,
        p_actor_user_id: owner.id,
        p_run_id: runId,
        p_evidence: {},
        p_reason: 'spec',
        p_idempotency_key: crypto.randomUUID(),
      },
    ],
  ] as const) {
    const denied = await anon.rpc(fn, args)
    expect(denied.error?.code, fn).toBe('42501')
    expect(denied.error?.message ?? '', fn).toMatch(/permission denied for function/)
  }
})

test('S1.1 + S1.3: a drill binds to an experiment at define, and its stop captures impact without ever failing', async ({
  request,
}) => {
  test.skip(process.env.SCENARIO_AUTHORING_ENABLED !== 'true', 'the authoring switch is off on this server')
  const client = db()
  const owner = await person(client, 'impact-route-owner')
  const project = await drillProject(request, client, owner)
  const bound = await faultFlag(client, project.projectId, owner.id, 'site.bound_fault')
  const draftOnly = await faultFlag(client, project.projectId, owner.id, 'site.draft_fault')
  const loose = await faultFlag(client, project.projectId, owner.id, 'site.loose_fault')
  const live = await experiment(client, project.projectId, owner.id, `drill_live_${Date.now()}`, bound, true)
  const liveKey = (
    await client.from('experiment_registries').select('key').eq('id', live.experiment_id).single()
  ).data!.key as string
  const draft = await experiment(
    client,
    project.projectId,
    owner.id,
    `drill_draft_${Date.now()}`,
    draftOnly,
    false
  )
  const draftKey = (
    await client.from('experiment_registries').select('key').eq('id', draft.experiment_id).single()
  ).data!.key as string

  const define = (
    scenarioKey: string,
    flag: { key: string; version: number },
    experimentRef?: [string, number]
  ) =>
    post(request, owner.auth, {
      project: project.slug,
      command: 'define',
      scenarioKey,
      targetKey: 'site.probe',
      flagKey: flag.key,
      flagVersion: flag.version,
      ...(experimentRef ? { experimentKey: experimentRef[0], experimentVersion: experimentRef[1] } : {}),
      requestCap: 10,
      concurrencyCap: 1,
      reason: 'spec',
    })

  // S1.1: each wrong reference is refused at define time, naming what is wrong.
  const unknown = await define('bound-drill', { key: 'site.bound_fault', version: bound.version }, [
    'no_such_experiment',
    1,
  ])
  expect(unknown.status()).toBe(400)
  expect(((await unknown.json()) as { error: string }).error).toContain('No experiment `no_such_experiment`')
  const missingVersion = await define('bound-drill', { key: 'site.bound_fault', version: bound.version }, [
    liveKey,
    999,
  ])
  expect(missingVersion.status()).toBe(400)
  expect(((await missingVersion.json()) as { error: string }).error).toContain(`has no version 999`)
  const unboundFlag = await define('bound-drill', { key: 'site.loose_fault', version: loose.version }, [
    liveKey,
    live.version,
  ])
  expect(unboundFlag.status()).toBe(400)
  expect(((await unboundFlag.json()) as { error: string }).error).toContain(
    `is not bound to site.loose_fault@${loose.version}`
  )

  const boundDefine = await define('bound-drill', { key: 'site.bound_fault', version: bound.version }, [
    liveKey,
    live.version,
  ])
  expect(boundDefine.status(), await boundDefine.text()).toBe(200)
  expect(((await boundDefine.json()) as { impactSource: unknown }).impactSource).toEqual({
    key: liveKey,
    definitionVersion: live.version,
  })
  const draftDefine = await define('draft-drill', { key: 'site.draft_fault', version: draftOnly.version }, [
    draftKey,
    draft.version,
  ])
  expect(draftDefine.status(), await draftDefine.text()).toBe(200)
  const plain = await define('plain-drill', { key: 'site.loose_fault', version: loose.version })
  expect(plain.status()).toBe(200)
  expect(((await plain.json()) as { impactSource: unknown }).impactSource).toBeNull()

  // The page lists each fault flag version's bound experiments (D3), so it offers nothing else.
  const view = (await (
    await request.get(`/api/v1/cli/scenarios?project=${project.slug}`, { headers: owner.auth })
  ).json()) as { faultFlags: Array<{ key: string; experiments: Array<{ key: string; version: number }> }> }
  expect(view.faultFlags.find((flag) => flag.key === 'site.bound_fault')?.experiments).toEqual([
    { key: liveKey, version: live.version },
  ])
  expect(view.faultFlags.find((flag) => flag.key === 'site.loose_fault')?.experiments).toEqual([])

  // S1.3, the failure path: a draft experiment has no analysis. The stop still succeeds and says why nothing was kept.
  const failed = await launchAndStop(request, client, owner.auth, project, 'draft-drill')
  expect(failed.body.impact).toEqual({
    state: 'not_captured',
    reason: 'experiment analysis unavailable: lifecycle_unavailable',
  })
  const { data: stoppedRun } = await client
    .from('scenario_runs')
    .select('status')
    .eq('id', failed.runId)
    .single()
  expect(stoppedRun?.status).toBe('stopped')
  expect(
    (await client.from('scenario_impact_evidence').select('id').eq('run_id', failed.runId)).data
  ).toEqual([])

  // An unbound drill's stop says it has no impact source.
  const unbound = await launchAndStop(request, client, owner.auth, project, 'plain-drill')
  expect(unbound.body.impact).toEqual({ state: 'unbound' })

  // S1.3, the success path: the probe's evidence lands during the run, and the stop captures it as of the stop.
  const captured = await launchAndStop(
    request,
    client,
    owner.auth,
    project,
    'bound-drill',
    async (runId, version) => {
      const facts = (['control', 'fault'] as const).map((arm, index) => ({
        project_id: project.projectId,
        user_id: 'scenario-probe',
        event: 'scenario_executed',
        feature_id: 'bound-drill',
        tags: {
          scenario_definition_version: version,
          run_id: runId,
          arm,
          failed: arm === 'fault',
          latency_ms: arm === 'fault' ? 40 : 10,
        },
        context_version: 1,
        subject_type: 'synthetic_probe',
        subject_id: `impact-${arm}-${index}`,
      }))
      expect((await client.from('events').insert(facts)).error).toBeNull()
    }
  )
  expect(captured.body.impact).toMatchObject({ state: 'captured', created: true })
  const evidenceId = (captured.body.impact as { evidenceId: string }).evidenceId
  const { data: stored } = await client
    .from('scenario_impact_evidence')
    .select('actor_user_id, external_actor_id, reason, evidence')
    .eq('id', evidenceId)
    .single()
  expect(stored).toMatchObject({
    actor_user_id: owner.id,
    external_actor_id: null,
    reason: 'Impact captured for a stopped drill.',
    evidence: {
      experiment: { key: liveKey, definitionVersion: live.version },
      technical: {
        control: { attempts: 1, failures: 0, latencyP95Ms: 10 },
        fault: { attempts: 1, failures: 1, latencyP95Ms: 40 },
      },
      claim: { causal: false },
    },
  })

  // The retry is idempotent: the recorded capture comes back, nothing new is written.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retry = await post(request, owner.auth, {
      project: project.slug,
      command: 'capture_impact',
      runId: captured.runId,
      reason: 'spec',
    })
    expect(retry.status()).toBe(200)
    expect(((await retry.json()) as { impact: unknown }).impact).toMatchObject({
      state: 'captured',
      evidenceId,
      created: false,
    })
  }
  expect(
    (await client.from('scenario_impact_evidence').select('id').eq('run_id', captured.runId)).data
  ).toHaveLength(1)

  // The database's own idempotency, below the service's short-circuit: the same key and evidence name the same row,
  // and the same key with a different reason is refused.
  const replay = (reason: string) =>
    client.rpc('owner_record_scenario_impact_evidence', {
      p_project_id: project.projectId,
      p_actor_user_id: owner.id,
      p_run_id: captured.runId,
      p_evidence: stored!.evidence,
      p_reason: reason,
      p_idempotency_key: ownerImpactIdempotencyKey(captured.runId),
    })
  const same = await replay(OWNER_IMPACT_REASON)
  expect(same.error).toBeNull()
  expect(same.data?.[0]).toMatchObject({ evidence_id: evidenceId, created: false })
  expect((await replay('A different reason.')).error?.code).toBe('22023')

  // Tenancy: the owner of ANOTHER project, naming their own project and this project's run, reaches nothing.
  const foreignOwner = await person(client, 'impact-foreign-owner')
  const foreign = await drillProject(request, client, foreignOwner)
  const foreignSource = await client.rpc('owner_get_scenario_impact_source', {
    p_project_id: foreign.projectId,
    p_actor_user_id: foreignOwner.id,
    p_run_id: captured.runId,
    p_as_of: new Date().toISOString(),
  })
  expect(foreignSource.error).toBeNull()
  expect(foreignSource.data).toEqual([])
  const foreignRecord = await client.rpc('owner_record_scenario_impact_evidence', {
    p_project_id: foreign.projectId,
    p_actor_user_id: foreignOwner.id,
    p_run_id: captured.runId,
    p_evidence: stored!.evidence,
    p_reason: OWNER_IMPACT_REASON,
    p_idempotency_key: crypto.randomUUID(),
  })
  expect(foreignRecord.error).toBeNull()
  expect(foreignRecord.data).toEqual([])
  // ...and naming THIS project is refused at ownership, before the run is looked at.
  const borrowed = await client.rpc('owner_get_scenario_impact_source', {
    p_project_id: project.projectId,
    p_actor_user_id: foreignOwner.id,
    p_run_id: captured.runId,
    p_as_of: new Date().toISOString(),
  })
  expect(borrowed.error?.message).toMatch(/requires project ownership/)
  expect(
    (await client.from('scenario_impact_evidence').select('id').eq('run_id', captured.runId)).data
  ).toHaveLength(1)

  // The Miyagi key path still reads the project's evidence, an owner's capture (no external actor) included.
  const keyRead = await request.get('/api/v1/scenarios/impact', {
    headers: { authorization: `Bearer ${project.adminKey}` },
  })
  expect(keyRead.status()).toBe(200)
  expect(((await keyRead.json()) as { evidence: Array<Record<string, unknown>> }).evidence).toEqual([
    expect.objectContaining({ id: evidenceId, runId: captured.runId, externalActorId: null }),
  ])
})

test('S2.1: a plain member reads a run impact in three states, and a stranger cannot', async ({
  request,
}) => {
  test.skip(process.env.SCENARIO_AUTHORING_ENABLED !== 'true', 'the authoring switch is off on this server')
  const client = db()
  const owner = await person(client, 'run-impact-owner')
  const member = await person(client, 'run-impact-member')
  const stranger = await person(client, 'run-impact-stranger')
  const project = await drillProject(request, client, owner)
  await client
    .from('project_members')
    .insert({ project_id: project.projectId, user_id: member.id, role: 'member' })
  const bound = await faultFlag(client, project.projectId, owner.id, 'site.read_bound_fault')
  const draftOnly = await faultFlag(client, project.projectId, owner.id, 'site.read_draft_fault')
  const loose = await faultFlag(client, project.projectId, owner.id, 'site.read_loose_fault')
  const live = await experiment(client, project.projectId, owner.id, `read_live_${Date.now()}`, bound, true)
  const draft = await experiment(
    client,
    project.projectId,
    owner.id,
    `read_draft_${Date.now()}`,
    draftOnly,
    false
  )
  const keyOf = async (id: string) =>
    (await client.from('experiment_registries').select('key').eq('id', id).single()).data!.key as string
  const liveKey = await keyOf(live.experiment_id)
  const draftKey = await keyOf(draft.experiment_id)

  const define = async (
    scenarioKey: string,
    flag: { key: string; version: number },
    experimentRef?: [string, number]
  ) => {
    const response = await post(request, owner.auth, {
      project: project.slug,
      command: 'define',
      scenarioKey,
      targetKey: 'site.probe',
      flagKey: flag.key,
      flagVersion: flag.version,
      ...(experimentRef ? { experimentKey: experimentRef[0], experimentVersion: experimentRef[1] } : {}),
      requestCap: 10,
      concurrencyCap: 1,
      reason: 'spec',
    })
    expect(response.status(), await response.text()).toBe(200)
  }
  await define('read-plain', { key: 'site.read_loose_fault', version: loose.version })
  await define('read-failed', { key: 'site.read_draft_fault', version: draftOnly.version }, [
    draftKey,
    draft.version,
  ])
  await define('read-bound', { key: 'site.read_bound_fault', version: bound.version }, [
    liveKey,
    live.version,
  ])

  const unbound = await launchAndStop(request, client, owner.auth, project, 'read-plain')
  const failed = await launchAndStop(request, client, owner.auth, project, 'read-failed')
  const captured = await launchAndStop(
    request,
    client,
    owner.auth,
    project,
    'read-bound',
    async (runId, version) => {
      const facts = (['control', 'fault'] as const).map((arm, index) => ({
        project_id: project.projectId,
        user_id: 'scenario-probe',
        event: 'scenario_executed',
        feature_id: 'read-bound',
        tags: {
          scenario_definition_version: version,
          run_id: runId,
          arm,
          failed: arm === 'fault',
          latency_ms: arm === 'fault' ? 40 : 10,
        },
        context_version: 1,
        subject_type: 'synthetic_probe',
        subject_id: `read-${arm}-${index}`,
      }))
      expect((await client.from('events').insert(facts)).error).toBeNull()
    }
  )

  const read = (runId: string, auth: Record<string, string>) =>
    request.get(`/api/v1/cli/scenarios?project=${project.slug}&run=${runId}`, { headers: auth })
  const impactOf = async (runId: string) => {
    const response = await read(runId, member.auth)
    expect(response.status(), await response.text()).toBe(200)
    const body = (await response.json()) as {
      project: string
      runId: string
      impact: Record<string, unknown>
    }
    expect(body).toMatchObject({ project: project.slug, runId })
    return body.impact
  }

  expect(await impactOf(unbound.runId)).toEqual({ state: 'unbound' })
  expect(await impactOf(failed.runId)).toEqual({
    state: 'not_captured',
    reason: `no capture recorded — run \`frijoles scenarios impact ${failed.runId} --capture\``,
  })
  expect(await impactOf(captured.runId)).toMatchObject({
    state: 'captured',
    experiment: { key: liveKey, definitionVersion: live.version },
    control: { attempts: 1, failures: 0, latencyP95Ms: 10 },
    treatment: { attempts: 1, failures: 1, latencyP95Ms: 40 },
    claim: { causal: false },
  })

  // Without `run` the read is the list, unchanged; an unknown run is not found; a stranger finds no project.
  const list = (await (
    await request.get(`/api/v1/cli/scenarios?project=${project.slug}`, { headers: member.auth })
  ).json()) as { runs: unknown[] }
  expect(list.runs).toHaveLength(3)
  const unknownRun = await read('00000000-0000-4000-8000-000000000000', member.auth)
  expect(unknownRun.status()).toBe(404)
  expect((await read(captured.runId, stranger.auth)).status()).toBe(404)
})
