import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { VISITOR_COOKIE_ATTRIBUTES, isMarketingPath, VISITOR_COOKIE } from '@/lib/marketing-paths'

// multi-tenant-activation · Sprint 1, Story 1.1 — auth session refresh.
//
// Server Components can't write cookies, so @supabase/ssr needs middleware to rewrite refreshed
// auth cookies onto the response. This is session PLUMBING ONLY — it does NOT gate routes.
// Per-route authorization is a server-side membership check at the DATA boundary
// (lib/membership.ts), never a URL-pattern guard here. /api/v1/* is untouched; a marketing page pays the
// auth cost only when it carries a session cookie (below).
/** A Supabase session cookie (`sb-<ref>-auth-token`, possibly chunked `.0`, `.1`): only then is there a session to refresh. */
function hasAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
}

export async function middleware(request: NextRequest) {
  // landing-launch-experiment D2 — a public marketing page needs the visitor id IN THE REQUEST it renders, or the
  // server cannot pick an A/B variant for a first visit and the client would mint a different id: the visit and the
  // exposure would be two people. Set on the request (the page reads it in this same render) and on the response (the
  // browser keeps it).
  let minted: string | null = null
  if (isMarketingPath(request.nextUrl.pathname)) {
    if (!request.cookies.get(VISITOR_COOKIE)?.value) {
      minted = crypto.randomUUID()
      request.cookies.set(VISITOR_COOKIE, minted)
    }
    // S4.4 (verifier, #419): the landing's Growth tier reads the session (a signed-in owner gets the checkout form). A
    // Server Component cannot write cookies, so a stale access token refreshed THERE would throw the rotated tokens away
    // and leave the browser holding a spent refresh token — signing out the very buyer the button is for. So a marketing
    // page with a session cookie is refreshed here, like /app; one without (almost every visitor) pays nothing.
    if (!hasAuthCookie(request)) return withVisitor(NextResponse.next({ request }), minted)
  }

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Auth env missing (e.g. a preview built before the vars land): skip the refresh — there's no
  // session to refresh without a client. This is NOT graceful degradation to a login screen: the
  // page's own getSessionUser() will then throw from requireEnv() and the request 500s. That is
  // deliberate and correct — a misconfigured auth boundary must fail LOUD, never silently render
  // as "logged out" (which could read as an authorization answer). An earlier comment here claimed
  // a /login fallback that the code never provided; cross-review round 2 (Codex, 2026-07-20) caught
  // the mismatch. The fix is the honest comment, not a softer failure.
  if (!url || !anon) return withVisitor(response, minted)

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Touch getUser() to refresh a stale access token (and its cookie) before the page runs.
  await supabase.auth.getUser()
  return withVisitor(response, minted)
}

/** The browser keeps a visitor id minted for this request; set last, because a refresh replaces the response. */
function withVisitor(response: NextResponse, minted: string | null): NextResponse {
  if (minted) response.cookies.set(VISITOR_COOKIE, minted, VISITOR_COOKIE_ATTRIBUTES)
  return response
}

// account-from-the-terminal D8: `/cli/connect` reads the session too (the device-code confirm), and
// a stale access token there would show a signed-in person the signed-out page.
// landing-launch-experiment D2: the marketing paths are listed in lib/marketing-paths.ts too, and a spec pins that the
// two lists agree (a matcher must be a static literal, so it cannot import the list).
export const config = {
  matcher: [
    '/app/:path*',
    '/cli/:path*',
    '/',
    '/methodology/:path*',
    '/methodology',
    '/talk',
    '/signup',
    '/login',
  ],
}
