import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { getSessionUser } from './supabase-auth'
import { monthWindowStart } from './quota-window'
import { poolNotice, type PoolNotice } from './workspace-pool-notice'

// landing-launch-experiment · Sprint 4, Story 4.2 (epic D24) — what Today tells a WORKSPACE owner about its pool. The third
// named tenancy carve-out (AGENTS § tenancy, Daniel 2026-10-20): one number about the caller's OWN workspace, to its owner
// only, nothing from inside any project.
// Reads exactly two rows: the project's OWN workspace (by the id the project row holds) and that workspace's counter for
// this month. Never a read across workspaces. Fails SOFT to "no notice": Today must not become an error page because a
// counter could not be read, and a missing notice is not a wrong number.
export async function readPoolNotice(projectId: string): Promise<PoolNotice | null> {
  try {
    const supabase = getSupabaseServiceClient()
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id, workspaces ( plan, monthly_event_pool )')
      .eq('id', projectId)
      .is('deleted_at', null) // many-products D9: a deleted product is not found, and is told nothing
      .maybeSingle()
    const workspace = project?.workspaces as { plan?: string; monthly_event_pool?: number | null } | null
    if (!project?.workspace_id || !workspace) return null
    // The WORKSPACE owner, not a project owner: a project owner who is a mere member of the workspace sees nothing.
    const user = await getSessionUser()
    if (!user) return null
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', project.workspace_id as string)
      .eq('user_id', user.id)
      .maybeSingle()
    if (member?.role !== 'owner') return null
    const pool = workspace.monthly_event_pool ?? null
    if (pool === null) return null
    const { data: counter } = await supabase
      .from('rate_limit_counters')
      .select('count')
      .eq('key', `quota:ws:${project.workspace_id}`)
      .eq('window_start', monthWindowStart().toISOString())
      .maybeSingle()
    return poolNotice({
      used: (counter?.count as number | undefined) ?? 0,
      pool,
      plan: workspace.plan ?? 'free',
    })
  } catch (err) {
    console.error('[workspace-pool] notice read failed:', err)
    return null
  }
}
