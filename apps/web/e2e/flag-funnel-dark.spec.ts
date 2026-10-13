// tars-one-model S2.4 — the funnel switch, OFF. This spec has a dedicated CI pass against the server whose gates are all
// off (ci/gates.off.env); in the normal ON suite it skips (its ON half is in hub.spec.ts). It pushes the demo roadmap,
// which only hub.spec.ts may do in the ON run (latest-wins), so it must never run there: the skip below is load-bearing.
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { isFlagFunnelsEnabled } from './helpers/gates'
import { specWorkspaceId } from './helpers/spec-workspace'

const DEMO_SLUG = process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
const KEY = 'local-funnel-dark-key-do-not-use-in-prod'

function dbClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

test('with the funnel switch off, a measured epic page shows no funnel', async ({ request }) => {
  test.skip(isFlagFunnelsEnabled(), 'dedicated dark-path pass requires FLAG_FUNNELS_ENABLED=false')
  const db = dbClient()
  // Look-then-verify, as hub.spec.ts does: key_hash is unique across projects, so never insert-or-ignore.
  const { data: existing } = await db.from('projects').select('id').eq('slug', DEMO_SLUG).maybeSingle()
  let projectId = existing?.id as string | undefined
  if (!projectId) {
    const { data, error } = await db
      .from('projects')
      .insert({ workspace_id: await specWorkspaceId(db), slug: DEMO_SLUG })
      .select('id')
      .single()
    if (error) throw new Error(`could not provision the demo project: ${error.message}`)
    projectId = data.id as string
  }
  const keyHash = createHash('sha256').update(KEY).digest('hex')
  const { data: held } = await db.from('api_keys').select('project_id').eq('key_hash', keyHash).maybeSingle()
  if (held && held.project_id !== projectId)
    throw new Error('the spec key is bound to another project; refusing')
  if (!held) {
    const { error } = await db
      .from('api_keys')
      .insert({ project_id: projectId, key_hash: keyHash, label: 'funnel dark spec' })
    if (error) throw new Error(`could not provision the spec key: ${error.message}`)
  }

  const slug = `spec-measured-dark-${Date.now()}`
  const pushed = await request.post('/api/v1/roadmap/push', {
    headers: { Authorization: `Bearer ${KEY}` },
    data: {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { commit: 'abc1234', ref: 'main' },
      items: [
        {
          name: `Measured ${slug}`,
          slug,
          grain: 'Epic',
          status: 'Building',
          stage: 'Building',
          area: '01 Growth Engine',
          build_order_num: 1,
          risk: 'High',
          flag_key: 'spec.measured_enabled',
          target_segment: 'everyone',
          adopted_event: 'order_placed',
          retention_days: 7,
        },
      ],
    },
  })
  expect(pushed.status(), await pushed.text()).toBe(200)
  const res = await request.get(`/hub/${DEMO_SLUG}/epic/${slug}`)
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toContain(`Measured ${slug}`) // the page rendered the epic, so the absence below is the switch
  expect(html).not.toMatch(/The flag(&#x27;|')s funnel/)
})
