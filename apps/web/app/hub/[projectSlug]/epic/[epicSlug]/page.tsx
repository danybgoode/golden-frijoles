import { notFound } from 'next/navigation'
import { requireDashboardAccess } from '@/lib/dashboard-auth'
import { getHubRoadmap } from '@/lib/hub-query'
import { formatFreshness } from '@/lib/hub-freshness'
import { boardQuery, findCard, hasStages, parseBoardFilters } from '@/lib/hub-board'
import { epicFinops } from '@/lib/roadmap-finops'
import { readEpicFlag } from '@/lib/epic-flag'
import { Crumb, Crumbs } from '@/design-system/primitives'
import { HubShell } from '../../../hub-shell'
import { EmptyBoard } from '../../board/board-components'
import {
  EpicBars,
  EpicDocs,
  EpicFlag,
  EpicFreshness,
  EpicHead,
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
  searchParams: Promise<{ type?: string | string[]; risk?: string | string[] }>
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
  const freshness = formatFreshness(artifact.generatedAt, new Date(), artifact.sourceCommit)

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
      {card.grain === 'Epic' && card.finops ? (
        <EpicSpend finops={epicFinops(card.finops)} projectSlug={projectSlug} slug={card.slug} />
      ) : null}
      <EpicDocs card={card} repo={repo} />
      <EpicFreshness freshness={freshness} />
    </HubShell>
  )
}
