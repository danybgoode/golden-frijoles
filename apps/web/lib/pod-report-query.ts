import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getLatestArtifact, getLatestArtifactBefore, type ReportArtifact } from './report-artifacts'
import { speedHistory, windowCutoffs, type EarlierWindow, type SpeedHistory } from './outcome-history'
import { nextStepOf } from './adoption-steps'
import { getFeatureFunnelByProjectId } from './tars-query'
import { buildPodReportView, type PodReportView } from './pod-report-view'
import { buildOutcomeSection, type OutcomeSection } from './pod-outcome'
import { applyLens, applyPayingOffLens, type PodReportLens } from './pod-report-lens'
import { getProjectNorthStarByProjectId } from './north-star-query'
import { epicResult } from './roadmap-result'
import { epicFinops } from './roadmap-finops'
import { buildPayingOff, unavailablePayingOff, type OutcomeEpic, type PayingOffView } from './outcome-figures'
import type { MetricSource } from './outcome-expected'

// pod-report · Sprint 2.5d — the Pod Report's single read path.
//
// Same shape as lib/hub-query.ts: resolve the slug to a project_id SERVER-SIDE, read through the
// canonical seams, hand back one already-lensed object. Every surface that shows a Pod Report —
// the internal hub page, and Sprint 3's share links — comes through here, so "what a client may
// see" is decided in one place rather than re-derived per route.
//
// ── Why the report is a JOIN and not one stored document ──────────────────────────────────────
// The delivery half is computed by a Node script from a git checkout and pushed (Story 1.1's
// client-pushes rail); the outcome half needs the engine's own database, which that script has no
// business holding credentials for. So a STORED delivery artifact meets a LIVE outcome read at
// render time. That also makes the adoption numbers current rather than frozen at generation,
// which is what any reader assumes of something labelled "adoption".

export type PodReportResult =
  | {
      ok: true
      artifact: ReportArtifact
      view: PodReportView
      outcome: OutcomeSection
      /** outcome-report-v2 — "is it paying off": the sentence, the lines, the figures, the epics table. Lensed. */
      payingOff: PayingOffView
      /** outcome-report-v2 D8 — How fast against the latest version of each of the two previous months. */
      history: SpeedHistory
      lens: PodReportLens
    }
  // 'project_not_found' → notFound(); 'no_artifact' → the deliberate empty state; 'query_failed' →
  // throw at the caller. A broken database must never render identically to "nothing pushed yet"
  // (Roadmap/LEARNINGS.md — a zero that pages nobody).
  | { ok: false; reason: 'project_not_found' | 'no_artifact' | 'query_failed' }

/**
 * Read the latest Pod Report for a tenant, through a lens.
 *
 * `lens` is a parameter and not a default because every caller resolves it from a credential the
 * viewer presented — a session for the internal page, a share token for Sprint 3. There is no
 * "the usual lens": a route that forgot to decide would otherwise silently get the widest one.
 */
export async function getPodReport(projectSlug: string, lens: PodReportLens): Promise<PodReportResult> {
  const supabase = getSupabaseServiceClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', projectSlug)
    .maybeSingle()
  if (error) {
    console.error('[pod-report-query] project lookup failed:', error)
    return { ok: false, reason: 'query_failed' }
  }
  if (!project) return { ok: false, reason: 'project_not_found' }

  return getPodReportByProjectId(project.id as string, projectSlug, lens)
}

/**
 * The same read, for a caller that ALREADY holds an immutable project id.
 *
 * ── Why this overload exists (cross-review, Codex — the one Blocking finding on PR #33) ────────
 * The share route resolves its token to a `project_id` AND a slug, then called `getPodReport(slug)`,
 * which threw the id away and re-derived a project from the slug. `projects.slug` is a MUTABLE
 * natural key: if a tenant were renamed and its old slug reassigned between the token resolution and
 * this read, a still-valid token would render a DIFFERENT tenant's report. Four review rounds by
 * another model family read this code and did not see it.
 *
 * No slug rename path exists in the app today, so this was not exploitable — but "not currently
 * reachable" is not the property a tenancy boundary should rest on, and the fix is free: the caller
 * already had the id. The rule generalises: once a credential has resolved a tenant, carry the
 * immutable id and never re-derive the tenant from anything a human can edit.
 *
 * Mirrors the shape lib/tars-query.ts and lib/north-star-query.ts already use for exactly this
 * reason — `getFeatureFunnelByProjectId` exists because the authed API route must not re-trust a
 * client-supplied project identifier. The `projectSlug` here is for DISPLAY and for the funnel
 * queries' own signatures only; nothing resolves tenancy from it.
 */
