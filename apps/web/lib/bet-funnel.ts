import 'server-only'
import { getFlagFunnel, getFlagFunnelTrend } from './event-catalog-query'
import { EVERYONE, type BetMeasure, type FunnelPeriod, type SegmentRule, type TrendBy } from './flag-funnel'
import {
  flagFunnelView,
  funnelTrendView,
  segmentNotDefinedText,
  type FunnelTrendView,
  type FunnelView,
} from './flag-funnel-view'
import { getSegment } from './segments'

// funnel-truth D12–D14 — a bet's funnel and trend for ONE project, aimed at the segment the bet names. The one seam the
// epic page and Journeys' From your flags read a bet through, so a segment is resolved the same way everywhere: `everyone`
// reads as before; a defined key narrows Targeted; an undefined key says so with no numbers (never read as everyone);
// a failed lookup reads as unreadable, never as everyone either.

type Resolved = { kind: 'everyone' } | { kind: 'segment'; rule: SegmentRule } | { kind: 'text'; text: string }

async function resolve(projectId: string, key: string | undefined): Promise<Resolved> {
  if (!key || key === EVERYONE) return { kind: 'everyone' }
  const segment = await getSegment(projectId, key).catch(() => 'failed' as const)
  if (segment === 'failed')
    return { kind: 'text', text: `The ${key} segment could not be read right now. This is not a zero.` }
  if (segment === null) return { kind: 'text', text: segmentNotDefinedText(key) }
  return { kind: 'segment', rule: segment }
}

export async function betFunnelView(
  projectId: string,
  bet: BetMeasure,
  segmentKey: string | undefined,
  period: FunnelPeriod
): Promise<FunnelView> {
  const s = await resolve(projectId, segmentKey)
  if (s.kind === 'text') return { kind: 'unreadable', text: s.text }
  const rule = s.kind === 'segment' ? s.rule : undefined
  return flagFunnelView(await getFlagFunnel(projectId, bet, period, rule).catch(() => null), rule?.key)
}

export async function betTrendView(
  projectId: string,
  bet: BetMeasure,
  segmentKey: string | undefined,
  by: TrendBy
): Promise<FunnelTrendView> {
  const s = await resolve(projectId, segmentKey)
  if (s.kind === 'text') return { kind: 'unreadable', text: s.text }
  const rule = s.kind === 'segment' ? s.rule : undefined
  return funnelTrendView(await getFlagFunnelTrend(projectId, bet, by, rule).catch(() => null), rule?.key)
}
