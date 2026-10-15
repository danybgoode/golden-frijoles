import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { TREND_BYS, type TrendBy } from '@/lib/flag-funnel'
import { funnelTrendRows } from '@/lib/funnel-trend-rows'
import { getFeatureFunnelTrendByProjectId } from '@/lib/tars-query'

// funnel-truth S1.4 (D8) — a feature's funnel by cohort period, for an agent: `frijoles funnel <feature-key> --by month`.
//
// Member-gated through `requireCliMember` (a `frijoles login` token, the console's own membership check, 404 for a
// project the caller is not in), so this reads exactly one project, resolved server-side. It reads the REGISTRY source
// through `getFeatureFunnelTrendByProjectId` (D4) and renders it with `funnelTrendRows`, the rendering the connector
// shares. Not flag-gated (D8).

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context

  const feature = url.searchParams.get('feature')?.trim()
  if (!feature) return cliError('invalid', 'Name the feature: frijoles funnel <feature-key>.')
  const byParam = url.searchParams.get('by')
  if (byParam !== null && !(TREND_BYS as readonly string[]).includes(byParam))
    return cliError('invalid', '--by must be month or week.')
  const by: TrendBy = (byParam as TrendBy | null) ?? 'month'

  const result = await getFeatureFunnelTrendByProjectId(context.projectId, context.projectSlug, feature, by)
  if (!result.ok && result.reason === 'feature_not_found')
    return cliError('not_found', `No feature "${feature}" in ${context.projectSlug}.`)
  if (!result.ok) return cliError('server_error', 'Could not read this feature’s funnel right now.')
  return cliOk({
    project: context.projectSlug,
    feature: result.feature.key,
    by,
    trend: funnelTrendRows(result.trend),
  })
}
