import { NextRequest, NextResponse } from 'next/server'
import { asPeriod } from '@/lib/flag-funnel'
import { resolveProjectFromAuthHeader } from '@/lib/auth'
import { getSupabaseServiceClient } from '@/lib/supabase'
import { getFeatureFunnelByProjectId } from '@/lib/tars-query'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const auth = await resolveProjectFromAuthHeader(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }
  const { key } = await params

  const supabase = getSupabaseServiceClient()
  const { data: project, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', auth.projectId)
    .single()
  if (error || !project) {
    console.error('[features/funnel] project lookup failed:', error)
    return NextResponse.json({ ok: false, error: 'Project lookup failed' }, { status: 500 })
  }

  const result = await getFeatureFunnelByProjectId(
    auth.projectId,
    project.slug,
    key,
    asPeriod(req.nextUrl.searchParams.get('period'))
  )
  if (!result.ok) {
    if (result.reason === 'query_failed') {
      return NextResponse.json({ ok: false, error: 'Funnel lookup failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: false, error: `Unknown feature: ${key}` }, { status: 404 })
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
