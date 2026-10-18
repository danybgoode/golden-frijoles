import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Client as PgClient } from 'pg'
import { specWorkspaceId } from './helpers/spec-workspace'
import { requireTestDatabaseUrl } from './helpers/test-db-cleanup'

// delivery-back-on · Sprint 1 — the pg_cron waker (Story 1.1) and the July backlog expiry (Story 1.2).
//
// The tick's positive cases run INSIDE a transaction that is rolled back: pg_net's worker only sees a
// committed request, so nothing is ever sent, and the Vault secrets they create never persist. That is
// also what makes them deterministic — a committed request could be dequeued before the spec reads it.

function dbClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function withOwner<T>(run: (client: PgClient) => Promise<T>): Promise<T> {
  const client = new PgClient({ connectionString: requireTestDatabaseUrl() })
  await client.connect()
  try {
    return await run(client)
  } finally {
    await client.end()
  }
}

/** Runs `run` in a transaction that is always rolled back. */
async function inRollback<T>(run: (client: PgClient) => Promise<T>): Promise<T> {
  return withOwner(async (client) => {
    await client.query('BEGIN')
    try {
      return await run(client)
    } finally {
      await client.query('ROLLBACK')
    }
  })
}

async function setSecrets(client: PgClient, url: string, bearer: string) {
  // A row the spec did not create may exist on a developer's database; the rollback restores it.
  await client.query(`DELETE FROM vault.secrets WHERE name LIKE 'dispatch_deliveries_%'`)
  await client.query(`SELECT vault.create_secret($1, 'dispatch_deliveries_url')`, [url])
  await client.query(`SELECT vault.create_secret($1, 'dispatch_deliveries_cron_secret')`, [bearer])
}

async function tick(client: PgClient): Promise<string | null> {
  const { rows } = await client.query<{ id: string | null }>('SELECT public.dispatch_tick() AS id')
  return rows[0].id
}

test('the waker is scheduled every five minutes, calling dispatch_tick()', async () => {
  const jobs = await withOwner((client) =>
    client.query<{ schedule: string; command: string; active: boolean }>(
      `SELECT schedule, command, active FROM cron.job WHERE jobname = 'dispatch-deliveries'`
    )
  )
  expect(jobs.rows).toEqual([
    { schedule: '*/5 * * * *', command: 'SELECT public.dispatch_tick()', active: true },
  ])
})

test('with no Vault secrets a tick sends nothing', async () => {
  await inRollback(async (client) => {
    await client.query(`DELETE FROM vault.secrets WHERE name LIKE 'dispatch_deliveries_%'`)
    const before = await client.query('SELECT count(*)::int AS n FROM net.http_request_queue')
    expect(await tick(client)).toBeNull()
    const after = await client.query('SELECT count(*)::int AS n FROM net.http_request_queue')
    expect(after.rows[0].n).toBe(before.rows[0].n)
  })
})

test('a URL that is not https:// sends nothing, so the bearer never travels in plaintext', async () => {
  await inRollback(async (client) => {
    await setSecrets(client, 'http://dispatch.invalid/api/internal/dispatch-deliveries', 'spec-bearer')
    expect(await tick(client)).toBeNull()
  })
})

test('an empty bearer sends nothing', async () => {
  await inRollback(async (client) => {
    await setSecrets(client, 'https://dispatch.invalid/api/internal/dispatch-deliveries', '')
    expect(await tick(client)).toBeNull()
  })
})

test('with both secrets a tick enqueues ONE POST to the route, carrying the bearer', async () => {
  await inRollback(async (client) => {
    const url = 'https://dispatch.invalid/api/internal/dispatch-deliveries'
    await setSecrets(client, url, 'spec-bearer')
    const id = await tick(client)
    expect(id).not.toBeNull()
    const { rows } = await client.query<{ method: string; url: string; headers: Record<string, string> }>(
      'SELECT method, url, headers FROM net.http_request_queue WHERE id = $1',
      [id]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].method).toBe('POST')
    expect(rows[0].url).toBe(url)
    expect(rows[0].headers.Authorization).toBe('Bearer spec-bearer')
  })
})

