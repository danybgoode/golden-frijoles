// one-bet-wired D2, tars-one-model D1/D2 — every funnel on the TARS model agreed with Daniel (2026-10-10), pure. One
// model, two kinds of exposure: a flag's `on` evaluation, or a registry feature's target event. A period is a COHORT:
// the people first exposed in it, followed through adoption and return (Daniel, 2026-10-12: a feature reads across its
// whole life by default, not 90 days of behaviour against all-time exposure).
//
// TARS's Targeted is a strategy decision (the share of the base that has the problem), NOT who was exposed. So the
// funnel reads: Base (the period's active users) → Targeted (the bet's segment; `everyone` until tars-segments) →
// Exposed (got the flag `on`) → Adopted (the adoption event at or after first exposure) → Retained (a repeat within the
// window) → Satisfied (an optional event, else null: "not measured"). People who did the adoption event WITHOUT being
// exposed first are real evidence of value but do not validate the bet, so they are counted BESIDE the funnel and never
// enter its rates. The older TAR funnels (`lib/tars.ts`) read through this model too (tars-one-model).

export const FLAG_EVALUATED_EVENT = 'flag_evaluated'
/** satisfied-ask D1 — the SDK's standard rating (packages/sdk/src/satisfaction.ts; pinned equal by the spec). */
export const SATISFACTION_RATED_EVENT = 'satisfaction_rated'
/** satisfied-ask D3 — the bar when a bet sets none: the top two of five. */
export const DEFAULT_SATISFIED_MIN_SCORE = 4
/** Users the instrumentation guide gives to the server itself: not people, never in the base. */
const isSystemUser = (userId: string) => userId.startsWith('system:')

/**
 * The person an event is about: its subject when that subject is a USER (a flag evaluation names whom it was evaluated
 * for), else the event's own user; an order, merchant or task subject is not a person (verifier, #341).
 */
export function personOf(row: {
  user_id: string
  subject_type: string | null
  subject_id: string | null
}): string {
  return row.subject_type === 'user' && row.subject_id ? row.subject_id : row.user_id
}

export type FunnelEvent = {
  userId: string
  event: string
  createdAt: string
  featureId: string | null
  variant: string | null
  /** satisfied-ask D4 — `tags.score` as a number, when the event carries one; read only on `satisfaction_rated`. */
  score?: number | null
}

/** What counts as being exposed: a flag's `on` evaluation, or a registry feature's target event (any of its events when null). */
export type ExposureRule =
  { kind: 'flag'; flagKey: string } | { kind: 'feature'; featureKey: string; targetEvent: string | null }

/** What the funnel reads after exposure. A null adoption event (a registry feature naming none) measures nothing past exposure. */
export type FunnelMeasure = {
  adoptedEvent: string | null
  /** null: a repeat of the adoption event. */
  retainedEvent: string | null
  retentionDays: number
  /** null: satisfaction is not measured. */
  satisfiedEvent: string | null
  /**
   * satisfied-ask D3/D4 — read only when `satisfiedEvent` is `satisfaction_rated`: the score its latest answer needs.
   * Absent or null = DEFAULT_SATISFIED_MIN_SCORE. Optional so every measure written before it stays one.
   */
  satisfiedMinScore?: number | null
}

/** A measured flag's bet: its flag and what it reads (one-bet-wired D1). */
export type BetMeasure = FunnelMeasure & { flagKey: string; adoptedEvent: string }

/** The period a funnel follows: the people first exposed in it (D2). `all` is the feature's whole life. */
export const FUNNEL_PERIODS = ['all', '90d', '30d'] as const
export type FunnelPeriod = (typeof FUNNEL_PERIODS)[number]
export const PERIOD_DAYS: Record<FunnelPeriod, number | null> = { all: null, '90d': 90, '30d': 30 }
/**
 * landing-launch-experiment D9 — a missing period is `all`; a known one is itself; anything else is `null`, so the
 * caller must decide (the API says 400, a page falls back and says so). Never a silent `all`: an agent must not read
 * all-time numbers as last week's.
 */
export const parsePeriod = (raw: unknown): FunnelPeriod | null => {
  if (raw === null || raw === undefined || raw === '') return 'all'
  return (FUNNEL_PERIODS as readonly unknown[]).includes(raw) ? (raw as FunnelPeriod) : null
}
/** The one sentence for an unknown period: the 400's error and the pages' visible line share it. */
export const unknownPeriodError = (raw: unknown): string =>
  `Unknown period "${String(raw).slice(0, 32)}". Use one of: ${FUNNEL_PERIODS.join(', ')}.`

