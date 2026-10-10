// one-bet-wired D7 — how a measured flag's funnel reads on screen, pure, so the epic page and Journeys say the same
// words. Each stage is a count and its share of the stage before; "not measured" is said, never shown as zero.
import type { FlagFunnelRead } from './flag-funnel-read'

export type FunnelRow = { stage: string; people: string; share: string }
export type FunnelView =
  | { kind: 'unreadable'; text: string }
  | { kind: 'not_exposed'; text: string }
  | { kind: 'measured'; rows: FunnelRow[]; beside: string; note: string | null }

const pct = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

export function flagFunnelView(read: FlagFunnelRead | null): FunnelView {
  if (read === null)
    return { kind: 'unreadable', text: 'The funnel could not be read right now. This is not a zero.' }
  if (read.state === 'not_exposed')
    return {
      kind: 'not_exposed',
      text: 'Nobody has had this flag on yet, so there is no funnel. Roll it out to someone and it fills from there.',
    }
  const f = read.funnel
  const rows: FunnelRow[] = [
    { stage: 'Active users', people: String(f.base), share: '' },
    { stage: 'Targeted (everyone)', people: String(f.targeted), share: pct(f.rates.targeted) },
    { stage: 'Got the flag on', people: String(f.exposed), share: pct(f.rates.exposed) },
    { stage: 'Adopted', people: String(f.adopted), share: pct(f.rates.adopted) },
    { stage: 'Retained', people: String(f.retained), share: pct(f.rates.retained) },
    f.satisfied === null
      ? { stage: 'Satisfied', people: 'not measured', share: '' }
      : { stage: 'Satisfied', people: String(f.satisfied), share: pct(f.rates.satisfied) },
  ]
  const beside =
    f.adoptedWithoutExposure === 0
      ? 'Nobody adopted without the flag on.'
      : `${f.adoptedWithoutExposure} ${f.adoptedWithoutExposure === 1 ? 'person' : 'people'} adopted without the flag on: evidence the feature is wanted, not counted in the rates.`
  const note = read.truncated
    ? `More events than one read covers since ${read.from.slice(0, 10)}: the counts are a lower bound.`
    : null
  return { kind: 'measured', rows, beside, note }
}
