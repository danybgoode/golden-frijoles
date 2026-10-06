'use server'

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase-auth'
import { decideDeviceCode } from '@/lib/cli-device-codes'
import { normalizeUserCode } from '@/lib/cli-device-code-format'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm step (epic D8).
//
// The person is the SESSION's user, never a field in the form: the only thing the form carries is
// the code they are deciding about. Without a session nothing is decided — "Didn't start this from
// your terminal? Close this page. Nothing happens." is true because the only write is here.

async function decide(formData: FormData, approve: boolean): Promise<never> {
  const code = normalizeUserCode(formData.get('code'))
  if (!(await isTerminalSignInEnabled())) redirect('/login')
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/cli/connect?code=${code ?? ''}`)}`)
  const outcome = code ? await decideDeviceCode(code, user.id, approve) : 'unknown'
  redirect(`/cli/connect?code=${encodeURIComponent(code ?? '')}&done=${outcome}`)
}

export async function confirmDeviceCode(formData: FormData) {
  await decide(formData, true)
}

export async function denyDeviceCode(formData: FormData) {
  await decide(formData, false)
}
