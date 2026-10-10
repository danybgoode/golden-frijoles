import { notFound } from 'next/navigation'
import { requireProjectMembership } from '@/lib/dashboard-auth'
import { isJourneyProjectionsEnabled } from '@/lib/flags'
import { isOwner } from '@/lib/roles'
import { listJourneyRegistries } from '@/lib/journeys'
import { newestVersion } from '@/lib/experiment-list-view'
import {
  journeyAnswer,
  projectJourneyRows,
  summariseJourneys,
  type JourneyListInput,
} from '@/lib/journey-list-view'
import { JourneyManager } from './journey-manager'
import { JourneyRows } from './journey-rows'
import { ProductShell } from '@/components/product/ProductShell'
import { NewThingDialog } from '@/components/product/NewThingDialog'
import { Answer, PageHead, Tile } from '@/design-system/primitives'
import { FlagFunnel } from '@/components/product/FlagFunnel'
import { getFlagFunnel } from '@/lib/event-catalog-query'
import { flagFunnelView, type FunnelView } from '@/lib/flag-funnel-view'
import { isFlagFunnelsEnabled } from '@/lib/flags'
import { getLatestArtifact } from '@/lib/report-artifacts'
import { toCard } from '@/lib/hub-board'
import type { RoadmapRow } from '@/lib/roadmap-artifact-schema'

/** one-bet-wired D7 — at most this many measured flags are read per page view, so the page stays bounded. */
const FROM_YOUR_FLAGS_CAP = 12

/**
 * Journeys' From your flags: one read-only funnel per measured flag in this project's latest roadmap, named by its epic.
 * They are views, not journey definitions: creating a journey never creates a flag. A failed read shows nothing here
 * rather than an empty section that reads as "no measured flags".
 */
async function fromYourFlags(
  projectId: string
): Promise<Array<{ name: string; flagKey: string; view: FunnelView }> | null> {
  try {
    const artifact = await getLatestArtifact<{ items?: RoadmapRow[] }>(projectId, 'roadmap')
    const measured = (artifact?.payload?.items ?? [])
      .map((row) => toCard(row))
      .filter((card) => card !== null && card.grain === 'Epic' && card.flagKey && card.measure)
      .slice(0, FROM_YOUR_FLAGS_CAP)
    return await Promise.all(
      measured.map(async (card) => ({
        name: card!.name,
        flagKey: card!.flagKey!,
        view: flagFunnelView(
          await getFlagFunnel(projectId, { flagKey: card!.flagKey!, ...card!.measure! }).catch(() => null)
        ),
      }))
    )
  } catch {
    return null
  }
}

// design-system-rails · Sprint 5, Story 5.5 — reference state `measure-journeys`.
//
// ⚠️ **mockups-as-built · Story 2.1 — the disclosure is GONE and the authoring surface is a MODAL.**
// This page shipped the approved list with the whole authoring surface kept behind a
// `<details>`, under the argument that "deleting a capability to satisfy a geometry assertion is
// not what render-from-the-design-system asks for". The capability half of that was right and the
// disclosure half was not the builder's call to make — it is the decision that produced this epic.
//
// D7 confirmed the capability is real: `journey-manager.tsx` is the ONLY way to create a journey in
// this product. There is no API route and no SDK path — `createJourneyVersion` has exactly one
// consumer, and it is inside the disclosure. So the answer is Daniel's 33rd approved state (D8):
// the manager moves into `NewThingDialog`, opened by the `+ New journey` control the approved state
// draws in the page head. Nothing is lost and no `<details>` survives.
//
// ⚠️ **The subject counts are NOT read here, and that is deliberate.** A journey's population comes
// from `getJourneyCohortByProjectId`, which is a bounded fact scan per journey per window — the same
// cost shape as an experiment analysis. Running one per row would make a list page N of them, and
// the number is on each journey's own page where the whole cohort is being computed anyway. So the
// People column renders a dash with a sentence rather than a figure this page did not read: "we did
// not read how many" and "nobody" are different, and `projectJourneyRows` keeps them apart.
export const dynamic = 'force-dynamic'

