// one-product-project · Sprint 2, Story 2.1 — the ONE seam every gate is read through. The table and the rule are
// pure (lib/gates-decision.ts); this file only fetches what the catalog serves.
//
// Deliberately NOT `import 'server-only'`, for the reason lib/flags.ts gives: the Playwright process imports the
// gates to decide which suites run, and there the off-Vercel override always answers (D6). The database reader is
// imported lazily, only when a gate actually has to ask the catalog, so that process never loads it.
//
// ── The cache ─────────────────────────────────────────────────────────────────────────────────
// One read of the whole catalog per process per 30 s, shared by every gate (one query, not nineteen). A gate is a
// single GLOBAL fact, not tenant data, so sharing it across requests leaks nothing. 30 s bounds how long a
// `frijoles flags kill` takes to land. A failed read is cached too (serving the last good catalog), so an outage costs one
// query per 30 s, not one per request.

import {
  createCatalogCache,
  envOverride,
  flagEnvironmentFor,
  resolveGate,
  type Gate,
  type ServedCatalog,
} from './gates-decision'
import { EXPERIMENT_FLAGS, resolveVariant, type ExperimentFlagName, type VariantAnswer } from './variant-decision'

// The cache's rules (30 s, a 1.5 s bound, keep the last good catalog, an older read never wins) live in the pure
// `createCatalogCache` so they are unit-tested; this file only supplies the database reader.
const catalog = createCatalogCache(
  () =>
    // readServedCatalog never throws; the catch covers the import itself failing, so a gate always answers.
    import('./gates-catalog')
      .then((module) => module.readServedCatalog())
      .catch((err: unknown): ServedCatalog => {
        console.error('[gates] catalog reader failed to load:', err)
        return null
      }),
  {
    onMiss: () =>
      console.error(
        '[gates] catalog read failed, timed out or was stale; serving the last good catalog or the fallbacks'
      ),
  }
)

export async function gate(gate: Gate): Promise<boolean> {
  // The override answers without a database round-trip — the CI and local path (D6).
  const override = envOverride(gate, process.env)
  if (override !== undefined) return override
  return resolveGate(gate, await catalog(), process.env)
}

/**
 * landing-launch-experiment D1 — which side of an A/B test one visitor is on, through the SAME catalog read and 30 s
 * cache as every gate, so `frijoles flags kill` reaches a test exactly as fast as it reaches a gate. Evaluated with the
 * visitor id as the targeting key: the same visitor gets the same answer for as long as the served version stands.
 *
 * Never emits an event. The exposure is written by the beacon (D3), which calls this again from the cookie: a page
 * render that wrote exposures would count every crawler and every prefetch as a person in the experiment.
 *
 * No off-Vercel override: a test arm is not a gate a CI server must pin, and A is what an unread catalog serves.
 */
export async function variant(name: ExperimentFlagName, visitorId: unknown): Promise<VariantAnswer> {
  const environment = flagEnvironmentFor(process.env.VERCEL_ENV)
  const row = (await catalog())?.get(EXPERIMENT_FLAGS[name].key)?.find((r) => r.environment === environment)
  return resolveVariant(row, visitorId)
}
