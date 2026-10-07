import { notFound, redirect } from 'next/navigation'
import { requireDashboardAccess } from '@/lib/dashboard-auth'
import { getHubRoadmap } from '@/lib/hub-query'
import { formatFreshness } from '@/lib/hub-freshness'
import { boardQuery, buildBoard, hasStages, parseBoardFilters } from '@/lib/hub-board'
import { HubShell } from '../../hub-shell'
import { BoardView, EmptyBoard } from './board-components'

export const dynamic = 'force-dynamic'

// board-sinks-and-scrumban · Sprint 2 — `/hub/<slug>/board`: every initiative on the six stages (S2.2) and the type/risk
// filters in the URL (S2.4). A card opens its epic page (one-epic-page D3); an old `?card=<slug>` link redirects there.
//
// The Hub never computes a stage (lock D19): `lib/hub-board.ts` groups the rows the push already resolved, and this
// page renders what it returns. Gating is the other hub pages' (`requireDashboardAccess`): a member reads it, and the
// demo project — this repo's own self-tenant, `golden-beans-demo` — is public by design (AGENTS rule #2, lock C2).
// A share link does not reach it in v1 (lock C10).
export default async function HubBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string }>
  searchParams: Promise<{ card?: string | string[]; type?: string | string[]; risk?: string | string[] }>
}) {
  const { projectSlug } = await params
  const query = await searchParams
  await requireDashboardAccess(projectSlug)

  // one-epic-page D3 — `?card=` is in shared links (and the build view's), so it redirects rather than breaks; the
  // filters ride along so the epic page's Back returns to the same board. After the access gate, so the redirect
  // confirms nothing to a viewer the board would refuse; the epic page gates again on its own.
  const cardSlug = Array.isArray(query.card) ? query.card[0] : query.card
  if (cardSlug) {
    redirect(
      `/hub/${encodeURIComponent(projectSlug)}/epic/${encodeURIComponent(cardSlug)}${boardQuery(parseBoardFilters(query))}`
    )
  }

  const result = await getHubRoadmap(projectSlug)
  if (!result.ok) {
    if (result.reason === 'query_failed') throw new Error('Roadmap artifact lookup failed')
    if (result.reason === 'project_not_found') notFound()
    return (
      <HubShell projectSlug={projectSlug} tab="board">
        <EmptyBoard />
      </HubShell>
    )
  }

  const { artifact } = result
  const items = Array.isArray(artifact.payload?.items) ? artifact.payload.items : []
  // A roadmap pushed before this epic carries no stages: that is "nothing on the board yet", said with the command
  // that fixes it — never a board of six empty columns pretending to be a reading.
  if (!hasStages(items)) {
    return (
      <HubShell projectSlug={projectSlug} tab="board">
        <EmptyBoard />
      </HubShell>
    )
  }

  const filters = parseBoardFilters(query)
  const boardBlock = (
    artifact.payload as { board?: { wip?: { Building?: number; QA?: number }; repo?: string } }
  ).board
  const freshness = formatFreshness(artifact.generatedAt, new Date(), artifact.sourceCommit)
  const base = `/hub/${encodeURIComponent(projectSlug)}/board`

  const board = buildBoard(items, { filters, wip: boardBlock?.wip ?? null })
  return (
    <HubShell projectSlug={projectSlug} tab="board">
      <BoardView
        board={board}
        filters={filters}
        base={base}
        freshness={freshness}
        version={artifact.version}
      />
    </HubShell>
  )
}
