import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { createGrowthEngineClient, createScenarioProvider, type ScenarioProvider } from '@golden-frijoles/sdk'
import { isResilienceScenariosEnabled } from '@/lib/flags'
import { probeEnvironment, runScenarioProbe } from '@/lib/scenario-probe'

// scenarios-light-up S2.2 (D7) — the seam a drill's fault lands on, on our own site. Reached only by
// `scripts/scenario-drill.mjs` with SCENARIO_PROBE_SECRET, for a `synthetic:` subject (lib/scenario-probe.ts). Every
// other request is a plain 404, whatever the switches say: unset secret, wrong secret, the resilience switch off, or a
// body that is not a synthetic probe. Nothing here is reachable from a page.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TARGET_KEY = process.env.SCENARIO_PROBE_TARGET_KEY?.trim() || 'site.probe'
let provider: ScenarioProvider | null = null
// The engine this site reports to, as a customer app would configure it: the SDK's default (goldenfrijoles.com)
// unless GOLDEN_FRIJOLES_URL points elsewhere (a local or CI run). Not getSiteUrl(): no URL here is handed to anyone.
const engineUrl = () => process.env.GOLDEN_FRIJOLES_URL?.trim() || undefined

function notFound() {
  return new Response(null, { status: 404 })
}

function authorized(request: Request): boolean {
  const secret = process.env.SCENARIO_PROBE_SECRET?.trim()
  const header = request.headers.get('authorization')
  if (!secret || secret.length < 32 || !header?.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice('Bearer '.length).trim())
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

function scenarioProvider(environment: 'development' | 'preview' | 'production'): ScenarioProvider | null {
  const flagReadKey = process.env.GOLDEN_FRIJOLES_SCENARIO_FLAG_READ_KEY?.trim()
  if (!flagReadKey) return null
  provider ??= createScenarioProvider({ baseUrl: engineUrl(), flagReadKey, environment })
  return provider
}

export async function POST(request: Request) {
  if (!authorized(request)) return notFound()
  if (!(await isResilienceScenariosEnabled())) return notFound()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return notFound()
  }
  const subject = body && typeof body === 'object' ? (body as { subject?: unknown }).subject : undefined
  if (typeof subject !== 'string' || !subject.startsWith('synthetic:')) return notFound()

  const environment = probeEnvironment(process.env.VERCEL_ENV)
  const scenarios = scenarioProvider(environment)
  if (!scenarios) return notFound()
  const apiKey = process.env.SELF_PROJECT_API_KEY?.trim()
  const growth = apiKey ? createGrowthEngineClient({ apiKey, baseUrl: engineUrl() }) : null

  const result = await runScenarioProbe(
    {
      provider: scenarios,
      track: growth ? (input) => growth.trackScenarioExecution(input) : null,
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      now: () => Date.now(),
    },
    { targetKey: TARGET_KEY, subject, environment }
  )
  return Response.json(result, { status: result.status, headers: { 'Cache-Control': 'no-store' } })
}
