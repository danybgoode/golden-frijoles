// pod-report · Sprint 1, Story 1.3 — the horizon view's destination↔epic derivation.
//
// many-products D14 (S3.2): the destinations are the PRODUCT'S OWN data. They are declared in its repo
// (`Roadmap/00-strategy/horizon.md`), an epic names the ones it lights (`destination:` in its README frontmatter),
// and both travel in the roadmap push — so this module no longer holds a list. It takes the declared destinations and
// the pushed epics and derives each destination's state. (`HORIZON_DESTINATIONS`, Golden Frijoles' own list, moved to
// this repo's own `horizon.md`.)
//
// A destination is a three-way LIT / PARTIAL / COMING rather than landing-sections.ts's binary live/next, because it
// is an end-state milestone that SEVERAL epics light, and an epic may light several destinations.
//
// Deliberately ZERO framework/server-only imports (no `server-only`, no `next/*`, no Supabase) — the
// same rule roadmap-artifact-schema.ts documents: a pure module a plain `node --test` run can import
// directly must not share a file with a runtime-only import, or the test throws an opaque, unrelated
// error just loading the file. The DB-touching half (resolving a project slug, reading the latest
// artifact) lives next door in app/hub/[projectSlug]/horizon/page.tsx.

export type DestinationStatus = 'lit' | 'partial' | 'coming'

/** One declared destination — what the push's `horizon` carries. */
export interface HorizonDestination {
  id: string
  title: string
  description: string
}

/** The shape the caller supplies per epic — deliberately narrow (no status STRING accepted here). */
export interface HorizonEpicInput {
  slug: string
  name: string
  /**
   * MUST come from the caller's own `summarizeRoadmap(...).epics[].shipped` derivation
   * (roadmap-artifact-schema.ts). This module never re-derives "is it shipped" from a status string
   * itself — that derivation lives in exactly one place on purpose (the poster rule: ✅ means
   * shipped, everywhere, the same way).
   */
  shipped: boolean
  /** Destination ids this epic lights (the row's `destinations`); absent or null lights nothing. */
  destinations?: ReadonlyArray<string> | null
}

export interface LitEpic {
  slug: string
  name: string
  shipped: boolean
}

export interface HorizonDestinationView extends HorizonDestination {
  status: DestinationStatus
  /**
   * Epics from the pushed artifact that name this destination, in the order given. Only epics that NAME it
   * appear here — an epic that names no destination never appears anywhere in the output (an unrefined epic
   * lights nothing, silently, rather than erroring).
   */
  litBy: LitEpic[]
}

/**
 * Derive every destination's lit/partial/coming state from a pushed artifact's epics.
 *
 * A destination is:
 *   - `lit`     — at least one epic names it, and EVERY epic that names it is shipped.
 *   - `partial` — at least one such epic is shipped, but not all of them.
 *   - `coming`  — no such epic is shipped (including the case where no epic
 *                 names it at all — an epic not yet pushed is exactly as "not shipped"
 *                 as one pushed and still in flight).
 *
 * This is the ONLY place a destination's badge is decided — the page renders `status` and `litBy`
 * verbatim rather than re-deriving anything, so "nothing claims ✅ for unshipped work" (the poster
 * rule) holds by construction: `lit` is unreachable unless every contributing epic's own `shipped`
 * flag says so.
 */
export function deriveHorizon(
  destinations: ReadonlyArray<HorizonDestination>,
  epics: ReadonlyArray<HorizonEpicInput>
): HorizonDestinationView[] {
  return destinations.map((destination) => {
    const litBy: LitEpic[] = epics
      .filter((epic) => epic.destinations?.includes(destination.id))
      .map((epic) => ({ slug: epic.slug, name: epic.name, shipped: epic.shipped }))

    const shippedCount = litBy.filter((epic) => epic.shipped).length
    const status: DestinationStatus =
      litBy.length > 0 && shippedCount === litBy.length ? 'lit' : shippedCount > 0 ? 'partial' : 'coming'

    return { ...destination, status, litBy }
  })
}
