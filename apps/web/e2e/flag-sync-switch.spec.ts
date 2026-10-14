// one-flag-switch S1.5 — a flag that arrives by sync starts with its switch set from its source default, in every
// environment; an existing flag's switch is never touched by a sync. Driven through the database function itself, so it
// runs on every CI server whatever the sync route's switch (the HTTP route is `flag-catalog-sync.spec.ts`'s).
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { hashCredential } from '@/lib/credential-hash'
import type { FlagDefinition } from '@/lib/flag-definition'
import {
  cleanupFlagProjects,
  requireLocalSupabaseApiUrl,
  requireTestDatabaseUrl,
} from './helpers/test-db-cleanup'
import { specWorkspaceId } from './helpers/spec-workspace'

const projectIds: string[] = []
const userIds: string[] = []

const boolean = (defaultVariantKey: 'on' | 'off', description: string): FlagDefinition => ({
  valueType: 'boolean',
  description,
  defaultVariantKey,
  variants: [
    { key: 'off', value: false },
    { key: 'on', value: true },
  ],
  rules: [],
})

function db(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set')
  requireTestDatabaseUrl()
  return createClient(requireLocalSupabaseApiUrl(), key, { auth: { persistSession: false } })
}

test.afterAll(async () => {
  await cleanupFlagProjects(projectIds)
  const client = db()
  for (const id of userIds) await client.auth.admin.deleteUser(id)
})

test('a new synced flag starts at its source default in every environment; an existing flag is never switched', async () => {
  const client = db()
  const { data: user } = await client.auth.admin.createUser({
    email: `flag-sync-switch-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
    email_confirm: true,
  })
  const owner = user!.user!.id
  userIds.push(owner)
  const { data: project } = await client
    .from('projects')
    .insert({
      workspace_id: await specWorkspaceId(client),
      slug: `flag-sync-switch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      api_key_hash: `h-${crypto.randomUUID()}`,
    })
    .select('id')
    .single()
  const projectId = project!.id as string
  projectIds.push(projectId)
  await client.from('project_members').insert({ project_id: projectId, user_id: owner, role: 'owner' })
  const plaintext = `gb_key_${crypto.randomUUID().replaceAll('-', '')}`
  const minted = await client.rpc('create_flag_sync_key', {
    p_project_id: projectId,
    p_key_hash: hashCredential(plaintext),
    p_label: 'switch spec publisher',
    p_source: 'app',
    p_expires_at: null,
    p_actor_user_id: owner,
  })
  expect(minted.error).toBeNull()
  const sync = (entries: Array<{ key: string; definition: FlagDefinition }>) =>
    client.rpc('sync_flag_definition_catalog', { p_key_hash: hashCredential(plaintext), p_entries: entries })
  const served = async (key: string) => {
    const { data: flag } = await client
      .from('flag_registries')
      .select('id')
      .eq('project_id', projectId)
      .eq('key', key)
      .single()
    const { data: rows } = await client
      .from('flag_environment_activations')
      .select('environment, version_id')
      .eq('project_id', projectId)
      .eq('flag_id', flag!.id)
    return new Map((rows ?? []).map((row) => [row.environment as string, row.version_id as string | null]))
  }

  // Two new flags: a kill switch born on, an enablement born off. Each is set, in all three environments, to the
  // version the sync just wrote — whose default is what the source file says.
  const first = await sync([
    { key: 'app.checkout_enabled', definition: boolean('on', 'Kill switch, born on.') },
    { key: 'app.beta_enabled', definition: boolean('off', 'Enablement, born off.') },
  ])
  expect(first.error).toBeNull()
  for (const key of ['app.checkout_enabled', 'app.beta_enabled']) {
    const row = first.data!.find((entry: { flag_key: string }) => entry.flag_key === key)
    const environments = await served(key)
    expect([...environments.keys()].sort()).toEqual(['development', 'preview', 'production'])
    for (const versionId of environments.values()) expect(versionId).toBe(row.version_id)
  }

  // A flag that already existed before the sync (made by hand, never switched anywhere) is left exactly as it is: a
  // sync that brings the identical definition does not switch it, because the sync did not create it.
  const made = await client.rpc('create_flag_definition_version', {
    p_project_id: projectId,
    p_flag_key: 'app.existing_enabled',
    p_definition: boolean('on', 'Existed before the sync.'),
    p_reason: 'spec: made by hand',
    p_actor_user_id: owner,
  })
  expect(made.error).toBeNull()
  const again = await sync([
    { key: 'app.checkout_enabled', definition: boolean('on', 'Kill switch, born on.') },
    { key: 'app.existing_enabled', definition: boolean('on', 'Existed before the sync.') },
  ])
  expect(again.error).toBeNull()
  expect(again.data!.map((entry: { created: boolean }) => entry.created)).toEqual([false, false])
  expect((await served('app.existing_enabled')).size).toBe(0)
  // …and the flags the first sync switched keep exactly the switch they had.
  const checkoutVersion = first.data!.find(
    (entry: { flag_key: string }) => entry.flag_key === 'app.checkout_enabled'
  ).version_id
  for (const versionId of (await served('app.checkout_enabled')).values())
    expect(versionId).toBe(checkoutVersion)
})
