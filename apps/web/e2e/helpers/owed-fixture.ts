import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ROADMAP_SCHEMA_VERSION } from '@/lib/roadmap-artifact-schema'

// owed-on-screen S2.4 — one roadmap push WITH an `owed` block, for the lit and the dark spec to share (two copies of a
// fixture are two chances for the dark half to assert against a page the lit half never had).
//
// Pushed through `push_report_artifact`, the product's own write path, to a project the spec's disposable person owns —
// never the shared fixture user's project (every other authed spec reads that board) and never the demo project (latest
// wins there; hub.spec.ts owns it).

export const OWED_REPO = 'https://github.com/danybgoode/golden-frijoles/blob/main/'
export const OWED_COMMIT = 'abc1234def5678'

export const OWED_EPIC = 'owed-fixture-epic'
/** An epic that owes nothing: its page must carry no Owed section even with the flag on. */
export const OWED_QUIET_EPIC = 'owed-fixture-quiet'
export const OWED_FILE = `Roadmap/02-commercial/${OWED_EPIC}/RETROSPECTIVE.md`
export const OWED_LINE = 12

/** One check per D10 group, and one that belongs to no epic. A unique marker keeps a stray match out of the assertions. */
export function owedFixtureRows(marker: string) {
  return [
    {
      epic: OWED_EPIC,
      text: `${marker} decide whether the verdict stands`,
      kind: 'judgment',
      category: 'other',
      file: OWED_FILE,
      line: OWED_LINE,
    },
    {
      epic: OWED_EPIC,
      text: `${marker} walk the signed-in board`,
      kind: 'signed-in',
      category: 'auth-path',
      file: `Roadmap/02-commercial/${OWED_EPIC}/sprint-2.md`,
      line: 40,
    },
    {
      epic: null,
      text: `${marker} a note nobody sorted`,
      kind: 'unsorted',
      category: 'other',
      file: 'apps/web/e2e/owed-fixture.spec.ts',
      line: 3,
    },
  ]
}

export async function pushOwedRoadmap(db: SupabaseClient, projectId: string, marker: string) {
  const epic = (slug: string, name: string) => ({
    name,
    slug,
    grain: 'Epic' as const,
    status: 'in-progress',
    area: '02-commercial',
    build_order_num: null,
    build_order: null,
    type: 'Feature',
    risk: 'low',
    epic_slug: null,
    stage: 'Building',
    stage_source: 'fixture',
  })
  const { error } = await db.rpc('push_report_artifact', {
    p_project_id: projectId,
    p_kind: 'roadmap',
    p_schema_version: ROADMAP_SCHEMA_VERSION,
    p_payload: {
      items: [epic(OWED_EPIC, 'An epic that still owes'), epic(OWED_QUIET_EPIC, 'An epic that owes nothing')],
      board: { wip: { Building: 2, QA: 3 }, repo: OWED_REPO },
      owed: owedFixtureRows(marker),
    },
    p_generated_at: new Date().toISOString(),
    p_source_commit: OWED_COMMIT,
    p_source_ref: 'main',
  })
  if (error) throw new Error(`could not push the owed roadmap fixture: ${error.message}`)
}

/**
 * A second product for `userId` in the SAME workspace as `workspaceId`, never pushed. The portfolio appears only with two
 * products, and this one is the control: a product that keeps no ledger must say nothing, not "0 owed". Returns its id so
 * the caller removes it (the disposable session only tracks the projects it made itself).
 */
export async function addQuietProduct(db: SupabaseClient, userId: string, workspaceId: string) {
  const slug = `owed-quiet-${randomBytes(4).toString('hex')}`
  const { data, error } = await db
    .from('projects')
    .insert({ slug, api_key_hash: null, workspace_id: workspaceId })
    .select('id')
    .single()
  if (error || !data) throw new Error(`second project: ${error?.message}`)
  const { error: memberError } = await db
    .from('project_members')
    .insert({ user_id: userId, project_id: data.id, role: 'member' })
  if (memberError) throw new Error(`second project member: ${memberError.message}`)
  return { id: data.id as string, slug }
}

export async function removeProducts(db: SupabaseClient, ids: string[]) {
  if (!ids.length) return
  await db.from('project_members').delete().in('project_id', ids)
  await db.from('projects').delete().in('id', ids)
}