test('no API role can call dispatch_tick() — a function-level denial, never a body that ran', async () => {
  const url = process.env.SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  test.skip(!url || !anon || !service, 'anon or service key not in env')
  for (const [role, key] of [
    ['anon', anon!],
    ['service_role', service!],
  ] as const) {
    const client = createClient(url!, key, { auth: { persistSession: false } })
    const { error } = await client.rpc('dispatch_tick')
    expect(error, `${role} must be refused`).not.toBeNull()
    const code = error?.code ?? ''
    const message = (error?.message ?? '').toLowerCase()
    const functionLevelDenial =
      (code === '42501' && message.includes('function')) ||
      code === 'PGRST202' ||
      message.includes('could not find the function')
    expect(functionLevelDenial, `${role}: expected a function-level denial, got ${code} ${message}`).toBe(
      true
    )
  }
  // PGRST202 would also pass if the function did not exist at all, so pin that it does, owner-side.
  const exists = await withOwner((client) =>
    client.query(`SELECT 1 FROM pg_proc WHERE oid = 'public.dispatch_tick()'::regprocedure`)
  )
  expect(exists.rowCount).toBe(1)
})

// ── Story 1.2: the July backlog expiry ─────────────────────────────────────────────────────────
const expiry = readFileSync(
  join(__dirname, '..', 'supabase', 'migrations', '20261020110000_delivery_backlog_expiry.sql'),
  'utf8'
)

test('the backlog expiry dead-letters rows from the dark window only, once, and each stays replayable', async () => {
  const db = dbClient()
  const { data: proj } = await db
    .from('projects')
    .insert({
      workspace_id: await specWorkspaceId(db),
      slug: `waker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      api_key_hash: `h-${Math.random()}`,
    })
    .select('id')
    .single()
  const pid = proj!.id as string
  try {
    const { data: dest } = await db
      .from('event_destinations')
      .insert({
        project_id: pid,
        name: 'waker-dest',
        enabled: true,
        target_url: 'https://receiver.example.test/hook',
        signing_secret: 'whsec_waker_spec_secret_0123456789',
        secret_set_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    const { data: events } = await db
      .from('events')
      .insert([
        { project_id: pid, user_id: 'waker-u', event: 'old_one' },
        { project_id: pid, user_id: 'waker-u', event: 'fresh_one' },
      ])
      .select('id, event')
    const eventId = (name: string) => events!.find((e) => e.event === name)!.id as string
    const { data: rows } = await db
      .from('event_deliveries')
      .insert([
        { project_id: pid, event_id: eventId('old_one'), destination_id: dest!.id },
        { project_id: pid, event_id: eventId('fresh_one'), destination_id: dest!.id },
      ])
      .select('id, event_id')
    const oldId = rows!.find((r) => r.event_id === eventId('old_one'))!.id as string
    const freshId = rows!.find((r) => r.event_id === eventId('fresh_one'))!.id as string
    // Queued in the dark window.
    await db.from('event_deliveries').update({ created_at: '2026-08-01T00:00:00Z' }).eq('id', oldId)

    await withOwner((client) => client.query(expiry))
    const read = async (id: string) =>
      (await db.from('event_deliveries').select('status, last_error, updated_at').eq('id', id).single()).data!

    const expired = await read(oldId)
    expect(expired.status).toBe('dead')
    expect(expired.last_error).toBe('expired: delivery was off 2026-07-22 → 2026-10-17')
    expect((await read(freshId)).status).toBe('pending')

    // A second run changes nothing: the expired row is already dead, the fresh one is past the cutoff.
    await withOwner((client) => client.query(expiry))
    expect((await read(oldId)).updated_at).toBe(expired.updated_at)
    expect((await read(freshId)).status).toBe('pending')

    // Reversible per row: the operator's replay sends it again.
    const { data: replayed } = await db.rpc('replay_delivery', {
      p_project_id: pid,
      p_delivery_id: oldId,
      p_now: new Date().toISOString(),
    })
    expect(replayed).toBeTruthy()
    expect((await read(oldId)).status).toBe('pending')
  } finally {
    await db.from('projects').delete().eq('id', pid)
  }
})
