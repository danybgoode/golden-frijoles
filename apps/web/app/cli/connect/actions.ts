'use server'

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase-auth'
import { decideDeviceCode } from '@/lib/cli-device-codes'
import { normalizeUserCode } from '@/lib/cli-device-code-format'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm step (epic D8). Since many-products D4 (2026-10-14)
// it no longer picks a product: the token it mints reaches every product the person belongs to, as a console mint does.
//
// The person is the SESSION's user, never a field in the form. The form carries only the code.
// Without a session nothing is decided — "Didn't start this from your terminal? Close this page. Nothing
// happens." is true because the only writes are here.

async function sessionOrLogin(code: string | null) {
  if (!(await isTerminalSignInEnabled())) redirect('/login')
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cli/connect?code=${code ?? ''}`)}`)
  return user
}

function done(code: string | null, outcome: string): never {
  redirect(`/cli/connect?code=${encodeURIComponent(code ?? '')}&done=${outcome}`)
}

export async function confirmDeviceCode(formData: FormData) {
  const code = normalizeUserCode(formData.get('code'))
  const user = await sessionOrLogin(code)
  if (!code) done(code, 'unknown')
  // many-products D4: login is WHO YOU ARE, not which product. Allow mints an account-wide token (the 3-argument
  // decide, which carries no product), so a new repo is never bound to a product picked before it had one; the repo
  // binds itself with `frijoles init --project | --create`.
  done(code, await decideDeviceCode(code, user.id, { approve: true }))
}

export async function denyDeviceCode(formData: FormData) {
  const code = normalizeUserCode(formData.get('code'))
  const user = await sessionOrLogin(code)
  done(code, code ? await decideDeviceCode(code, user.id, { approve: false }) : 'unknown')
}
