import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getFlagRegistryView } from './flag-registry'
import { toCliFlagView } from './cli-flag-view'
import { DEMO_PROJECT_SLUG } from './public-demo'
import type { ServedCatalog, ServedEnvironment } from './gates-decision'

// one-product-project · Sprint 2, Story 2.1 — what Golden Frijoles' own catalog serves, for lib/gates.ts.
//
// The project is the one Golden Frijoles is built in (`golden-frijoles`, D1), resolved from configuration, never
// from a request. The read is service-role and needs no sign-in, so nothing it gates can stand in its way. Every
// failure — no database (previews: SUPABASE_* is Production-only), no project, a query error — returns `null`, and
// each gate then serves its fallback (lib/gates-decision.ts, D5). It never throws: a page that cannot read a gate
// still renders, as production.
export async function readServedCatalog(): Promise<ServedCatalog> {
  try {
    const { data: project, error } = await getSupabaseServiceClient()
      .from('projects')
      .select('id')
      .eq('slug', DEMO_PROJECT_SLUG)
      .maybeSingle()
    if (error || !project) {
      console.error(
        '[gates] could not resolve the catalog project; every gate serves its fallback:',
        error?.message
      )
      return null
    }
    const registry = await getFlagRegistryView(project.id as string)
    const served = new Map<string, readonly ServedEnvironment[]>()
    for (const flag of registry.flags) served.set(flag.key, toCliFlagView(flag).environments)
    return served
  } catch (err) {
    console.error(
      '[gates] catalog read failed; every gate serves its fallback:',
      err instanceof Error ? err.message : err
    )
    return null
  }
}
