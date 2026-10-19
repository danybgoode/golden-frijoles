// landing-launch-experiment D3, D5, D11 — the small rules around the landing's A/B test, pure so the unit layer pins
// them: which letter a variant answer is, which user agents never count as exposed, the acquisition cookie, and the
// preview-only override. No imports beyond a type: the beacon route, the auth callback and the page all read these.

import type { VariantAnswer } from './variant-decision'

export type VariantLetter = 'a' | 'b'

/** httpOnly, set by the beacon from the SERVER's answer (D3); read once, when a signup creates a workspace (D5). */
export const ACQUISITION_VARIANT_COOKIE = 'gb_variant'

export function variantLetter(answer: Pick<VariantAnswer, 'b'>): VariantLetter {
  return answer.b ? 'b' : 'a'
}

/** The cookie's value as a workspace may record it, or null. Anything else — a forged or stale value — is "none". */
export function parseAcquisitionVariant(raw: unknown): VariantLetter | null {
  return raw === 'a' || raw === 'b' ? raw : null
}

// rabbit hole 5 — an obvious crawler, preview fetcher or scripted client is not a person deciding anything, and every
// one counted as exposed would sit in the denominator of both arms. Deliberately coarse: a missing user agent is a
// script, and a real browser names itself. This decides exposure only; the visit itself is still counted, as before.
const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|curl|wget|python|httpclient|okhttp|go-http|node-fetch|axios|undici|postman|playwright|^node\b|\bnode\//i

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || !userAgent.trim() || BOT_USER_AGENT.test(userAgent)
}

/**
 * D11 — `/?variant=b` (or `a`) forces the tree on a preview or locally, where the catalog cannot answer (previews have
 * no database), so B can be read before launch. Production ignores it: there, the only way to see B is to be assigned.
 */
export function forcedVariant(param: unknown, vercelEnv: string | undefined): VariantLetter | null {
  if (vercelEnv === 'production') return null
  const value = Array.isArray(param) ? param[0] : param
  return parseAcquisitionVariant(value)
}
