// sdk-1-0 D6 — the 0.6.0 surface is frozen: 1.0 only adds (Daniel's gate decision a, 2026-10-09).
//
// The list below is 0.6.0's runtime exports, read from a build of `main` at 0.6.0 (not from memory). A name missing
// here, or a 0.6.0-shaped call that no longer works, is a breaking change and must not ship in 1.x.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
const registerHooks = (Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void })
  .registerHooks
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\/[a-z-]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
})

const sdk = (await import('./index.ts')) as Record<string, unknown>

const SURFACE_0_6_0 = [
  'ERROR_EVENT',
  'EXPERIMENT_METADATA_KEYS',
  'FLAG_CONTEXT_FIELDS',
  'FLAG_CONTRACT_VERSION',
  'FLAG_DEFINITION_SYNC_CONTRACT_VERSION',
  'FLAG_ENVIRONMENTS',
  'FLAG_EVALUATED_EVENT',
  'FLAG_EVALUATION_SEGMENT_FIELDS',
  'FLAG_POLARITIES',
  'MAX_FLAG_CLAUSES',
  'MAX_FLAG_DEFINITION_BYTES',
  'MAX_FLAG_DEFINITION_SYNC_BODY_BYTES',
  'MAX_FLAG_DEFINITION_SYNC_ENTRIES',
  'MAX_FLAG_METADATA_ENTRIES',
  'MAX_FLAG_RULES',
  'MAX_FLAG_VARIANTS',
  'MAX_SCENARIOS_PER_SNAPSHOT',
  'MAX_SCENARIO_ABORT_FAILURES',
  'MAX_SCENARIO_CONCURRENCY_CAP',
  'MAX_SCENARIO_DEFINITION_BYTES',
  'MAX_SCENARIO_DELAY_MS',
  'MAX_SCENARIO_DURATION_SECONDS',
  'MAX_SCENARIO_ERROR_RATE_BASIS_POINTS',
  'MAX_SCENARIO_LEASE_TTL_SECONDS',
  'MAX_SCENARIO_REQUEST_CAP',
  'MAX_SCENARIO_SNAPSHOT_BYTES',
  'OFF_VARIANT_KEY',
  'ON_VARIANT_KEY',
  'SCENARIO_COHORTS',
  'SCENARIO_CONTRACT_VERSION',
  'SCENARIO_EXECUTED_EVENT',
  'SCENARIO_FAULT_KINDS',
  'SCENARIO_KINDS',
  'SCENARIO_SECURITY_TEMPLATES',
  'UNEXPLAINED_DIFF_TEXT',
  'basisPointsToPercent',
  'createFlagDefinitionSyncClient',
  'createFlagProvider',
  'createGrowthEngineClient',
  'createScenarioProvider',
  'defaultServedValue',
  'describeFlagClause',
  'diffFlagDefinitions',
  'evaluateFlag',
  'evaluateScenario',
  'experimentForResolution',
  'explainFlagEvaluation',
  'formatRolloutPercent',
  'isFlagDefinitionSyncBodyWithinLimit',
  'isFlagEnvironment',
  'normalizeEnvironments',
  'parseFlagDefinition',
  'parseFlagDefinitionSyncRequest',
  'parseFlagSnapshot',
  'parseScenarioDefinition',
  'parseScenarioFault',
  'parseScenarioSnapshot',
  'percentToBasisPoints',
  'planFlagCreate',
  'planFlagKill',
  'planFlagRollout',
  'planFlagRules',
  'planFlagSet',
  'planTypedFlagCreate',
  'rolloutBarPercent',
  'validateFlagKey',
]

const CLIENT_METHODS_0_6_0 = [
  'track',
  'trackAdoption',
  'syncFeatures',
  'bucket',
  'trackExposure',
  'trackFlagEvaluation',
  'trackScenarioExecution',
  'captureError',
  'captureGlobalErrors',
]

test('every 0.6.0 export is still exported (the scenario API included)', () => {
  assert.equal(SURFACE_0_6_0.length, 66)
  const missing = SURFACE_0_6_0.filter((name) => !(name in sdk))
  assert.deepEqual(missing, [])
})

