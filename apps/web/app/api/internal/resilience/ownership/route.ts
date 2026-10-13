import { createScenarioOwnershipHandler } from '@golden-frijoles/sdk'

// scenarios-light-up S2.2 (D7) — goldenfrijoles.com answers the drill-target ownership check exactly as a customer app
// does: the SDK's handler, with the token `frijoles scenarios targets add` printed, from server env. No token, no
// answer: 404, the same as any request the handler does not recognise.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let handler: ((request: Request) => Promise<Response | null>) | null | undefined

function answer() {
  if (handler === undefined) {
    const token = process.env.GOLDEN_FRIJOLES_TARGET_TOKEN?.trim()
    try {
      handler = token ? createScenarioOwnershipHandler({ token }) : null
    } catch {
      // A malformed token is configuration, not a request error: the route stays a plain 404.
      handler = null
    }
  }
  return handler
}

export async function POST(request: Request) {
  const respond = answer()
  return (respond && (await respond(request))) ?? new Response(null, { status: 404 })
}
