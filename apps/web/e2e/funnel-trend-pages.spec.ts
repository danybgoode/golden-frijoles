// funnel-truth S1.3 (D5, D6) — the trend on the funnel page, rendered by the server, both halves of its switch. The
// demo project (seeded in CI by `npm run seed:demo`, `setup_guide`) is publicly readable, so no session is needed; the
// flag page's Funnel tab mounts the same pane (its signed-in check is in feature-tabs.authed.spec.ts). The ON half runs
// in the main suite; the OFF half in the dedicated pass against the gates-off server (ci/gates.off.env).
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { isFunnelTrendEnabled } from './helpers/gates'
import { specWorkspaceId } from './helpers/spec-workspace'

const DEMO_SLUG = process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
const page = `/app/funnel/${DEMO_SLUG}/setup_guide`
const thisMonth = new Date().toISOString().slice(0, 7)

test('with the trend switch on, the funnel page draws the trend by month, and by week on request', async ({
  request,
}) => {
  test.skip(!isFunnelTrendEnabled(), 'the ON half; the OFF half runs against the gates-off server')
  const res = await request.get(page)
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toContain('Funnel · ') // CONTROL: the funnel page itself rendered
  expect(html).toContain('aria-label="The funnel over time"')
  expect(html).toContain('aria-label="Trend grouping"')
  expect(html).toContain('>Month<')
  expect(html).toContain(`>${thisMonth}<`) // the seed's cohort, this month
  expect(html).toContain('still maturing') // the current month has not had retention_days to retain
  expect(html).toContain(`?period=all&amp;by=week`)

  const weekly = await (await request.get(`${page}?by=week`)).text()
  expect(weekly).toContain('>Week of<')
  expect(weekly).toContain(`?period=all&amp;by=month`)
})

test('with the trend switch off, the funnel page is exactly the funnel', async ({ request }) => {
  test.skip(isFunnelTrendEnabled(), 'dedicated dark-path pass requires FUNNEL_TREND_ENABLED=false')
  // The gates-off pass runs before `seed:demo` (verifier, #378): provision the public project and its registered
  // feature here, look-then-insert as flag-funnel-dark.spec.ts does, so the page renders rather than 404s.
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  const db = createClient(url, key, { auth: { persistSession: false } })
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
  const { data: feature } = await db
    .from('features')
    .select('key')
    .eq('project_id', projectId)
    .eq('key', 'setup_guide')
    .maybeSingle()
  if (!feature) {
    const { error } = await db.from('features').insert({
      project_id: projectId,
      key: 'setup_guide',
      enabled: true,
      target_event: 'setup_guide_viewed',
      adopted_event: 'setup_guide_step_completed',
      retained_event: null,
      retention_days: 7,
      description: 'Provisioned by funnel-trend-pages.spec.ts for the gates-off pass.',
    })
    if (error) throw new Error(`could not provision the feature: ${error.message}`)
  }
  const res = await request.get(page)
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toContain('Funnel · ') // CONTROL: the page rendered, so the absence below is the switch
  expect(html).toContain('aria-label="Funnel period"')
  expect(html).not.toContain('The funnel over time')
  expect(html).not.toContain('Trend grouping')
  expect(html).not.toContain('by=month') // D6: the period links are exactly as before
})
