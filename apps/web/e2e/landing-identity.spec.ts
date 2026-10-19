import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import {
  LANDING_SIGNAL_KEY,
  LANDING_VISITED_EVENT,
  SIGNUP_STARTED_EVENT,
  START_PROMPT_COPIED_EVENT,
  VISITOR_SUBJECT_TYPE,
} from '@/lib/self-track-events'
import { ACQUISITION_VARIANT_COOKIE } from '@/lib/landing-variant'
import { VISITOR_COOKIE } from '@/lib/marketing-paths'

// landing-launch-experiment · Sprint 1, Story 1.2 + Sprint 2, Story 2.2 (epic D3, D4, D5) — one identity from visit
// to signup. This reads the DATABASE: the defects this area has shipped (a NULL feature_id, an id the read never
// joined) all returned 200 and ingested perfectly. What matters is the row: its user id, its feature and its subject.
//
// The workspace half (D5: the callback records the acquisition variant) needs a signed-in browser and lives in
// `landing-identity.authed.spec.ts`; the column's constraint is asserted here by attempting the refused write.

// Serial: the last test serves an experiment-bound flag on this server's catalog, which would change the variant the
// earlier tests read. (The page itself renders A whatever is served until S3.4.)
test.describe.configure({ mode: 'serial' })

const SELF_SLUG =
  process.env.SELF_PROJECT_SLUG?.trim() || process.env.DEMO_PROJECT_SLUG?.trim() || 'golden-frijoles'
const configured = !!process.env.SELF_PROJECT_API_KEY?.trim()
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

function randomIp(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.')
}

type Row = {
  event: string
  feature_id: string | null
  subject_type: string | null
  subject_id: string | null
}

// Sent in `after()`, so the insert can land a moment after the response: poll, never race one read.
async function eventsFor(userId: string, want: string[], timeoutMs = 8000): Promise<Row[]> {
  const client = db()
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const { data, error } = await client
      .from('events')
      .select('event, feature_id, subject_type, subject_id, projects!inner(slug)')
      .eq('user_id', userId)
      .eq('projects.slug', SELF_SLUG)
    if (error) throw new Error(`eventsFor: ${error.message}`)
    const rows = (data ?? []) as unknown as Row[]
    if (want.every((name) => rows.some((row) => row.event === name)) || Date.now() > deadline) return rows
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
}

function cookieValue(
  res: { headersArray(): { name: string; value: string }[] },
  name: string
): string | null {
  const header = res
    .headersArray()
    .find((h) => h.name.toLowerCase() === 'set-cookie' && h.value.startsWith(`${name}=`))
  return header ? decodeURIComponent(header.value.slice(name.length + 1).split(';')[0]) : null
}