export default async function JourneysPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  // Dark means nonexistent, before auth or project lookup. Old surfaces remain untouched.
  if (!(await isJourneyProjectionsEnabled())) notFound()
  const { projectSlug } = await params
  const membership = await requireProjectMembership(projectSlug)
  const journeys = await listJourneyRegistries(membership.projectId)

  const inputs: JourneyListInput[] = journeys.map((journey) => ({
    key: journey.key,
    // The DESCRIPTION lives on the definition, and the active version's is the current one. Falling
    // back to the newest version's means a journey with only drafts still says what it is for.
    //
    // ⚠️ **`newestVersion`, NOT `.at(-1)`** — `mapJourneyRegistryRows` sorts DESCENDING too, so the
    // fallback was picking the OLDEST draft. Same defect as the experiments list, same fix: compute
    // the maximum, so a mapper's ordering cannot reach it.
    description:
      (
        journey.versions.find((version) => version.id === journey.activeVersionId) ??
        newestVersion(journey.versions)
      )?.definition.description ?? '',
    activeVersionId: journey.activeVersionId,
    versions: journey.versions.map((version) => ({
      id: version.id,
      version: version.version,
      state: version.state,
    })),
  }))
  const rows = projectJourneyRows(inputs, new Map())
  const summary = summariseJourneys(rows)
  const flagFunnels = (await isFlagFunnelsEnabled()) ? await fromYourFlags(membership.projectId) : null

  return (
    <ProductShell projectSlug={projectSlug} section="measure" railActive={'journeys'}>
      <main>
        <PageHead
          title="Journeys"
          lede="A journey is the path you want somebody to walk. Each one counts how far people actually get."
          actions={
            <NewThingDialog
              // ⚠️ The label is the approved state's, character for character — the structural gate
              // reads the head's primary action and compares the words (`state-contract.mjs`).
              label="+ New journey"
              title="New journey"
              lede="A definition, and the version that counts people."
            >
              <JourneyManager
                slug={projectSlug}
                journeys={journeys}
                canManage={isOwner({ projectId: membership.projectId, role: membership.role })}
              />
            </NewThingDialog>
          }
        />
        <Answer>{journeyAnswer(rows)}</Answer>

        {rows.length === 0 ? null : (
          // ⚠️ **FOUR tiles, and the approved state's four labels.** This drew three — Active,
          // Drafts waiting, Defined — and the design draws Active, Drafts waiting, People being
          // counted, Reached the end. `summariseJourneys` already returns the population figure and
          // its own comment calls these "the four summary tiles' figures"; the fourth tile was the
          // missing render, not a missing query.
          //
          // ⚠️ **The two population tiles say WHICH nothing they are, and that is deliberate**
          // (epic D13-c). A journey's population comes from `getJourneyCohortByProjectId`, a bounded
          // fact scan per journey per window — running one per row would make a list page N of them,
          // which is exactly why `projectJourneyRows` is handed an empty map here. So
          // `subjectsCounted` is `null` and the tile says so, rather than rendering a `0` that reads
          // as "nobody" when it means "we did not read". Do NOT "fix" this by adding the scans.
          <div className="ds-tiles">
            <Tile label="Active" value={String(summary.active)} detail="definitions live" />
            <Tile
              label="Drafts waiting"
              value={String(summary.draftsWaiting)}
              detail="not counting anyone yet"
              tone={summary.draftsWaiting > 0 ? 'warn' : undefined}
            />
            <Tile
              label="People being counted"
              value={summary.subjectsCounted === null ? null : String(summary.subjectsCounted)}
              absent="counted on each journey's own page"
              detail="across all journeys"
            />
            <Tile
              label="Reached the end"
              value={null}
              absent="shown per journey"
              detail="final stage, all journeys"
            />
          </div>
        )}

        <JourneyRows slug={projectSlug} rows={rows} />
        {flagFunnels && flagFunnels.length > 0 ? (
          <section aria-label="From your flags">
            <h2 className="ds-label">From your flags</h2>
            <p className="ds-hint">
              Each measured flag&apos;s funnel, read from your bets. They are views: a new journey never
              creates a flag.
            </p>
            {flagFunnels.map((f) => (
              <div key={f.flagKey}>
                <h3>
                  {f.name} <span className="ds-mono">{f.flagKey}</span>
                </h3>
                <FlagFunnel view={f.view} />
              </div>
            ))}
          </section>
        ) : null}
      </main>
    </ProductShell>
  )
}
