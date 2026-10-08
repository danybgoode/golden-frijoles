'use server'

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase-auth'
import { decideDeviceCode } from '@/lib/cli-device-codes'
import { normalizeUserCode } from '@/lib/cli-device-code-format'
import { getMembership, getUserProjects } from '@/lib/membership'
import { provisionTenantForUser } from '@/lib/provisioning'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'

// account-from-the-terminal · Sprint 2, Story 2.2 — the confirm step (epic D8), and since the 2026-10-05
// amendment (canvas First run, frame 6) the product the token is for.
//
// The person is the SESSION's user, never a field in the form. The form carries the code, and on Allow the
// slug of the product they picked — which only selects among THEIR memberships: `getMembership` resolves it
// for this user or not at all, and the database re-checks the membership in the statement that writes.
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

/**
 * The product to bind the token to. A person with no product at all gets their first one, made the way
 * `frijoles init` makes it (the same idempotent `provisionTenantForUser`, its one-time key never revealed here).
 */
async function chosenProjectId(
  userId: string,
  email: string | undefined,
  slug: unknown
): Promise<string | null> {
  if (typeof slug === 'string' && slug !== '') return (await getMembership(userId, slug))?.projectId ?? null
  if ((await getUserProjects(userId)).length > 0 || !email) return null
  const provisioned = await provisionTenantForUser(userId, email)
  if (!provisioned.ok) return null
  return (await getMembership(userId, provisioned.projectSlug))?.projectId ?? null
}

export async function confirmDeviceCode(formData: FormData) {
  const code = normalizeUserCode(formData.get('code'))
  const user = await sessionOrLogin(code)
  if (!code) done(code, 'unknown')
  const projectId = await chosenProjectId(user.id, user.email ?? undefined, formData.get('product'))
  // Not one of yours and no such product are the same answer, and nothing is minted for either.
  if (!projectId) done(code, 'not_member')
  done(code, await decideDeviceCode(code, user.id, { approve: true, projectId }))
}

export async function denyDeviceCode(formData: FormData) {
  const code = normalizeUserCode(formData.get('code'))
  const user = await sessionOrLogin(code)
  done(code, code ? await decideDeviceCode(code, user.id, { approve: false }) : 'unknown')
}
