import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliMember } from '@/lib/cli-auth'
import { isLiveIngestKeyOf } from '@/lib/api-keys'

// setup-instruments-connects D1 — `frijoles init --ingest` asks, before it mints anything, whether the ingest key already
// in `.env.local` is a live key of THIS project. A member may ask (verifying mints nothing); the answer is one bit, the
// same for a revoked key, an unknown string and another project's key, so it says nothing about any other project. The
// key travels in the body over TLS to the server that issued it, and is never logged or echoed.
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const input = await readCliBody(req)
  if (input instanceof NextResponse) return input
  const context = await requireCliMember(req, typeof input.project === 'string' ? input.project : null)
  if (context instanceof NextResponse) return context
  if (input.type !== 'ingest')
    return cliError('invalid', 'type must be "ingest": only ingest keys are verified here.')
  if (typeof input.key !== 'string' || input.key.trim().length === 0 || input.key.length > 512)
    return cliError('invalid', 'key must be a non-empty string.')
  try {
    const live = await isLiveIngestKeyOf(context.projectId, input.key.trim())
    return cliOk({ project: context.projectSlug, type: 'ingest', state: live ? 'live' : 'not-live' })
  } catch {
    return cliError('server_error', 'Could not verify the key right now.')
  }
}
