import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { getInputSeriesByKey } from '@/lib/north-star-query'
import { inputReadings, isReadingsCut } from '@/lib/input-readings'

// result-record · Story 3.1 (D14) — one North Star input's readings, for an agent: `frijoles north-star readings <input>`.
//
// Member-gated through `requireCliMember` (a `frijoles login` token, the console's own membership check, 404 for a project the
// caller is not in), so this reads exactly one project, resolved server-side. It reads one input through
// `getInputSeriesByKey`, whose series comes from the same `readInputSeries` the North Star page uses — no second query of
// `input_values` or `events` — and `lib/input-readings.ts` cuts it at `to` and names the latest reading.

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context

  const key = url.searchParams.get('input')?.trim()
  if (!key) return cliError('invalid', 'Name the North Star input: frijoles north-star readings <input-key>.')
  const to = url.searchParams.get('to')
  if (!isReadingsCut(to)) return cliError('invalid', '--to must be a day written YYYY-MM-DD.')

  const result = await getInputSeriesByKey(context.projectId, key)
  if (!result.ok && result.reason === 'input_not_found')
    return cliError(
      'not_found',
      `No North Star input "${key}" in ${context.projectSlug}. \`frijoles north-star set\` registers inputs.`
    )
  if (!result.ok) return cliError('server_error', 'Could not read this project’s North Star right now.')
  const view = inputReadings([result.input], key, to)
  if (!view) return cliError('server_error', 'Could not read this project’s North Star right now.')
  return cliOk({ project: context.projectSlug, metric: result.input.metricKey || null, ...view })
}
