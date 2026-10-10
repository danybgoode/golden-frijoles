import 'server-only'
import { reservedEventsInFilter, type EventCatalog } from './event-catalog'
import { readEventCatalog } from './event-catalog-read'
import { readFlagFunnel, type FlagFunnelRead } from './flag-funnel-read'
import type { BetMeasure } from './flag-funnel'
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

/** one-bet-wired D3 — a measured flag's funnel for ONE project (the caller resolved it). Throws on a failed read. */
export function getFlagFunnel(
  projectId: string,
  bet: BetMeasure,
  now: Date = new Date()
): Promise<FlagFunnelRead> {
  return readFlagFunnel(getSupabaseServiceClient(), projectId, bet, now)
}
