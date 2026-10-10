import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { getFirstEventForBand, getProductEventMarks } from '@/lib/event-catalog-query'
import { FIRST_EVENT_WINDOW_DAYS, firstEventBand } from '@/lib/first-event-band'
import { isFirstEventBandEnabled } from '@/lib/flags'

// setup-instruments-connects D3 — `frijoles status`: has this project received its first product event, and which was
// the latest. One project, resolved by the member check (lib/membership.ts through requireCliMember); the read is the
// canonical event module's. Behind the first-event kill switch: off → 404, as every gated route answers.
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!(await isFirstEventBandEnabled()))
    return cliError('disabled', 'The first-event status is not switched on here.')
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context
  try {
    // `todayMessage` is what Today shows, from the same bounded read and decision, so the API spec proves the page's
    // waiting → arrived on a real project (verifier, #338).
    const [marks, forToday] = await Promise.all([
      getProductEventMarks(context.projectId),
      getFirstEventForBand(context.projectId, FIRST_EVENT_WINDOW_DAYS),
    ])
    return cliOk({
      project: context.projectSlug,
      ...marks,
      todayMessage: firstEventBand(forToday)?.kind ?? null,
    })
  } catch {
    return cliError('server_error', 'Could not read this project’s events right now.')
  }
}
