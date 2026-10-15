import 'server-only'
import { unstable_cache } from 'next/cache'
import type { SegmentRule } from './flag-funnel'
import { readSegmentShare, type SegmentShareRead } from './flag-funnel-read'
import type { SegmentDefinition } from './segment-schema'
import { getSupabaseServiceClient } from './supabase'

// funnel-truth D9–D11 — a project's segments: the one place `segments` is read or written. Every call takes a
// `projectId` the caller resolved server-side (membership, a credential); nothing here accepts a slug.

export type Segment = SegmentRule & { updatedAt: string }

type SegmentRow = { key: string; event: string; min_count: number; days: number; updated_at: string }
const toSegment = (r: SegmentRow): Segment => ({
  key: r.key,
  event: r.event,
  minCount: r.min_count,
  days: r.days,
  updatedAt: r.updated_at,
})
const COLUMNS = 'key, event, min_count, days, updated_at'

/** The project's segments by key; null on a failed read (never an empty list that looks like "none defined"). */
export async function listSegments(projectId: string): Promise<Segment[] | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from('segments')
    .select(COLUMNS)
    .eq('project_id', projectId)
    .order('key', { ascending: true })
  if (error) {
    console.error('[segments] list failed:', error)
    return null
  }
  return (data as SegmentRow[]).map(toSegment)
}

/** One segment, `null` when the project hasn't defined it, or `'failed'` on a failed read. */
export async function getSegment(projectId: string, key: string): Promise<Segment | null | 'failed'> {
  const { data, error } = await getSupabaseServiceClient()
    .from('segments')
    .select(COLUMNS)
    .eq('project_id', projectId)
    .eq('key', key)
    .maybeSingle()
  if (error) {
    console.error('[segments] get failed:', error)
    return 'failed'
  }
  return data ? toSegment(data as SegmentRow) : null
}

/** Define or redefine a segment by key (D10). */
export async function defineSegment(
  projectId: string,
  userId: string,
  definition: SegmentDefinition
): Promise<{ ok: true; segment: Segment; created: boolean } | { ok: false }> {
  const client = getSupabaseServiceClient()
  const existing = await getSegment(projectId, definition.key)
  if (existing === 'failed') return { ok: false }
  const { data, error } = await client
    .from('segments')
    .upsert(
      {
        project_id: projectId,
        key: definition.key,
        event: definition.event,
        min_count: definition.minCount,
        days: definition.days,
        created_by: existing ? undefined : userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,key' }
    )
    .select(COLUMNS)
    .single()
  if (error || !data) {
    console.error('[segments] define failed:', error)
    return { ok: false }
  }
  return { ok: true, segment: toSegment(data as SegmentRow), created: existing === null }
}

/** A segment's share of the last 30 days' active people (D11), cached as the funnels are. Throws on a failed read. */
export function getSegmentShare(projectId: string, rule: SegmentRule): Promise<SegmentShareRead> {
  return unstable_cache(
    () => readSegmentShare(getSupabaseServiceClient(), projectId, rule),
    ['segment-share', projectId, rule.key, rule.event, String(rule.minCount), String(rule.days)],
    { revalidate: 300 }
  )()
}
