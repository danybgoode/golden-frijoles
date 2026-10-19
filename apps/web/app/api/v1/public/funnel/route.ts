import { NextRequest, NextResponse } from 'next/server'
import { FUNNEL_PERIODS, parsePeriod, unknownPeriodError } from '@/lib/flag-funnel'
import { assertPublicAllowedSlug } from '@/lib/public-demo'
import { getFeatureFunnel } from '@/lib/tars-query'

// Story 1.2 (commercial-shell/sprint-1.md) — GET /v1/public/funnel?project=&feature=. The public,
// unauthenticated twin of /v1/features/:key/funnel, gated to the demo project only. Reuses
// getFeatureFunnel unmodified (the same slug-based getter the unauthed /app/funnel page already
// calls) — no new query logic.
export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get('project')?.trim()
  const feature = req.nextUrl.searchParams.get('feature')?.trim()
  if (!project || !feature) {
    return NextResponse.json(
      { ok: false, error: 'project and feature query params are required' },
      { status: 400 }
    )
  }

  const allowed = assertPublicAllowedSlug(project)
  if (!allowed.ok) {
    return NextResponse.json({ ok: false, error: allowed.error }, { status: allowed.status })
  }

  // landing-launch-experiment D9: an unknown period is named, never read as `all`. Before any read.
  const rawPeriod = req.nextUrl.searchParams.get('period')
  const period = parsePeriod(rawPeriod)
  if (period === null) {
    return NextResponse.json(
      { ok: false, error: unknownPeriodError(rawPeriod), accepted: [...FUNNEL_PERIODS] },
      { status: 400 }
    )
  }

  const result = await getFeatureFunnel(project, feature, period)
  if (!result.ok) {
    if (result.reason === 'query_failed') {
      return NextResponse.json({ ok: false, error: 'Funnel lookup failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: false, error: `Unknown feature: ${feature}` }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    project: result.project,
    feature: result.feature,
    funnel: result.funnel,
    // tars-one-model D5: the one model's stages, over a period (?period=all|90d|30d, default all).
    note: "Stages: active users, targeted (everyone), exposed (the feature's target event), adopted, retained, satisfied. The period follows the people first exposed in it: all (the feature's whole life), 90d or 30d.",
  })
}
