import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { requireDashboardAccess } from '@/lib/dashboard-auth'
import { getHubRoadmap } from '@/lib/hub-query'
import { formatFreshness } from '@/lib/hub-freshness'
import { boardQuery, findCard, hasStages, parseBoardFilters } from '@/lib/hub-board'
import { epicFinops } from '@/lib/roadmap-finops'
import { readEpicFlag } from '@/lib/epic-flag'
import { Crumb, Crumbs } from '@/design-system/primitives'
import { HubShell } from '../../../hub-shell'
import { EmptyBoard } from '../../board/board-components'
import { FlagFunnel } from '@/components/product/FlagFunnel'
import { PeriodChoice } from '@/components/product/PeriodChoice'
import {
  asTrendBy,
  parsePeriod,
  unknownPeriodError,
  type FunnelPeriod,
  type TrendBy,
} from '@/lib/flag-funnel'
import { betFunnelView, betTrendView } from '@/lib/bet-funnel'
import { funnelBetOf } from '@/lib/flag-funnel-view'
import { isFlagFunnelsEnabled, isFunnelTrendEnabled } from '@/lib/flags'
import { noteFunnelTrendViewed } from '@/lib/funnel-trend-screen'
import { FunnelTrend } from '@/components/product/FunnelTrend'
import { readOwedOnScreen } from '@/lib/owed-screen'
import { trackSelfEvent, OWED_VIEWED_EVENT } from '@/lib/self-track'
import {
  EpicBars,
  EpicDocs,
  EpicFlag,
  EpicFreshness,
  EpicHead,
  EpicOwed,
  EpicSpend,
  EpicTrack,
  EpicWhy,
  NowPanel,
} from './epic-components'

export const dynamic = 'force-dynamic'

