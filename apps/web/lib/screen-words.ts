// one-header-one-name · Sprint 2, Story 2.2 — one name per thing, on screen (epic README D8; audit decision 2).
//
// The ONE place a renamed screen word is spelled. Pages, the inventory's nav labels and the board's columns read it
// from here, so a word changes once. It is DISPLAY only: stage keys (`ROADMAP_STAGES`, `lib/stage-commands.ts`,
// `lib/hub-areas.ts`), `status:` values, flag keys, table names and URLs are the system of record and keep their
// spelling — a renamed key silently empties a board column (the seed's first rabbit hole).
//
// The retired words are guarded in `design-system/vocabulary.ts` (`RETIRED_SCREEN_WORDS`); `screen-words.test.ts`
// welds that list to `SCREEN_RENAMES` below so the two cannot drift.
//
// No framework or environment imports: the inventory imports this, and the inventory is read by the fast unit layer.

import type { RoadmapStage } from './roadmap-artifact-schema'

/** The names decision 2 settled, by what they name. Import the word; never retype it. */
export const SCREEN_WORDS = {
  flags: 'Flags',
  flagsOn: 'Flags on',
  abTests: 'A/B tests',
  outcomeReport: 'Outcome report',
  webhooks: 'Webhooks',
  portfolio: 'Portfolio',
  agentQueue: 'Agent queue',
  flagHistory: 'Flag history',
} as const

/**
 * Decision 2, as data: each retired screen word and the name that replaced it. "Report" (the Hub tab) and "Pod report"
 * both became the Outcome report. Horizon's "destinations" is a DIFFERENT thing from Setup's Destinations and is not
 * here — a blanket rename would break Horizon (the seed's last rabbit hole).
 */
export const SCREEN_RENAMES: readonly { retired: string; now: string }[] = [
  { retired: 'Features', now: SCREEN_WORDS.flags },
  { retired: 'On in Production', now: SCREEN_WORDS.flagsOn },
  { retired: 'Experiments', now: SCREEN_WORDS.abTests },
  { retired: 'Pod report', now: SCREEN_WORDS.outcomeReport },
  { retired: 'Report', now: SCREEN_WORDS.outcomeReport },
  { retired: 'Destinations', now: SCREEN_WORDS.webhooks },
  { retired: 'Your workspace', now: SCREEN_WORDS.portfolio },
  { retired: 'Tasks', now: SCREEN_WORDS.agentQueue },
  { retired: 'Activity', now: SCREEN_WORDS.flagHistory },
  { retired: 'To groom', now: 'Backlog' },
  { retired: 'Ready to build', now: 'Ready' },
]

// A `Record` over the CLOSED stage union, so a seventh stage is a compile error here rather than a column that shows
// its raw key. Only two differ from their key.
const STAGE_LABEL: Record<RoadmapStage, string> = {
  'To groom': 'Backlog',
  Grooming: 'Grooming',
  'Ready to build': 'Ready',
  Building: 'Building',
  QA: 'QA',
  Shipped: 'Shipped',
}

/** What a stage is CALLED on screen. The argument is the stored key and stays one; compare keys, show this. */
export function stageLabel(stage: RoadmapStage): string {
  return STAGE_LABEL[stage]
}