export type Funnel = {
  base: number
  targeted: number
  exposed: number
  /** null when no adoption event is named: "not measured", never zero (D1). */
  adopted: number | null
  retained: number | null
  /** null when the bet names no satisfaction event: "not measured", never zero. */
  satisfied: number | null
  /** Did the adoption event without (or before) being exposed: beside the funnel, not in it. */
  adoptedWithoutExposure: number
  /**
   * funnel-truth D12 — only when the funnel names a segment: people first exposed in the period who are NOT in it, and
   * how many of them adopted after exposure. Beside the funnel, never in its rates. Absent for `everyone`.
   */
  outside?: { exposed: number; adopted: number | null }
  /** Each stage as a share of the one before; null when the one before is zero or not measured. */
  rates: {
    targeted: number | null
    exposed: number | null
    adopted: number | null
    retained: number | null
    satisfied: number | null
  }
}
/** The flag funnel's name from one-bet-wired; the same shape. */
export type FlagFunnel = Funnel

const ms = (iso: string) => new Date(iso).getTime()
const rate = (part: number | null, whole: number | null) =>
  part === null || whole === null || whole === 0 ? null : part / whole

/** Is this event an exposure under the rule? */
export function isExposure(e: FunnelEvent, rule: ExposureRule): boolean {
  if (rule.kind === 'flag')
    return e.event === FLAG_EVALUATED_EVENT && e.featureId === rule.flagKey && e.variant === 'on'
  return e.featureId === rule.featureKey && (rule.targetEvent === null || e.event === rule.targetEvent)
}

/**
 * The funnel for one exposure rule and measure. `since` (ms) makes it a cohort: only people whose FIRST exposure is at
 * or after it are exposed, and only adoptions at or after it count beside the funnel; absent = the whole life.
 * `until` (ms, exclusive) closes the cohort (funnel-truth D1): first exposure, the base and adoption beside the funnel
 * are bounded by it, while adoption, retention and satisfaction still follow the cohort to the last event; absent = now.
 * `basePeople`: the period's active people when the caller read them separately (the bounded read does); people in
 * `events` active in the period always count too, so the base is never smaller than the funnel.
 */