test('every 0.6.0 client method is still there, and a 0.6.0-shaped call sends the same request', async () => {
  const seen: { url: string; body: unknown; auth: string }[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    seen.push({
      url,
      body: JSON.parse(String(init.body)),
      auth: (init.headers as Record<string, string>).Authorization,
    })
    return new Response(JSON.stringify({ ok: true, id: 'evt_1' }), { status: 200 })
  }) as unknown as typeof fetch
  const create = sdk.createGrowthEngineClient as (c: object) => Record<string, (...a: unknown[]) => unknown>
  const growth = create({ baseUrl: 'https://growth.example.com', apiKey: 'key', userId: 'user-1', fetchImpl })
  for (const method of CLIENT_METHODS_0_6_0) assert.equal(typeof growth[method], 'function', method)
  assert.deepEqual(await growth.track('checkout_completed', { featureId: 'checkout' }), {
    ok: true,
    id: 'evt_1',
  })
  assert.deepEqual(seen[0], {
    url: 'https://growth.example.com/api/v1/track',
    body: { userId: 'user-1', event: 'checkout_completed', featureId: 'checkout' },
    auth: 'Bearer key',
  })
  const variant = growth.bucket('exp', [{ key: 'a' }, { key: 'b' }]) as { ok: boolean }
  assert.equal(variant.ok, true)
})

// Verifier, #331: 0.6.0 read config.baseUrl and config.userId on every call. These shapes worked then and must still
// reach the caller's own URL, never the default.
function recorder() {
  const urls: string[] = []
  const bodies: unknown[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    urls.push(url)
    bodies.push(JSON.parse(String(init.body)))
    return new Response(JSON.stringify({ ok: true, id: 'e' }), { status: 200 })
  }) as unknown as typeof fetch
  return { urls, bodies, fetchImpl }
}
const create = sdk.createGrowthEngineClient as (
  c: object
) => Record<string, (...a: unknown[]) => Promise<unknown>>

test("0.6.0 shapes: a baseUrl getter on a class instance is the caller's URL", async () => {
  const r = recorder()
  class Config {
    apiKey = 'k'
    userId = 'u'
    fetchImpl = r.fetchImpl
    get baseUrl() {
      return 'http://staging.internal'
    }
  }
  await create(new Config()).track('e')
  assert.equal(r.urls[0], 'http://staging.internal/api/v1/track')
})

test("0.6.0 shapes: an inherited baseUrl is the caller's URL, for the client and the flag provider", async () => {
  const r = recorder()
  const config = Object.assign(Object.create({ baseUrl: 'http://staging.internal' }), {
    apiKey: 'k',
    userId: 'u',
    fetchImpl: r.fetchImpl,
  })
  await create(config).track('e')
  assert.equal(r.urls[0], 'http://staging.internal/api/v1/track')

  const snapshotUrls: string[] = []
  const providerConfig = Object.assign(Object.create({ baseUrl: 'http://staging.internal' }), {
    flagReadKey: 'read',
    refreshIntervalMs: 0,
    fetchImpl: async (input: unknown) => {
      snapshotUrls.push(String(input))
      return new Response(null, { status: 500 })
    },
  })
  const provider = (sdk.createFlagProvider as (c: object) => { initialize(): Promise<unknown> })(
    providerConfig
  )
  await provider.initialize()
  assert.equal(snapshotUrls[0], 'http://staging.internal/api/v1/flags/snapshot')
})

test('0.6.0 shapes: a config filled in after the client is created is read when the call is made', async () => {
  const r = recorder()
  const config: Record<string, unknown> = {
    apiKey: 'k',
    fetchImpl: r.fetchImpl,
    baseUrl: undefined,
    userId: undefined,
  }
  const growth = create(config)
  config.baseUrl = 'http://localhost:3000'
  config.userId = 'late-user'
  await growth.track('e')
  assert.equal(r.urls[0], 'http://localhost:3000/api/v1/track')
  assert.equal((r.bodies[0] as { userId: string }).userId, 'late-user')
})

test('identify overrides config.userId, and reset forgets both until the next identify', async () => {
  const r = recorder()
  const growth = create({ apiKey: 'k', userId: 'from-config', fetchImpl: r.fetchImpl }) as Record<
    string,
    (...a: unknown[]) => unknown
  >
  growth.identify('signed-in')
  await growth.track('e')
  growth.reset()
  const after = (await growth.track('e')) as { ok: boolean; code?: string }
  assert.equal((r.bodies[0] as { userId: string }).userId, 'signed-in')
  assert.equal(after.code, 'NO_USER')
  assert.equal(r.bodies.length, 1)
})
