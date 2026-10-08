import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { specWorkspaceId } from './helpers/spec-workspace'
import { isConnectorWritesEnabled } from './helpers/gates'

// account-from-the-terminal · Sprint 3, Story 3.1 — a connector URL that acts as the person who made
// it (epic D11). No Bearer header anywhere in this file: the Claude app's connector settings take a
// URL and nothing else, so the URL alone must carry the person.

const WRITE_TOOLS = ['create_flag', 'kill_flag', 'rollout_flag', 'set_flag']

function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** A fresh project with one owner, and a connector URL that may or may not name that owner. */
async function fixture(options: { maker: 'owner' | 'none' }) {
  const client = db()
  const { data: created } = await client.auth.admin.createUser({
    email: `maker-spec-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  const userId = created.user!.id
  const workspaceId = await specWorkspaceId(client, 'connector-maker')
  const slug = `maker-spec-${randomBytes(4).toString('hex')}`
  const { data: project, error } = await client
    .from('projects')
    .insert({ slug, workspace_id: workspaceId })
    .select('id')
    .single()
  if (error || !project) throw new Error(`could not create a fixture project: ${error?.message}`)
  await client.from('project_members').insert({ user_id: userId, project_id: project.id, role: 'owner' })
  const token = `gb_connector_${randomBytes(24).toString('base64url')}`
  await client.from('connector_tokens').insert({
    project_id: project.id,
    token,
    created_by: options.maker === 'owner' ? userId : null,
  })
  return {
    token,
    userId,
    projectId: project.id as string,
    cleanup: async () => {
      await client.from('projects').delete().eq('id', project.id)
      await client.auth.admin.deleteUser(userId)
      await client.from('workspaces').delete().eq('id', workspaceId)
    },
  }
}

async function rpc(request: APIRequestContext, connector: string, method: string, params?: unknown) {
  const response = await request.post(`/api/v1/public/mcp/c/${connector}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    data: { jsonrpc: '2.0', id: 1, method, params },
  })
  return { status: response.status(), body: response.status() === 200 ? await response.json() : null }
}

async function toolNames(request: APIRequestContext, connector: string) {
  const { body } = await rpc(request, connector, 'tools/list')
  return (body.result.tools as Array<{ name: string }>).map((tool) => tool.name)
}

test('a URL made by an owner lists the write tools, and a write is recorded as that owner', async ({
  request,
}) => {
  test.skip(
    !isConnectorWritesEnabled(),
    'writes are off — the dark side is pinned in lib/connector-maker.test.ts'
  )
  const f = await fixture({ maker: 'owner' })
  try {
    const names = await toolNames(request, f.token)
    for (const tool of WRITE_TOOLS) expect(names, `${tool} missing on a person-bound URL`).toContain(tool)

    const key = `spec.maker_${randomBytes(4).toString('hex')}`
    const { body } = await rpc(request, f.token, 'tools/call', {
      name: 'create_flag',
      arguments: { key, polarity: 'kill-switch', environments: ['development'], reason: 'maker spec' },
    })
    const result = JSON.parse(body.result.content[0].text)
    expect(result.ok).toBe(true)

    const { data: audit } = await db()
      .from('flag_lifecycle_audit')
      .select('actor_user_id')
      .eq('project_id', f.projectId)
    expect(audit?.length).toBeGreaterThan(0)
    for (const row of audit ?? []) expect(row.actor_user_id).toBe(f.userId)

    // D12: using the URL stamps it, which is what turns Setup › Connections green.
    const { data: tokenRow } = await db()
      .from('connector_tokens')
      .select('last_used_at')
      .eq('token', f.token)
      .single()
    expect(tokenRow?.last_used_at).not.toBeNull()
  } finally {
    await f.cleanup()
  }
})

test('a URL made before this sprint (no maker) lists only read tools', async ({ request }) => {
  const f = await fixture({ maker: 'none' })
  try {
    const names = await toolNames(request, f.token)
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool)
    expect(names).toContain('list_flags')
  } finally {
    await f.cleanup()
  }
})

test('a maker removed from the project, or demoted, turns the URL read-only at once', async ({ request }) => {
  const f = await fixture({ maker: 'owner' })
  try {
    await db()
      .from('project_members')
      .update({ role: 'member' })
      .eq('user_id', f.userId)
      .eq('project_id', f.projectId)
    for (const tool of WRITE_TOOLS) expect(await toolNames(request, f.token)).not.toContain(tool)

    await db().from('project_members').delete().eq('user_id', f.userId).eq('project_id', f.projectId)
    const names = await toolNames(request, f.token)
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool)
    expect(names).toContain('list_flags')
  } finally {
    await f.cleanup()
  }
})

test('a revoked URL answers 401', async ({ request }) => {
  const f = await fixture({ maker: 'owner' })
  try {
    await db().from('connector_tokens').update({ revoked_at: new Date().toISOString() }).eq('token', f.token)
    const { status } = await rpc(request, f.token, 'tools/list')
    expect(status).toBe(401)
  } finally {
    await f.cleanup()
  }
})

test('the public demo URL never writes, even if a maker were somehow stamped on it', async ({ request }) => {
  const client = db()
  const { data: demo } = await client.from('projects').select('id').eq('slug', 'golden-frijoles').single()
  const { data: row } = await client
    .from('connector_tokens')
    .select('id, token, created_by')
    .eq('project_id', demo!.id)
    .is('revoked_at', null)
    .limit(1)
    .single()
  const f = await fixture({ maker: 'none' })
  try {
    // Make the fixture's owner an owner of the demo AND stamp them on the demo URL — the state D11
    // must refuse in the ROUTE, not only at mint.
    await client.from('project_members').insert({ user_id: f.userId, project_id: demo!.id, role: 'owner' })
    await client.from('connector_tokens').update({ created_by: f.userId }).eq('id', row!.id)
    const names = await toolNames(request, row!.token as string)
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool)
  } finally {
    await client.from('connector_tokens').update({ created_by: row!.created_by }).eq('id', row!.id)
    await client.from('project_members').delete().eq('user_id', f.userId).eq('project_id', demo!.id)
    await f.cleanup()
  }
})
