// traffic-relaunch D5 — where a visit came from, as tags the query layer can group by.
//
// The beacon (components/landing/SelfTrackBeacon.tsx) sends what the browser saw: the four utm_* parameters and
// `document.referrer`. This is the server's half, and the route is unauthenticated, so everything here is attacker
// input: each value is kept only if, lowercased, it matches `[a-z0-9._-]{1,64}`; anything else is dropped, never
// stored and never an error (the beacon's contract is "always 200"). The referrer is reduced to its host, and our own
// host is dropped, so an internal click is not a source. `source` is the one tag every visit carries:
// utm_source, else the referring host, else `direct`.
//
// Pure: no imports, no environment. The caller passes our own host (from getSiteUrl(), rule #5).

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const
export type UtmKey = (typeof UTM_KEYS)[number]
export type SourceTags = Partial<Record<UtmKey | 'ref_host', string>> & { source: string }

const VALUE = /^[a-z0-9._-]{1,64}$/

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  return VALUE.test(v) ? v : undefined
}

/** A referrer URL → its host (no `www.`), or undefined when it is missing, malformed, not http(s), or our own. */
export function referrerHost(referrer: unknown, ownHost: string): string | undefined {
  if (typeof referrer !== 'string' || referrer.length === 0 || referrer.length > 2048) return undefined
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return undefined
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const own = ownHost.toLowerCase().replace(/^www\./, '')
  if (host === own || host.endsWith(`.${own}`)) return undefined
  return clean(host)
}

/**
 * The beacon's raw `source` object → the tags to store. Unknown keys are ignored; an absent or malformed object is a
 * direct visit.
 */
export function sanitizeSource(raw: unknown, ownHost: string): SourceTags {
  const body = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const tags: Partial<Record<UtmKey | 'ref_host', string>> = {}
  for (const key of UTM_KEYS) {
    const v = clean(body[key])
    if (v) tags[key] = v
  }
  const ref = referrerHost(body.referrer, ownHost)
  if (ref) tags.ref_host = ref
  return { ...tags, source: tags.utm_source ?? tags.ref_host ?? 'direct' }
}
