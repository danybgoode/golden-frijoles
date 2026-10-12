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
}

/** A measured flag's bet: its flag and what it reads (one-bet-wired D1). */
export type BetMeasure = FunnelMeasure & { flagKey: string; adoptedEvent: string }

/** The period a funnel follows: the people first exposed in it (D2). `all` is the feature's whole life. */
export const FUNNEL_PERIODS = ['all', '90d', '30d'] as const
export type FunnelPeriod = (typeof FUNNEL_PERIODS)[number]
export const PERIOD_DAYS: Record<FunnelPeriod, number | null> = { all: null, '90d': 90, '30d': 30 }
export const asPeriod = (v: unknown): FunnelPeriod =>
  (FUNNEL_PERIODS as readonly unknown[]).includes(v) ? (v as FunnelPeriod) : 'all'

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
 * `basePeople`: the period's active people when the caller read them separately (the bounded read does); people in
 * `events` active in the period always count too, so the base is never smaller than the funnel.
 */
export function computeFunnel(
  events: FunnelEvent[],
  rule: ExposureRule,
  measure: FunnelMeasure,
  options: { basePeople?: ReadonlySet<string>; since?: number } = {}
): Funnel {
  const since = options.since ?? -Infinity
  const people = events.filter((e) => !isSystemUser(e.userId))
  const base = new Set(
    [
      ...(options.basePeople ?? []),
      ...people.filter((e) => ms(e.createdAt) >= since).map((e) => e.userId),
    ].filter((u) => !isSystemUser(u))
  )
  const targeted = base // `everyone` (one-bet-wired D1): the whole base

  // Every person's FIRST exposure, all time: the cohort is who first got it in the period (D2).
  const firstExposure = new Map<string, number>()
  for (const e of people) {
    if (!isExposure(e, rule)) continue
    const t = ms(e.createdAt)
    if (!firstExposure.has(e.userId) || t < firstExposure.get(e.userId)!) firstExposure.set(e.userId, t)
  }
  const cohort = new Set([...firstExposure].filter(([u, t]) => t >= since && targeted.has(u)).map(([u]) => u))

  const adoptedWithoutExposure = new Set<string>()
  const adoptedAfterExposure = new Set<string>() // any cohort: such a person adopted through the feature
  const firstAdoption = new Map<string, number>()
  if (measure.adoptedEvent !== null) {
    for (const e of people) {
      if (e.event !== measure.adoptedEvent) continue
      const t = ms(e.createdAt)
      const exposedAt = firstExposure.get(e.userId)
      if (exposedAt === undefined || t < exposedAt) {
        if (t >= since) adoptedWithoutExposure.add(e.userId)
        continue
      }
      adoptedAfterExposure.add(e.userId)
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
    const happy = new Set<string>()
    for (const e of people) {
      const adoptedAt = firstAdoption.get(e.userId)
      if (
        retained.has(e.userId) &&
        adoptedAt !== undefined &&
        e.event === measure.satisfiedEvent &&
        ms(e.createdAt) >= adoptedAt
      )
        happy.add(e.userId)
    }
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
    rates: {
      targeted: rate(counts.targeted, counts.base),
      exposed: rate(counts.exposed, counts.targeted),
      adopted: rate(counts.adopted, counts.exposed),
      retained: rate(counts.retained, counts.adopted),
      satisfied: rate(satisfied, counts.retained),
    },
  }
}

/** A measured flag's funnel (one-bet-wired): the model with a flag's exposure rule. */
export function computeFlagFunnel(
  events: FunnelEvent[],
  bet: BetMeasure,
  options: { basePeople?: ReadonlySet<string>; since?: number } = {}
): Funnel {
  return computeFunnel(events, { kind: 'flag', flagKey: bet.flagKey }, bet, options)
}
