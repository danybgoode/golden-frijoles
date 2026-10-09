// sdk-1-0 S2.2 — the SDK quickstart, ONE module for both surfaces (/install and Setup › Connect).
//
// 1.0 starts in one line: with no `baseUrl` key the SDK talks to goldenfrijoles.com (DEFAULT_BASE_URL). The snippet
// names `baseUrl` only when this deployment is somewhere else (a preview, local dev, a self-host), so a tester copying
// it from a preview never sends events to production.
import { DEFAULT_BASE_URL } from '@golden-frijoles/sdk'

export const SDK_API_KEY_ENV = 'GOLDEN_FRIJOLES_API_KEY'

/** Pure: the client line, with `baseUrl` only when `siteUrl` is not the SDK's default. */
export function sdkClientLine(siteUrl: string): string {
  const site = siteUrl.replace(/\/+$/, '')
  const base = site === DEFAULT_BASE_URL ? '' : `baseUrl: '${site}', `
  return `const engine = createGrowthEngineClient({ ${base}apiKey: process.env.${SDK_API_KEY_ENV} })`
}

/** The full quickstart: install, create, identify after sign-in, then the calls the page is about. */
export function sdkQuickstart(siteUrl: string, calls: string[]): string {
  return [
    'npm install @golden-frijoles/sdk',
    '',
    "import { createGrowthEngineClient } from '@golden-frijoles/sdk'",
    '',
    sdkClientLine(siteUrl),
    'engine.identify(currentUser.id) // after sign-in; events before it have no user',
    '',
    ...calls,
  ].join('\n')
}
