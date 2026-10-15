import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getWorkspaceProjects } from './workspace'
import { getProjectOutcome } from './pod-report-query'
import { listExperimentRegistries } from './experiments'
import { getFlagRegistryView } from './flag-registry'
import { projectFlagRows } from './flag-list-view'
import { getLatestArtifact } from './report-artifacts'
import { isOwedOnScreenEnabled } from './flags'
import { getOwedForViewer } from './owed-read'
import { epicFinopsFromArtifact } from './roadmap-finops'
import { readLoopStage } from './loop-stage-store'
import { assemblePortfolio, type PortfolioReaders, type PortfolioRow } from './portfolio-model'

export type { PortfolioRow } from './portfolio-model'

// portfolio-view · Sprint 1, Story 1.1 (Roadmap/02-commercial/portfolio-view — the Architecture lock, D1, D8, D10).
//
// ⚠️ **The project list comes from `getWorkspaceProjects()` and from nowhere else** (AGENTS.md § The tenancy invariant
// — cited, not restated). Every reader below takes ONE project id from that list; none of them lists, joins or filters
// by several. Widening this to "every project in the workspace" is the one change the invariant exists to forbid, and
// `e2e/portfolio-access.spec.ts` (and, signed in, Sprint 2's `e2e/portfolio.authed.spec.ts`) seeds a sibling
// project the viewer is not a member of to catch exactly that.
//
// Every reader is the one the product's own single-project pages already use (D10) — the portfolio adds no query of
// its own except the loop stage, which it reads per project rather than by widening the legal read.

const readers: PortfolioReaders = {
  loopStage: (projectId) => readLoopStage(getSupabaseServiceClient(), projectId),
  // The read Today renders its North Star tile and funnel from — so the two surfaces cannot disagree.
  outcome: (project) => getProjectOutcome(project.id, project.slug),
  experiments: (projectId) => listExperimentRegistries(projectId),
  // Production, because that is what Today's "On in Production" tile counts and what a kill switch protects.
  flags: async (projectId) => projectFlagRows((await getFlagRegistryView(projectId)).flags, 'production'),
  podReport: (projectId) => getLatestArtifact(projectId, 'pod_report'),
  roadmap: (projectId) => getLatestArtifact(projectId, 'roadmap'),
  epicSpend: epicFinopsFromArtifact,
  // Replaced per call in `getPortfolio`: it needs the viewer and the flag. Nothing may be said until it is.
  owed: async () => null,
}

/**
 * One row per product of `workspaceId` that `userId` is a member of — and nothing at all unless they belong to that
 * workspace (both decided by `getWorkspaceProjects`, which returns [] on any error: it fails closed).
 */
export async function getPortfolio(userId: string, workspaceId: string): Promise<PortfolioRow[]> {
  // owed-on-screen S2.3 (D9) — the flag FIRST: off, no owed read happens at all. On, each product's count is its OWN
  // push, one project per read, by an id `getWorkspaceProjects` returned; `getOwedForViewer` re-checks that the viewer is
  // a member of it, so a project they cannot open contributes nothing.
  const owedOn = await isOwedOnScreenEnabled()
  const owed = owedOn
    ? async (projectId: string) => {
        const read = await getOwedForViewer(projectId, userId)
        return read.ok ? read.items.length : null
      }
    : readers.owed
  return assemblePortfolio(await getWorkspaceProjects(userId, workspaceId), { ...readers, owed })
}
