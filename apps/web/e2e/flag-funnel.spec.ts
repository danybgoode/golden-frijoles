// one-bet-wired D3 — the flag funnel's bounded read against real PostgREST, on a fresh project: exposure from
// flag_evaluated (variant on), adoption after exposure, retention, and an adopter without exposure beside the funnel.
// The read module takes its client as a parameter (no server-only import), so this spec drives it with the service key.
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'node:crypto'
import { readFlagFunnel, readFunnel } from '../lib/flag-funnel-read'

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

test('a measured flag fills its funnel from its own evaluations, on a fresh project', async ({ request }) => {
  const client = db()
  const { data, error } = await client.auth.admin.createUser({
    email: `funnel-spec-${randomBytes(6).toString('hex')}@example.test`,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`could not create a test user: ${error?.message}`)
  const userId = data.user.id
  const token = `gf_pat_${randomBytes(32).toString('base64url')}`
  await client.from('cli_tokens').insert({ user_id: userId, token_hash: sha256(token), label: 'spec' })
  try {
    const auth = { authorization: `Bearer ${token}` }
    const created = await request.post('/api/v1/cli/projects', { headers: auth, data: {} })
    expect(created.status()).toBe(200)
    const slug = ((await created.json()) as { slug: string }).slug
    const { data: project } = await client.from('projects').select('id').eq('slug', slug).single()
    const minted = await request.post('/api/v1/cli/keys', {
      headers: auth,
      data: { project: slug, type: 'ingest', label: 'funnel spec' },
    })
    const key = ((await minted.json()) as { key: string }).key
    const track = async (userId: string, event: string, extra: Record<string, unknown> = {}) => {
      const res = await request.post('/api/v1/track', {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        data: { userId, event, ...extra },
      })
      expect(res.status(), `${userId} ${event}`).toBeLessThan(300)
    }
    const flagKey = 'checkout.one_step_enabled'
    // Exposures as the server sends them: a `system:server` client naming the person evaluated in `subject` (the
    // funnel keys on the subject, verifier #341), each evaluation with its own idempotency key, as the SDK sends it.
    const on = (u: string) =>
      track('system:server', 'flag_evaluated', {
        featureId: flagKey,
        tags: { flag_key: flagKey, variant: 'on' },
        context: {
          version: 1,
          subject: { type: 'user', id: u },
          idempotencyKey: `flag_eval:spec:${u}:${randomBytes(4).toString('hex')}`,
        },
      })
    await track('a', 'page_viewed')
    await on('a')
    await track('a', 'order_placed')
    await track('a', 'order_placed')
    await track('b', 'page_viewed')
    await on('b')
    await track('c', 'order_placed') // adopted without exposure: beside the funnel

    const read = await readFlagFunnel(client, project!.id as string, {
      flagKey,
      adoptedEvent: 'order_placed',
      retainedEvent: null,
      retentionDays: 7,
      satisfiedEvent: null,
    })
    expect(read.state).toBe('measured')
    if (read.state !== 'measured') return
    expect(read.funnel).toMatchObject({
      base: 3,
      targeted: 3,
      exposed: 2,
      adopted: 1,
      retained: 1,
      satisfied: null,
      adoptedWithoutExposure: 1,
    })
    expect(read.truncated).toEqual({ exposures: false, events: false, base: false })

    const none = await readFlagFunnel(client, project!.id as string, {
      flagKey: 'never.evaluated_enabled',
      adoptedEvent: 'order_placed',
      retainedEvent: null,
      retentionDays: 7,
      satisfiedEvent: null,
    })
    expect(none.state).toBe('not_exposed')

    // tars-one-model D1/D3: a registry feature through the same read — exposure is its target event, scoped to the
    // feature; another feature's event of the same name is not this exposure.
    await track('d', 'export_viewed', { featureId: 'export' })
    await track('d', 'export_done', { featureId: 'export' })
    await track('e', 'export_done', { featureId: 'export' }) // adopted, never saw it: beside
    await track('f', 'export_viewed', { featureId: 'other' })
    const measure = {
      adoptedEvent: 'export_done',
      retainedEvent: null,
      retentionDays: 7,
      satisfiedEvent: null,
    }
    const source = { kind: 'feature', featureKey: 'export', targetEvent: 'export_viewed' } as const
    const feature = await readFunnel(client, project!.id as string, source, measure, 'all')
    expect(feature.state).toBe('measured')
    if (feature.state !== 'measured') return
    expect(feature.funnel).toMatchObject({ exposed: 1, adopted: 1, retained: 0, adoptedWithoutExposure: 1 })
    expect(feature.period).toBe('all')
    const lately = await readFunnel(client, project!.id as string, source, measure, '30d')
    expect(lately.state === 'measured' && lately.funnel.exposed).toBe(1)
    const unnamed = await readFunnel(client, project!.id as string, source, {
      ...measure,
      adoptedEvent: null,
    })
    expect(unnamed.state === 'measured' && unnamed.funnel.adopted).toBeNull()
  } finally {
    await client.from('project_members').delete().eq('user_id', userId)
    await client.auth.admin.deleteUser(userId)
  }
})
