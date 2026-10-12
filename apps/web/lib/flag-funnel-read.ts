import type { SupabaseClient } from '@supabase/supabase-js'
import { EVENT_CATALOG_PAGE_SIZE } from './event-catalog-read'
import {
  computeFunnel,
  FLAG_EVALUATED_EVENT,
  PERIOD_DAYS,
  personOf as person,
  type BetMeasure,
  type ExposureRule,
  type Funnel,
  type FunnelEvent,
  type FunnelMeasure,
  type FunnelPeriod,
} from './flag-funnel'

// one-bet-wired D3 — the bounded read behind a measured flag's funnel, with the client INJECTED (as the event catalog's
// read is) so it can be driven against real PostgREST. Product code calls `getFlagFunnel` in ./event-catalog-query. ONE
// project, resolved by the caller from server-side credentials or membership. Three reads, each only what it needs
// (verifier, #341):
//
//   1. EXPOSURES: every `on` evaluation of this flag, through the (project_id, feature_id, created_at) index, with no age
//      floor: an exposure is stored once per evaluation fingerprint, so a floor would lose it and turn an exposed adopter
//      into "adopted without exposure".
//   2. FUNNEL EVENTS: only the measure's own events (adoption, retention, satisfaction), from the period's start to now.
//      tars-one-model D2/D3: the period is a cohort (the people first exposed in it), and a cohort's adoption is never
//      before its exposure, so reading from the period's start is complete for it. The old 90-day cap read behaviour for
//      90 days against all-time exposure and is gone (Daniel, 2026-10-12).
//   3. BASE: the people active in that period, newest first, people only; past the cap the base is "at least".
//
// A FEATURE source (a registry feature, the older TAR funnels) scopes its exposures AND its events to
// `feature_id = featureKey`, as tars-query always did; a FLAG source reads its events project-wide.
//
// The person is the event's subject when that subject is a USER (a flag evaluation names whom it was evaluated for; a
// shared server client's user is not that person), else the event's user id: an order, a merchant or a task as subject
// is not a person (verifier, #341). The time is `occurred_at` when the event carries one, else `created_at`.

export const FLAG_FUNNEL_ROW_CAP = 50_000

export type FunnelRead =
  | { state: 'not_exposed'; source: ExposureRule; period: FunnelPeriod }
  | {
      state: 'measured'
      source: ExposureRule
      period: FunnelPeriod
      funnel: Funnel
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

/** The one read (tars-one-model D3): a flag or a registry feature, followed over a period. One project. */
export async function readFunnel(
  client: SupabaseClient,
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  period: FunnelPeriod = 'all',
  now: Date = new Date(),
  options: { base?: boolean } = {}
): Promise<FunnelRead> {
  const cols = 'user_id, subject_type, subject_id, event, created_at, occurred_at, feature_id'
  const key = source.kind === 'flag' ? source.flagKey : source.featureKey
  const exposures = await paged((a, b) => {
    let q = client
      .from('events')
      .select(`${cols}, variant:tags->>variant`)
      .eq('project_id', projectId)
      .eq('feature_id', key)
    if (source.kind === 'flag') q = q.eq('event', FLAG_EVALUATED_EVENT).eq('tags->>variant', 'on')
    else if (source.targetEvent !== null) q = q.eq('event', source.targetEvent)
    return q.order('created_at', { ascending: true }).order('id', { ascending: true }).range(a, b)
  })
  if (exposures.rows.length === 0) return { state: 'not_exposed', source, period }

  const firstOn = Math.min(...exposures.rows.map((r) => new Date(when(r)).getTime()))
  const days = PERIOD_DAYS[period]
  const since = days === null ? undefined : now.getTime() - days * 86_400_000
  const from = new Date(Math.max(firstOn, since ?? firstOn)).toISOString()
  const to = now.toISOString()
  const names = [
    ...new Set(
      [measure.adoptedEvent, measure.retainedEvent, measure.satisfiedEvent].filter((n): n is string => !!n)
    ),
  ]
  const funnelEvents =
    measure.adoptedEvent === null
      ? { rows: [] as Row[], truncated: false }
      : await paged((a, b) => {
          let q = client.from('events').select(cols).eq('project_id', projectId).in('event', names)
          if (source.kind === 'feature') q = q.eq('feature_id', key)
          return q
            .gte('created_at', from)
            .lte('created_at', to)
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
            .range(a, b)
        })
  // The BASE (every project event in the period) is the costliest read: there is no (project_id, created_at) index and a
  // whole life can be long (verifier, #344). Only a page that shows "active users" and "targeted" needs it; the reports
  // and the friction alerts read exposed → adopted → retained and pass `base: false`; only a view that shows active users
  // pays it (the feature pages, the epic page, Journeys' flags).
  // Without it, base and targeted count only the people in the funnel's own events.
  const base =
    options.base === false
      ? { rows: [] as Row[], truncated: false }
      : await paged((a, b) =>
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
  const funnel = computeFunnel([...exposures.rows, ...funnelEvents.rows].map(toEvent), source, measure, {
    basePeople: new Set(base.rows.map(person)),
    since,
  })
  return {
    state: 'measured',
    source,
    period,
    funnel,
    from,
    to,
    truncated: { exposures: exposures.truncated, events: funnelEvents.truncated, base: base.truncated },
  }
}

/** A measured flag's funnel (one-bet-wired): the read with a flag source. */
export function readFlagFunnel(
  client: SupabaseClient,
  projectId: string,
  bet: BetMeasure,
  now: Date = new Date(),
  period: FunnelPeriod = 'all'
): Promise<FunnelRead> {
  return readFunnel(client, projectId, { kind: 'flag', flagKey: bet.flagKey }, bet, period, now)
}

/** one-bet-wired's name for the read result. */
export type FlagFunnelRead = FunnelRead
