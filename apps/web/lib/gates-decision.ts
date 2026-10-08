// one-product-project · Sprint 2, Story 2.1 — the gate table and the rule that resolves a gate. Pure: no imports, so
// the unit layer and the Playwright process can both read it without a database or a server-only module.
//
// ── What changed, and why it is not a redesign ────────────────────────────────────────────────
// Every gate in lib/flags.ts used to be a Vercel env var. Changing one took a Vercel edit AND a commit to main (env
// is snapshotted at build — AGENTS rule #4), it was invisible in the flag console, and six production values were
// sensitive-masked so nobody could read them back. The gates now live where the product says flags live: Golden
// Frijoles' own catalog, in the one project (`golden-frijoles`, epic D1/D3). `gf flags kill <key>` is the switch.
//
// The epic README's gate table is the record of each key's production value on 2026-10-08 (the masked ones read from
// live behaviour). `fallback` below IS that value (D5): what a gate serves when the catalog cannot answer — the read
// failed, the flag was never activated in this environment, or a preview has no database. A catalog outage
// therefore changes nothing anyone can see, which an env var could promise and a database read must earn.
//
// ── Off Vercel, the old env var still wins (D6) ───────────────────────────────────────────────
// CI boots two servers against one database, one with every gate ON and one with every gate OFF (ci/gates.*.env).
// One catalog cannot serve both, so off Vercel a SET env var overrides — `'true'` is on, any other value is off,
// exactly the old `=== 'true'` contract. ON Vercel the env is never read: a leftover Vercel var cannot become a
// second source of truth (and S3.2 deletes them all).

/**
 * The project whose catalog holds the product's gates: Golden Frijoles' own (D1). A constant, NOT
 * `DEMO_PROJECT_SLUG`/`SELF_PROJECT_SLUG`: one env var must not be able to hand every gate to another project's
 * catalog (cross-family review of #319, Codex). The slug is reserved (lib/tenant-slug.ts), so no tenant can take it.
 */
export const GATE_CATALOG_PROJECT_SLUG = 'golden-frijoles'

export type FlagEnvironmentName = 'development' | 'preview' | 'production'

export type Gate = {
  /** The flag's key in the `golden-frijoles` catalog. */
  readonly key: string
  /** The env var it replaced — honoured only off Vercel (D6). `null`: the gate was never an env var. */
  readonly envVar: string | null
  /** Served when the catalog cannot answer (D5) — the production value on the day it moved. */
  readonly fallback: boolean
}

/** The shape of `CliFlagView['environments'][number]` this rule reads — nothing more. */
export type ServedEnvironment = { environment: string; serving: unknown; readable: boolean; state?: string }

/** flag key → what each environment serves. `null` = the catalog could not be read. */
export type ServedCatalog = ReadonlyMap<string, readonly ServedEnvironment[]> | null

export const GATES = {
  signup: { key: 'auth.signup_enabled', envVar: 'SIGNUP_ENABLED', fallback: true },
  terminalSignIn: { key: 'auth.terminal_sign_in_enabled', envVar: null, fallback: true },
  connector: { key: 'connector.mcp_enabled', envVar: 'CONNECTOR_ENABLED', fallback: true },
  connectorWrites: { key: 'connector.writes_enabled', envVar: 'CONNECTOR_WRITES_ENABLED', fallback: true },
  destinationDelivery: {
    key: 'delivery.destinations_enabled',
    envVar: 'DESTINATION_DELIVERY_ENABLED',
    fallback: false,
  },
  journeyProjections: {
    key: 'journeys.projections_enabled',
    envVar: 'JOURNEY_PROJECTIONS_ENABLED',
    fallback: true,
  },
  experimentGovernance: {
    key: 'experiments.governance_enabled',
    envVar: 'EXPERIMENT_GOVERNANCE_ENABLED',
    fallback: true,
  },
  experimentBuilder: {
    key: 'experiments.builder_enabled',
    envVar: 'EXPERIMENT_BUILDER_ENABLED',
    fallback: true,
  },
  reportShares: { key: 'reports.shares_enabled', envVar: 'REPORT_SHARES_ENABLED', fallback: true },
  signals: { key: 'signals.loop_enabled', envVar: 'SIGNALS_ENABLED', fallback: true },
  flagDefinitionSync: {
    key: 'flags.definition_sync_enabled',
    envVar: 'FLAG_DEFINITION_SYNC_ENABLED',
    fallback: true,
  },
  flagRuleBuilder: { key: 'flags.rule_builder_enabled', envVar: 'FLAG_RULE_BUILDER_ENABLED', fallback: true },
  flagConsole: { key: 'flags.console_enabled', envVar: 'FLAG_CONSOLE_ENABLED', fallback: true },
  resilienceScenarios: {
    key: 'ops.resilience_scenarios_enabled',
    envVar: 'RESILIENCE_SCENARIOS_ENABLED',
    fallback: false,
  },
  securitySimulations: {
    key: 'ops.security_simulations_enabled',
    envVar: 'SECURITY_SIMULATIONS_ENABLED',
    fallback: false,
  },
  automaticCircuitBreakers: {
    key: 'ops.automatic_circuit_breakers_enabled',
    envVar: 'AUTOMATIC_CIRCUIT_BREAKERS_ENABLED',
    fallback: false,
  },
  scenarioAuthoring: {
    key: 'ops.scenario_authoring_enabled',
    envVar: 'SCENARIO_AUTHORING_ENABLED',
    fallback: false,
  },
  agentRail: { key: 'console.agent_rail_enabled', envVar: 'AGENT_RAIL_ENABLED', fallback: true },
} as const satisfies Record<string, Gate>