// one-epic-page — ONE page per epic (audit decision 4; dogfood F44). The Board's card view (`?card=`) and the Hub's
// epic drill-down showed the same epic with different content; this page is both, and `?card=` now redirects here
// (lock D3). It reads the pushed row as a `BoardCard` (D1) — the same object the board draws its card from — so the
// board and the page cannot disagree about a field, and a seed (Backlog, Grooming) gets a page too.
//
// Gating is every hub page's (`requireDashboardAccess`): a member reads it, the demo project is public by design
// (AGENTS rule #2). Workspace-board cards link here through the card's OWN project, so access stays that project's.
export default async function HubEpicPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string; epicSlug: string }>
  searchParams: Promise<{
    type?: string | string[]
    risk?: string | string[]
    period?: string | string[]
    by?: string | string[]
  }>
}) {
  const { projectSlug, epicSlug } = await params
  const query = await searchParams
  await requireDashboardAccess(projectSlug)

  // D3 — Back returns to the board with the filters it was opened from. Only the two whitelisted filters survive
  // `parseBoardFilters`, so nothing a link carries is ever reflected into the href.
  const back = {
    href: `/hub/${encodeURIComponent(projectSlug)}/board${boardQuery(parseBoardFilters(query))}`,
    label: 'Board',
  }

  const result = await getHubRoadmap(projectSlug)
  if (!result.ok) {
    if (result.reason === 'query_failed') throw new Error('Roadmap artifact lookup failed')
    if (result.reason === 'project_not_found') notFound()
    // 'no_artifact': nothing has been pushed, so there is no epic to open — the board's own empty state says how to
    // push, rather than a 404 that reads as "this epic does not exist".
    return (
      <HubShell projectSlug={projectSlug} tab="board">
        <Crumbs back={back}>
          <Crumb mono>{epicSlug}</Crumb>
        </Crumbs>
        <EmptyBoard />
      </HubShell>
    )
  }

  const { artifact } = result
  const items = Array.isArray(artifact.payload?.items) ? artifact.payload.items : []
  // A push from before stages carries none: the page would have to guess where an epic is, and the Hub never computes
  // a stage (board lock D19). Same empty state as the board. Live at the lock: no project's push is stage-less.
  if (!hasStages(items)) {
    return (
      <HubShell projectSlug={projectSlug} tab="board">
        <Crumbs back={back}>
          <Crumb mono>{epicSlug}</Crumb>
        </Crumbs>
        <EmptyBoard />
      </HubShell>
    )
  }

  const card = findCard(items, epicSlug)
  if (!card) notFound()

  const repo = (artifact.payload as { board?: { repo?: string } }).board?.repo ?? null
  // D12 — this project's registry only, by the id the read above resolved after the access gate (D2).
  const flag = await readEpicFlag(result.projectId, card.flagKey, card.flagNote)
  // one-bet-wired D7 — the measured flag's funnel, for THIS project (the id the access gate resolved), behind its switch.
  const funnelBet = funnelBetOf(card)
  const periodParam = Array.isArray(query.period) ? query.period[0] : query.period
  const parsedPeriod = parsePeriod(periodParam)
  const period = parsedPeriod ?? 'all'
  // The period link keeps the filters the page was opened with (they only matter to Back).
  const by = asTrendBy(Array.isArray(query.by) ? query.by[0] : query.by)
  const epicHref = (extra: Record<string, string>) =>
    `/hub/${encodeURIComponent(projectSlug)}/epic/${encodeURIComponent(epicSlug)}${boardQuery(parseBoardFilters(query), extra)}`
  const byHref = (b: TrendBy) => epicHref({ period, by: b })
  const funnelsOn = funnelBet !== null && (await isFlagFunnelsEnabled())
  const funnel = funnelsOn
    ? await betFunnelView(result.projectId, funnelBet, card.measure?.targetSegment, period)
    : null
  // funnel-truth D5/D6 — the flag's trend under its funnel, behind both switches. D7: counted only for a member.
  const trend =
    funnelsOn && (await isFunnelTrendEnabled())
      ? await betTrendView(result.projectId, funnelBet, card.measure?.targetSegment, by)
      : null
  if (trend) await noteFunnelTrendViewed(result.projectId)
  // D6: with the trend off, the period links are exactly as before (verifier, #378).
  const periodHref = (p: FunnelPeriod) => epicHref(trend ? { period: p, by } : { period: p })
  const freshness = formatFreshness(artifact.generatedAt, new Date(), artifact.sourceCommit)
  // owed-on-screen S2.1 — a member's owed checks for THIS epic, behind the flag. `{ ok: false }` (flag off, signed out,
  // not a member, nothing pushed) leaves the page exactly as it was.
  const owedRead = await readOwedOnScreen(result.projectId)
  const owed = owedRead.ok ? owedRead.items.filter((item) => item.epic === card.slug) : []
  // D11 — once per page view that rendered at least one owed check, as the member (person = user subject).
  if (owedRead.ok && owed.length > 0) after(() => trackSelfEvent(OWED_VIEWED_EVENT, owedRead.userId))

  return (
    <HubShell projectSlug={projectSlug} tab="board">
      <Crumbs back={back}>
        <Crumb mono>{card.slug}</Crumb>
      </Crumbs>
      <EpicHead card={card} />
      <EpicTrack card={card} />
      <NowPanel card={card} product={projectSlug} />
      <EpicWhy card={card} />
      <EpicBars card={card} />
      {/* A seed has no flag and no spend (S1.1): those come with refining. */}
      {card.grain === 'Epic' ? <EpicFlag flag={flag} projectSlug={projectSlug} /> : null}
      {funnel ? (
        <section className="ds-epic-section" aria-label="The flag's funnel">
          <h2 className="ds-label">The flag&apos;s funnel</h2>
          <PeriodChoice period={period} hrefFor={periodHref} />
          {parsedPeriod === null ? (
            <p className="ds-hint" role="status">
              {unknownPeriodError(periodParam)} Showing all time.
            </p>
          ) : null}
          <FlagFunnel view={funnel} />
        </section>
      ) : null}
      {trend ? <FunnelTrend view={trend} by={by} hrefFor={byHref} /> : null}
      {card.grain === 'Epic' && card.finops ? (
        <EpicSpend finops={epicFinops(card.finops)} projectSlug={projectSlug} slug={card.slug} />
      ) : null}
      <EpicOwed items={owed} repo={repo} />
      <EpicDocs card={card} repo={repo} />
      <EpicFreshness freshness={freshness} />
    </HubShell>
  )
}
