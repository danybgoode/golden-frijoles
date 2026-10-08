// one-product-project S1.1 (fresh review of #318, rounds 1–2) — what an ANONYMOUS reader of the public project's
// connector may not see. The public project is Golden Frijoles' own (D1), and its connector URL is on /install for
// anyone. Its numbers, flags and decisions are public by design (built in the open); WHO did something is not.
//
// One seam, by field name, over every tool's reply, so a tool added later is covered without anyone remembering to.
// The first fix redacted one tool's audit `actor` and missed three more places the same class lived (a decision's
// `actorUserId`, a task's `claimedBy`, a flag version's targeting rules). Pure: no imports.

/** What a hidden field reads as. */
export const HIDDEN_ON_PUBLIC_CONNECTOR = 'hidden on the public connector'

// Field names that carry a person: an actor, a user/subject/visitor id, a claimant, a maker, an email. Also a
// journey drilldown's paging cursor, which encodes its last subject id (lib/journey-cohort.ts), so an anonymous
// reader gets the cohort's numbers but no page of who is in it (round 3).
const PERSON_FIELD =
  /^(actor|actor_?(user_?)?id|external_?actor_?id|user_?ids?|subject_?ids?|visitor_?ids?|distinct_?ids?|owner_?id|claimed_?by|created_?by|decided_?by|maker|email|next_?cursor)$/i
// Targeting rules may name a user id or an email verbatim. An empty list names nobody and keeps its type.
const RULES_FIELD = /^rules$/i

function hides(key: string, field: unknown): boolean {
  if (field === null) return false
  if (RULES_FIELD.test(key)) return !(Array.isArray(field) && field.length === 0)
  return PERSON_FIELD.test(key)
}

export function scrubForPublicReader(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubForPublicReader)
  if (value === null || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(value)) {
    out[key] = hides(key, field) ? HIDDEN_ON_PUBLIC_CONNECTOR : scrubForPublicReader(field)
  }
  return out
}

/** A tool reply's text, scrubbed when it is JSON; any other text is returned as it was. */
export function scrubToolText(text: string): string {
  try {
    return JSON.stringify(scrubForPublicReader(JSON.parse(text)))
  } catch {
    return text
  }
}
