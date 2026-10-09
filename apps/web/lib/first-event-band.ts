// setup-instruments-connects D4 — what Today's First event band says, as a pure decision so the page only renders it.
// Waiting until the project's first product event; "arrived" for a week after it, so the founder who connected at setup
// sees it land; then nothing, because a project with a history does not need the band. A read that failed is not
// "waiting": it shows nothing, rather than telling a founder whose events arrive that none have.

export const FIRST_EVENT_WINDOW_DAYS = 7

export type EventMarks = { firstEvent: { event: string; at: string } | null }
export type FirstEventBand = { kind: 'waiting' } | { kind: 'arrived'; event: string; at: string } | null

export function firstEventBand(marks: EventMarks | null, now: Date = new Date()): FirstEventBand {
  if (marks === null) return null
  if (marks.firstEvent === null) return { kind: 'waiting' }
  const ageMs = now.getTime() - new Date(marks.firstEvent.at).getTime()
  return ageMs <= FIRST_EVENT_WINDOW_DAYS * 86_400_000 ? { kind: 'arrived', ...marks.firstEvent } : null
}
