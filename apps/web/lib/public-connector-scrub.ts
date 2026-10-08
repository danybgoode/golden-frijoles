// one-product-project S1.1 (fresh review of #318, rounds 1–2) — what an ANONYMOUS reader of the public project's
// connector may not see. The public project is Golden Frijoles' own (D1), and its connector URL is on /install for
// anyone. Its numbers, flags and decisions are public by design (built in the open); WHO did something is not.
//
// One seam, by field name, over every tool's reply, so a tool added later is covered without anyone remembering to.
// The first fix redacted one tool's audit `actor` and missed three more places the same class lived (a decision's
// `actorUserId`, a task's `claimedBy`, a flag version's targeting rules). Pure: no imports.

/** What a hidden field reads as. */
export const HIDDEN_ON_PUBLIC_CONNECTOR = 'hidden on the public connector'

// Field names that carry a person: an actor, a user id, a claimant, a maker — and targeting rules, which may name
// a user id or an email verbatim.
const PERSON_FIELD = /^(actor|actor_?user_?id|user_?id|claimed_?by|created_?by|decided_?by|maker|email|rules)$/i

export function scrubForPublicReader(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubForPublicReader)
  if (value === null || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, field] of Object.entries(value)) {
    out[key] = PERSON_FIELD.test(key) && field !== null ? HIDDEN_ON_PUBLIC_CONNECTOR : scrubForPublicReader(field)
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
