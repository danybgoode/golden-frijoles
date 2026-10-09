// sdk-1-0 D1 — the one default URL, and the one rule for when it applies.
//
// The default applies only when the `baseUrl` KEY is absent from the config. Snippets written for 0.6.0 pass
// `baseUrl: process.env.GOLDEN_FRIJOLES_URL!`: when that variable is unset the key is present and `undefined`, and
// defaulting it would quietly send a developer's local or test events to production instead of failing. So a key that
// is present but empty or not a string stays "not configured", exactly as before.

export const DEFAULT_BASE_URL = 'https://goldenfrijoles.com'

/** The base URL a config resolves to, without a trailing slash, or `undefined` when it is present but unusable. Read it
 * per call: the config may be filled in later. */
export function resolveBaseUrl(config: object): string | undefined {
  // `in`, not hasOwnProperty: a getter on a class or an inherited baseUrl is a configured URL (verifier, #331).
  if (!('baseUrl' in config)) return DEFAULT_BASE_URL
  const value = (config as { baseUrl?: unknown }).baseUrl
  if (typeof value !== 'string' || value.trim().length === 0) return undefined
  return value.trim().replace(/\/+$/, '')
}
