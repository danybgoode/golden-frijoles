'use server'
import { cookies } from 'next/headers'
import { after } from 'next/server'
import { requireProjectMembership } from '@/lib/dashboard-auth'
import { isSatisfactionAskEnabled } from '@/lib/flags'
import { GATES } from '@/lib/gates-decision'
import {
  SATISFACTION_ASK_COOKIE,
  SATISFACTION_ASK_MAX_AGE_S,
  parseSatisfactionAnswer,
} from '@/lib/satisfaction-ask'
import { trackSelfSatisfaction } from '@/lib/self-track'

/**
 * satisfied-ask S1.4 — a member answered (or declined) the funnel-trend ask. Re-checks membership and the switch here,
 * because a server action is a public endpoint whatever page rendered its button. The rating is about OUR feature
 * (the funnel trend), so it lands in the self project under that flag's key, as the member's own user id: the same
 * person funnel-truth's bet counts as adopting (funnel_trend_viewed).
 */
export async function answerSatisfactionAsk(slug: unknown, value: unknown): Promise<{ ok: boolean }> {
  if (typeof slug !== 'string') return { ok: false }
  const answer = parseSatisfactionAnswer(value)
  if (answer === null) return { ok: false }
  const { userId } = await requireProjectMembership(slug)
  if (!(await isSatisfactionAskEnabled())) return { ok: false }
  ;(await cookies()).set(SATISFACTION_ASK_COOKIE, String(answer), {
    maxAge: SATISFACTION_ASK_MAX_AGE_S,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  after(() => trackSelfSatisfaction(userId, GATES.funnelTrend.key, answer))
  return { ok: true }
}
