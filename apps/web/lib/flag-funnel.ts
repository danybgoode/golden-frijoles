// one-bet-wired D2 — a measured flag's funnel on the TARS model agreed with Daniel (2026-10-10), pure.
//
// TARS's Targeted is a strategy decision (the share of the base that has the problem), NOT who was exposed. So the
// funnel reads: Base (the period's active users) → Targeted (the bet's segment; `everyone` until tars-segments) →
// Exposed (got the flag `on`) → Adopted (the adoption event at or after first exposure) → Retained (a repeat within the
// window) → Satisfied (an optional event, else null: "not measured"). People who did the adoption event WITHOUT being
// exposed first are real evidence of value but do not validate the bet, so they are counted BESIDE the funnel and never
// enter its rates. `lib/tars.ts` (the older TAR funnels) is unchanged; moving it to this model is tars-segments.

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

export type BetMeasure = {
  flagKey: string
  adoptedEvent: string
  /** null: a repeat of the adoption event. */
  retainedEvent: string | null
  retentionDays: number
  /** null: satisfaction is not measured. */
  satisfiedEvent: string | null
}

export type FlagFunnel = {
  base: number
  targeted: number
  exposed: number
  adopted: number
  retained: number
  /** null when the bet names no satisfaction event: "not measured", never zero. */
  satisfied: number | null
  /** Did the adoption event without (or before) being exposed: beside the funnel, not in it. */
  adoptedWithoutExposure: number
  /** Each stage as a share of the one before; null when the one before is zero. */
  rates: {
    targeted: number | null
    exposed: number | null
    adopted: number | null
    retained: number | null
    satisfied: number | null
  }
}

const ms = (iso: string) => new Date(iso).getTime()
const rate = (part: number, whole: number) => (whole === 0 ? null : part / whole)

/**
 * `basePeople`: the period's active people when the caller read them separately (the bounded read does); the people in
 * `events` always count too, so the base can never be smaller than the funnel.
 */
export function computeFlagFunnel(
  events: FunnelEvent[],
  bet: BetMeasure,
  options: { basePeople?: ReadonlySet<string> } = {}
): FlagFunnel {
  const people = events.filter((e) => !isSystemUser(e.userId))
  const base = new Set(
    [...(options.basePeople ?? []), ...people.map((e) => e.userId)].filter((u) => !isSystemUser(u))
  )
  const targeted = base // `everyone` (D1): the whole base

  const firstExposure = new Map<string, number>()
  for (const e of people) {
    if (e.event !== FLAG_EVALUATED_EVENT || e.featureId !== bet.flagKey || e.variant !== 'on') continue
    const t = ms(e.createdAt)
    if (!firstExposure.has(e.userId) || t < firstExposure.get(e.userId)!) firstExposure.set(e.userId, t)
  }

  const firstAdoption = new Map<string, number>()
  const adoptedWithoutExposure = new Set<string>()
  for (const e of people) {
    if (e.event !== bet.adoptedEvent) continue
    const t = ms(e.createdAt)
    const exposedAt = firstExposure.get(e.userId)
    if (exposedAt === undefined || t < exposedAt) {
      adoptedWithoutExposure.add(e.userId)
      continue
    }
    if (!targeted.has(e.userId)) continue
    if (!firstAdoption.has(e.userId) || t < firstAdoption.get(e.userId)!) firstAdoption.set(e.userId, t)
  }
  // Someone who adopted before exposure AND again after it adopted through the flag: count them in the funnel only.
  for (const userId of firstAdoption.keys()) adoptedWithoutExposure.delete(userId)

  const retentionEvent = bet.retainedEvent ?? bet.adoptedEvent
  const windowMs = bet.retentionDays * 86_400_000
  const retained = new Set<string>()
  for (const e of people) {
    const adoptedAt = firstAdoption.get(e.userId)
    if (adoptedAt === undefined || e.event !== retentionEvent) continue
    const t = ms(e.createdAt)
    if (t > adoptedAt && t <= adoptedAt + windowMs) retained.add(e.userId)
  }

  let satisfied: number | null = null
  if (bet.satisfiedEvent !== null) {
    const happy = new Set<string>()
    for (const e of people) {
      const adoptedAt = firstAdoption.get(e.userId)
      if (
        retained.has(e.userId) &&
        adoptedAt !== undefined &&
        e.event === bet.satisfiedEvent &&
        ms(e.createdAt) >= adoptedAt
      )
        happy.add(e.userId)
    }
    satisfied = happy.size
  }

  const counts = {
    base: base.size,
    targeted: targeted.size,
    exposed: [...firstExposure.keys()].filter((u) => targeted.has(u)).length,
    adopted: firstAdoption.size,
    retained: retained.size,
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
      satisfied: satisfied === null ? null : rate(satisfied, counts.retained),
    },
  }
}
