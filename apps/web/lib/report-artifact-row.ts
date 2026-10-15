// owed-on-screen D5 — a `report_artifacts` row as the app reads it, and the strip that keeps owed checks off it. ZERO
// IMPORTS, so `report-artifact-row.test.ts` asserts the strip rather than trusting it: `lib/report-artifacts.ts` imports
// `server-only` and cannot be loaded by a plain test runner.
//
// ── Why the strip lives at the read seam ───────────────────────────────────────────────────────────────────────
// The public project's roadmap is public (AGENTS rule #2), and ten readers serialize parts of its payload: the hub
// pages, the connector, the CLI, the share link, the portfolio, finops, the pod report. Asking each one to drop `owed`
// is ten places to forget. Every read in `lib/report-artifacts.ts` maps its row through here with `keepOwed: false`,
// except the one raw read (`getLatestRoadmapWithOwed`, D6), which has two registered callers.

export type ReportArtifact<T = unknown> = {
  id: string
  version: number
  schemaVersion: number
  payload: T
  sourceCommit: string | null
  sourceRef: string | null
  generatedAt: string
  createdAt: string
}

export type ReportArtifactRow = {
  id: string
  version: number
  schema_version: number
  payload: unknown
  source_commit: string | null
  source_ref: string | null
  generated_at: string
  created_at: string
}

/**
 * The artifact for one row. Owed checks are REMOVED unless `keepOwed` — which only `getLatestRoadmapWithOwed` passes
 * (a closed registry, `owed-read-registry.test.ts`). Required, not defaulted, so every caller states which it is.
 */
export function artifactFromRow<T>(
  row: ReportArtifactRow,
  { keepOwed }: { keepOwed: boolean }
): ReportArtifact<T> {
  return {
    id: row.id,
    version: row.version,
    schemaVersion: row.schema_version,
    payload: (keepOwed ? row.payload : withoutOwed(row.payload)) as T,
    sourceCommit: row.source_commit,
    sourceRef: row.source_ref,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  }
}

/** The payload keys that carry owed checks. `owed_unattached` was the seed's name; dropped too, should a pusher send it. */
export const OWED_PAYLOAD_KEYS = ['owed', 'owed_unattached'] as const

/**
 * A roadmap payload with every owed key removed, top level and on every row (a hand-written push could put one on a
 * row: rows are `.passthrough()`). Returns a new object; never mutates what it was given. Anything not an object is
 * returned as it was.
 */
export function withoutOwed<T>(payload: T): T {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return payload
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if ((OWED_PAYLOAD_KEYS as readonly string[]).includes(key)) continue
    out[key] = key === 'items' && Array.isArray(value) ? value.map((row) => withoutOwed(row)) : value
  }
  return out as T
}
