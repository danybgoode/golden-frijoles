import type { NextConfig } from 'next'

// Story 1.1 (commercial-shell/sprint-1.md) — the engine pages (funnel/impact/experiments) moved
// under /app/... to make room for the public landing at `/`. No auth exists yet (out of this
// epic's scope), so "gating" here is physical relocation + a redirect, not a real access check.
// 307 (temporary), not 301: the real auth-gated destination may move again once E2 lands, and a
// 301 would get hard-cached by browsers/search engines against a path that isn't final.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      // one-product-project S1.1 — `golden-beans-demo` was renamed `golden-frijoles` (D1). Links already shared
      // keep working. Permanent: the old slug is reserved (lib/tenant-slug.ts) and can never mean anything else.
      // `golden-beans` is NOT redirected: it still exists, archived, and its flag history stays readable there.
      { source: '/hub/golden-beans-demo', destination: '/hub/golden-frijoles', permanent: true },
      { source: '/hub/golden-beans-demo/:path*', destination: '/hub/golden-frijoles/:path*', permanent: true },
      { source: '/app/:section/golden-beans-demo', destination: '/app/:section/golden-frijoles', permanent: true },
      {
        source: '/app/:section/golden-beans-demo/:path*',
        destination: '/app/:section/golden-frijoles/:path*',
        permanent: true,
      },
      {
        source: '/funnel/:projectSlug/:featureKey',
        destination: '/app/funnel/:projectSlug/:featureKey',
        permanent: false,
      },
      {
        source: '/impact/:projectSlug/:featureKey',
        destination: '/app/impact/:projectSlug/:featureKey',
        permanent: false,
      },
      {
        source: '/experiments/:projectSlug/:experimentKey',
        destination: '/app/experiments/:projectSlug/:experimentKey',
        permanent: false,
      },
      // connect-page D2 — onboarding retired: signup lands on Connect, and old links and bookmarks follow it.
      {
        source: '/app/onboarding/:projectSlug',
        destination: '/app/setup/connect/:projectSlug',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
