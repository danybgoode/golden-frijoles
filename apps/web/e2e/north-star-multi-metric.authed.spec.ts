import { test, expect } from '@playwright/test'
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

  // The OLDER metric is inserted second, so insertion order and creation order disagree.
  await metric(project.id as string, 'newer_metric', '2026-10-04T00:00:00Z', ['newer_a', 'newer_b'])
  await metric(project.id as string, 'older_metric', '2026-07-16T00:00:00Z', ['older_only'])

  const response = await page.goto(`/app/north-star/${slug}`)
  expect(response?.status()).toBe(200)
  await expect(page.getByText('A server error occurred')).toHaveCount(0)
  await expect(page.locator('main .ds-mono', { hasText: 'newer_metric' }).first()).toBeVisible()
  await expect(page.locator('main .ds-chart-smalls .ds-chart-small')).toHaveCount(2)
  await expect(page.locator('main')).not.toContainText('older_metric')
  await expect(page.locator('main')).not.toContainText('older_only')
})
