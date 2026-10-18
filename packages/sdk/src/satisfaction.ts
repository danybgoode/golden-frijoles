// satisfied-ask D1/D2 — the pure half of the Satisfied ask. ZERO imports, deliberately (see ./capture's header: a
// source module is unit-testable under `npm run test:unit` only without relative imports).
//
// One event, one payload: `satisfaction_rated`, the flag key as `featureId`, the score in `tags.score`. The funnel
// (apps/web/lib/flag-funnel.ts, which mirrors these names) reads the score only on THIS event, so a bet that invents its
// own rating event keeps today's "any answer counts" read and never gets a threshold it did not ask for.

/** A person rated a flag's feature 1–5. Mirrored by apps/web/lib/flag-funnel.ts (pinned by its spec). */
export const SATISFACTION_RATED_EVENT = 'satisfaction_rated'
/** A person declined to rate ("Not now"). Never counts as satisfied; lets an app stop asking. */
export const SATISFACTION_DISMISSED_EVENT = 'satisfaction_dismissed'
export const SATISFACTION_MIN = 1
export const SATISFACTION_MAX = 5

// The same key pattern the flag parser enforces (./flags FLAG_KEY): a rating for a key no flag could have is a typo
// that would silently land in no funnel.
const FLAG_KEY = /^[a-z][a-z0-9_.-]{0,127}$/

/** Why a rating cannot be sent, or null when it can. */
export function satisfactionProblem(flagKey: unknown, score: unknown): string | null {
  if (typeof flagKey !== 'string' || !FLAG_KEY.test(flagKey))
    return 'flagKey must be a flag key (lowercase letters, digits, _ . -)'
  if (
    !Number.isInteger(score) ||
    (score as number) < SATISFACTION_MIN ||
    (score as number) > SATISFACTION_MAX
  )
    return `score must be a whole number from ${SATISFACTION_MIN} to ${SATISFACTION_MAX}`
  return null
}
