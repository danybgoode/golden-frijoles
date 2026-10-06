import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getFlagRegistryView } from './flag-registry'
import { toCliFlagView } from './cli-flag-view'
import { SELF_PROJECT_SLUG } from './self-track'
import {
  TERMINAL_SIGN_IN_FLAG_KEY,
  flagEnvironmentFor,
  isTerminalSignInOn,
} from './terminal-sign-in-flag-decision'

// account-from-the-terminal · Sprint 2, Story 2.1 — the ONE seam for `auth.terminal_sign_in_enabled`
// (epic D5). Read by the Google buttons, `/cli/connect` and both device endpoints; nothing else
// decides whether terminal sign-in is on.
//
// ── Why it reads Golden Frijoles's own catalog, in-process ────────────────────────────────────
// The flag lives where every other flag lives — this product's own project (`SELF_PROJECT_SLUG`) —
// so `gf flags kill auth.terminal_sign_in_enabled --env production` is the kill, with no env var
// and no redeploy. The read is service-role and needs no sign-in, so there is no circularity with
// the thing it gates. The project is resolved from configuration, never from a request.
//
// ── The cache ─────────────────────────────────────────────────────────────────────────────────
// One boolean per process for 30 s. It is a single GLOBAL fact (not tenant data), so sharing it
// across requests leaks nothing — unlike a cached identity, which is why `getSessionUser` uses a
// per-request `cache()` instead. 30 s bounds how long a kill takes to land.

const CACHE_MS = 30_000
let cached: { value: boolean; at: number } | null = null

export async function isTerminalSignInEnabled(): Promise<boolean> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value
  const value = await readFlag()
  cached = { value, at: Date.now() }
  return value
}

async function readFlag(): Promise<boolean> {
  try {
    const { data: project, error } = await getSupabaseServiceClient()
      .from('projects')
      .select('id')
      .eq('slug', SELF_PROJECT_SLUG)
      .maybeSingle()
    if (error || !project) return true
    const registry = await getFlagRegistryView(project.id as string)
    const flag = registry.flags.find((row) => row.key === TERMINAL_SIGN_IN_FLAG_KEY)
    if (!flag) return true
    return isTerminalSignInOn(toCliFlagView(flag).environments, flagEnvironmentFor(process.env.VERCEL_ENV))
  } catch (err) {
    // Includes a deployment with no database at all (previews: SUPABASE_* is Production-only).
    console.error(
      '[terminal-sign-in-flag] read failed, serving the born-ON default:',
      err instanceof Error ? err.message : err
    )
    return true
  }
}
