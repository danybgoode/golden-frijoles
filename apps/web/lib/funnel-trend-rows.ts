import type { TrendPeriod } from './flag-funnel'
import type { FunnelTrendRead } from './flag-funnel-read'

// funnel-truth S1.4 (D8) — the trend as plain JSON rows, for an agent. PURE: no server-only imports, so the CLI route
// (`/api/v1/cli/funnel`) and the connector's `get_tars_funnel { by }` render the SAME rows from the one trend read.
// Counts only, never a person (the anonymous public reader's reply is scrubbed on top of this).

export type FunnelTrendRow =
  | {
      label: string
      start: string
      end: string
      maturing: boolean
      state: 'read'
      exposed: number
      adopted: number | null
      /** null when no retained event is named. A maturing period's count is still filling: read it with `maturing`. */
      retained: number | null
      adoptedWithoutExposure: number
    }
  | { label: string; start: string; end: string; maturing: boolean; state: 'unreadable'; reason: string }

export type FunnelTrendRows =
  { state: 'not_exposed' } | { state: 'measured'; from: string; to: string; periods: FunnelTrendRow[] }

const row = (p: TrendPeriod): FunnelTrendRow => {
  const head = { label: p.label, start: p.start, end: p.end, maturing: p.maturing }
  if (p.state === 'unreadable') return { ...head, state: 'unreadable', reason: p.reason }
  const f = p.funnel
  return {
    ...head,
    state: 'read',
    exposed: f.exposed,
    adopted: f.adopted,
    retained: f.retained,
    adoptedWithoutExposure: f.adoptedWithoutExposure,
  }
}

export function funnelTrendRows(trend: FunnelTrendRead): FunnelTrendRows {
  if (trend.state === 'not_exposed') return { state: 'not_exposed' }
  return { state: 'measured', from: trend.from, to: trend.to, periods: trend.periods.map(row) }
}
