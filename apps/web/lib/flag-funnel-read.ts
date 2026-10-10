import type { SupabaseClient } from '@supabase/supabase-js'
import { EVENT_CATALOG_PAGE_SIZE } from './event-catalog-read'
import {
  computeFlagFunnel,
  FLAG_EVALUATED_EVENT,
  type BetMeasure,
  type FlagFunnel,
  type FunnelEvent,
} from './flag-funnel'

// one-bet-wired D3 — the bounded read behind a measured flag's funnel, with the client INJECTED (as the event catalog's
// read is) so its paging can be tested against real PostgREST. Product code calls `getFlagFunnel` in
// ./event-catalog-query, which supplies the service client. ONE project, resolved by the caller from server-side
// credentials or membership.
//
// The period runs from the flag's first `on` evaluation (found through the (project_id, feature_id, created_at) index)
// to now, at most FLAG_FUNNEL_MAX_DAYS. PostgREST answers at most 1,000 rows a request, so the period is read in pages,
// oldest first, up to FLAG_FUNNEL_ROW_CAP; past the cap the funnel says it is truncated rather than undercount quietly.

export const FLAG_FUNNEL_MAX_DAYS = 90
export const FLAG_FUNNEL_ROW_CAP = 50_000

export type FlagFunnelRead =
  | { state: 'not_exposed'; flagKey: string }
  | { state: 'measured'; flagKey: string; funnel: FlagFunnel; from: string; to: string; truncated: boolean }

type Row = {
  user_id: string
  event: string
  created_at: string
  feature_id: string | null
  variant: string | null
}

export async function readFlagFunnel(
  client: SupabaseClient,
  projectId: string,
  bet: BetMeasure,
  now: Date = new Date()
): Promise<FlagFunnelRead> {
  const first = await client
    .from('events')
    .select('created_at')
    .eq('project_id', projectId)
    .eq('feature_id', bet.flagKey)
    .eq('event', FLAG_EVALUATED_EVENT)
    .eq('tags->>variant', 'on')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (first.error) throw new Error(`flag funnel read failed: ${first.error.message}`)
  if (!first.data) return { state: 'not_exposed', flagKey: bet.flagKey }

  const floor = now.getTime() - FLAG_FUNNEL_MAX_DAYS * 86_400_000
  const from = new Date(Math.max(new Date(first.data.created_at as string).getTime(), floor)).toISOString()
  const to = now.toISOString()
  const rows: Row[] = []
  let truncated = false
  while (rows.length < FLAG_FUNNEL_ROW_CAP) {
    const start = rows.length
    const end = Math.min(start + EVENT_CATALOG_PAGE_SIZE, FLAG_FUNNEL_ROW_CAP) - 1
    const { data, error } = await client
      .from('events')
      .select('user_id, event, created_at, feature_id, variant:tags->>variant')
      .eq('project_id', projectId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(start, end)
    if (error) throw new Error(`flag funnel read failed: ${error.message}`)
    const page = (data ?? []) as Row[]
    rows.push(...page)
    if (page.length < end - start + 1) break
    if (rows.length >= FLAG_FUNNEL_ROW_CAP) truncated = true
  }
  const events: FunnelEvent[] = rows.map((r) => ({
    userId: r.user_id,
    event: r.event,
    createdAt: r.created_at,
    featureId: r.feature_id,
    variant: r.variant,
  }))
  return {
    state: 'measured',
    flagKey: bet.flagKey,
    funnel: computeFlagFunnel(events, bet),
    from,
    to,
    truncated,
  }
}
