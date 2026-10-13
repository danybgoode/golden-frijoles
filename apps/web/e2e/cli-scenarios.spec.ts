// scenarios-light-up S1.1 + S1.3 — `frijoles scenarios`' route against real PostgREST and the owner RPCs: member reads,
// owner writes, a stranger "not found", target register → token once → verify, and the authoring switch.
// Runs on both CI servers and branches on the switch the route reports (the OFF pass lists it in ci.yml).
import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function person(client: ReturnType<typeof db>, label: string) {
  const { data, error } = await client.auth.admin.createUser({
    email: `${label}-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  await client.from('cli_tokens').insert({ user_id: data.user.id, token_hash: sha256(token), label: 'spec' })
  return { id: data.user.id, auth: { authorization: `Bearer ${token}` } }
}

const post = (request: APIRequestContext, auth: Record<string, string>, data: Record<string, unknown>) =>
  request.post('/api/v1/cli/scenarios', { headers: auth, data })

test('owner writes, member reads, stranger sees nothing; a target is registered once and verify asks the app', async ({
  request,
}) => {
  const client = db()
  const owner = await person(client, 'scn-owner')
  const member = await person(client, 'scn-member')
  const stranger = await person(client, 'scn-stranger')
  try {
    const created = await request.post('/api/v1/cli/projects', { headers: owner.auth, data: {} })
    expect(created.status()).toBe(200)
    const project = ((await created.json()) as { slug: string }).slug
    const { data: row } = await client.from('projects').select('id').eq('slug', project).single()
    await client.from('project_members').insert({ project_id: row!.id, user_id: member.id, role: 'member' })

    const read = await request.get(`/api/v1/cli/scenarios?project=${project}`, { headers: member.auth })
    expect(read.status()).toBe(200)
    const view = (await read.json()) as { authoring: boolean; targets: unknown[]; runs: unknown[] }
    expect(view.targets).toEqual([])
    expect((await request.get(`/api/v1/cli/scenarios?project=${project}`, { headers: stranger.auth })).status()).toBe(404)

    const register = { project, command: 'register_target', targetKey: 'site.probe', origin: 'https://app.example.invalid', reason: 'spec' }
    if (!view.authoring) {
      // Dark: every write is 404 `disabled` before the credential is even looked at.
      const dark = await post(request, owner.auth, register)
      expect(dark.status()).toBe(404)
      expect(((await dark.json()) as { code: string }).code).toBe('disabled')
      return
    }

    // A member who is not an owner gets the same 404 a stranger gets.
    expect((await post(request, member.auth, register)).status()).toBe(404)
    expect((await post(request, stranger.auth, register)).status()).toBe(404)

    const first = await post(request, owner.auth, register)
    expect(first.status()).toBe(200)
    const added = (await first.json()) as { token: string; status: string; targetId: string }
    expect(added.status).toBe('pending')
    expect(added.token).toMatch(/^gf_target_[0-9a-f]{64}$/)
    // Only the token's hash is kept; it is never read back.
    const { data: stored } = await client.from('scenario_targets').select('ownership_challenge_hash, target_kind').eq('id', added.targetId).single()
    expect(stored).toEqual({ ownership_challenge_hash: sha256(added.token), target_kind: 'owner_token_v1' })
    const listed = (await (await request.get(`/api/v1/cli/scenarios?project=${project}`, { headers: owner.auth })).json()) as {
      targets: Array<Record<string, unknown>>
    }
    expect(listed.targets).toHaveLength(1)
    expect(JSON.stringify(listed)).not.toContain(added.token)

    // Registered once: the token cannot be shown again, so a second registration is a conflict that says what to do.
    const again = await post(request, owner.auth, register)
    expect(again.status()).toBe(409)
    expect(((await again.json()) as { error: string }).error).toMatch(/revoke it and add the app under a new key/)

    // Verify asks the app; an origin that cannot be reached is a plain reason, and nothing is verified.
    const verify = await post(request, owner.auth, { project, command: 'verify_target', targetKey: 'site.probe', reason: 'spec' })
    expect(verify.status()).toBe(400)
    expect(((await verify.json()) as { error: string }).error).toMatch(/could not be reached/)
    const { data: still } = await client.from('scenario_targets').select('status').eq('id', added.targetId).single()
    expect(still?.status).toBe('pending')

    // A launch on a scenario that does not exist, and a stop on a run that does not exist, are "not found".
    expect((await post(request, owner.auth, { project, command: 'launch', scenarioKey: 'nope', reason: 'spec' })).status()).toBe(404)
    expect(
      (await post(request, owner.auth, { project, command: 'stop', runId: '00000000-0000-4000-8000-000000000000', reason: 'spec' })).status()
    ).toBe(404)
    expect((await post(request, owner.auth, { project, command: 'teleport', reason: 'spec' })).status()).toBe(400)

    const revoke = await post(request, owner.auth, { project, command: 'revoke_target', targetKey: 'site.probe', reason: 'spec' })
    expect(revoke.status()).toBe(200)
    const { data: gone } = await client.from('scenario_targets').select('status').eq('id', added.targetId).single()
    expect(gone?.status).toBe('revoked')
  } finally {
    for (const who of [owner, member, stranger]) {
      await client.from('project_members').delete().eq('user_id', who.id)
      await client.auth.admin.deleteUser(who.id)
    }
  }
})

test('the owner RPCs refuse a non-owner and cannot be called by a request role', async () => {
  const client = db()
  const someone = await person(client, 'scn-rpc')
  try {
    const { data: anyProject } = await client.from('projects').select('id').limit(1).single()
    const { error } = await client.rpc('owner_register_scenario_target', {
      p_project_id: anyProject!.id,
      p_actor_user_id: someone.id,
      p_target_key: 'site.probe',
      p_origin: 'https://app.example.invalid',
      p_token_hash: sha256('x'),
      p_reason: 'spec',
    })
    expect(error?.code).toBe('42501')

    const url = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    test.skip(!url || !anonKey, 'needs SUPABASE_ANON_KEY to exercise the anon role')
    const anon = createClient(url!, anonKey!, { auth: { persistSession: false } })
    // Called with the function's real arguments, so a refusal can only be EXECUTE being denied, never "no such
    // function" (PGRST202) or an argument error, which would pass for the wrong reason.
    const calls: Array<[string, Record<string, unknown>]> = [
      [
        'owner_register_scenario_target',
        {
          p_project_id: anyProject!.id,
          p_actor_user_id: someone.id,
          p_target_key: 'site.probe',
          p_origin: 'https://app.example.invalid',
          p_token_hash: sha256('x'),
          p_reason: 'spec',
        },
      ],
      [
        'owner_verify_scenario_target',
        {
          p_project_id: anyProject!.id,
          p_actor_user_id: someone.id,
          p_target_id: '00000000-0000-4000-8000-000000000000',
          p_checked_hash: sha256('x'),
          p_reason: 'spec',
        },
      ],
    ]
    for (const [fn, args] of calls) {
      const denied = await anon.rpc(fn, args)
      expect(denied.error?.code, fn).toBe('42501')
      expect(denied.error?.message ?? '', fn).toMatch(/permission denied for function/)
    }
  } finally {
    await client.auth.admin.deleteUser(someone.id)
  }
})