export function computeFunnel(
  events: FunnelEvent[],
  rule: ExposureRule,
  measure: FunnelMeasure,
  options: {
    basePeople?: ReadonlySet<string>
    since?: number
    until?: number
    /** funnel-truth D12 — the people in the bet's segment (`segmentMembers`); absent = everyone. */
    segment?: ReadonlySet<string>
  } = {}
): Funnel {
  const since = options.since ?? -Infinity
  const until = options.until ?? Infinity
  const inPeriod = (t: number) => t >= since && t < until
  const people = events.filter((e) => !isSystemUser(e.userId))
  const base = new Set(
    [
      ...(options.basePeople ?? []),
      ...people.filter((e) => inPeriod(ms(e.createdAt))).map((e) => e.userId),
    ].filter((u) => !isSystemUser(u))
  )
  // `everyone` (one-bet-wired D1) is the whole base; a named segment is its members within the base (funnel-truth D12).
  const segment = options.segment
  const targeted = segment ? new Set([...base].filter((u) => segment.has(u))) : base

  // Every person's FIRST exposure, all time: the cohort is who first got it in the period (D2).
  const firstExposure = new Map<string, number>()
  for (const e of people) {
    if (!isExposure(e, rule)) continue
    const t = ms(e.createdAt)
    if (!firstExposure.has(e.userId) || t < firstExposure.get(e.userId)!) firstExposure.set(e.userId, t)
  }
  const cohort = new Set(
    [...firstExposure].filter(([u, t]) => inPeriod(t) && targeted.has(u)).map(([u]) => u)
  )
  const exposedOutside = segment
    ? new Set([...firstExposure].filter(([u, t]) => inPeriod(t) && !targeted.has(u)).map(([u]) => u))
    : null

  const adoptedWithoutExposure = new Set<string>()
  const adoptedAfterExposure = new Set<string>() // any cohort: such a person adopted through the feature
  const firstAdoption = new Map<string, number>()
  const adoptedOutside = new Set<string>()
  if (measure.adoptedEvent !== null) {
    for (const e of people) {
      if (e.event !== measure.adoptedEvent) continue
      const t = ms(e.createdAt)
      const exposedAt = firstExposure.get(e.userId)
      if (exposedAt === undefined || t < exposedAt) {
        if (inPeriod(t)) adoptedWithoutExposure.add(e.userId)
        continue
      }
      adoptedAfterExposure.add(e.userId)
      if (exposedOutside?.has(e.userId)) adoptedOutside.add(e.userId)
      if (!cohort.has(e.userId)) continue // exposed before the period: another cohort's adoption
      if (!firstAdoption.has(e.userId) || t < firstAdoption.get(e.userId)!) firstAdoption.set(e.userId, t)
    }
    // Someone who adopted before exposure AND again after it adopted through the feature: never beside the funnel.
    for (const userId of adoptedAfterExposure) adoptedWithoutExposure.delete(userId)
  }

  const retained = new Set<string>()
  if (measure.adoptedEvent !== null) {
    const retentionEvent = measure.retainedEvent ?? measure.adoptedEvent
    const windowMs = measure.retentionDays * 86_400_000
    for (const e of people) {
      const adoptedAt = firstAdoption.get(e.userId)
      if (adoptedAt === undefined || e.event !== retentionEvent) continue
      const t = ms(e.createdAt)
      if (t > adoptedAt && t <= adoptedAt + windowMs) retained.add(e.userId)
    }
  }

  let satisfied: number | null = null
  if (measure.adoptedEvent !== null && measure.satisfiedEvent !== null) {
    // satisfied-ask D4 — on the standard rating a person counts by their LATEST score since adopting: someone who said 2
    // and later 5 is satisfied, and someone who said 5 and later 2 is not. Any other event keeps the old read, where
    // sending it at all counts (a bet that named its own event never asked for a threshold).
    // One event name serves every flag, so a rating counts only for the flag it names (its featureId): a flag's measure
    // read is not feature-scoped (flag-funnel-read), and without this a rating of flag A would satisfy flag B.
    const scored = measure.satisfiedEvent === SATISFACTION_RATED_EVENT
    const ratedKey = rule.kind === 'flag' ? rule.flagKey : rule.featureKey
    const bar = measure.satisfiedMinScore ?? DEFAULT_SATISFIED_MIN_SCORE
    const latest = new Map<string, { t: number; score: number | null }>()
    const happy = new Set<string>()
    for (const e of people) {
      const adoptedAt = firstAdoption.get(e.userId)
      const t = ms(e.createdAt)
      if (
        !retained.has(e.userId) ||
        adoptedAt === undefined ||
        e.event !== measure.satisfiedEvent ||
        t < adoptedAt
      )
        continue
      if (!scored) happy.add(e.userId)
      else if (e.featureId !== ratedKey) continue
      else if (!latest.has(e.userId) || t >= latest.get(e.userId)!.t)
        latest.set(e.userId, { t, score: e.score ?? null })
    }
    for (const [userId, answer] of latest) if (answer.score !== null && answer.score >= bar) happy.add(userId)
    satisfied = happy.size
  }

  const measured = measure.adoptedEvent !== null
  const counts = {
    base: base.size,
    targeted: targeted.size,
    exposed: cohort.size,
    adopted: measured ? firstAdoption.size : null,
    retained: measured ? retained.size : null,
  }
  return {
    ...counts,
    satisfied,
    adoptedWithoutExposure: adoptedWithoutExposure.size,
    ...(exposedOutside
      ? { outside: { exposed: exposedOutside.size, adopted: measured ? adoptedOutside.size : null } }
      : {}),
    rates: {
      targeted: rate(counts.targeted, counts.base),
      exposed: rate(counts.exposed, counts.targeted),
      adopted: rate(counts.adopted, counts.exposed),
      retained: rate(counts.retained, counts.adopted),
      satisfied: rate(satisfied, counts.retained),
    },
  }
}

/** funnel-truth D9/D11 — a project's segment: the people who did `event` at least `minCount` times in `days`. */
export type SegmentRule = { key: string; event: string; minCount: number; days: number }
export const EVERYONE = 'everyone'

/**
 * funnel-truth D11 — who is in a segment at a moment: the people (never `system:` users) with at least `minCount` of
 * its event in `(at − days, at]`, placed by the event's own time as every funnel stage is.
 */
export function segmentMembers(events: FunnelEvent[], rule: SegmentRule, at: number): Set<string> {
  const from = at - rule.days * 86_400_000
  const counts = new Map<string, number>()
  for (const e of events) {
    if (e.event !== rule.event || isSystemUser(e.userId)) continue
    const t = ms(e.createdAt)
    if (t > from && t <= at) counts.set(e.userId, (counts.get(e.userId) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, n]) => n >= rule.minCount).map(([u]) => u))
}

