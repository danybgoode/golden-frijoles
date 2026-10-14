import { AGENTS_MD } from '@/lib/agents-manifest'

// GET /agents.md — agent-legible-horizon S1.4 (D6). Served like `app/install.md/route.ts`, from a
// module `lib/agents-md.test.ts` holds to the CLI's command table and the MCP tool registrations.
// It names no absolute URL, so it needs no `getSiteUrl()` and is safe to build statically.
export const dynamic = 'force-static'

export async function GET() {
  return new Response(AGENTS_MD, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
