import { test, expect, type APIRequestContext } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { createHash, createHmac } from 'node:crypto'
import { specWorkspaceId } from './helpers/spec-workspace'

// proving-workspaces-reading S1.1 (D1–D3) — a roadmap push whose epic newly reads `proven` records ONE
// `workspace_proved_bet` in Golden Frijoles' own project, as an HMAC of the pushing project's workspace id, after the
// response. `proven → proven` and `proven → unclear` record nothing.
//
// Its own workspace and tenant, so the subject is unique to this run and the count is this spec's alone. The events are
// read from the self project by the subject the server must have computed: the same HMAC over the same secret, which
// CI and the local runner both export to the server and to this process (D11).

const SELF_SLUG =
  process.env.SELF_PROJECT_SLUG?.trim() || process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
const SELF_KEY = process.env.SELF_PROJECT_API_KEY?.trim()
const SECRET = process.env.SELF_SUBJECT_SECRET?.trim()

function dbClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function freshTenant(db: ReturnType<typeof dbClient>, label: string) {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const workspaceId = await specWorkspaceId(db, label)
  const { data: project, error } = await db
    .from('projects')
    .insert({ workspace_id: workspaceId, slug: `${label}-${stamp}` })
    .select('id')
    .single()
  if (error) throw new Error(`could not provision the tenant: ${error.message}`)
  const key = `local-${label}-${stamp}-do-not-use-in-prod`
  const { error: keyError } = await db
    .from('api_keys')
    .insert({ project_id: project.id, key_hash: createHash('sha256').update(key).digest('hex'), label })
  if (keyError) throw new Error(`could not provision the key: ${keyError.message}`)
  return { workspaceId, key }
}

async function pushRoadmap(request: APIRequestContext, key: string, items: unknown[]) {
  const res = await request.post('/api/v1/roadmap/push', {
    headers: { Authorization: `Bearer ${key}` },
    data: { schemaVersion: 1, generatedAt: new Date().toISOString(), items },
  })
  expect(res.status(), await res.text()).toBe(200)
}

const epic = (slug: string, verdict: string | null) => ({
  name: `Epic ${slug}`,
  slug,
  grain: 'Epic',
  status: 'Shipped',
  area: '01 Growth Engine',
  verdict,
})