test.describe('the landing visitor is one identity (D3, D4)', () => {
  test.skip(!configured, 'needs SELF_PROJECT_API_KEY — the self tenant must be seeded (CI seeds it)')

  test('a visit and a prompt copy land under the visitor, in landing_conversion, with the visitor as subject', async ({
    request,
  }) => {
    const vid = randomUUID()
    const headers = {
      Cookie: `${VISITOR_COOKIE}=${vid}`,
      'x-forwarded-for': randomIp(),
      'user-agent': BROWSER_UA,
    }
    const visit = await request.post('/api/v1/public/self-visit', {
      headers,
      data: { surface: 'landing', rendered: 'a' },
    })
    expect(visit.status()).toBe(200)
    // No flag is served here, so every visitor is A — and the cookie the callback reads says so (D5).
    expect(cookieValue(visit, ACQUISITION_VARIANT_COOKIE)).toBe('a')
    const copy = await request.post('/api/v1/public/self-visit', {
      headers,
      data: { surface: 'landing-copy' },
    })
    expect(copy.status()).toBe(200)

    const rows = await eventsFor(vid, [LANDING_VISITED_EVENT, START_PROMPT_COPIED_EVENT])
    for (const name of [LANDING_VISITED_EVENT, START_PROMPT_COPIED_EVENT]) {
      const row = rows.find((candidate) => candidate.event === name)
      expect(row, `${name} under the visitor`).toBeTruthy()
      expect(row).toMatchObject({
        feature_id: LANDING_SIGNAL_KEY,
        subject_type: VISITOR_SUBJECT_TYPE,
        subject_id: vid,
      })
    }
    // No experiment is running here, so nobody was assigned by one of its rules: no exposure (D1, D3).
    expect(rows.some((row) => row.event === 'experiment_exposed')).toBe(false)
  })

  test('a caller cannot name an event: an unknown surface is still a visit', async ({ request }) => {
    const vid = randomUUID()
    await request.post('/api/v1/public/self-visit', {
      headers: { Cookie: `${VISITOR_COOKIE}=${vid}`, 'x-forwarded-for': randomIp() },
      data: { surface: 'signup_started' },
    })
    const rows = await eventsFor(vid, [LANDING_VISITED_EVENT])
    expect(rows.map((row) => row.event)).toEqual([LANDING_VISITED_EVENT])
  })

  test('a preview `?variant=` view sets no acquisition variant (D11)', async ({ request }) => {
    const visit = await request.post('/api/v1/public/self-visit', {
      headers: { Cookie: `${VISITOR_COOKIE}=${randomUUID()}`, 'x-forwarded-for': randomIp() },
      data: { surface: 'landing', rendered: 'b', forced: true },
    })
    expect(visit.status()).toBe(200)
    expect(cookieValue(visit, ACQUISITION_VARIANT_COOKIE)).toBeNull()
  })

  test('a signup from the page is also a signup_started under the visitor (D4)', async ({ request }) => {
    const vid = randomUUID()
    const email = `spec-landing-${randomUUID().slice(0, 8)}@example.com`
    const res = await request.post('/api/v1/public/signup', {
      headers: { Cookie: `${VISITOR_COOKIE}=${vid}`, 'x-forwarded-for': randomIp() },
      data: { email, password: `pw-${randomUUID()}` },
    })
    test.skip(res.status() === 404, 'signup is off on this server')
    expect(res.status()).toBe(200)
    try {
      const rows = await eventsFor(vid, [SIGNUP_STARTED_EVENT])
      const row = rows.find((candidate) => candidate.event === SIGNUP_STARTED_EVENT)
      expect(row).toMatchObject({
        feature_id: LANDING_SIGNAL_KEY,
        subject_type: VISITOR_SUBJECT_TYPE,
        subject_id: vid,
      })
    } finally {
      const { data } = await db().auth.admin.listUsers({ perPage: 1000 })
      const user = data?.users.find((candidate) => candidate.email === email)
      if (user) await db().auth.admin.deleteUser(user.id)
    }
  })
})

test('a workspace can record a or b and nothing else (D5) — the database refuses the write', async () => {
  const client = db()
  const { data: workspace, error } = await client
    .from('workspaces')
    .insert({ name: 'spec acquisition variant', acquisition_variant: 'b' })
    .select('id, acquisition_variant')
    .single()
  expect(error).toBeNull()
  try {
    expect(workspace?.acquisition_variant).toBe('b')
    const refused = await client
      .from('workspaces')
      .update({ acquisition_variant: 'c' })
      .eq('id', workspace!.id)
    expect(refused.error?.message ?? '').toContain('workspaces_acquisition_variant_known')
  } finally {
    await client.from('workspaces').delete().eq('id', workspace!.id)
  }
})

