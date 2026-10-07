// console-ia-overhaul · Sprint 1, Story 1.5 — what ⌘K matches, decided outside the DOM.
//
// ── Why the filter is here and not in the component ───────────────────────────────────────────
// The palette is the ONE client island in `ProductShell`, which wraps every signed-in route. Every
// line that lives in the component is a line that can only be exercised through a real browser with
// a real session — which this repo's blocking gate does not have. So the matching, the ordering and
// the cursor arithmetic live here, where `npm run test:unit` can reach them, and the component is
// left with keystrokes and markup.
//
// Same argument and same shape as `lib/console-shell.ts` and `lib/agent-rail-visibility.ts`
// (CODE-QUALITY rule 5). This module imports nothing at all.

import { CONSOLE_SECTIONS, type ProjectSurfaceLink } from './project-route-inventory'
import type { RoadmapRow, RoadmapStage } from './roadmap-artifact-schema'
import { stageLabel } from './screen-words'

/**
 * One row in the palette.
 *
 * ⚠️ **`kind` opened to two members in Story 3.4, which is what the closed union was for.** Story
 * 1.5 wrote it with one on purpose — *"a closed union means that story cannot add feature rows
 * without every consumer being made to say what it does with them"* — and that is exactly what
 * happened: adding `'feature'` failed the component until it rendered a label distinguishing the
 * two, which is Story 3.4's own acceptance ("labelled so the two kinds are distinguishable").
 *
 * `hint` means different things per kind, and deliberately: a surface's is its SECTION (where you
 * would find it in the header), a feature's is its DESCRIPTION (what it controls). Both answer
 * "which one is this" for their own kind, which is the only job the column has.
 */
export type PaletteEntry = {
  // one-header-one-name D7 — `epic` (the ACTIVE project's epics) and `product` (the viewer's other products). A closed
  // union, and `PALETTE_KIND_LABEL` is a `Record` over it: a fifth kind cannot be added without deciding what it says.
  kind: 'surface' | 'feature' | 'epic' | 'product'
  /** Stable identity for React keys and for the cursor — unique within one palette. */
  id: string
  label: string
  /** For a surface, the section it lives in; for a feature, what it controls. Rendered beside it. */
  hint: string
  href: string
}

/** The word each row's kind shows, so a reader can tell the Flags PAGE from a flag, an epic and a product apart. */
export const PALETTE_KIND_LABEL: Record<PaletteEntry['kind'], string> = {
  surface: 'Go to',
  feature: 'Flag', // one-header-one-name D8: Features → Flags
  epic: 'Epic',
  product: 'Product',
}

/** One epic, as `/api/internal/epic-index/<slug>` hands it over: the active project's, never another's (D7). */
export type EpicIndexEntry = { slug: string; name: string; stage: RoadmapStage | null }

/** The Epic-grain rows of a pushed roadmap, in push order. Seeds and sprints are not epics and are not listed. */
export function projectEpicIndex(items: readonly RoadmapRow[]): EpicIndexEntry[] {
  return items
    .filter((row) => row.grain === 'Epic')
    .map((row) => ({ slug: row.slug, name: row.name, stage: row.stage ?? null }))
}

/** Epics open the epic page; the hint is the stage's SCREEN word ("Epic · Building", "Epic · Backlog"). */
export function buildEpicEntries(epics: readonly EpicIndexEntry[], projectSlug: string): PaletteEntry[] {
  return epics.map((epic) => ({
    kind: 'epic' as const,
    id: `epic:${epic.slug}`,
    label: epic.name,
    hint: epic.stage === null ? '' : stageLabel(epic.stage),
    href: `/hub/${encodeURIComponent(projectSlug)}/epic/${encodeURIComponent(epic.slug)}`,
  }))
}

/**
 * The viewer's OTHER products, from the switcher's own list (`getShellNav` → `getUserProjects`, already
 * workspace-filtered and already rendered in the header). A membership list, not a data read: nothing here reads a
 * project's contents, so `getWorkspaceProjects` is not involved (AGENTS.md § the tenancy invariant, the
 * `getUserProjects` carve-out). Each opens that product's Today. The current one is left out: you are already there.
 */
export function buildProductEntries(
  products: readonly { slug: string; href: string; current: boolean }[]
): PaletteEntry[] {
  return products
    .filter((product) => !product.current)
    .map((product) => ({
      kind: 'product' as const,
      id: `product:${product.slug}`,
      label: product.slug,
      hint: '',
      href: product.href,
    }))
}

