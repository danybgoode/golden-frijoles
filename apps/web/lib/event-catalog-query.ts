import 'server-only'
import { unstable_cache } from 'next/cache'
import { reservedEventsInFilter, type EventCatalog } from './event-catalog'
import { readEventCatalog } from './event-catalog-read'
import { readFunnel, readFunnelTrend, type FunnelRead, type FunnelTrendRead } from './flag-funnel-read'
import type { BetMeasure, ExposureRule, FunnelMeasure, FunnelPeriod, TrendBy } from './flag-funnel'
import { getSupabaseServiceClient } from './supabase'

/**
 * The canonical event catalog read (AGENTS rule #1). `projectId` is resolved by the caller from
 * server-side credentials or membership; accepting a slug here would make isolation optional.
 */
export function getEventCatalog(projectId: string, asOf: Date = new Date()): Promise<EventCatalog> {
  return readEventCatalog(getSupabaseServiceClient(), projectId, asOf)
}

/** One event and when it arrived. */
export type EventMark = { event: string; at: string }

/**
 * setup-instruments-connects D2 — ONE project's earliest and latest product event (not in `RESERVED_EVENTS`, the SDK's
 * own bookkeeping such as `flag_evaluated`), each null when there is none. Two one-row reads ordered by time, on demand
 * only (`frijoles status`): no `(project_id, created_at)` index exists, so each sorts the project's rows; Today uses
 * the bounded `getFirstEventForBand` instead (verifier, #338). Never another project. Throws on a query failure:
 * "could not read" must not render as "waiting".
 */
export async function getProductEventMarks(
  projectId: string
): Promise<{ firstEvent: EventMark | null; latestEvent: EventMark | null }> {
  const supabase = getSupabaseServiceClient()
  const reserved = reservedEventsInFilter()
  const one = async (ascending: boolean): Promise<EventMark | null> => {
    const { data, error } = await supabase
      .from('events')
      .select('event, created_at')
      .eq('project_id', projectId)
      .not('event', 'in', reserved)
      .order('created_at', { ascending })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`event marks read failed: ${error.message}`)
    return data ? { event: data.event as string, at: data.created_at as string } : null
  }
  const [firstEvent, latestEvent] = await Promise.all([one(true), one(false)])
  return { firstEvent, latestEvent }
}

/**
 * setup-instruments-connects D4 — what Today's first-event message needs, bounded (verifier, #338): is there a product
 * event OLDER than the window (a `LIMIT 1` with no sort, which stops at the first match), and if not, the first one
 * inside it (a sort over the window's rows only). One project; throws on a query failure.
 */
export async function getFirstEventForBand(
  projectId: string,
  windowDays: number,
  now: Date = new Date()
): Promise<{ hasOlder: boolean; firstInWindow: EventMark | null }> {
  const supabase = getSupabaseServiceClient()
  const reserved = reservedEventsInFilter()
  const cutoff = new Date(now.getTime() - windowDays * 86_400_000).toISOString()
  const older = await supabase
    .from('events')
    .select('id')
    .eq('project_id', projectId)
    .not('event', 'in', reserved)
    .lt('created_at', cutoff)
    .limit(1)
  if (older.error) throw new Error(`first-event read failed: ${older.error.message}`)
  if ((older.data ?? []).length > 0) return { hasOlder: true, firstInWindow: null }
  const first = await supabase
    .from('events')
    .select('event, created_at')
    .eq('project_id', projectId)
    .not('event', 'in', reserved)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (first.error) throw new Error(`first-event read failed: ${first.error.message}`)
  return {
    hasOlder: false,
    firstInWindow: first.data
      ? { event: first.data.event as string, at: first.data.created_at as string }
      : null,
  }
}

/**
 * one-bet-wired D3, tars-one-model D4 — a funnel (a flag's or a registry feature's) for ONE project (the caller resolved
 * it), over a period. Cached for FLAG_FUNNEL_CACHE_SECONDS per project, source, measure and period (verifier, #341): the
 * public Hub page, Journeys and the feature pages must not re-read the same events on every view. Throws on a failed
 * read (a thrown read is not cached).
 */
export const FLAG_FUNNEL_CACHE_SECONDS = 300
const funnelCacheKey = (projectId: string, source: ExposureRule, measure: FunnelMeasure) => [
  projectId,
  source.kind,
  source.kind === 'flag' ? source.flagKey : source.featureKey,
  source.kind === 'feature' ? (source.targetEvent ?? '*') : '',
  measure.adoptedEvent ?? '',
  measure.retainedEvent ?? '',
  String(measure.retentionDays),
  measure.satisfiedEvent ?? '',
]
export function getFunnel(
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  period: FunnelPeriod = 'all',
  options: { base?: boolean } = {}
): Promise<FunnelRead> {
  const withBase = options.base !== false
  const key = ['funnel', ...funnelCacheKey(projectId, source, measure), period, withBase ? 'base' : 'no-base']
  return unstable_cache(
    () =>
      readFunnel(getSupabaseServiceClient(), projectId, source, measure, period, new Date(), {
        base: withBase,
      }),
    key,
    {
      revalidate: FLAG_FUNNEL_CACHE_SECONDS,
    }
  )()
}

/** A measured flag's funnel (one-bet-wired). */
export function getFlagFunnel(
  projectId: string,
  bet: BetMeasure,
  period: FunnelPeriod = 'all'
): Promise<FunnelRead> {
  return getFunnel(projectId, { kind: 'flag', flagKey: bet.flagKey }, bet, period)
}

/**
 * funnel-truth D4 — a funnel's trend by cohort period for ONE project (the caller resolved it), cached as `getFunnel`
 * is. Throws on a failed read (a thrown read is not cached); an unreadable PERIOD is a value, not a throw (D3).
 */
export function getFunnelTrend(
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  by: TrendBy
): Promise<FunnelTrendRead> {
  return unstable_cache(
    () => readFunnelTrend(getSupabaseServiceClient(), projectId, source, measure, by, new Date()),
    ['funnel-trend', ...funnelCacheKey(projectId, source, measure), by],
    { revalidate: FLAG_FUNNEL_CACHE_SECONDS }
  )()
}

/** A measured flag's trend (the epic page). */
export function getFlagFunnelTrend(
  projectId: string,
  bet: BetMeasure,
  by: TrendBy
): Promise<FunnelTrendRead> {
  return getFunnelTrend(projectId, { kind: 'flag', flagKey: bet.flagKey }, bet, by)
}
