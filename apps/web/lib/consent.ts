// landing-launch-experiment D8 — the visitor's analytics consent, as pure data so the unit layer pins it.
//
// Deny by default: no stored answer, an unreadable one or a value from an older format all read as "not granted", and
// nothing third-party loads until a visitor says yes. The first-party beacon is outside this (it sets no third-party
// cookie and sends nothing off our domain).

export const CONSENT_STORAGE_KEY = 'gf_consent'
/** The footer's "Cookie settings" asks the banner to reopen with this window event. */
export const CONSENT_OPEN_EVENT = 'gf:consent-open'

export type ConsentChoice = 'granted' | 'denied'
export type StoredConsent = { choice: ConsentChoice; at: string }

export function parseStoredConsent(raw: string | null | undefined): StoredConsent | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as unknown
    if (typeof value !== 'object' || value === null) return null
    const { choice, at } = value as Record<string, unknown>
    if ((choice !== 'granted' && choice !== 'denied') || typeof at !== 'string') return null
    return { choice, at }
  } catch {
    return null
  }
}

export function serializeConsent(choice: ConsentChoice, now: Date): string {
  return JSON.stringify({ choice, at: now.toISOString() } satisfies StoredConsent)
}

/** Third parties load only on an explicit, readable yes. */
export function analyticsAllowed(stored: StoredConsent | null): boolean {
  return stored?.choice === 'granted'
}
