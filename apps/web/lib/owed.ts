// owed-on-screen — the owed checks a roadmap push carries, and who may see them. ZERO IMPORTS on purpose: the strip and
// the member decision are the authorization boundary, so a plain `node --test` spec asserts them with no server, no
// Supabase and no Next (CODE-QUALITY §5 — a guard behind auth the harness cannot reach goes in a pure module).
//
// The strip that keeps owed checks off every other read is `withoutOwed` in `lib/report-artifact-row.ts` (D5).

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
