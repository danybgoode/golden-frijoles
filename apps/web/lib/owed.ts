// owed-on-screen — the owed checks a roadmap push carries, and who may see them. ZERO IMPORTS on purpose: the strip and
// the member decision are the authorization boundary, so a plain `node --test` spec asserts them with no server, no
// Supabase and no Next (CODE-QUALITY §5 — a guard behind auth the harness cannot reach goes in a pure module).
//
// The strip that keeps owed checks off every other read is `withoutOwed` in `lib/report-artifact-row.ts` (D5).

// A TYPE-only import: erased at runtime, so this file still has no imports to load. It is what makes the two maps below
// total over the schema's kinds — a kind added there is a build error here, not a check that silently lands nowhere.
import type { OwedKind } from './roadmap-artifact-schema'

/** One owed check as stored on the push (`lib/roadmap-artifact-schema.ts → owedItemSchema` is the contract). */
export type OwedRow = {
  epic: string | null
  text: string
  kind: string
  category: string
  file: string
  line: number
}

/**
 * What a viewer receives from a raw payload: its owed rows when they are a member of the project, and `[]` for anyone
 * else — a signed-in stranger and a signed-out reader alike, the public project included. `null` when the push carried
 * no `owed` block at all (the project keeps no ledger), so a screen can tell "nothing owed" from "never measured"
 * (CODE-QUALITY §8). A non-member gets `[]`, never `null`: what a stranger sees must not depend on the project's data.
 */
export function owedForViewer(payload: unknown, isMember: boolean): OwedRow[] | null {
  if (!isMember) return []
  if (payload === null || typeof payload !== 'object') return null
  const owed = (payload as { owed?: unknown }).owed
  if (!Array.isArray(owed)) return null
  return owed.filter(isOwedRow)
}

function isOwedRow(v: unknown): v is OwedRow {
  if (v === null || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  return (
    (r.epic === null || typeof r.epic === 'string') &&
    typeof r.text === 'string' &&
    typeof r.kind === 'string' &&
    typeof r.category === 'string' &&
    typeof r.file === 'string' &&
    typeof r.line === 'number'
  )
}

// ── D10 — who can clear a check, and the kind in words ─────────────────────────────────────────────────────────────

export type OwedGroupKey = 'waiting' | 'agentCould' | 'unsorted'

const GROUP_OF_KIND: Record<OwedKind, OwedGroupKey> = {
  judgment: 'waiting',
  credential: 'waiting',
  publish: 'waiting',
  ops: 'waiting',
  'signed-in': 'agentCould',
  interactive: 'agentCould',
  unsorted: 'unsorted',
}

/** The kind as a reader says it. Never colour or a bare slug alone (DD4's status rule). */
export const OWED_KIND_WORDS: Record<OwedKind, string> = {
  judgment: 'A decision only you can make',
  credential: 'A credential',
  publish: 'A publish',
  ops: 'An ops step',
  'signed-in': 'A signed-in walkthrough',
  interactive: 'An interactive check',
  unsorted: 'Not sorted yet',
}

const isKnownKind = (kind: string): kind is OwedKind => Object.hasOwn(GROUP_OF_KIND, kind)

/** The kind in words; a kind a newer pusher invented reads as unsorted rather than as its raw slug. */
export function owedKindWords(kind: string): string {
  return isKnownKind(kind) ? OWED_KIND_WORDS[kind] : OWED_KIND_WORDS.unsorted
}

/**
 * The board's three groups, in display order, each in the push's own order. A kind this build does not know lands in
 * `unsorted` — visible, never dropped: a check that vanishes from the band is a check nobody clears.
 */
export function groupOwed(items: readonly OwedRow[]): Record<OwedGroupKey, OwedRow[]> {
  const groups: Record<OwedGroupKey, OwedRow[]> = { waiting: [], agentCould: [], unsorted: [] }
  for (const item of items) groups[isKnownKind(item.kind) ? GROUP_OF_KIND[item.kind] : 'unsorted'].push(item)
  return groups
}
