import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGrowthEngineClient } from '@golden-frijoles/sdk'
import {
  PROBE_ACTOR,
  createProbeGrowthClient,
  PROBE_MAX_DELAY_MS,
  engineBaseConfig,
  isSyntheticSubject,
  probeEnvironment,
  runScenarioProbe,
} from './scenario-probe.ts'

const RUN = '11111111-1111-4111-8111-111111111111'

function fakeProvider(
  fault:
    | { kind: 'none' }
    | { kind: 'delay'; delayMs: number }
    | { kind: 'synthetic_error'; errorCode: 'GB_RESILIENCE_503' },
  opts: { active?: boolean; admitted?: boolean } = {}
) {
  const calls: string[] = []
  const provider = {
    refresh: async () => {
      calls.push('refresh')
      return { ok: true } as never
    },
    resolveScenario: (targetKey: string, context: { targetingKey?: string }) => {
      calls.push(`resolve:${targetKey}:${context.targetingKey}`)
      return opts.active === false
        ? { value: { kind: 'none' as const }, reason: 'TARGET_MISMATCH' as const }
        : {
            value: fault,
            reason: fault.kind === 'none' ? ('CONTROL' as const) : ('MATCH' as const),
            scenarioKey: 'site-delay',
            scenarioVersion: 1,
            runId: RUN,
            runRevision: 2,
            variant: fault.kind === 'none' ? 'control' : 'fault',
            cohort: 'synthetic' as const,
          }
    },
    reserveExecution: async () => {
      calls.push('reserve')
      return opts.admitted === false
        ? ({
            ok: true,
            operation: 'reserve',
            leaseId: null,
            runRevision: 2,
            expiresAt: null,
            admitted: false,
            reason: 'REQUEST_CAP',
          } as const)
        : ({
            ok: true,
            operation: 'reserve',
            leaseId: 'lease-1',
            runRevision: 2,
            expiresAt: 'x',
            admitted: true,
            reason: 'ADMITTED',
          } as const)
    },
    settleExecution: async (_run: string, _lease: string, succeeded: boolean) => {
      calls.push(`settle:${succeeded}`)
      return { ok: true } as never
    },
    getSnapshot: () =>
      ({
        revision: 7,
        scenarios: [{ runId: RUN, flag: { key: 'ops.site_fault', definitionVersion: 3 } }],
      }) as never,
  }
  return { provider, calls }
}

function deps(
  provider: ReturnType<typeof fakeProvider>['provider'],
  tracked: unknown[] = [],
  slept: number[] = []
) {
  let clock = 0
  return {
    provider,
    track: async (input: unknown) => {
      tracked.push(input)
    },
    sleep: async (ms: number) => {
      slept.push(ms)
      clock += ms
    },
    now: () => clock,
  }
}

const input = { targetKey: 'site.probe', subject: 'synthetic:drill-1', environment: 'production' as const }

test('a delay fault is applied (capped), settled as a success, and recorded as the fault arm', async () => {
  const { provider, calls } = fakeProvider({ kind: 'delay', delayMs: 60_000 })
  const tracked: Array<Record<string, unknown>> = []
  const slept: number[] = []
  const result = await runScenarioProbe(deps(provider, tracked, slept), input)
  assert.deepEqual(slept, [PROBE_MAX_DELAY_MS])
  assert.equal(result.arm, 'fault')
  assert.equal(result.status, 200)
  assert.deepEqual(calls, ['refresh', 'resolve:site.probe:synthetic:drill-1', 'reserve', 'settle:true'])
  assert.equal(tracked.length, 1)
  assert.equal(tracked[0].leaseId, 'lease-1')
  assert.deepEqual(tracked[0].subject, { type: 'synthetic_probe', id: 'drill-1' })
  assert.equal((tracked[0].flag as { snapshotVersion: number }).snapshotVersion, 7)
})

test('a synthetic error answers 503 and settles as a failure', async () => {
  const { provider, calls } = fakeProvider({ kind: 'synthetic_error', errorCode: 'GB_RESILIENCE_503' })
  const result = await runScenarioProbe(deps(provider), input)
  assert.equal(result.status, 503)
  assert.ok(calls.includes('settle:false'))
})

test('the control arm applies nothing and still settles and records', async () => {
  const { provider, calls } = fakeProvider({ kind: 'none' })
  const tracked: unknown[] = []
  const slept: number[] = []
  const result = await runScenarioProbe(deps(provider, tracked, slept), input)
  assert.equal(result.arm, 'control')
  assert.deepEqual(slept, [])
  assert.ok(calls.includes('settle:true'))
  assert.equal(tracked.length, 1)
})

