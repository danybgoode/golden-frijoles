import 'server-only'
import { getMembershipByProjectId } from './membership'
import { getLatestRoadmapWithOwed } from './report-artifacts'
import { owedForViewer, type OwedRow } from './owed'

// owed-on-screen D7 — the ONE way a screen reaches owed checks: a member of the project gets them, anyone else gets
// nothing, and the public project is no exception (its roadmap is public by rule #2; who owes what is not).
//
// `projectId` is the id the calling page's own read already resolved after its access gate (one-epic-page D2) — never
// re-derived from a slug. `getMembershipByProjectId` fails closed and re-checks the caller's workspaces, so a person
// removed from a workspace is denied here too (AGENTS § The tenancy invariant).

export type OwedRead =
  | { ok: true; items: OwedRow[]; generatedAt: string; sourceCommit: string | null }
  // Not a member, signed out, never pushed, or a push with no owed block: the screen renders exactly what it did
  // before. One answer for all of them, so a stranger learns nothing about whether the project keeps a ledger.
  | { ok: false }

export async function getOwedForViewer(projectId: string, userId: string | null): Promise<OwedRead> {
  if (!userId) return { ok: false }
  const membership = await getMembershipByProjectId(userId, projectId)
  if (!membership) return { ok: false }
  const artifact = await getLatestRoadmapWithOwed(projectId)
  if (!artifact) return { ok: false }
  const items = owedForViewer(artifact.payload, true)
  if (items === null) return { ok: false }
  return { ok: true, items, generatedAt: artifact.generatedAt, sourceCommit: artifact.sourceCommit }
}
