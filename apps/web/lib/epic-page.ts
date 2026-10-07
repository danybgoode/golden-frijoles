import type { RoadmapStage } from './roadmap-artifact-schema'

// one-epic-page · Sprint 1, Story 1.2 (lock D6) — where an epic is, as data the page draws.
//
// Pure and import-free at runtime (type imports are erased), so `node --test` loads it with no resolver — the repo's
// rule for pure logic. It returns stage KEYS; the page shows them through `stageLabel` (lib/screen-words.ts), so a
// renamed stage word changes in one place and a key never changes at all.

/**
 * The seven steps of the track: the board's six stages, then Read. ⚠️ A copy of `BOARD_STAGES`, kept import-free;
 * `epic-page.test.ts` pins it. Read is not a stage (no new stored value, the seed's no-go): it is lit when the row
 * carries a verdict (result-record's field), and only then.
 */
export const TRACK_STEPS = [
  'To groom',
  'Grooming',
  'Ready to build',
  'Building',
  'QA',
  'Shipped',
  'Read',
] as const satisfies readonly (RoadmapStage | 'Read')[]

export type TrackKey = (typeof TRACK_STEPS)[number]
export type TrackStep = { key: TrackKey; state: 'done' | 'current' | 'todo' }

/** The track for a card: every step before the current one done, the current one lit, the rest to do. */
export function epicTrack(stage: RoadmapStage, hasVerdict: boolean): TrackStep[] {
  // A verdict only means something once the epic shipped; a verdict on an unshipped row (hand-edited README) does not
  // jump the track past the stage the push resolved — the Hub never computes a stage (board lock D19).
  const current: TrackKey = stage === 'Shipped' && hasVerdict ? 'Read' : stage
  const at = TRACK_STEPS.indexOf(current)
  return TRACK_STEPS.map((key, i) => ({ key, state: i < at ? 'done' : i === at ? 'current' : 'todo' }))
}

// one-epic-page · Sprint 2 (lock D10, D13) — the two bars, as numbers the page draws. Inline `style` is forbidden by the
// drift guard, so the page draws SVG `<rect width>` from these percentages.

export type SprintBar = { pct: number; state: 'done' | 'progress' | 'todo' }

/** One sprint's bar: done/total as a whole percent, clamped; a sprint with no stories counted is to do, never done. */
export function sprintBar(done: number, total: number): SprintBar {
  if (!(total > 0) || !(done > 0)) return { pct: 0, state: 'todo' }
  const pct = Math.min(100, Math.round((done / total) * 100))
  return { pct, state: done >= total ? 'done' : 'progress' }
}

export type SpendBar = { actualPct: number; lowPct: number; highPct: number; over: boolean }

/**
 * Spend against the quote: the scale is the larger of the quote's top and the actual, so an over-quote actual still
 * fits and reads as past the band. Null when either side is missing — "not measured yet" is said in words, not drawn.
 */
export function spendBar(f: {
  quoteLow: number | null
  quoteHigh: number | null
  actualUsd: number | null
}): SpendBar | null {
  if (f.quoteLow === null || f.quoteHigh === null || f.actualUsd === null) return null
  const max = Math.max(f.quoteHigh, f.actualUsd)
  if (!(max > 0)) return null
  const pct = (n: number) => Math.round((n / max) * 100)
  return {
    actualPct: pct(f.actualUsd),
    lowPct: pct(f.quoteLow),
    highPct: pct(f.quoteHigh),
    over: f.actualUsd > f.quoteHigh,
  }
}
