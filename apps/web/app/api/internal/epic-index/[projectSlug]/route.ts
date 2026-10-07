import { NextResponse } from 'next/server'
import { requireProjectMembership } from '@/lib/dashboard-auth'
import { getHubRoadmapByProjectId } from '@/lib/hub-query'
import { projectEpicIndex } from '@/lib/console-palette'

// one-header-one-name · Sprint 2, Story 2.1 (epic README D7) — ⌘K's epics, fetched on the palette's FIRST open.
//
// Gated exactly like its sibling `feature-index`: `requireProjectMembership` (a session AND a membership of THIS
// project, re-checked against the viewer's workspaces in `lib/membership.ts`), so a slug in the URL names a project
// only for someone who already belongs to it — a non-member gets the same 404 as a project that does not exist. One
// project, the active one: the palette never lists another project's epics. `private, no-store`: a per-viewer answer.
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params
  // By the membership's project ID, not the slug again: the slug picked the membership, the id is what it resolved to
  // (`getHubRoadmapByProjectId`'s own note on why a re-derived slug is the wrong key).
  const membership = await requireProjectMembership(projectSlug)
  const result = await getHubRoadmapByProjectId(membership.projectId)
  if (!result.ok && result.reason === 'query_failed') {
    return NextResponse.json(
      { error: 'epic_index_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
  const items =
    result.ok && Array.isArray(result.artifact.payload?.items) ? result.artifact.payload.items : []
  return NextResponse.json(
    { epics: projectEpicIndex(items) },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