// verifier, #408 (Should-fix) — the exposure, driven through the route where it runs: an experiment-bound flag served
// here, then exactly one `experiment_exposed` per visitor (subject = visitor, feature = the experiment key), none for a
// bot, none when the rendered arm disagrees with the server's answer, and none twice for a reload.
test.describe('the beacon writes the exposure (D3)', () => {
  test.skip(!configured, 'needs SELF_PROJECT_API_KEY — the self tenant must be seeded (CI seeds it)')
  const EXPERIMENT = 'landing-b-spec'
  const FLAG = 'landing.variant_b_enabled'

  test('one exposure per visitor; never for a bot or a disagreeing render', async ({ request }) => {
    test.setTimeout(90_000)
    const client = db()
    const { data: project } = await client.from('projects').select('id').eq('slug', SELF_SLUG).single()
    const projectId = project!.id as string
    const { data: created } = await client.auth.admin.createUser({
      email: `spec-exposure-${randomUUID().slice(0, 8)}@example.invalid`,
      password: `pw-${randomUUID()}`,
      email_confirm: true,
    })
    const actor = created!.user!.id
    await client.from('project_members').insert({ user_id: actor, project_id: projectId, role: 'owner' })
    const snapshot = async () =>
      Number(
        (
          await client
            .from('flag_environment_states')
            .select('snapshot_version')
            .eq('project_id', projectId)
            .eq('environment', 'development')
            .maybeSingle()
        ).data?.snapshot_version ?? 0
      )
    let flagId: string | null = null
    // The rule serves B ONLY to these ids (verifier, #408, round 2): the api project runs in parallel, and a rule that
    // put every visitor in B would hand other specs' beacons an exposure and a `b` they never asked for.
    const probe = randomUUID()
    const person = randomUUID()
    const bot = randomUUID()
    const disagreeing = randomUUID()
    try {
      const { data: version, error } = await client.rpc('create_flag_definition_version', {
        p_project_id: projectId,
        p_flag_key: FLAG,
        p_definition: {
          valueType: 'boolean',
          description: 'landing B (exposure spec)',
          defaultVariantKey: 'off',
          variants: [
            { key: 'off', value: false },
            { key: 'on', value: true },
          ],
          rules: [
            {
              priority: 0,
              clauses: [
                { field: 'targetingKey', operator: 'one_of', values: [probe, person, bot, disagreeing] },
              ],
              rollout: { basisPoints: 10_000 },
              variantKey: 'on',
            },
          ],
          metadata: { experiment_key: EXPERIMENT, experiment_version: 1, experiment_rules: '0' },
        },
        p_reason: 'exposure spec',
        p_actor_user_id: actor,
      })
      if (error || !version?.[0]) throw new Error(`version: ${error?.message}`)
      flagId = version[0].flag_id as string
      const activated = await client.rpc('set_flag_activation', {
        p_project_id: projectId,
        p_environment: 'development',
        p_flag_id: flagId,
        p_version_id: version[0].version_id,
        p_expected_snapshot_version: await snapshot(),
        p_reason: 'exposure spec',
        p_actor_user_id: actor,
      })
      if (activated.error) throw new Error(`activate: ${activated.error.message}`)

      const visit = (vid: string, rendered: 'a' | 'b', ua = BROWSER_UA) =>
        request.post('/api/v1/public/self-visit', {
          headers: { Cookie: `${VISITOR_COOKIE}=${vid}`, 'x-forwarded-for': randomIp(), 'user-agent': ua },
          data: { surface: 'landing', rendered },
        })
      // The gate cache answers for 30 s: wait until this server serves the new version.
      await expect
        .poll(async () => cookieValue(await visit(probe, 'b'), ACQUISITION_VARIANT_COOKIE), {
          timeout: 45_000,
        })
        .toBe('b')

      const exposures = async (vid: string) =>
        (await eventsFor(vid, ['experiment_exposed'], 6000)).filter(
          (row) => row.event === 'experiment_exposed'
        )

      await visit(person, 'b')
      await visit(person, 'b') // a reload
      expect(await exposures(person)).not.toHaveLength(0)
      // Both sends run in `after()`: a duplicate would land AFTER the first row is visible. Settle, then count.
      await new Promise((resolve) => setTimeout(resolve, 3000))
      const mine = await exposures(person)
      expect(mine).toHaveLength(1)
      expect(mine[0]).toMatchObject({
        feature_id: EXPERIMENT,
        subject_type: VISITOR_SUBJECT_TYPE,
        subject_id: person,
      })

      await visit(bot, 'b', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
      await visit(disagreeing, 'a')
      expect(await exposures(bot)).toEqual([])
      expect(await exposures(disagreeing)).toEqual([])
    } finally {
      if (flagId)
        await client.rpc('deactivate_flag', {
          p_project_id: projectId,
          p_environment: 'development',
          p_flag_id: flagId,
          p_expected_snapshot_version: await snapshot(),
          p_reason: 'exposure spec cleanup',
          p_actor_user_id: actor,
        })
      await client.from('project_members').delete().eq('user_id', actor).eq('project_id', projectId)
      await client.auth.admin.deleteUser(actor)
    }
  })
})
