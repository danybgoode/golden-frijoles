import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getFunnel } from './event-catalog-query'
import type { FunnelPeriod } from './flag-funnel'
import type { FunnelRead } from './flag-funnel-read'
import { computeServedDaily, type ServedDay, type TarsEvent } from './tars'

// Growth Engine v1 · Sprint 2, Story 2.3 — the DB-touching half of the funnel. Shared by
// both the authed JSON endpoint (app/api/v1/features/[key]/funnel/route.ts) and the
// unauthed funnel page (app/funnel/[projectSlug]/[featureKey]/page.tsx), so the page
// doesn't need its own Bearer credential to read its own project's data.
//
// tars-one-model D3/D5 — the funnel reads through the ONE model and read every funnel uses (lib/flag-funnel*.ts): a
// registry feature is a source whose exposure is its target event, followed over a period (whole life by default).
// `funnel` replaces the old `tars` counts (Daniel, 2026-10-12: no outside caller).

export type FunnelResult =
  | {
      ok: true
      project: { slug: string }
      feature: {
        key: string
        enabled: boolean
        targetEvent: string | null
        adoptedEvent: string | null
        retainedEvent: string | null
        retentionDays: number
        syncedAt: string
      }
      /** The funnel on the one model (tars-one-model D1), over `period`. */
      funnel: FunnelRead
      /**
       * *Times served, last 14 days* — design-system-rails Story 5.3.
       *
       * Its own read of the feature's last 14 days (tars-one-model: the funnel no longer reads every
       * event of the feature). Returned from here rather than computed in a route because AGENTS
       * rule #1 puts every `events` read on the canonical path.
       */
      servedDaily: ServedDay[]
    }
  | { ok: false; reason: 'project_not_found' | 'feature_not_found' | 'query_failed' }

export async function getFeatureFunnel(
  projectSlug: string,
  featureKey: string,
  period: FunnelPeriod = 'all'
): Promise<FunnelResult> {
  const supabase = getSupabaseServiceClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, slug')
    .eq('slug', projectSlug)
    .is('deleted_at', null) // many-products D9: a deleted product is not found
    .maybeSingle()
  if (error) {
    console.error('[tars-query] project lookup failed:', error)
    return { ok: false, reason: 'query_failed' }
  }
  if (!project) return { ok: false, reason: 'project_not_found' }
  return getFeatureFunnelByProjectId(project.id, project.slug, featureKey, period)
}

// Used by the Bearer-authed API route, which has already resolved `project_id` from the
// API key (Decision 8 — never re-trust a client-supplied project identifier).
export async function getFeatureFunnelByProjectId(
  projectId: string,
  projectSlug: string,
  featureKey: string,
  period: FunnelPeriod = 'all',
  /** `base: false` for the reports and friction loops: they never show active users (verifier, #344). */
  options: { base?: boolean } = {}
): Promise<FunnelResult> {
  const supabase = getSupabaseServiceClient()
  const project = { id: projectId, slug: projectSlug }

  const { data: feature, error: featureError } = await supabase
    .from('features')
    .select('key, enabled, target_event, adopted_event, retained_event, retention_days, synced_at')
    .eq('project_id', project.id)
    .eq('key', featureKey)
    .maybeSingle()
  if (featureError) {
    console.error('[tars-query] feature lookup failed:', featureError)
    return { ok: false, reason: 'query_failed' }
  }
  if (!feature) return { ok: false, reason: 'feature_not_found' }

  // The fourteen days the chart draws, and no more (it used to read every event of the feature).
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString()
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('user_id, event, created_at')
    .eq('project_id', project.id)
    .eq('feature_id', featureKey)
    .gte('created_at', since)
  if (eventsError) {
    console.error('[tars-query] events query failed:', eventsError)
    return { ok: false, reason: 'query_failed' }
  }
  const served: TarsEvent[] = (events ?? []).map((e) => ({
    userId: e.user_id,
    event: e.event,
    createdAt: e.created_at,
  }))

  let funnel: FunnelRead
  try {
    funnel = await getFunnel(
      project.id,
      { kind: 'feature', featureKey, targetEvent: feature.target_event },
      {
        adoptedEvent: feature.adopted_event,
        retainedEvent: feature.retained_event,
        retentionDays: feature.retention_days,
        satisfiedEvent: null, // the registry names no satisfaction event yet (tars-segments)
      },
      period,
      options
    )
  } catch (e) {
    console.error('[tars-query] funnel read failed:', e)
    return { ok: false, reason: 'query_failed' }
  }

  return {
    ok: true,
    project: { slug: project.slug },
    feature: {
      key: feature.key,
      enabled: feature.enabled,
      targetEvent: feature.target_event,
      adoptedEvent: feature.adopted_event,
      retainedEvent: feature.retained_event,
      retentionDays: feature.retention_days,
      syncedAt: feature.synced_at,
    },
    funnel,
    // Fourteen days, ending today. The window is a constant here rather than a parameter: it is the
    // number the approved design labels ("TIMES SERVED, LAST 14 DAYS"), and a caller-chosen window
    // would make the label and the data two things that must agree.
    servedDaily: computeServedDaily(served, 14),
  }
}
