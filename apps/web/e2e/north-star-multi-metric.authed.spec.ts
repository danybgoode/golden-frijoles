import { test, expect } from '@playwright/test'
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { readTenantRecord } from './helpers/authed-fixture'
import { db } from './helpers/experiment-owner-project'
import { cleanupExperimentProjects } from './helpers/test-db-cleanup'
import { specWorkspaceId } from './helpers/spec-workspace'

// north-star-multi-metric-read · S1.1 — a project holding TWO North Star metrics opens its North Star page on the
// newest one, with only that metric's inputs. `.maybeSingle()` used to error on the second row and the page threw:
// found live on golden-frijoles (2026-10-08), where one-product-project moved the real `proven_bets` in beside the
// synthetic `payable_sellers`. Two metrics with DISTINCT created_at, so an ordering bug cannot hide behind a fixture
// of one (LEARNINGS: a fixture with one of something hides ordering bugs).

const created: string[] = []
let client: SupabaseClient
let owner: string

test.beforeAll(() => {
  client = db()
  const tenant = readTenantRecord()
  if (!tenant?.userId) throw new Error('the authed fixture must record its user')
  owner = tenant.userId
})

test.afterAll(async () => {
  await cleanupExperimentProjects(created)
})

async function metric(projectId: string, key: string, createdAt: string, inputs: string[]) {
  const { data, error } = await client
    .from('north_star_metrics')
    .insert({ project_id: projectId, key, name: key, created_at: createdAt })
    .select('id')
    .single()
  if (error || !data) throw new Error(`metric fixture: ${error?.message}`)
  for (const input of inputs) {
    const { error: inputError } = await client.from('leading_inputs').insert({
      project_id: projectId,
      metric_id: data.id,
      key: input,
      name: input,
      value_source: 'external_push',
    })
    if (inputError) throw new Error(`input fixture: ${inputError.message}`)
  }
}

test('two metrics: the page names the NEWEST and plots only its inputs, with no error screen', async ({
  page,
}) => {
  const slug = `ns-multi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const { data: project, error } = await client
    .from('projects')
    .insert({ workspace_id: await specWorkspaceId(client), slug, api_key_hash: `h-${crypto.randomUUID()}` })
    .select('id')
    .single()
  if (error || !project) throw new Error(`project fixture: ${error?.message}`)
  created.push(project.id as string)
  const membership = await client
    .from('project_members')
    .insert({ project_id: project.id, user_id: owner, role: 'owner' })
  if (membership.error) throw new Error(`membership fixture: ${membership.error.message}`)

  // The OLDER metric is inserted FIRST, so a read without the ordering (heap order, "the first row") picks it and
  // fails here (cross-family review of #321, Codex).
  await metric(project.id as string, 'older_metric', '2026-07-16T00:00:00Z', ['older_only'])
  await metric(project.id as string, 'newer_metric', '2026-10-04T00:00:00Z', ['newer_a', 'newer_b'])

  const response = await page.goto(`/app/north-star/${slug}`)
  expect(response?.status()).toBe(200)
  await expect(page.getByText('A server error occurred')).toHaveCount(0)
  await expect(page.locator('main .ds-mono', { hasText: 'newer_metric' }).first()).toBeVisible()
  await expect(page.locator('main .ds-chart-smalls .ds-chart-small')).toHaveCount(2)
  await expect(page.locator('main')).not.toContainText('older_metric')
  await expect(page.locator('main')).not.toContainText('older_only')

  // The Pod Report's reader runs its own input COUNT, so it is checked on its own page: the same metric, and only
  // that metric's two inputs (#321, Codex). A report needs a pushed artifact, made through the real push route.
  const key = `ns-multi-${crypto.randomUUID()}`
  const keyRow = await client.from('api_keys').insert({
    project_id: project.id,
    key_hash: createHash('sha256').update(key).digest('hex'),
    label: 'ns multi-metric spec',
  })
  if (keyRow.error) throw new Error(`key fixture: ${keyRow.error.message}`)
  const push = await page.request.post('/api/v1/reports/pod/push', {
    headers: { Authorization: `Bearer ${key}` },
    data: {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      pushSource: { commit: 'abc1234', ref: 'main' },
      source: { repo: 'ns-multi', commits: 1, windowDays: 1 },
      delivery: { cycleTimeDays: null, notInstrumented: [] },
      caveats: [],
    },
  })
  expect(push.status(), await push.text()).toBe(200)
  await page.goto(`/hub/${slug}/report`)
  const card = page.getByTestId('outcome-north-star')
  await expect(card).toContainText('newer_metric')
  await expect(card).toContainText('2 leading inputs registered')
})
