import 'server-only'
import { getSessionUser } from './supabase-auth'
import { isOwedOnScreenEnabled } from './flags'
import { getOwedForViewer, type OwedRead } from './owed-read'

// owed-on-screen D9 + D11 — what a screen asks before it draws an owed check: the flag FIRST (off ⇒ no session lookup,
// no read, the page renders exactly what it did before), then the member-gated read. The flag is awaited here, in the
// one place, because a bare gate call is a Promise and a Promise is always truthy.
//
// `projectId` is the id the page's own read already resolved after its access gate — never derived from a slug.

export type OwedScreenRead = (Extract<OwedRead, { ok: true }> & { userId: string }) | { ok: false }

export async function readOwedOnScreen(projectId: string): Promise<OwedScreenRead> {
  if (!(await isOwedOnScreenEnabled())) return { ok: false }
  const user = await getSessionUser()
  const read = await getOwedForViewer(projectId, user?.id ?? null)
  // A read can only be ok for a signed-in member, so `user` is set whenever it is.
  return read.ok && user ? { ...read, userId: user.id } : { ok: false }
}
