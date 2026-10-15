import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { artifactFromRow, type ReportArtifact } from './report-artifact-row'

export type { ReportArtifact } from './report-artifact-row'

// pod-report · Sprint 1, Story 1.1 — the read side of the rendering primitive.
//
// Every hub view (journey, drill-down, horizon) renders THE LATEST artifact for a tenant, and they
// all come through here. One read path, one place where the tenant scope is applied — the same
// reasoning as lib/{tars,north-star,ab}-query.ts being the canonical reads instead of each page
// querying `events` ad hoc (AGENTS rule #1).

export type ReportArtifactKind = 'roadmap' | 'pod_report'

/**
 * The latest artifact of `kind` for `projectId`, or null when the tenant has never pushed one.
 *
 * `projectId` is REQUIRED and is always resolved server-side by the caller — from the request's
 * hashed API key, or from an allow-listed slug. It is never taken from a request body (AGENTS: no
 * request-derived read path may cross projects). Passing it explicitly rather than reading ambient
 * state is what makes that reviewable at every call site.
 *
 * Returns exactly `payload` and nothing derived, which is what makes the migration's single write
 * cap on `payload` sufficient: write-accept implies read-accept by construction, with no second
 * bound to drift out of step (Roadmap/LEARNINGS.md — the two-layer measurement trap).
 *
 * One thing is taken OUT, never added: a roadmap's owed checks (owed-on-screen D5). They are member-only and this read
 * serves public pages too; `getLatestRoadmapWithOwed` below is the one way to them.
 */
export async function getLatestArtifact<T = unknown>(
  projectId: string,
  kind: ReportArtifactKind
): Promise<ReportArtifact<T> | null> {
  return readLatestArtifact<T>(projectId, kind, { keepOwed: false })
}

/**
 * ⚠️ owed-on-screen D6 — the latest roadmap artifact WITH its owed checks: the only read that returns them. Every other
 * read strips them (`withoutOwed`, D5), because the public project's roadmap is public and owed checks are member-only.
 *
 * A CLOSED registry of callers, pinned by `owed-read-registry.test.ts`: the push route (its unchanged-board compare must
 * see `owed`) and `lib/owed-read.ts` (behind the member gate). A third caller turns that spec red — route it through
 * `getOwedForViewer` instead.
 */
export async function getLatestRoadmapWithOwed<T = unknown>(
  projectId: string
): Promise<ReportArtifact<T> | null> {
  return readLatestArtifact<T>(projectId, 'roadmap', { keepOwed: true })
}

async function readLatestArtifact<T>(
  projectId: string,
  kind: ReportArtifactKind,
  options: { keepOwed: boolean }
): Promise<ReportArtifact<T> | null> {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from('report_artifacts')
    .select('id, version, schema_version, payload, source_commit, source_ref, generated_at, created_at')
    .eq('project_id', projectId)
    .eq('kind', kind)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[report-artifacts] read failed:', error)
    // A read failure and "nothing pushed yet" must NOT look the same to the caller: the hub renders
    // a deliberate, friendly empty state for the second, and that empty state would otherwise mask
    // a broken database as "no data yet" — a zero that pages nobody (Roadmap/LEARNINGS.md).
    throw new Error('Failed to read report artifact')
  }
  if (!data) return null
  return artifactFromRow<T>(data, options)
}

/**
 * outcome-report-v2 D8 — the latest artifact of `kind` generated strictly before `beforeIso`, or null when there is
 * none. The same project scoping and the same throw-on-failure contract as `getLatestArtifact`; How fast reads the
 * latest version of each of the two previous months through it.
 */
export async function getLatestArtifactBefore<T = unknown>(
  projectId: string,
  kind: ReportArtifactKind,
  beforeIso: string
): Promise<ReportArtifact<T> | null> {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from('report_artifacts')
    .select('id, version, schema_version, payload, source_commit, source_ref, generated_at, created_at')
    .eq('project_id', projectId)
    .eq('kind', kind)
    .lt('generated_at', beforeIso)
    .order('generated_at', { ascending: false })
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[report-artifacts] earlier read failed:', error)
    throw new Error('Failed to read an earlier report artifact')
  }
  if (!data) return null
  return artifactFromRow<T>(data, { keepOwed: false }) // owed-on-screen D5: never through an earlier version either
}