/** One feature, as the index route hands it over. */
export type FeatureIndexEntry = { key: string; description: string }

const SECTION_LABEL = new Map(CONSOLE_SECTIONS.map((section) => [section.id, section.label]))

/**
 * The palette's contents, from the links `getShellNav()` already resolved.
 *
 * **No new query and no new route** (Story 1.5). The shell has already paid for this list in order
 * to render the rail; the palette is a second view of the same data, not a second read of it.
 */
export function buildPaletteEntries(links: readonly ProjectSurfaceLink[]): PaletteEntry[] {
  return links.map((link) => ({
    kind: 'surface' as const,
    id: `surface:${link.routeSegment}`,
    label: link.label,
    hint: SECTION_LABEL.get(link.section) ?? link.section,
    href: link.href,
  }))
}

/**
 * Project the flag registry down to what `⌘K` matches on.
 *
 * ⚠️ **Server-side, in the route handler** (A6). The registry a real tenant holds is ~16 KB of
 * definition JSONB across 5 round trips; this is ~1.1 KB. Projecting in the browser would move the
 * whole thing over the wire to throw most of it away.
 *
 * Pure and here rather than in the route, for this module's usual reason: `npm run test:unit` can
 * reach it, and a route handler behind `requireProjectMembership` can only be exercised with a real
 * session.
 *
 * `description` is normalised to a string so the component never has to think about `undefined` —
 * an empty description renders as no hint, not as the word "undefined".
 */
export function projectFeatureIndex(
  flags: ReadonlyArray<{ key: string; versions: ReadonlyArray<{ version: number; definition: unknown }> }>
): FeatureIndexEntry[] {
  return flags.map((flag) => {
    // The NEWEST version describes the feature here — not whichever version an environment serves.
    // The list page makes the finer distinction because it is answering about one environment; the
    // palette is answering "what is this feature", which has no environment in it.
    const latest = flag.versions.reduce<{ version: number; definition: unknown } | undefined>(
      (best, row) => (best === undefined || row.version > best.version ? row : best),
      undefined
    )
    const definition = latest?.definition
    const description =
      definition !== null && typeof definition === 'object' && !Array.isArray(definition)
        ? (definition as { description?: unknown }).description
        : undefined
    return { key: flag.key, description: typeof description === 'string' ? description : '' }
  })
}

/**
 * The feature rows, from the index the palette fetched on first open.
 *
 * They come FIRST in the merged list, which is the approved design's order and also the useful one:
 * somebody who presses `⌘K` and types is nearly always naming a feature — there are 42 of those and
 * 13 surfaces, and the surfaces are all one click away in the header and the rail anyway.
 */
export function buildFeatureEntries(
  features: readonly FeatureIndexEntry[],
  projectSlug: string
): PaletteEntry[] {
  return features.map((feature) => ({
    kind: 'feature' as const,
    // Namespaced against the surface ids so a feature called `flags` cannot collide with the Flags
    // surface — same reason `surface:` is prefixed.
    id: `feature:${feature.key}`,
    label: feature.key,
    hint: feature.description,
    href: `/app/flags/${projectSlug}/${encodeURIComponent(feature.key)}`,
  }))
}

/**
 * Filter by what the reader typed.
 *
 * Matches the label AND the hint, so typing `setup` lists everything in Setup and typing a word
 * from a feature's description finds the feature — the palette answers "where do I want to go" in
 * either vocabulary, which is the point of labelling the rows at all.
 *
 * Case- and whitespace-insensitive. An empty query returns everything rather than nothing: the
 * palette opens as a list of where you can go, not as a blank box that must be guessed at.
 */
export function filterPaletteEntries(entries: readonly PaletteEntry[], query: string): PaletteEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...entries]
  return entries.filter(
    (entry) => entry.label.toLowerCase().includes(needle) || entry.hint.toLowerCase().includes(needle)
  )
}

/**
 * Where the cursor lands after a move.
 *
 * Wraps in both directions, and — the part worth extracting — **is total over an empty list**.
 * `↓` on "no matches" is a real keystroke a real person will make while typing, and an index of
 * `-1 % 0` or `NaN` reaching a `[]` lookup is how a palette throws. It returns `0` there, which the
 * component renders as nothing selected because there is nothing to select.
 *
 * The wrap is also what makes `↑` from the first row useful rather than inert: the last row is one
 * keystroke away in a list of any length.
 */
export function movePaletteCursor(index: number, delta: number, length: number): number {
  if (length <= 0) return 0
  return (((index + delta) % length) + length) % length
}