export type GateName = keyof typeof GATES

/** `VERCEL_ENV` → the flag environment this deployment evaluates in. */
export function flagEnvironmentFor(vercelEnv: string | undefined): FlagEnvironmentName {
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'development'
}

/** Whether this process runs on Vercel. Vercel sets `VERCEL=1` at build and at runtime. */
export function isOnVercel(env: Readonly<Record<string, string | undefined>>): boolean {
  return env.VERCEL === '1'
}

/** The off-Vercel override (D6): `undefined` when it does not apply, else the old `=== 'true'` reading. */
export function envOverride(
  gate: Gate,
  env: Readonly<Record<string, string | undefined>>
): boolean | undefined {
  if (isOnVercel(env) || gate.envVar === null) return undefined
  const raw = env[gate.envVar]
  return raw === undefined ? undefined : raw === 'true'
}

/**
 * The catalog's answer for one gate in one environment.
 * - A served boolean is the answer. `gf flags kill` serves `false`, so a kill always lands.
 * - DEACTIVATED (`state: 'off'`) is OFF. That is what the console's off switch does (`deactivateFlagAction`), and an
 *   operator who switched a gate off must never find it still on because "nothing served" fell back to a
 *   born-ON default (cross-family review of #319, Codex).
 * - Anything else — the catalog unreadable, the flag absent, never activated here, a corrupt row, a non-boolean — is
 *   not an answer, and the gate serves its fallback.
 */
export function servedValue(gate: Gate, catalog: ServedCatalog, environment: FlagEnvironmentName): boolean {
  const row = catalog?.get(gate.key)?.find((candidate) => candidate.environment === environment)
  if (row?.state === 'off') return false
  if (!row || !row.readable || typeof row.serving !== 'boolean') return gate.fallback
  return row.serving
}

export function resolveGate(
  gate: Gate,
  catalog: ServedCatalog,
  env: Readonly<Record<string, string | undefined>>
): boolean {
  return envOverride(gate, env) ?? servedValue(gate, catalog, flagEnvironmentFor(env.VERCEL_ENV))
}

/**
 * Whether a catalog read that STARTED at `startedAt` may replace the one kept from `keptStartedAt`. Reads can finish
 * out of order (one stalls past its timeout and answers later); an older read must never overwrite a newer one, or a
 * kill that already landed would quietly turn back on (fresh review of #319, round 3).
 */
export function mayReplaceCatalog(startedAt: number, keptStartedAt: number): boolean {
  return startedAt >= keptStartedAt
}

export type CatalogCacheOptions = {
  /** How long one read answers every gate. Bounds how long `gf flags kill` takes to land. */
  cacheMs?: number
  /** A read that has not answered in this long counts as failed: an env var could never hang a request, and a stalled
   * database must not either (fresh review of #319). */
  timeoutMs?: number
  now?: () => number
  onMiss?: () => void
}

/**
 * One read of the whole catalog per `cacheMs`, shared by every gate. A failed, slow or stale read keeps serving the
 * LAST GOOD catalog (so one bad read cannot re-open a killed gate); a read that answers after its timeout still lands
 * for the next request; an older read never replaces a newer one (`mayReplaceCatalog`). The fallbacks answer only
 * before any read has succeeded. Pure: the reader and the clock are injected (cross-family review of #319, Codex).
 */
export function createCatalogCache(
  read: () => Promise<ServedCatalog>,
  { cacheMs = 30_000, timeoutMs = 1_500, now = Date.now, onMiss = () => {} }: CatalogCacheOptions = {}
): () => Promise<ServedCatalog> {
  let cached: { at: number; catalog: Promise<ServedCatalog> } | null = null
  let lastGood: ServedCatalog = null
  let lastGoodStartedAt = -Infinity

  const keep = (served: ServedCatalog, startedAt: number): boolean => {
    if (!served || !mayReplaceCatalog(startedAt, lastGoodStartedAt)) return false
    lastGood = served
    lastGoodStartedAt = startedAt
    return true
  }

  return () => {
    if (cached && now() - cached.at < cacheMs) return cached.catalog
    const startedAt = now()
    const fresh = read().catch((): ServedCatalog => null)
    void fresh.then((served) => {
      if (keep(served, startedAt)) cached = { at: now(), catalog: Promise.resolve(served) }
    })
    const timeout = new Promise<ServedCatalog>((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs) as { unref?: () => void }
      timer.unref?.()
    })
    const answer = Promise.race([fresh, timeout]).then((served) => {
      if (!keep(served, startedAt)) onMiss()
      return lastGood
    })
    cached = { at: now(), catalog: answer }
    return answer
  }
}
