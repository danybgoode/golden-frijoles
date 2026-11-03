import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { countEvents } from '@/lib/event-catalog-query'
import { EVENT_COUNT_MAX_DAYS, isGroupableTag } from '@/lib/event-count'

// traffic-relaunch S1.4 (D7) — how many times one event fired, per day, for an agent or a person:
// `frijoles events count <event> [--days N] [--by <tag>]`.
//
// Member-gated through `requireCliMember` (a `frijoles login` token, the console's own membership check re-checked
// against the caller's workspaces, 404 for a project the caller is not in), so this reads exactly one project,
// resolved server-side and never from the query. The count is read through the canonical seam,
// `countEvents` in `lib/event-catalog-query.ts` (rule #1). Not flag-gated (D8).

export const runtime = 'nodejs'

const EVENT_NAME = /^[A-Za-z0-9_.:-]{1,100}$/

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context

  const event = url.searchParams.get('event')?.trim() ?? ''
  if (!EVENT_NAME.test(event)) return cliError('invalid', 'Name the event: frijoles events count <event>.')

  const daysParam = url.searchParams.get('days')
  let days = 30
  if (daysParam !== null) {
    if (!/^\d{1,3}$/.test(daysParam) || Number(daysParam) < 1 || Number(daysParam) > EVENT_COUNT_MAX_DAYS)
      return cliError('invalid', `--days must be a whole number from 1 to ${EVENT_COUNT_MAX_DAYS}.`)
    days = Number(daysParam)
  }

  const byParam = url.searchParams.get('by')
  if (byParam !== null && !isGroupableTag(byParam))
    return cliError('invalid', '--by must be a tag name: lowercase letters, digits and _ (e.g. utm_source).')

  try {
    const count = await countEvents(context.projectId, event, { days, byTag: byParam })
    return cliOk({ project: context.projectSlug, ...count })
  } catch {
    return cliError('server_error', 'Could not count this event right now.')
  }
}