/** A measured flag's funnel (one-bet-wired): the model with a flag's exposure rule. */
export function computeFlagFunnel(
  events: FunnelEvent[],
  bet: BetMeasure,
  options: { basePeople?: ReadonlySet<string>; since?: number } = {}
): Funnel {
  return computeFunnel(events, { kind: 'flag', flagKey: bet.flagKey }, bet, options)
}

// ── funnel-truth D1/D2 — the funnel by cohort period ─────────────────────────────────────────────────────────────────
// A period is a UTC calendar month or an ISO week (Monday 00:00 UTC). The trend runs from the period holding the first
// exposure to the period holding `now`, gaps included: a period nobody first got the feature in is exposed 0, a real
// zero. Each period is `computeFunnel` closed by `since`/`until`, so the trend IS the one model, per period.

export const TREND_BYS = ['month', 'week'] as const
export type TrendBy = (typeof TREND_BYS)[number]
export const asTrendBy = (v: unknown): TrendBy =>
  (TREND_BYS as readonly unknown[]).includes(v) ? (v as TrendBy) : 'month'

const DAY_MS = 86_400_000

/** The start (ms) of the period holding `t`. */
export function periodStart(t: number, by: TrendBy): number {
  const d = new Date(t)
  if (by === 'month') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return day - ((d.getUTCDay() + 6) % 7) * DAY_MS // back to Monday
}

/** The start (ms) of the period after the one starting at `start`. */
export function nextPeriodStart(start: number, by: TrendBy): number {
  if (by === 'week') return start + 7 * DAY_MS
  const d = new Date(start)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
}

/** "2026-10" for a month, "2026-10-12" (its Monday) for a week. */
export const periodLabel = (start: number, by: TrendBy) =>
  new Date(start).toISOString().slice(0, by === 'month' ? 7 : 10)

/** Every period from the one holding `first` to the one holding `now`, oldest first. */
export function trendPeriods(
  first: number,
  now: number,
  by: TrendBy
): { label: string; start: number; end: number }[] {
  const periods: { label: string; start: number; end: number }[] = []
  for (let start = periodStart(first, by); start <= now; start = nextPeriodStart(start, by))
    periods.push({ label: periodLabel(start, by), start, end: nextPeriodStart(start, by) })
  return periods
}

/** A cohort period: its funnel, or why it couldn't be read (the bounded read decides; the model never does). */
export type TrendPeriod = {
  label: string
  start: string
  end: string
  /** D2: younger than `retentionDays` past its end, so retention (and satisfaction) is still filling. */
  maturing: boolean
} & ({ state: 'read'; funnel: Funnel } | { state: 'unreadable'; reason: string })

export type FunnelTrend = { by: TrendBy; periods: TrendPeriod[] }

/**
 * The funnel by cohort period (D1). `baseActivity`: the people the caller read as active, each with when (ms); a
 * period's base is those active in it. Null when nobody was ever exposed (there is no first period).
 */
export function computeFunnelTrend(
  events: FunnelEvent[],
  rule: ExposureRule,
  measure: FunnelMeasure,
  options: {
    by: TrendBy
    now: number
    baseActivity?: ReadonlyArray<{ person: string; at: number }>
    /** funnel-truth D12 — each period's Targeted is this segment, as of the period's end (capped at now). */
    segment?: SegmentRule
    /** The rows the segment is decided from (its own read); absent = `events`. Kept apart so none is counted twice. */
    segmentEvents?: FunnelEvent[]
  }
): FunnelTrend | null {
  // An exposure dated after `now` (a skewed client clock's occurred_at) never opens a period: the trend ends at now.
  let first = Infinity
  for (const e of events)
    if (!isSystemUser(e.userId) && isExposure(e, rule) && ms(e.createdAt) <= options.now)
      first = Math.min(first, ms(e.createdAt))
  if (first === Infinity) return null
  const periods = trendPeriods(first, options.now, options.by).map(({ label, start, end }): TrendPeriod => {
    const basePeople = new Set(
      (options.baseActivity ?? []).filter((a) => a.at >= start && a.at < end).map((a) => a.person)
    )
    return {
      label,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      maturing: end + measure.retentionDays * DAY_MS > options.now,
      state: 'read',
      funnel: computeFunnel(events, rule, measure, {
        basePeople,
        since: start,
        until: end,
        ...(options.segment
          ? {
              segment: segmentMembers(
                options.segmentEvents ?? events,
                options.segment,
                Math.min(end, options.now)
              ),
            }
          : {}),
      }),
    }
  })
  return { by: options.by, periods }
}
