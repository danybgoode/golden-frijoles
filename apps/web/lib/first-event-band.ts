// setup-instruments-connects D4 — what Today's First event band says, as a pure decision so the page only renders it.
// Waiting until the project's first product event; "arrived" for a week after it, so the founder who connected at setup
// sees it land; then nothing, because a project with a history does not need the band. A read that failed is not
// "waiting": it shows nothing, rather than telling a founder whose events arrive that none have.

export const FIRST_EVENT_WINDOW_DAYS = 7

/** What the bounded read returns (`getFirstEventForBand`). */
export type FirstEventRead = { hasOlder: boolean; firstInWindow: { event: string; at: string } | null }
export type FirstEventBand = { kind: 'waiting' } | { kind: 'arrived'; event: string; at: string } | null

export function firstEventBand(read: FirstEventRead | null): FirstEventBand {
  if (read === null || read.hasOlder) return null
  if (read.firstInWindow === null) return { kind: 'waiting' }
  return { kind: 'arrived', ...read.firstInWindow }
}