test('no active run, or not admitted: idle, nothing applied, nothing settled or recorded', async () => {
  for (const opts of [{ active: false }, { admitted: false }]) {
    const { provider, calls } = fakeProvider({ kind: 'delay', delayMs: 100 }, opts)
    const tracked: unknown[] = []
    const slept: number[] = []
    const result = await runScenarioProbe(deps(provider, tracked, slept), input)
    assert.equal(result.arm, 'idle')
    assert.deepEqual(slept, [])
    assert.equal(tracked.length, 0)
    assert.ok(!calls.some((call) => call.startsWith('settle')))
  }
})

test('a subject that is not synthetic never reaches the provider', async () => {
  const { provider, calls } = fakeProvider({ kind: 'delay', delayMs: 100 })
  for (const subject of ['user:42', 'synthetic:', 'synthetic: spaced', 'Synthetic:x']) {
    const result = await runScenarioProbe(deps(provider), { ...input, subject })
    assert.equal(result.arm, 'idle')
    assert.equal(isSyntheticSubject(subject), false)
  }
  assert.deepEqual(calls, [])
})

test('the environment follows Vercel, and anything else is development', () => {
  assert.equal(probeEnvironment('production'), 'production')
  assert.equal(probeEnvironment('preview'), 'preview')
  assert.equal(probeEnvironment(undefined), 'development')
})

test('with no GOLDEN_FRIJOLES_URL the SDK config has NO baseUrl key, so the SDK uses its default engine', async () => {
  // The SDK's rule: `'baseUrl' in config` with an empty value means "not configured" (S2.3's production failure).
  const { resolveBaseUrl } = await import('../../../packages/sdk/src/defaults.ts')
  for (const unset of [undefined, '', '   ']) {
    assert.equal('baseUrl' in engineBaseConfig(unset), false)
    assert.equal(resolveBaseUrl(engineBaseConfig(unset)), 'https://goldenfrijoles.com')
  }
  assert.deepEqual(engineBaseConfig(' http://127.0.0.1:3120 '), { baseUrl: 'http://127.0.0.1:3120' })
})

// drill-impact-for-agents D9 — the fake `track` above cannot see what the REAL client does with the probe's input, and
// that is where every golden-frijoles drill's evidence was lost (NO_USER, swallowed). Drive the real SDK client, built
// the way the probe route builds it, and watch the request leave.
test("the probe route's real SDK client sends scenario_executed (it reports as PROBE_ACTOR)", async () => {
  const posted: Array<{ url: string; body: Record<string, unknown> }> = []
  const fetchImpl = (async (url: string, init?: { body?: string }) => {
    posted.push({ url, body: JSON.parse(init?.body ?? '{}') })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }) as unknown as typeof fetch
  const telemetry = {
    scenarioKey: 'site-delay',
    scenarioVersion: 1,
    runId: '062daf1b-6475-4be5-8fde-c4712c6a553e',
    runRevision: 2,
    leaseId: '3ba6bd9f-f17b-48bd-8bad-67d2ec875b59',
    targetKey: 'site.probe',
    cohort: 'synthetic' as const,
    environment: 'production' as const,
    arm: 'fault' as const,
    faultKind: 'delay' as const,
    failed: false,
    latencyMs: 1502,
    subject: { type: 'synthetic_probe', id: 'drill-1760000000000-3' },
    flag: {
      key: 'site.drill_fault',
      definitionVersion: 2,
      variant: 'fault',
      reason: 'MATCH',
      snapshotVersion: 12,
    },
  }
  // Without a user the SDK refuses before any request: the failure the probe used to swallow.
  const anonymous = createGrowthEngineClient({
    apiKey: 'gb_key_spec',
    baseUrl: 'https://engine.test',
    fetchImpl,
  })
  assert.equal((await anonymous.trackScenarioExecution(telemetry)).ok, false)
  assert.equal(posted.length, 0)

  // The probe route builds its client with exactly this helper, so removing its user fails here.
  const client = createProbeGrowthClient('gb_key_spec', { baseUrl: 'https://engine.test' }, fetchImpl)
  assert.equal((await client.trackScenarioExecution(telemetry)).ok, true)
  const executed = posted.find((request) => request.body.event === 'scenario_executed')
  assert.ok(
    executed,
    `no scenario_executed POST among ${posted.map((request) => request.body.event).join(', ')}`
  )
  assert.equal(executed.body.user_id ?? executed.body.userId, PROBE_ACTOR)
})
