// satisfied-ask S1.4 (D5/D6) — whether the console asks a member to rate the funnel trend, PURE and zero-import so the
// decision is specced directly (CODE-QUALITY §5: a guard behind auth the harness cannot reach is extracted, not skipped).
//
// Golden Frijoles is a customer of itself here: the answer goes through the real SDK (lib/self-track.ts), lands in the
// self project as `satisfaction_rated` / `satisfaction_dismissed` with the funnel trend's flag as its feature, and the
// funnel-truth bet reads it. "Already answered" is a cookie in that member's browser, not a read of the events table:
// a request path that re-queried events to decide a UI hint would be the ad-hoc read rule #1 keeps out, and a member
// asked once more on a new browser costs nothing (the funnel counts their latest answer).

/** The cookie that says this browser's member answered or declined. One year: asked once, not nagged. */
export const SATISFACTION_ASK_COOKIE = 'gf_satisfaction_funnel_trend'
export const SATISFACTION_ASK_MAX_AGE_S = 365 * 24 * 60 * 60

export type SatisfactionAnswer = 1 | 2 | 3 | 4 | 5 | 'dismissed'

/** Show the ask only where a member is reading a trend, the switch is on, and this browser has not answered. */
export function shouldAskSatisfaction(input: {
  gateOn: boolean
  trendShown: boolean
  answeredCookie: string | undefined
}): boolean {
  return input.gateOn && input.trendShown && !input.answeredCookie
}

/** A form value → an answer, or null for anything a button could not have sent. */
export function parseSatisfactionAnswer(value: unknown): SatisfactionAnswer | null {
  if (value === 'dismissed') return 'dismissed'
  const n = typeof value === 'string' && /^[1-5]$/.test(value) ? Number(value) : value
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5 ? n : null
}
