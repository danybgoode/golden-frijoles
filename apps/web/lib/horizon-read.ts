import 'server-only'
import { getHubRoadmapByProjectId } from './hub-query'
import { deriveHorizon, type HorizonDestinationView } from './horizon-destinations'

// agent-legible-horizon D1/D3 — the horizon, as data, for ONE project an earlier seam already resolved (the CLI member
// check, or the connector token). The same derivation the /horizon page renders (`deriveHorizon` over the latest
// roadmap artifact, many-products D14), so a terminal, an MCP client and the page can never disagree about what is lit.

export type HorizonRead =
  | {
      ok: true
      /** false = this product has never pushed a roadmap; true with no destinations = it pushed, without a horizon. */
      pushed: boolean
      destinations: HorizonDestinationView[]
      generatedAt: string | null
      sourceCommit: string | null
    }
  | { ok: false; reason: 'query_failed' }

export async function readHorizon(projectId: string): Promise<HorizonRead> {
  try {
    const result = await getHubRoadmapByProjectId(projectId)
    if (!result.ok) {
      if (result.reason === 'no_artifact')
        return { ok: true, pushed: false, destinations: [], generatedAt: null, sourceCommit: null }
      return { ok: false, reason: 'query_failed' }
    }
    const { artifact, summary, horizon } = result
    const destinations = deriveHorizon(
      horizon,
      summary.epics.map((epic) => ({
        slug: epic.slug,
        name: epic.name,
        shipped: epic.shipped,
        destinations: epic.destinations,
      }))
    )
    return {
      ok: true,
      pushed: true,
      destinations,
      generatedAt: artifact.generatedAt ?? null,
      sourceCommit: artifact.sourceCommit ?? null,
    }
  } catch (err) {
    console.error('[horizon-read] read failed:', err)
    return { ok: false, reason: 'query_failed' }
  }
}
