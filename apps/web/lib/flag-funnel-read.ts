import type { SupabaseClient } from '@supabase/supabase-js'
import { EVENT_CATALOG_PAGE_SIZE } from './event-catalog-read'
import {
  computeFlagFunnel,
  FLAG_EVALUATED_EVENT,
  personOf as person,
  type BetMeasure,
  type FlagFunnel,
  type FunnelEvent,
} from './flag-funnel'

// one-bet-wired D3 — the bounded read behind a measured flag's funnel, with the client INJECTED (as the event catalog's
// read is) so it can be driven against real PostgREST. Product code calls `getFlagFunnel` in ./event-catalog-query. ONE
// project, resolved by the caller from server-side credentials or membership. Three reads, each only what it needs
// (verifier, #341):
//
//   1. EXPOSURES: every `on` evaluation of this flag, through the (project_id, feature_id, created_at) index, with no age
//      floor: an exposure is stored once per evaluation fingerprint, so a floor would lose it and turn an exposed adopter
//      into "adopted without exposure".
//   2. FUNNEL EVENTS: only the bet's own events (adoption, retention, satisfaction), from the first exposure to now, at
//      most FLAG_FUNNEL_MAX_DAYS.
//   3. BASE: the people active in that period, newest first, people only; past the cap the base is "at least".
//
// The person is the event's subject when that subject is a USER (a flag evaluation names whom it was evaluated for; a
// shared server client's user is not that person), else the event's user id: an order, a merchant or a task as subject
// is not a person (verifier, #341). The time is `occurred_at` when the event carries one, else `created_at`.

export const FLAG_FUNNEL_MAX_DAYS = 90
export const FLAG_FUNNEL_ROW_CAP = 50_000

export type FlagFunnelRead =
  | { state: 'not_exposed'; flagKey: string }
  | {
      state: 'measured'
      flagKey: string
      funnel: FlagFunnel
      from: string
      to: string
      /** Which read hit its cap, if any; each skews different numbers (flag-funnel-view says how). */
      truncated: { exposures: boolean; events: boolean; base: boolean }
    }

type Row = {
  user_id: string
  subject_type: string | null
  subject_id: string | null
  event: string
  created_at: string
  occurred_at: string | null
  feature_id: string | null
  variant?: string | null
}

const when = (r: Row) => r.occurred_at ?? r.created_at

/** Page a query (1,000 rows a request, PostgREST's max) up to the cap; `truncated` only when a row exists past it. */
async function paged(
  page: (
    from: number,
    to: number
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
): Promise<{ rows: Row[]; truncated: boolean }> {
  const rows: Row[] = []
  while (rows.length < FLAG_FUNNEL_ROW_CAP) {
    const start = rows.length
    const end = Math.min(start + EVENT_CATALOG_PAGE_SIZE, FLAG_FUNNEL_ROW_CAP) - 1
    const { data, error } = await page(start, end)
    if (error) throw new Error(`flag funnel read failed: ${error.message}`)
    const got = (data ?? []) as Row[]
    rows.push(...got)
    if (got.length < end - start + 1) return { rows, truncated: false }
  }
  const { data, error } = await page(FLAG_FUNNEL_ROW_CAP, FLAG_FUNNEL_ROW_CAP)
  if (error) throw new Error(`flag funnel read failed: ${error.message}`)
  return { rows, truncated: (data ?? []).length > 0 }
}

export async function readFlagFunnel(
  client: SupabaseClient,
  projectId: string,
  bet: BetMeasure,
  now: Date = new Date()
): Promise<FlagFunnelRead> {
  const cols = 'user_id, subject_type, subject_id, event, created_at, occurred_at, feature_id'
  const exposures = await paged((a, b) =>
    client
      .from('events')
      .select(`${cols}, variant:tags->>variant`)
      .eq('project_id', projectId)
      .eq('feature_id', bet.flagKey)
      .eq('event', FLAG_EVALUATED_EVENT)
      .eq('tags->>variant', 'on')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(a, b)
  )
  if (exposures.rows.length === 0) return { state: 'not_exposed', flagKey: bet.flagKey }

  const firstOn = Math.min(...exposures.rows.map((r) => new Date(when(r)).getTime()))
  const from = new Date(Math.max(firstOn, now.getTime() - FLAG_FUNNEL_MAX_DAYS * 86_400_000)).toISOString()
  const to = now.toISOString()
  const names = [
    ...new Set([bet.adoptedEvent, bet.retainedEvent, bet.satisfiedEvent].filter((n): n is string => !!n)),
  ]
  const funnelEvents = await paged((a, b) =>
    client
      .from('events')
      .select(cols)
      .eq('project_id', projectId)
      .in('event', names)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(a, b)
  )
  const base = await paged((a, b) =>
    client
      .from('events')
      .select('user_id, subject_type, subject_id')
      .eq('project_id', projectId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(a, b)
  )

  const toEvent = (r: Row): FunnelEvent => ({
    userId: person(r),
    event: r.event,
    createdAt: when(r),
    featureId: r.feature_id,
    variant: r.variant ?? null,
  })
  const funnel = computeFlagFunnel([...exposures.rows, ...funnelEvents.rows].map(toEvent), bet, {
    basePeople: new Set(base.rows.map(person)),
  })
  return {
    state: 'measured',
    flagKey: bet.flagKey,
    funnel,
    from,
    to,
    truncated: { exposures: exposures.truncated, events: funnelEvents.truncated, base: base.truncated },
  }
}
