import { getSiteUrl } from '@/lib/site-url'
import { installManifest } from '@/lib/install-manifest'

// GET /install.md — account-from-the-terminal S1.1 (epic D1). The page the install prompt tells an
// agent to read BEFORE installing anything. Same shape as `app/llms.txt/route.ts`: a real route built
// on `getSiteUrl()` (AGENTS rule #5), force-dynamic so a CI build's missing SITE_URL is never frozen
// into it. The body is `lib/install-manifest.ts`, generated from the constants `/install` renders.
export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(installManifest(getSiteUrl()), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
