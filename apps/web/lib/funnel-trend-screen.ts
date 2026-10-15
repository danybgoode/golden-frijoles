import 'server-only'
import { after } from 'next/server'
import { getMembershipByProjectId } from './membership'
import { FUNNEL_TREND_VIEWED_EVENT, trackSelfEvent } from './self-track'
import { getSessionUser } from './supabase-auth'

/**
 * funnel-truth D7 — a page rendered a funnel trend: once per view, only for a signed-in MEMBER of that project (the
 * person is their user id). An anonymous reader of the public project sees the trend and is never counted.
 */
export async function noteFunnelTrendViewed(projectId: string): Promise<void> {
  const user = await getSessionUser()
  if (!user) return
  if (!(await getMembershipByProjectId(user.id, projectId))) return
  after(() => trackSelfEvent(FUNNEL_TREND_VIEWED_EVENT, user.id))
}
