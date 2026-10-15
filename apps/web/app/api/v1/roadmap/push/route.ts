import { NextRequest, NextResponse } from 'next/server'
import { resolveProjectFromAuthHeader } from '@/lib/auth'
import { getSupabaseServiceClient } from '@/lib/supabase'
import { isSameRoadmapPayload, parseRoadmapPush, ROADMAP_SCHEMA_VERSION } from '@/lib/roadmap-artifact-schema'
import { getLatestRoadmapWithOwed } from '@/lib/report-artifacts'

// pod-report · Sprint 1, Story 1.1 — POST /api/v1/roadmap/push
//
// The client-pushes rail: a tenant POSTs their own roadmap extract with their own API key and the
// engine stores it as an immutable, versioned artifact. Same shape as the S2 registry seed — the
// engine never reads anyone's git, holds no repo credential, and needs no access to a customer's
// source. They push; we render.
//
// The tenant is resolved from the hashed API key (lib/auth.ts) and NEVER from the body. There is no
// project field in the payload schema at all, so "push into someone else's project" is not a
// vulnerability to guard against — it is an unrepresentable request.

export async function POST(req: NextRequest) {
  const auth = await resolveProjectFromAuthHeader(req.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parseRoadmapPush(body)
  if (!parsed.ok) {
    // Version mismatch and shape failure are distinguishable to the caller — see parseRoadmapPush.
    return NextResponse.json(
      { ok: false, error: parsed.error, ...(parsed.issues ? { issues: parsed.issues } : {}) },
      { status: 400 }
    )
  }

  const { generatedAt, source, items, board, horizon, owed } = parsed.value
  // `board` (WIP limits, the repo base for doc links) is stored beside the rows. Before it was declared, an extra key
  // passed validation and was silently stripped here (board-sinks-and-scrumban lock C6).
  // `horizon` (the product's own destinations, many-products D14) rides the same way: absent when the push had none.
  const payload = {
    items,
    ...(board ? { board } : {}),
    ...(horizon && horizon.length ? { horizon } : {}),
    // owed-on-screen D4 — stored beside the rows (it is not in `items`, so it would be dropped). [] is kept: it is a
    // reading ("nothing owed"), where absent is "keeps no ledger". Never read back raw except through D6's registry.
    ...(Array.isArray(owed) ? { owed } : {}),
  }
  const supabase = getSupabaseServiceClient()

  // D16 — an unchanged board is not a new version. The latest artifact is read for THIS project only (the id came
  // from the API key above), and a failed read never blocks the push: the worst case is one duplicate version.
  let latest = null
  try {
    // The RAW read (owed-on-screen D6): the stripped one would make every push carrying `owed` look changed.
    latest = await getLatestRoadmapWithOwed(auth.projectId)
  } catch {
    latest = null
  }
  if (
    latest &&
    latest.schemaVersion === ROADMAP_SCHEMA_VERSION &&
    isSameRoadmapPayload(latest.payload, payload)
  ) {
    return NextResponse.json({
      ok: true,
      unchanged: true,
      artifactId: latest.id,
      version: latest.version,
      schemaVersion: ROADMAP_SCHEMA_VERSION,
      items: items.length,
    })
  }

  // Version allocation happens inside the RPC under an advisory lock — never here. Reading
  // max(version) in the route and inserting version+1 is the lost-update race two concurrent pushes
  // would hit, and the app has no lock to prevent it.
  const { data, error } = await supabase
    .rpc('push_report_artifact', {
      p_project_id: auth.projectId,
      p_kind: 'roadmap',
      p_schema_version: ROADMAP_SCHEMA_VERSION,
      p_payload: payload,
      p_generated_at: generatedAt.toISOString(),
      p_source_commit: source?.commit ?? null,
      p_source_ref: source?.ref ?? null,
    })
    .single<{ artifact_id: string; artifact_version: number }>()

  if (error) {
    console.error('[roadmap/push] insert failed:', error)
    return NextResponse.json({ ok: false, error: 'Failed to store roadmap artifact' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    artifactId: data.artifact_id,
    version: data.artifact_version,
    schemaVersion: ROADMAP_SCHEMA_VERSION,
    items: items.length,
  })
}
