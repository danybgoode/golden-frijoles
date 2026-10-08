import 'server-only'

// Story 1.2 (commercial-shell/sprint-1.md) — the public landing's live-proof section, and the
// /api/v1/public/* routes, may only ever read ONE project: Golden Frijoles' own, built in the open
// (one-product-project D1 — it was `golden-beans-demo`, a synthetic demo seeded by
// scripts/seed-demo-project.mjs, which still seeds it locally and in CI). This is the allow-list gate for the HTTP boundary where a
// project slug is attacker-controlled (query param); the landing page itself never needs this
// check since it always calls the query functions with this same hardcoded constant, never with
// request input.
export const DEMO_PROJECT_SLUG = process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'

export type PublicSlugCheck = { ok: true } | { ok: false; status: 403; error: string }

export function assertPublicAllowedSlug(slug: string): PublicSlugCheck {
  if (slug !== DEMO_PROJECT_SLUG) {
    return { ok: false, status: 403, error: 'This read path serves only the public demo project.' }
  }
  return { ok: true }
}
