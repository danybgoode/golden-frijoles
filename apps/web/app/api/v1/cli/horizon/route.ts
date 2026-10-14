import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { readHorizon } from '@/lib/horizon-read'

// agent-legible-horizon D1 — `frijoles horizon`: a product's destinations and what lights each, headless. A MEMBER read,
// like `cli/status`: one project, resolved by the member check (lib/membership.ts through requireCliMember, which also
// refuses a deleted product and a token scoped to another one). The data is the latest roadmap push's `horizon`.
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context
  const horizon = await readHorizon(context.projectId)
  if (!horizon.ok) return cliError('server_error', 'Could not read this product’s horizon right now.')
  return cliOk({
    project: context.projectSlug,
    pushed: horizon.pushed,
    destinations: horizon.destinations,
    generatedAt: horizon.generatedAt,
    sourceCommit: horizon.sourceCommit,
  })
}
