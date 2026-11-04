// traffic-relaunch D2 — where the analytics banner must ask first, as pure data so the unit layer pins it.
//
// The middleware reads Cloudflare's `CF-IPCountry` on a marketing path and turns it into ONE word, `ask` or `load`,
// carried to the client in the `gf_cr` session cookie (D1). The country itself goes nowhere: not into the cookie, an
// event, a tag or a log line (D4).
//
// Fail closed in both directions: an unknown, missing or malformed country is `ask`, and on the client anything but
// the exact cookie value `load` is "consent required". A tampered cookie can only ever bring the banner back.
//
// The list is the regions whose law asks for an opt-in before analytics cookies (Daniel, 2026-11-03): the EU-27, the
// rest of the EEA, the UK, Switzerland, Brazil (LGPD) and Canada (Quebec's Law 25; an IP gives no province, so all of
// Canada). Changing it is one edit here; the privacy page's sentence lives in `lib/legal.ts`.

/** The cookie the middleware writes and `ConsentManager` reads. A session cookie: no expiry, no country. */
export const CONSENT_REGION_COOKIE = 'gf_cr'

export type ConsentMode = 'ask' | 'load'

const EU_27 = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
] as const
const REST_OF_EEA = ['IS', 'LI', 'NO'] as const

/** Countries where the banner asks before GA4 and Clarity load. */
export const OPT_IN_COUNTRIES: ReadonlySet<string> = new Set([
  ...EU_27,
  ...REST_OF_EEA,
  'GB',
  'CH',
  'BR',
  'CA',
])

/**
 * `ask` for an opt-in country and for anything that is not a real ISO country: missing, empty, malformed, Cloudflare's
 * `XX` (unknown) and `T1` (Tor). `load` only for a recognised two-letter country outside the list.
 */
export function consentMode(country: string | null | undefined): ConsentMode {
  const code = (country ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return 'ask'
  return OPT_IN_COUNTRIES.has(code) ? 'ask' : 'load'
}

/** The client's reading of the cookie: consent is required unless it says exactly `load`. */
export function consentRequiredFromCookie(value: string | null | undefined): boolean {
  return value !== 'load'
}

/** `document.cookie` → the `gf_cr` value, or null. Pure, so the unit layer covers the parse. */
export function readConsentRegionCookie(cookieHeader: string | null | undefined): string | null {
  for (const part of (cookieHeader ?? '').split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === CONSENT_REGION_COOKIE) return part.slice(eq + 1).trim()
  }
  return null
}
