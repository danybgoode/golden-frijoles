import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { readTenantRecord } from './helpers/authed-fixture'

// account-from-the-terminal · Sprint 3, Story 3.2 — Setup › Connections, signed in: "Get a new URL"
// stops the old URL at once, and "Disconnect" signs a machine out (its next `gf whoami` is refused).

function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

function tenant() {
  const record = readTenantRecord()
  if (!record?.slug || !record.projectId) throw new Error('this spec requires the auth-setup project')
  return record as typeof record & { slug: string; projectId: string }
}

test('Get a new URL revokes the old one and mints one that acts as you', async ({ page, request }) => {
  const t = tenant()
  const client = db()
  // Exactly one live URL to start from (the project allows only one).
  const { data: live } = await client
    .from('connector_tokens')
    .select('id, token')
    .eq('project_id', t.projectId)
    .is('revoked_at', null)
    .maybeSingle()
  const old =
    live ??
    (
      await client
        .from('connector_tokens')
        .insert({ project_id: t.projectId, token: `gb_connector_${randomBytes(24).toString('base64url')}` })
        .select('id, token')
        .single()
    ).data!

  await page.goto(`/app/setup/connect/${t.slug}`)
  await expect(page.getByText('The Claude app')).toBeVisible()
  await page.getByRole('button', { name: 'Get a new URL' }).first().click()
  await page.getByRole('dialog').getByRole('button', { name: 'Get a new URL' }).click()
  await expect(page.getByText('Copy this now — it is not shown again')).toBeVisible()

  const { data: oldRow } = await client.from('connector_tokens').select('revoked_at').eq('id', old.id).single()
  expect(oldRow?.revoked_at).not.toBeNull()
  // The old URL stops answering at once.
  const stale = await request.post(`/api/v1/public/mcp/c/${old.token}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    data: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
  })
  expect(stale.status()).toBe(401)

  const { data: fresh } = await client
    .from('connector_tokens')
    .select('created_by')
    .eq('project_id', t.projectId)
    .is('revoked_at', null)
    .single()
  expect(fresh?.created_by).toBe(t.userId)
})

test('Disconnect signs a coding agent out: its next whoami is refused', async ({ page, request }) => {
  const t = tenant()
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  const label = `spec-laptop-${randomBytes(3).toString('hex')}`
  await db()
    .from('cli_tokens')
    .insert({ user_id: t.userId, token_hash: createHash('sha256').update(token).digest('hex'), label })
  const before = await request.get('/api/v1/cli/whoami', { headers: { authorization: `Bearer ${token}` } })
  expect(before.status()).toBe(200)

  await page.goto(`/app/setup/connect/${t.slug}`)
  const row = page.locator('.ds-copyrow', { hasText: label })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Disconnect' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.locator('.ds-copyrow', { hasText: label })).toHaveCount(0)

  const after = await request.get('/api/v1/cli/whoami', { headers: { authorization: `Bearer ${token}` } })
  expect(after.status()).toBe(401)
})
