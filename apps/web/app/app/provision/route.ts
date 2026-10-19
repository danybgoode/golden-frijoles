import { NextResponse, after } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/supabase-auth'
import { getUserProjects } from '@/lib/membership'
import { getSiteUrl } from '@/lib/site-url'
import { isSignupEnabled } from '@/lib/flags'
import { displayNameFrom } from '@/lib/display-name'
import { provisionTenantForUser, registerStarterFeature } from '@/lib/provisioning'
import {
  trackSelfEvent,
  trackVisitorSignupCreated,
  ACCOUNT_CONFIRMED_EVENT,
  VISITOR_COOKIE,
} from '@/lib/self-track'
import { ACQUISITION_VARIANT_COOKIE, parseAcquisitionVariant } from '@/lib/landing-variant'

// multi-tenant-activation · Sprint 2 — the provisioning RETRY, as a Route Handler.
//
// Why this exists at all: the auth callback provisions a tenant after the email round-trip, but
// `signInWithPassword` (app/login/login-form.tsx) sets its cookies client-side and NEVER reaches
// /auth/callback. So a user whose provisioning hit a transient error at confirmation time had no
// path back — a working account, no tenant, and nothing that would ever retry (cross-review,
// Codex 2026-07-20).
//
// Why a Route Handler rather than doing it inline in the /app Server Component: a Server Component
// cannot write cookies. Retrying inline therefore could not hand over the plaintext key, which
// forced a "provision without a first key" mode — and that mode then silently skipped the starter
// feature too, leaving retried tenants with a permanently empty funnel (cross-review, Agy
// 2026-07-20). A Route Handler can set cookies, so the retried user gets the IDENTICAL experience
// to a first-time signup: key reveal, starter feature, onboarding screen. The special case is gone
// rather than patched.
export async function GET() {
  const siteUrl = getSiteUrl()
  const backToApp = new URL('/app', siteUrl)

  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login', siteUrl))

  // Re-checked here, not just at the caller: this is a real HTTP endpoint anyone with a session
  // can hit directly, so it must never provision while signup is dark.
  if (!(await isSignupEnabled())) return NextResponse.redirect(backToApp)

  // Already has a tenant → nothing to do. Also what stops a redirect loop with /app.
  const projects = await getUserProjects(user.id)
  if (projects.length > 0) return NextResponse.redirect(backToApp)

  // landing-launch-experiment D4/D5 — same cookies, same rule as the auth callback (this is its retry path).
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value
  const result = await provisionTenantForUser(
    user.id,
    user.email ?? '',
    displayNameFrom(user.user_metadata),
    parseAcquisitionVariant(cookieStore.get(ACQUISITION_VARIANT_COOKIE)?.value)
  )
  if (!result.ok) {
    console.error('[app/provision] retry failed:', result.error)
    // `?provision=failed` is what tells /app not to bounce straight back here — the loop breaker.
    // /app then renders its honest "no projects yet" state and the user can retry by revisiting.
    return NextResponse.redirect(new URL('/app?provision=failed', siteUrl))
  }

  if (result.created) {
    // The activation funnel's MIDDLE stage. Fired here as well as in the auth callback, because
    // this route handles exactly the transient-failure path where the callback's own emit was
    // missed — omitting it would leave the funnel permanently missing account_confirmed for the
    // users who most needed the retry (cross-review, Codex 2026-07-20). Double-firing across the
    // two paths is harmless: TARS counts DISTINCT users per event.
    after(() => trackSelfEvent(ACCOUNT_CONFIRMED_EVENT, user.id))
    after(() => trackVisitorSignupCreated(visitorId))

    // connect-page D3: the first key registers the starter feature (through the SDK, AGENTS rule #1)
    // and is never handed to the browser. It stays listed and revocable under Setup › Keys.
    if (result.plaintextKey) {
      const starterKey = result.plaintextKey
      after(() => registerStarterFeature(starterKey))
    }
  }

  if (result.created) {
    // connect-page D2: a new account lands on Connect.
    return NextResponse.redirect(new URL(`/app/setup/connect/${result.projectSlug}`, siteUrl))
  }

  // `created: false` means "you already had one" — but we only got here BECAUSE /app saw zero
  // projects. If that's still true, provisioning and the membership read disagree, and bouncing
  // back to /app would send the user straight here again, forever. The loop breaker is
  // unconditional and does not depend on any particular cause being fixed upstream: whatever new
  // way this disagreement arises, the user lands on a page instead of in a redirect cycle
  // (cross-review, Codex 2026-07-20).
  const afterProvision = await getUserProjects(user.id)
  if (afterProvision.length === 0) {
    console.error(`[app/provision] adopted "${result.projectSlug}" but user ${user.id} still has no projects`)
    return NextResponse.redirect(new URL('/app?provision=failed', siteUrl))
  }

  return NextResponse.redirect(backToApp)
}
