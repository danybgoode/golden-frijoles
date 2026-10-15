import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliMember, requireCliOwner } from '@/lib/cli-auth'
import { EVERYONE } from '@/lib/flag-funnel'
import type { SegmentShareRead } from '@/lib/flag-funnel-read'
import { segmentDefinitionSchema } from '@/lib/segment-schema'
import { defineSegment, getSegmentShare, listSegments, type Segment } from '@/lib/segments'

// funnel-truth S2.1 (D10) — a project's segments, for an agent: `frijoles segments ls` (GET, a member) and
// `frijoles segments define` (POST, an owner, as North Star and scenario writes are). One project, resolved
// server-side by the membership check; 404 for a project the caller is not in.

export const runtime = 'nodejs'

type ShareBody = { share: number | null; members: number; base: number } | { share: null; unreadable: string }
async function shareOf(projectId: string, segment: Segment): Promise<ShareBody> {
  let read: SegmentShareRead
  try {
    read = await getSegmentShare(projectId, segment)
  } catch {
    return { share: null, unreadable: 'The share could not be read right now. This is not a zero.' }
  }
  return read.state === 'read'
    ? { share: read.share, members: read.members, base: read.base }
    : { share: null, unreadable: read.reason }
}
const view = (s: Segment) => ({
  key: s.key,
  event: s.event,
  minCount: s.minCount,
  days: s.days,
  updatedAt: s.updatedAt,
})

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context

  const segments = await listSegments(context.projectId)
  if (segments === null) return cliError('server_error', 'Could not read this project’s segments right now.')
  const rows = await Promise.all(
    segments.map(async (s) => ({ ...view(s), ...(await shareOf(context.projectId, s)) }))
  )
  // `everyone` is every project's built-in segment: always listed first, always the whole base.
  return cliOk({ project: context.projectSlug, segments: [{ key: EVERYONE, share: 1 }, ...rows] })
}

export async function POST(req: NextRequest) {
  const input = await readCliBody(req)
  if (input instanceof NextResponse) return input
  const context = await requireCliOwner(req, typeof input.project === 'string' ? input.project : null)
  if (context instanceof NextResponse) return context

  const parsed = segmentDefinitionSchema.safeParse(input.segment)
  if (!parsed.success)
    return cliError('invalid', parsed.error.issues.map((i) => i.message).join('; '), {
      issues: parsed.error.issues,
    })
  const result = await defineSegment(context.projectId, context.userId, parsed.data)
  if (!result.ok) return cliError('server_error', 'Could not save the segment right now.')
  return cliOk({
    project: context.projectSlug,
    created: result.created,
    segment: { ...view(result.segment), ...(await shareOf(context.projectId, result.segment)) },
  })
}
