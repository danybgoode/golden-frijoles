import type { SupabaseClient } from '@supabase/supabase-js'
import { EVENT_CATALOG_PAGE_SIZE } from './event-catalog-read'
import {
  computeFunnel,
  computeFunnelTrend,
  periodStart,
  segmentMembers,
  type SegmentRule,
  FLAG_EVALUATED_EVENT,
  PERIOD_DAYS,
  personOf as person,
  type BetMeasure,
  type ExposureRule,
  type Funnel,
  type FunnelEvent,
  type FunnelMeasure,
  type FunnelPeriod,
  type TrendBy,
  type TrendPeriod,
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
      /** `segment` only when the funnel names one (funnel-truth D12): its read was cut, so Targeted can't be told. */
      truncated: { exposures: boolean; events: boolean; base: boolean; segment?: boolean }
    }

/** funnel-truth D4 — the trend read: every cohort period from the first exposure, each read or unreadable (D3). */
export type FunnelTrendRead =
  | { state: 'not_exposed'; source: ExposureRule; by: TrendBy }
  | { state: 'measured'; source: ExposureRule; by: TrendBy; from: string; to: string; periods: TrendPeriod[] }

type Row = {
  user_id: string
  subject_type: string | null
  subject_id: string | null
  event: string
  created_at: string
  occurred_at: string | null
  feature_id: string | null
  variant?: string | null
  score?: string | null
}

const when = (r: Row) => r.occurred_at ?? r.created_at

type Page = (
  from: number,
  to: number
) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
type Read = { rows: Row[]; truncated: boolean }

/** Page a query (1,000 rows a request, PostgREST's max) up to the cap; `truncated` only when a row exists past it. */
async function paged(page: Page, cap: number = FLAG_FUNNEL_ROW_CAP): Promise<Read> {
  const rows: Row[] = []
  while (rows.length < cap) {
    const start = rows.length
    const end = Math.min(start + EVENT_CATALOG_PAGE_SIZE, cap) - 1
    const { data, error } = await page(start, end)
    if (error) throw new Error(`flag funnel read failed: ${error.message}`)
    const got = (data ?? []) as Row[]
    rows.push(...got)
    if (got.length < end - start + 1) return { rows, truncated: false }
  }
  const { data, error } = await page(cap, cap)
  if (error) throw new Error(`flag funnel read failed: ${error.message}`)
  return { rows, truncated: (data ?? []).length > 0 }
}

const COLS = 'user_id, subject_type, subject_id, event, created_at, occurred_at, feature_id'
const keyOf = (source: ExposureRule) => (source.kind === 'flag' ? source.flagKey : source.featureKey)

/** Read 1: every exposure, oldest arrival first, no age floor. */
function readExposures(
  client: SupabaseClient,
  projectId: string,
  source: ExposureRule,
  cap?: number
): Promise<Read> {
  return paged((a, b) => {
    let q = client
      .from('events')
      .select(`${COLS}, variant:tags->>variant`)
      .eq('project_id', projectId)
      .eq('feature_id', keyOf(source))
    if (source.kind === 'flag') q = q.eq('event', FLAG_EVALUATED_EVENT).eq('tags->>variant', 'on')
    else if (source.targetEvent !== null) q = q.eq('event', source.targetEvent)
    return q.order('created_at', { ascending: true }).order('id', { ascending: true }).range(a, b)
  }, cap)
}

/** Read 2: the measure's own events in [from, to], oldest arrival first; none when no adoption event is named. */
async function readMeasureEvents(
  client: SupabaseClient,
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  from: string,
  to: string,
  cap?: number
): Promise<Read> {
  if (measure.adoptedEvent === null) return { rows: [], truncated: false }
  const names = [
    ...new Set(
      [measure.adoptedEvent, measure.retainedEvent, measure.satisfiedEvent].filter((n): n is string => !!n)
    ),
  ]
  return paged((a, b) => {
    // satisfied-ask D4 — the score rides in tags; only the standard rating's is read (computeFunnel).
    let q = client
      .from('events')
      .select(`${COLS}, score:tags->>score`)
      .eq('project_id', projectId)
      .in('event', names)
    if (source.kind === 'feature') q = q.eq('feature_id', keyOf(source))
    return q
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(a, b)
  }, cap)
}

/** Read 3: the people active in [from, to], newest arrival first. */
function readBase(
  client: SupabaseClient,
  projectId: string,
  from: string,
  to: string,
  cap?: number
): Promise<Read> {
  return paged(
    (a, b) =>
      client
        .from('events')
        .select('user_id, subject_type, subject_id, created_at')
        .eq('project_id', projectId)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(a, b),
    cap
  )
}

