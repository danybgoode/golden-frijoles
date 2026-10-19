// landing-launch-experiment D2 + D8 — the public marketing pages, named once. Two things key off this list:
//   - the middleware mints the visitor id (`gb_vid`) on them before the first render (D2), and
//   - the consent banner, GA4 and Clarity mount ONLY on them (D8).
//
// ── Why an allow-list and not "everything public" ────────────────────────────────────────────
// Clarity records the screen. A member's console (`/app`), a share link (`/s`), a hub page (`/hub`) or `/install`'s
// freshly minted connector URL must never reach a session recording, so a new page is OFF these lists until someone
// decides it is marketing. Adding a path here is that decision.
//
// Pure and import-free: the middleware, the root layout's client component and the specs all read it.

export const VISITOR_COOKIE = 'gb_vid'

/** The same attributes `SelfTrackBeacon.ensureVisitorId` writes. NOT httpOnly: the beacon reads its own id. */
export const VISITOR_COOKIE_ATTRIBUTES = {
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: false,
} as const

const EXACT = new Set(['/', '/methodology', '/talk', '/signup', '/login'])
const PREFIXES = ['/methodology/']

export function isMarketingPath(pathname: string): boolean {
  return EXACT.has(pathname) || PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/** The middleware matcher's marketing entries, for the spec that pins the two lists together. */
export const MARKETING_MATCHERS = [
  '/',
  '/methodology/:path*',
  '/methodology',
  '/talk',
  '/signup',
  '/login',
] as const
