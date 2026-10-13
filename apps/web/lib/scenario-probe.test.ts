import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PROBE_MAX_DELAY_MS,
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