test('a newly proven verdict records one HMAC-subject event in the self project; repeats and reversals none', async ({
  request,
}) => {
  test.skip(
    !SELF_KEY || !SECRET,
    'needs SELF_PROJECT_API_KEY and SELF_SUBJECT_SECRET (CI and the local runner set both)'
  )
  const db = dbClient()
  const { workspaceId, key } = await freshTenant(db, 'proven-transition')

  const subject = createHmac('sha256', SECRET!).update(workspaceId).digest('hex')
  const { data: self } = await db.from('projects').select('id').eq('slug', SELF_SLUG).single()
  const events = async () => {
    const { data, error: readError } = await db
      .from('events')
      .select('event, user_id, project_id, tags, metadata')
      .eq('user_id', subject)
    if (readError) throw new Error(readError.message)
    return data ?? []
  }
  const waitFor = async (n: number) => {
    const deadline = Date.now() + 8000
    for (;;) {
      const rows = await events()
      if (rows.length >= n || Date.now() > deadline) return rows
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  const push = (items: unknown[]) => pushRoadmap(request, key, items)

  // The seeded previous artifact: `a` unclear.
  await push([epic('a', 'unclear')])
  expect(await events()).toHaveLength(0)

  // unclear → proven: one event, in the self project, under the HMAC — never the workspace id, never the epic slug.
  await push([epic('a', 'proven')])
  const first = await waitFor(1)
  expect(first).toHaveLength(1)
  expect(first[0]).toMatchObject({ event: 'workspace_proved_bet', project_id: self!.id })
  expect(JSON.stringify(first[0])).not.toContain(workspaceId)
  expect(JSON.stringify(first[0].tags ?? {})).not.toContain('"a"')

  // proven → proven (the board moved, so the push is stored) and proven → unclear: nothing.
  await push([{ ...epic('a', 'proven'), status: 'Done' }])
  await push([epic('a', 'unclear')])
  // Then a sentinel transition (`b` newly proven), sent AFTER both: once it lands, anything the two pushes above had
  // scheduled had the same chance to land. Exactly two means they sent none.
  await push([epic('a', 'unclear'), epic('b', 'proven')])
  const all = await waitFor(2)
  await new Promise((r) => setTimeout(r, 1000))
  expect(await events()).toHaveLength(2)
  expect(all.every((row) => row.project_id === self!.id)).toBe(true)
})

// S1.3 (D10) — the whole path, from the sender's instructions: Golden Frijoles' own `north-star.md` entry synced into
// the self project, a proven transition pushed by another tenant, then the input read the way the public reads it:
// the ANONYMOUS connector of the public project. It shows the count, and neither the subject nor the workspace id.
test('proving_workspaces, synced from north-star.md, reads the transition on the anonymous public connector', async ({
  request,
}) => {
  const demoSlug = process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
  test.skip(!SELF_KEY || !SECRET, 'needs SELF_PROJECT_API_KEY and SELF_SUBJECT_SECRET')
  test.skip(
    SELF_SLUG !== demoSlug,
    'the public connector reads the demo project; here self-tracking lands elsewhere'
  )
  const db = dbClient()
  const selfHeaders = { Authorization: `Bearer ${SELF_KEY}` }

  // The file's own entry, sent under the self project's CURRENT metric (resent unchanged), so the spec moves no other
  // spec's North Star: a new metric key would become the current one (lib/north-star-query.ts → currentNorthStar).
  const markdown = readFileSync(
    join(__dirname, '..', '..', '..', 'Roadmap', '00-strategy', 'north-star.md'),
    'utf8'
  )
  const [fence] = [...markdown.matchAll(/^```json\n([\s\S]*?)\n```$/gm)].map((m) => m[1])
  const entry = (JSON.parse(fence).inputs as { key: string }[]).find((i) => i.key === 'proving_workspaces')
  const listed = await (await request.get('/api/v1/north-star', { headers: selfHeaders })).json()
  const current = [...listed.metrics].sort(
    (a: { createdAt: string; key: string }, b: { createdAt: string; key: string }) =>
      b.createdAt.localeCompare(a.createdAt) || a.key.localeCompare(b.key)
  )[0]
  const synced = await request.post('/api/v1/north-star/sync', {
    headers: selfHeaders,
    data: {
      metric: {
        key: current.key,
        name: current.name,
        ...(current.description ? { description: current.description } : {}),
      },
      inputs: [...current.inputs.filter((i: { key: string }) => i.key !== 'proving_workspaces'), entry].map(
        (i: {
          key: string
          name: string
          valueSource: string
          sourceEvent?: string | null
          aggregate?: string
        }) => ({
          key: i.key,
          name: i.name,
          valueSource: i.valueSource,
          ...(i.sourceEvent ? { sourceEvent: i.sourceEvent } : {}),
          ...(i.valueSource === 'telemetry_event' && i.aggregate ? { aggregate: i.aggregate } : {}),
        })
      ),
    },
  })
  expect(synced.status(), await synced.text()).toBe(200)

  const { workspaceId, key } = await freshTenant(db, 'proving-read')
  const subject = createHmac('sha256', SECRET!).update(workspaceId).digest('hex')
  await pushRoadmap(request, key, [epic('read-me', 'proven')]) // a first push counts (D1)
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    const { data } = await db.from('events').select('id').eq('user_id', subject)
    if ((data ?? []).length > 0) break
    await new Promise((r) => setTimeout(r, 200))
  }

  const { data: demo } = await db.from('projects').select('id').eq('slug', demoSlug).single()
  const { data: tokenRow } = await db
    .from('connector_tokens')
    .select('token')
    .eq('project_id', demo!.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  const res = await request.post(`/api/v1/public/mcp/c/${tokenRow!.token}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    data: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'get_input_readings', arguments: { inputKey: 'proving_workspaces' } },
    },
  })
  expect(res.status()).toBe(200)
  const text = (await res.json()).result.content[0].text as string
  const view = JSON.parse(text)
  expect(view.input).toMatchObject({
    key: 'proving_workspaces',
    valueSource: 'telemetry_event',
    aggregate: 'distinct_monthly',
  })
  expect(view.latest.date).toBe(new Date().toISOString().slice(0, 10))
  expect(view.latest.value).toBeGreaterThanOrEqual(1)
  expect(text).not.toContain(subject)
  expect(text).not.toContain(workspaceId)
})
