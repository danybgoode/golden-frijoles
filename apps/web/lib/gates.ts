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
// `gf flags kill` takes to land. A failed read is cached too (serving the last good catalog), so an outage costs one
// query per 30 s, not one per request.

import { envOverride, resolveGate, type Gate, type ServedCatalog } from './gates-decision'

const CACHE_MS = 30_000
// A catalog read that has not answered in this long counts as failed. An env var could never hang a request; a
// stalled database must not either (fresh review of #319).
const READ_TIMEOUT_MS = 1_500
let cached: { at: number; catalog: Promise<ServedCatalog> } | null = null
// The last catalog that WAS read. A failed or slow read keeps serving it rather than dropping every gate to its
// fallback, so one bad read cannot re-open a gate an operator killed (fresh review of #319). The fallbacks answer
// only before any read has succeeded in this process.
let lastGood: ServedCatalog = null

function timeout(): Promise<ServedCatalog> {
  return new Promise((resolve) => setTimeout(() => resolve(null), READ_TIMEOUT_MS).unref?.())
}

function catalog(): Promise<ServedCatalog> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.catalog
  // readServedCatalog never throws; the catch covers the import itself failing, so a gate always answers.
  const fresh = import('./gates-catalog')
    .then((module) => module.readServedCatalog())
    .catch((err: unknown): ServedCatalog => {
      console.error('[gates] catalog reader failed to load:', err)
      return null
    })
  // A read that answers AFTER the timeout still lands: it becomes the last good catalog and the cached answer, so a
  // slow database delays a kill by one request, not by the whole 30 s window (fresh review of #319, round 2).
  void fresh.then((served) => {
    if (!served) return
    lastGood = served
    cached = { at: Date.now(), catalog: Promise.resolve(served) }
  })
  const read = Promise.race([fresh, timeout()]).then((served) => {
    if (served) lastGood = served
    else
      console.error(
        '[gates] catalog read failed or timed out; serving the last good catalog or the fallbacks'
      )
    return served ?? lastGood
  })
  cached = { at: Date.now(), catalog: read }
  return read
}

export async function gate(gate: Gate): Promise<boolean> {
  // The override answers without a database round-trip — the CI and local path (D6).
  const override = envOverride(gate, process.env)
  if (override !== undefined) return override
  return resolveGate(gate, await catalog(), process.env)
}

/** Test seam: forget the cached catalog. */
export function resetGateCacheForTests(): void {
  cached = null
}
