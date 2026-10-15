// one-bet-wired D7 — how a measured flag's funnel reads on screen, pure, so the epic page and Journeys say the same
// words. Each stage is a count and its share of the stage before; "not measured" is said, never shown as zero.
import type { FlagFunnelRead, FunnelTrendRead } from './flag-funnel-read'
import type { BetMeasure, FunnelPeriod, TrendBy, TrendPeriod } from './flag-funnel'
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

/**
 * funnel-truth D13 — a bet that names a segment its project hasn't defined: said in words with no numbers, never read
 * as everyone.
 */
export const segmentNotDefinedText = (key: string) =>
  `This bet targets ${key}, which this project hasn’t defined, so its funnel isn’t read as everyone. \`frijoles segments define ${key} --event <e> --min <n> --days <d>\` defines it.`

export function flagFunnelView(read: FlagFunnelRead | null, segmentKey?: string): FunnelView {
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
    // funnel-truth D14 — the funnel names its segment: everyone, or the bet's.
    {
      stage: segmentKey ? `Targeted: ${segmentKey}` : 'Targeted (everyone)',
      people: String(f.targeted),
      share: pct(f.rates.targeted),
    },
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
  const besideWithout =
    f.adoptedWithoutExposure === 0
      ? `Nobody adopted ${without}.`
      : `${f.adoptedWithoutExposure} ${f.adoptedWithoutExposure === 1 ? 'person' : 'people'} adopted ${without}: evidence the feature is wanted, not counted in the rates.`
  // funnel-truth D12/D14 — people exposed outside the segment, beside the funnel and never in its rates.
  const outside =
    f.outside && segmentKey
      ? ` ${f.outside.exposed} ${f.outside.exposed === 1 ? 'person' : 'people'} outside ${segmentKey} got it${f.outside.adopted === null ? '' : ` (${f.outside.adopted} adopted)`}: beside the funnel, not in its rates.`
      : ''
  const beside = besideWithout + outside
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

// ── funnel-truth D5 — the trend on screen, pure ──────────────────────────────────────────────────────────────────────
// One small chart per stage and a table of every period. A stage's line holds read periods only; retained and satisfied
// hold mature ones only (D2), so a cohort still filling never reads as a drop. Unreadable periods sit at one end of the
// trend by construction (D3: an exposure cut takes the newest, a base cut the oldest, an events cut all), so leaving
// them out never draws a line across a hole; they are named in words instead.

export const TREND_BY_LABELS: Record<TrendBy, string> = { month: 'By month', week: 'By week' }
export function trendByLinks(by: TrendBy): { by: TrendBy; label: string; current: boolean }[] {
  return (Object.keys(TREND_BY_LABELS) as TrendBy[]).map((b) => ({
    by: b,
    label: TREND_BY_LABELS[b],
    current: b === by,
  }))
}

export type TrendStage = { label: string; value: number | null; series: { date: string; value: number }[] }
export type TrendRow = {
  period: string
  gotIt: string
  adopted: string
  retained: string
  satisfied: string | null
}
export type FunnelTrendView =
  | { kind: 'unreadable' | 'not_exposed'; text: string }
  | {
      kind: 'measured'
      stages: TrendStage[]
      rows: TrendRow[]
      unreadable: string[]
      /** funnel-truth D14 — who the trend is about, when the bet names a segment; null for everyone. */
      segment: string | null
    }

const share = (part: number | null, whole: number | null) =>
  part === null || whole === null || whole === 0 ? null : Math.round((part / whole) * 100)
const shareText = (part: number | null, whole: number | null) => {
  if (part === null) return 'not measured'
  const p = share(part, whole)
  return p === null ? String(part) : `${part} (${p}%)`
}

export function funnelTrendView(read: FunnelTrendRead | null, segmentKey?: string): FunnelTrendView {
  if (read === null)
    return { kind: 'unreadable', text: 'The trend could not be read right now. This is not a zero.' }
  if (read.state === 'not_exposed')
    return {
      kind: 'not_exposed',
      text: 'Nobody has got it yet, so there is no first month to start a trend from.',
    }
  const read_ = read.periods.filter((p): p is TrendPeriod & { state: 'read' } => p.state === 'read')
  const measured = read_.some((p) => p.funnel.adopted !== null)
  const satisfiedMeasured = read_.some((p) => p.funnel.satisfied !== null)
  const point = (p: TrendPeriod & { state: 'read' }, value: number | null) =>
    value === null ? [] : [{ date: p.start.slice(0, 10), value }]
  const stage = (label: string, points: { date: string; value: number }[]): TrendStage => ({
    label,
    value: points.length ? points[points.length - 1].value : null,
    series: points,
  })
  const mature = read_.filter((p) => !p.maturing)
  const stages: TrendStage[] = [
    stage(
      'Got it (people)',
      read_.flatMap((p) => point(p, p.funnel.exposed))
    ),
  ]
  if (measured) {
    stages.push(
      stage(
        'Adopted (% who got it)',
        read_.flatMap((p) => point(p, share(p.funnel.adopted, p.funnel.exposed)))
      )
    )
    stages.push(
      stage(
        'Retained (% of adopters)',
        mature.flatMap((p) => point(p, share(p.funnel.retained, p.funnel.adopted)))
      )
    )
  }
  if (satisfiedMeasured)
    stages.push(
      stage(
        'Satisfied (% of retained)',
        mature.flatMap((p) => point(p, share(p.funnel.satisfied, p.funnel.retained)))
      )
    )
  const rows = read.periods.map((p): TrendRow => {
    if (p.state === 'unreadable')
      return {
        period: p.label,
        gotIt: 'couldn’t be read',
        adopted: '',
        retained: '',
        satisfied: satisfiedMeasured ? '' : null,
      }
    const f = p.funnel
    return {
      period: p.label,
      gotIt: String(f.exposed),
      adopted: shareText(f.adopted, f.exposed),
      retained: p.maturing && f.adopted !== null ? 'still maturing' : shareText(f.retained, f.adopted),
      satisfied: satisfiedMeasured
        ? p.maturing
          ? 'still maturing'
          : shareText(f.satisfied, f.retained)
        : null,
    }
  })
  const unreadable = read.periods.flatMap((p) =>
    p.state === 'unreadable' ? [`${p.label}: ${p.reason}`] : []
  )
  const outside = read_.reduce((n, p) => n + (p.funnel.outside?.exposed ?? 0), 0)
  const segment = segmentKey
    ? `Targeted: ${segmentKey}. Each month counts the people in it as of the month’s end; ${outside} ${outside === 1 ? 'person' : 'people'} outside it got it, beside these numbers.`
    : null
  return { kind: 'measured', stages, rows, unreadable, segment }
}