/** funnel-truth D12 — the segment's own event, from `days` before `from` to `to`, oldest arrival first. */
function readSegmentEvents(
  client: SupabaseClient,
  projectId: string,
  rule: SegmentRule,
  from: string,
  to: string,
  cap?: number
): Promise<Read> {
  const since = new Date(new Date(from).getTime() - rule.days * 86_400_000).toISOString()
  return paged(
    (a, b) =>
      client
        .from('events')
        .select(COLS)
        .eq('project_id', projectId)
        .eq('event', rule.event)
        .gte('created_at', since)
        .lte('created_at', to)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(a, b),
    cap
  )
}

const toEvent = (r: Row): FunnelEvent => ({
  userId: person(r),
  event: r.event,
  createdAt: when(r),
  featureId: r.feature_id,
  variant: r.variant ?? null,
  score: scoreOf(r.score),
})

/** `tags->>score` arrives as text: a whole number 1–5, else null (a score the SDK would never send counts as none). */
function scoreOf(raw: string | null | undefined): number | null {
  const n = raw == null ? NaN : Number(raw)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

/** The one read (tars-one-model D3): a flag or a registry feature, followed over a period. One project. */
export async function readFunnel(
  client: SupabaseClient,
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  period: FunnelPeriod = 'all',
  now: Date = new Date(),
  options: { base?: boolean; segment?: SegmentRule } = {}
): Promise<FunnelRead> {
  const exposures = await readExposures(client, projectId, source)
  if (exposures.rows.length === 0) return { state: 'not_exposed', source, period }

  const firstOn = Math.min(...exposures.rows.map((r) => new Date(when(r)).getTime()))
  const days = PERIOD_DAYS[period]
  const since = days === null ? undefined : now.getTime() - days * 86_400_000
  const from = new Date(Math.max(firstOn, since ?? firstOn)).toISOString()
  const to = now.toISOString()
  const funnelEvents = await readMeasureEvents(client, projectId, source, measure, from, to)
  // The BASE (every project event in the period) is the costliest read: there is no (project_id, created_at) index and a
  // whole life can be long (verifier, #344). Only a page that shows "active users" and "targeted" needs it; the reports
  // and the friction alerts read exposed → adopted → retained and pass `base: false`; only a view that shows active users
  // pays it (the feature pages, the epic page, Journeys' flags).
  // Without it, base and targeted count only the people in the funnel's own events.
  const base =
    options.base === false
      ? { rows: [] as Row[], truncated: false }
      : await readBase(client, projectId, from, to)

  // funnel-truth D12 — a named segment: its members as of now, from its own bounded read.
  // Members as of now need only (now − days, now] (verifier, #379): readSegmentEvents reads `days` before its `from`.
  const segment = options.segment ? await readSegmentEvents(client, projectId, options.segment, to, to) : null
  const funnel = computeFunnel([...exposures.rows, ...funnelEvents.rows].map(toEvent), source, measure, {
    basePeople: new Set(base.rows.map(person)),
    since,
    ...(segment && options.segment
      ? { segment: segmentMembers(segment.rows.map(toEvent), options.segment, now.getTime()) }
      : {}),
  })
  return {
    state: 'measured',
    source,
    period,
    funnel,
    from,
    to,
    truncated: {
      exposures: exposures.truncated,
      events: funnelEvents.truncated,
      base: base.truncated,
      ...(segment ? { segment: segment.truncated } : {}),
    },
  }
}

/**
 * funnel-truth D3 — the trend: the same three reads from the first exposure to now, each bounded by the cap (`rowCap`
 * per read, only for the spec), then every cohort period computed by the one model. Whether a period could be read is DERIVED from
 * where each read was cut, never guessed: a cut-off read must never look like a drop.
 *   - exposures, oldest arrival first: a cut at T leaves out people first exposed after T → every period ending after T.
 *   - the measure's events follow every cohort to now: a cut there shortens every period's adoption → every period.
 *   - the base, newest arrival first: a cut at T leaves out activity before T → every period starting at or before T.
 * A period's base is the people with an event arriving in it. One project.
 */
export async function readFunnelTrend(
  client: SupabaseClient,
  projectId: string,
  source: ExposureRule,
  measure: FunnelMeasure,
  by: TrendBy,
  now: Date = new Date(),
  options: {
    /** funnel-truth D12 — each period's Targeted is this segment as of the period's end. */
    segment?: SegmentRule
    /** Spec only: a lower cap per read, so each cut can be driven on its own. */
    rowCap?: { exposures?: number; events?: number; base?: number; segment?: number }
  } = {}
): Promise<FunnelTrendRead> {
  const cap = options.rowCap ?? {}
  const exposures = await readExposures(client, projectId, source, cap.exposures)
  if (exposures.rows.length === 0) return { state: 'not_exposed', source, by }
  // The first period starts before the first exposure (a month's 1st, a week's Monday): read from there, so that
  // period's active people and adoptions beside the funnel are whole, not counted from the first exposure on.
  // Exposures dated after now (a skewed clock) open no period (Codex, #378); none left is nobody exposed yet.
  const firstOn = Math.min(
    ...exposures.rows.map((r) => new Date(when(r)).getTime()).filter((t) => t <= now.getTime())
  )
  if (firstOn === Infinity) return { state: 'not_exposed', source, by }
  const from = new Date(periodStart(firstOn, by)).toISOString()
  const to = now.toISOString()
  const events = await readMeasureEvents(client, projectId, source, measure, from, to, cap.events)
  const base = await readBase(client, projectId, from, to, cap.base)
  const segment = options.segment
    ? await readSegmentEvents(client, projectId, options.segment, from, to, cap.segment)
    : { rows: [] as Row[], truncated: false }

  const trend = computeFunnelTrend([...exposures.rows, ...events.rows].map(toEvent), source, measure, {
    by,
    ...(options.segment ? { segment: options.segment, segmentEvents: segment.rows.map(toEvent) } : {}),
    now: now.getTime(),
    baseActivity: base.rows.map((r) => ({ person: person(r), at: new Date(r.created_at).getTime() })),
  })
  if (!trend) return { state: 'not_exposed', source, by }

  const lastArrival = (read: Read) => new Date(read.rows[read.rows.length - 1].created_at).getTime()
  const exposuresCut = exposures.truncated ? lastArrival(exposures) : null
  const baseCut = base.truncated ? lastArrival(base) : null
  const day = (t: number) => new Date(t).toISOString().slice(0, 10)
  const why = (start: number, end: number): string | null => {
    if (segment.truncated && options.segment)
      return `More ${options.segment.event} events than one read covers, so who is in ${options.segment.key} can’t be told.`
    if (events.truncated)
      return 'More adoption and retention events than one read covers, so no cohort’s adoption could be followed through.'
    if (exposuresCut !== null && end > exposuresCut)
      return `More exposures than one read covers: those arriving after ${day(exposuresCut)} weren’t read, so this cohort can’t be counted.`
    if (baseCut !== null && start <= baseCut)
      return `More activity than one read covers: activity before ${day(baseCut)} wasn’t read, so this period’s active people can’t be counted.`
    return null
  }
  const periods = trend.periods.map((p): TrendPeriod => {
    const reason = why(new Date(p.start).getTime(), new Date(p.end).getTime())
    return reason === null
      ? p
      : { label: p.label, start: p.start, end: p.end, maturing: p.maturing, state: 'unreadable', reason }
  })
  return { state: 'measured', source, by, from, to, periods }
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

/** funnel-truth D11/D14 — a segment's share of the last 30 days' active people, or why it can't be told. */
export type SegmentShareRead =
  | { state: 'read'; members: number; base: number; share: number | null }
  | { state: 'unreadable'; reason: string }

export const SEGMENT_SHARE_DAYS = 30

/** The share as of `now`: members (D11) within the people active in the last 30 days, over those people. One project. */
export async function readSegmentShare(
  client: SupabaseClient,
  projectId: string,
  rule: SegmentRule,
  now: Date = new Date(),
  options: { rowCap?: { base?: number; segment?: number } } = {}
): Promise<SegmentShareRead> {
  const to = now.toISOString()
  const from = new Date(now.getTime() - SEGMENT_SHARE_DAYS * 86_400_000).toISOString()
  const base = await readBase(client, projectId, from, to, options.rowCap?.base)
  if (base.truncated)
    return { state: 'unreadable', reason: 'More activity in the last 30 days than one read covers.' }
  // readSegmentEvents reads `days` before its `from`, so passing `to` reads exactly (now − days, now].
  const segment = await readSegmentEvents(client, projectId, rule, to, to, options.rowCap?.segment)
  if (segment.truncated)
    return { state: 'unreadable', reason: `More ${rule.event} events than one read covers.` }
  const active = new Set(base.rows.map(person).filter((u) => !u.startsWith('system:')))
  const members = segmentMembers(segment.rows.map(toEvent), rule, now.getTime())
  const inside = [...active].filter((u) => members.has(u)).length
  return {
    state: 'read',
    members: inside,
    base: active.size,
    share: active.size === 0 ? null : inside / active.size,
  }
}