export async function getPodReportByProjectId(
  projectId: string,
  projectSlug: string,
  lens: PodReportLens
): Promise<PodReportResult> {
  let artifact: ReportArtifact | null
  try {
    artifact = await getLatestArtifact(projectId, 'pod_report')
  } catch {
    // getLatestArtifact throws on a real query failure and returns null for "never pushed" — the
    // distinction the empty state depends on. Preserve it rather than collapsing both to null.
    return { ok: false, reason: 'query_failed' }
  }
  if (!artifact) return { ok: false, reason: 'no_artifact' }

  const built = buildPodReportView(artifact.payload)
  // D9: the next step's count is taken from the rows BEFORE the lens may hide them — an aggregate, like the verdict.
  if (built.maturity) built.maturity.next = nextStepOf(built.maturity.verdict, built.maturity.rows)
  const view = applyLens(built, lens)
  const [outcome, payingOff, earlier] = await Promise.all([
    getProjectOutcome(projectId, projectSlug),
    getPayingOff(projectId, projectSlug),
    getEarlierWindows(projectId, artifact.generatedAt),
  ])

  return {
    ok: true,
    artifact,
    view,
    outcome,
    payingOff: applyPayingOffLens(payingOff, lens),
    // Speed is never narrowed by a lens (pod-report-lens.ts), so neither are its deltas.
    history: speedHistory(
      built.speed.map((r) => ({ key: r.key, raw: r.raw ?? null })),
      earlier
    ),
    lens,
  }
}

/**
 * The latest version of each of the two months before the current artifact's (D8), or null when the read failed —
 * which the page says, rather than rendering an outage as "the first month".
 */
async function getEarlierWindows(
  projectId: string,
  generatedAt: string
): Promise<Array<EarlierWindow | null> | null> {
  const cutoffs = windowCutoffs(generatedAt)
  if (!cutoffs) return []
  try {
    const found = await Promise.all(
      cutoffs.map((before) => getLatestArtifactBefore(projectId, 'pod_report', before))
    )
    return found.map((a) =>
      a
        ? {
            id: a.id,
            version: a.version,
            generatedAt: a.generatedAt,
            speed: buildPodReportView(a.payload).speed.map((r) => ({ key: r.key, raw: r.raw ?? null })),
          }
        : null
    )
  } catch {
    return null
  }
}

/**
 * outcome-report-v2 D6 — the "is it paying off" half, team view (the caller lenses it). The epics' targets, verdicts
 * and spend come from the latest pushed ROADMAP artifact, read through `epicResult`/`epicFinops`; the actuals from the
 * North Star read the North Star page makes. Both are scoped to the one `projectId` the caller resolved.
 *
 * A failed read of either is the third state, `unavailable` — never "no targets", which would be a truthful-sounding
 * sentence produced by an outage (the same rule `getProjectOutcome` follows below). A project that never pushed a
 * roadmap has no epics: that IS "no targets yet".
 */
async function getPayingOff(projectId: string, projectSlug: string): Promise<PayingOffView> {
  // The whole half is one try (codex + fresh review, #299): a rejected North Star read, or a tenant-pushed row the
  // builders cannot handle, must cost this section — never the report, and never every share link of the project.
  try {
    return await readPayingOff(projectId, projectSlug)
  } catch (error) {
    console.error('[pod-report-query] paying-off read failed:', error)
    return unavailablePayingOff()
  }
}

async function readPayingOff(projectId: string, projectSlug: string): Promise<PayingOffView> {
  const roadmap = await getLatestArtifact(projectId, 'roadmap')
  const northStar = await getProjectNorthStarByProjectId(projectId, projectSlug)
  if (!northStar.ok) return unavailablePayingOff()

  const items = (roadmap?.payload as { items?: unknown } | null)?.items
  const epics: OutcomeEpic[] = (Array.isArray(items) ? items : [])
    .filter(
      (i): i is Record<string, unknown> =>
        typeof i === 'object' && i !== null && (i as { grain?: unknown }).grain === 'Epic'
    )
    .map((row) => ({
      result: epicResult(row),
      finops: epicFinops(row),
      shippedAt: typeof row.shipped_at === 'string' ? row.shipped_at : null,
    }))

  const sources: MetricSource[] = northStar.inputs.map((input) => ({
    key: input.key,
    name: input.name,
    isNorthStar: false,
    series: input.series.map((p) => ({ date: p.date, value: p.value })),
  }))
  // The metric itself has no recorded level (north-star-query.ts) — it is a source with an empty series, so an epic
  // targeting it still gets its expected line and says it has no actual.
  if (northStar.metricKey) {
    sources.push({ key: northStar.metricKey, name: northStar.metricKey, isNorthStar: true, series: [] })
  }

  return buildPayingOff({ product: projectSlug, epics, sources })
}

