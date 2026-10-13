// one-bet-wired D7 — how a measured flag's funnel reads on screen, pure, so the epic page and Journeys say the same
// words. Each stage is a count and its share of the stage before; "not measured" is said, never shown as zero.
import type { FlagFunnelRead } from './flag-funnel-read'
import type { BetMeasure, FunnelPeriod } from './flag-funnel'
import type { BoardCard } from './hub-board'

/** The bet an epic card measures, or null: an Epic with a flag and an adoption event (one-bet-wired D1, D7). */
export function funnelBetOf(card: Pick<BoardCard, 'grain' | 'flagKey' | 'measure'>): BetMeasure | null {
  if (card.grain !== 'Epic' || !card.flagKey || !card.measure) return null
  const { adoptedEvent, retainedEvent, retentionDays, satisfiedEvent } = card.measure
  return { flagKey: card.flagKey, adoptedEvent, retainedEvent, retentionDays, satisfiedEvent }
}

export type FunnelRow = { stage: string; people: string; share: string }
export type FunnelView =
  | { kind: 'unreadable'; text: string }
  | { kind: 'not_exposed'; text: string }
  | { kind: 'measured'; rows: FunnelRow[]; beside: string; note: string | null }

const pct = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`)
/** A stage's count, or "not measured" (tars-one-model D1: a feature naming no adoption event), never a zero. */
const stageRow = (stage: string, people: number | null, rate: number | null): FunnelRow =>
  people === null
    ? { stage, people: 'not measured', share: '' }
    : { stage, people: String(people), share: pct(rate) }

/** The three periods a funnel can follow, as plain-link choices (tars-one-model D2); `current` marks the one shown. */
export const PERIOD_LABELS: Record<FunnelPeriod, string> = {
  all: 'Whole life',
  '90d': 'Last 90 days',
  '30d': 'Last 30 days',
}
export function periodLinks(
  period: FunnelPeriod
): { period: FunnelPeriod; label: string; current: boolean }[] {
  return (Object.keys(PERIOD_LABELS) as FunnelPeriod[]).map((p) => ({
    period: p,
    label: PERIOD_LABELS[p],
    current: p === period,
  }))
}

/** Tars-one-model D8: the one-time note that feature funnels changed how they count, shown until this date. */
export const FUNNEL_MODEL_NOTE_UNTIL = '2026-11-12'
export const FUNNEL_MODEL_NOTE =
  'Funnels now count adoption among the people who got the feature, across its whole life. Numbers before 12 Oct 2026 counted it differently.'
export function funnelModelNote(now: Date): string | null {
  return now.getTime() < new Date(`${FUNNEL_MODEL_NOTE_UNTIL}T00:00:00Z`).getTime() ? FUNNEL_MODEL_NOTE : null
}

export function flagFunnelView(read: FlagFunnelRead | null): FunnelView {
  if (read === null)
    return { kind: 'unreadable', text: 'The funnel could not be read right now. This is not a zero.' }
  const feature = read.source.kind === 'feature' ? read.source : null
  if (read.state === 'not_exposed')
    return {
      kind: 'not_exposed',
      text: feature
        ? `Nobody has been counted with this feature’s ${feature.targetEvent ?? 'target'} event yet. It fills once the app reports it.`
        : 'No one has been counted with this flag on yet. It fills once the flag is on for someone and the app reports the evaluation (refine’s Measure step says how).',
    }
  const f = read.funnel
  const rows: FunnelRow[] = [
    { stage: 'Active users', people: String(f.base), share: '' },
    { stage: 'Targeted (everyone)', people: String(f.targeted), share: pct(f.rates.targeted) },
    {
      stage: feature
        ? feature.targetEvent === null
          ? 'Used it'
          : `Saw it (${feature.targetEvent})`
        : 'Got the flag on',
      people: String(f.exposed),
      share: pct(f.rates.exposed),
    },
    stageRow('Adopted', f.adopted, f.rates.adopted),
    stageRow('Retained', f.retained, f.rates.retained),
    stageRow('Satisfied', f.satisfied, f.rates.satisfied),
  ]
  const without = feature ? 'without seeing it' : 'without the flag on'
  const beside =
    f.adoptedWithoutExposure === 0
      ? `Nobody adopted ${without}.`
      : `${f.adoptedWithoutExposure} ${f.adoptedWithoutExposure === 1 ? 'person' : 'people'} adopted ${without}: evidence the feature is wanted, not counted in the rates.`
  // Each capped read skews different numbers; say which (verifier, #341).
  const notes = [
    read.truncated.exposures &&
      (feature
        ? 'Only the earliest exposures could be read: people first exposed later count as adopting without seeing it, so saw-it and adopted read low.'
        : 'Only the earliest exposures could be read: people first exposed later count as adopting without the flag, so got-the-flag-on and adopted read low.'),
    read.truncated.events &&
      `More adoption and retention events since ${read.from.slice(0, 10)} than one read covers: adopted and retained may read low.`,
    read.truncated.base &&
      'More active users than one read covers: active users is a lower bound, so the first two shares may read high.',
  ].filter((n): n is string => typeof n === 'string')
  if (f.adopted === null) notes.push('Name an adoption event for this feature to read adoption.')
  const note = notes.length ? notes.join(' ') : null
  return { kind: 'measured', rows, beside, note }
}
