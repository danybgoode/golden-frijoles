'use client'
import { useState } from 'react'
import { createAuthBrowserClient } from '@/lib/supabase-browser'
import { Button } from '@/design-system/primitives'

// account-from-the-terminal · Sprint 2, Story 2.1 — "Continue with Google" (epic D4).
//
// Supabase's own Google provider: the browser client starts the OAuth round trip (it keeps the
// PKCE verifier in a cookie), Google returns to the EXISTING `/auth/callback`, which exchanges the
// code and provisions a new account exactly as an email confirmation does. Nothing new on the server.
//
// ── Where the return URL comes from ──────────────────────────────────────────────────────────
// `siteUrl` is handed down by the server page from `getSiteUrl()` (AGENTS rule #5) — never
// `window.location`, which is the browser's Host header by another name. `next` is a PATH the page
// chose; `/auth/callback` re-guards it with `safeRedirectPath` before following it.
//
// Rendered INSIDE the door's `.ds-doorform`: the approved door states are a fixed block sequence
// (doorbrand → title → note → doorform → doorfoot → doornote), and a button inside the form adds no
// block. The caller renders this only when `isTerminalSignInEnabled()` said so.
export function GoogleSignIn({ siteUrl, next }: { siteUrl: string; next: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setBusy(true)
    setError(null)
    const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
    const { error: oauthError } = await createAuthBrowserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    // On success the browser is already navigating to Google; only a failure comes back here.
    if (oauthError) {
      setBusy(false)
      setError('Google sign-in is not available right now. Use your email and password below.')
    }
  }

  return (
    <>
      <Button onClick={onClick} state={busy ? 'loading' : 'idle'}>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </Button>
      {error !== null && (
        <p className="ds-field-error" role="alert">
          {error}
        </p>
      )}
      <p className="ds-hint">or with your email</p>
    </>
  )
}
