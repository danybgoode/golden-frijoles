import 'server-only'
import { reservedEventsInFilter, type EventCatalog } from './event-catalog'
import { readEventCatalog } from './event-catalog-read'
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
 * own bookkeeping such as `flag_evaluated`), each null when there is none. Two one-row reads ordered by time; never a
 * scan, never another project. Throws on a query failure: "could not read" must not render as "waiting".
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