/**
 * The live outcome half — ALSO the Command Center's stat strip and funnel (app-shell-and-agent-rail
 * S3.1/S3.2). Exported rather than private for that second caller: the Pod Report and the signed-in
 * front door must not disagree about a tenant's adoption numbers, and two implementations that
 * currently agree are two implementations (CODE-QUALITY rule 2). The honesty rules below — a failed
 * read is `unavailable`, never an empty list; a null value is never a zero — are exactly what the
 * front door needed and would otherwise have had to re-derive.
 *
 * Reads the tenant's REGISTERED features and asks lib/tars-query.ts for each one's funnel — the
 * canonical read path, never a fresh query against `events` (AGENTS rule #1). A feature whose
 * funnel cannot be read yields a null-funnel row carrying its own caveat, not a row of zeros:
 * "we could not read this" and "nobody adopted it" are opposite facts and must not render alike.
 *
 * A tenant with no registered features gets an empty row list, which the page renders as "not
 * instrumented". That is the truthful answer for a pod that has not wired the engine to its
 * product yet, and it is a far better sales artifact than three confident zeros.
 */
export async function getProjectOutcome(projectId: string, projectSlug: string): Promise<OutcomeSection> {
  const supabase = getSupabaseServiceClient()

  const { data: features, error } = await supabase
    .from('features')
    .select('key')
    .eq('project_id', projectId)
    .eq('enabled', true)
    // Bounded on purpose. The outcome section is a summary, not an inventory, and an unbounded
    // fan-out of funnel queries would make one tenant's feature count the page's latency budget.
    .order('key', { ascending: true })
    .limit(8)

  if (error) {
    console.error('[pod-report-query] feature list failed:', error)
    // ── Cross-review (Agy, PR #33) caught this being wrong in exactly the way its own comment
    // warned about ──────────────────────────────────────────────────────────────────────────────
    // The previous version returned `features: []` here, which the renderer showed as "no features
    // are registered, so there is no adoption to read" — a truthful-sounding sales sentence produced
    // by a database outage. The comment said "a read failure produces NO rows and no claim"; the
    // code produced a claim. That is the prose-as-evidence trap this repo has a LEARNINGS entry for.
    //
    // `unavailable: true` is a THIRD state, deliberately not a thrown error: the delivery half of
    // this report is fine and still worth rendering, so failing the whole page would destroy real
    // information to report a partial failure. The renderer says the layer could not be read.
    return buildOutcomeSection({ tenant: projectSlug, features: [], northStar: null, unavailable: true })
  }

  const keys = (features ?? []).map((f) => f.key as string)
  const rows = await Promise.all(
    keys.map(async (key) => {
      const funnel = await getFeatureFunnelByProjectId(projectId, projectSlug, key)
      if (!funnel.ok) return { key, tars: null }
      return {
        key,
        tars: {
          targeted: funnel.tars.targeted,
          adopted: funnel.tars.adopted,
          retained: funnel.tars.retained,
        },
      }
    })
  )

  return buildOutcomeSection({
    tenant: projectSlug,
    features: rows,
    northStar: await readNorthStar(projectId),
  })
}

/**
 * The North-Star level, if one is registered.
 *
 * Deliberately reports a LEVEL and never a trend: `OUTCOME_NOT_INSTRUMENTED` already declares that
 * movement needs at least two recorded values, and drawing a direction through one point would
 * invent it. `latestValue` stays null when nothing has been recorded — distinct from a recorded
 * zero, which lib/pod-outcome.ts turns into two different sentences.
 */
async function readNorthStar(projectId: string): Promise<{
  metric: string | null
  inputCount: number | null
  latestValue: number | null
  unavailable?: boolean
} | null> {
  const supabase = getSupabaseServiceClient()

  const { data: metric, error } = await supabase
    .from('north_star_metrics')
    .select('key')
    .eq('project_id', projectId)
    .maybeSingle()
  if (error) {
    // NOT `return null`. Cross-review round 2 (Agy): null means "no metric is registered", so
    // collapsing an error into it renders a database failure as a truthful-sounding absence — the
    // same defect fixed one round earlier in getProjectOutcome, in its sibling function. Hardening one
    // instance and leaving the other is precisely what a later review round finds.
    console.error('[pod-report-query] north-star lookup failed:', error)
    return { metric: null, inputCount: null, latestValue: null, unavailable: true }
  }
  if (!metric) return null // genuinely none registered — a truthful answer, not a failure

  const { count, error: countError } = await supabase
    .from('leading_inputs')
    .select('key', { count: 'exact', head: true })
    .eq('project_id', projectId)
  if (countError) console.error('[pod-report-query] leading_inputs count failed:', countError)

  // `count ?? null`, never `?? 0`. Cross-review (Agy, PR #33): a failed count resolves to null, and
  // coercing that to 0 asserts "no leading inputs are registered" on the strength of a query that
  // never answered. Same not-zero rule the rest of this file follows.
  return { metric: metric.key as string, inputCount: count ?? null, latestValue: null }
}
