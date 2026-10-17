import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Story 3.1 (Roadmap/01-growth-engine/growth-engine-v1/sprint-3.md) —
// POST /v1/north-star/sync + GET /v1/north-star.
const PROJECT_ONE_KEY = 'local-test-key-do-not-use-in-prod'
const PROJECT_TWO_KEY = 'local-test-key-two-do-not-use-in-prod'

function dbClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

test('missing Authorization header → 401 on both sync and list', async ({ request }) => {
  const sync = await request.post('/api/v1/north-star/sync', {
    data: {
      metric: { key: 'm', name: 'M' },
      inputs: [{ key: 'i', name: 'I', valueSource: 'external_push' }],
    },
  })
  expect(sync.status()).toBe(401)

  const list = await request.get('/api/v1/north-star')
  expect(list.status()).toBe(401)
})

test('telemetry_event input missing sourceEvent → 400', async ({ request }) => {
  const res = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: `spec-metric-${Date.now()}`, name: 'Spec Metric' },
      inputs: [{ key: 'spec_input', name: 'Spec Input', valueSource: 'telemetry_event' }],
    },
  })
  expect(res.status()).toBe(400)
})

test('external_push input WITH a sourceEvent → 400 (must be omitted for pushed inputs)', async ({
  request,
}) => {
  const res = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: `spec-metric-${Date.now()}`, name: 'Spec Metric' },
      inputs: [
        {
          key: 'spec_input',
          name: 'Spec Input',
          valueSource: 'external_push',
          sourceEvent: 'should_not_be_here',
        },
      ],
    },
  })
  expect(res.status()).toBe(400)
})

test('duplicate input keys in one payload → 400', async ({ request }) => {
  const inputKey = `spec-dup-${Date.now()}`
  const res = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: `spec-metric-${Date.now()}`, name: 'Spec Metric' },
      inputs: [
        { key: inputKey, name: 'One', valueSource: 'external_push' },
        { key: inputKey, name: 'Two', valueSource: 'external_push' },
      ],
    },
  })
  expect(res.status()).toBe(400)
  const body = await res.json()
  expect(body.error).toContain(inputKey)
})

test('valid sync defines a metric with both a telemetry_event and an external_push input, queryable after', async ({
  request,
}) => {
  const metricKey = `payable_sellers_spec_${Date.now()}`
  const telemetryInputKey = `setup_guide_shares_spec_${Date.now()}`
  const pushInputKey = `attributed_revenue_spec_${Date.now()}`

  const sync = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: metricKey, name: 'Payable Sellers', description: 'Spec fixture' },
      inputs: [
        {
          key: telemetryInputKey,
          name: 'Setup Guide Shares',
          valueSource: 'telemetry_event',
          sourceEvent: 'setup_guide_share_tapped',
        },
        { key: pushInputKey, name: 'Attributed Revenue', valueSource: 'external_push' },
      ],
    },
  })
  expect(sync.status()).toBe(200)
  const syncBody = await sync.json()
  expect(syncBody.ok).toBe(true)
  expect(syncBody.inputsSynced).toBe(2)

  const list = await request.get('/api/v1/north-star', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
  })
  expect(list.status()).toBe(200)
  const listBody = await list.json()
  const metric = listBody.metrics.find((m: { key: string }) => m.key === metricKey)
  expect(metric).toBeTruthy()
  expect(metric.inputs).toHaveLength(2)
  const telemetryInput = metric.inputs.find((i: { key: string }) => i.key === telemetryInputKey)
  expect(telemetryInput.valueSource).toBe('telemetry_event')
  expect(telemetryInput.sourceEvent).toBe('setup_guide_share_tapped')
  const pushInput = metric.inputs.find((i: { key: string }) => i.key === pushInputKey)
  expect(pushInput.valueSource).toBe('external_push')
  expect(pushInput.sourceEvent).toBeNull()

  // Re-sync updates in place, not a duplicate row.
  const resync = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: metricKey, name: 'Payable Sellers (renamed)' },
      inputs: [
        {
          key: telemetryInputKey,
          name: 'Setup Guide Shares',
          valueSource: 'telemetry_event',
          sourceEvent: 'setup_guide_share_tapped',
        },
      ],
    },
  })
  expect(resync.status()).toBe(200)

  const db = dbClient()
  const { data: metricRows } = await db.from('north_star_metrics').select('name').eq('key', metricKey)
  expect(metricRows?.length).toBe(1)
  expect(metricRows?.[0]?.name).toBe('Payable Sellers (renamed)')
})

test('re-syncing an existing input with a DIFFERENT valueSource → 400 (would silently orphan its stored series)', async ({
  request,
}) => {
  const metricKey = `spec-value-source-guard-metric-${Date.now()}`
  const inputKey = `spec-value-source-guard-input-${Date.now()}`

  const first = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: metricKey, name: 'Spec Metric' },
      inputs: [{ key: inputKey, name: 'Spec Input', valueSource: 'external_push' }],
    },
  })
  expect(first.status()).toBe(200)
  // A pushed value is what the refusal protects (proving-workspaces-reading D7: with none, the switch is allowed).
  const pushedValue = await request.post(`/api/v1/inputs/${inputKey}/values`, {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: { values: [{ occurredOn: '2026-10-01', value: 3 }] },
  })
  expect(pushedValue.status(), await pushedValue.text()).toBeLessThan(300)

  const second = await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: metricKey, name: 'Spec Metric' },
      inputs: [
        { key: inputKey, name: 'Spec Input', valueSource: 'telemetry_event', sourceEvent: 'some_event' },
      ],
    },
  })
  expect(second.status()).toBe(400)

  const db = dbClient()
  const { data: rows } = await db.from('leading_inputs').select('value_source').eq('key', inputKey)
  expect(rows?.[0]?.value_source).toBe('external_push') // unchanged
})

test("tenant isolation: project-two sees its own metric but not project-one's", async ({ request }) => {
  // A positive check on project-two's OWN data, not just an absence check on project-one's key —
  // an endpoint that always returned an empty list would wrongly "pass" an absence-only test.
  const projectOneKey = `spec-isolation-one-${Date.now()}`
  const projectTwoKey = `spec-isolation-two-${Date.now()}`

  await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: {
      metric: { key: projectOneKey, name: 'Spec One' },
      inputs: [{ key: `spec-isolation-input-one-${Date.now()}`, name: 'Spec', valueSource: 'external_push' }],
    },
  })
  await request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_TWO_KEY}` },
    data: {
      metric: { key: projectTwoKey, name: 'Spec Two' },
      inputs: [{ key: `spec-isolation-input-two-${Date.now()}`, name: 'Spec', valueSource: 'external_push' }],
    },
  })

  const list = await request.get('/api/v1/north-star', {
    headers: { Authorization: `Bearer ${PROJECT_TWO_KEY}` },
  })
  const listBody = await list.json()
  expect(listBody.metrics.find((m: { key: string }) => m.key === projectTwoKey)).toBeTruthy()
  expect(listBody.metrics.find((m: { key: string }) => m.key === projectOneKey)).toBeUndefined()
})

// ── proving-workspaces-reading S1.2 (D6–D8) ────────────────────────────────────────────────────────────────────────

const sync = (request: import('@playwright/test').APIRequestContext, metricKey: string, inputs: unknown[]) =>
  request.post('/api/v1/north-star/sync', {
    headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` },
    data: { metric: { key: metricKey, name: 'Spec Metric' }, inputs },
  })

test('D7: an external_push input with NOTHING pushed may switch to telemetry_event; the reverse is refused', async ({
  request,
}) => {
  const stamp = Date.now()
  const metricKey = `spec-switch-metric-${stamp}`
  const inputKey = `spec-switch-input-${stamp}`
  expect(
    (await sync(request, metricKey, [{ key: inputKey, name: 'In', valueSource: 'external_push' }])).status()
  ).toBe(200)

  const switched = await sync(request, metricKey, [
    {
      key: inputKey,
      name: 'In',
      valueSource: 'telemetry_event',
      sourceEvent: 'spec_event',
      aggregate: 'distinct_monthly',
    },
  ])
  expect(switched.status(), await switched.text()).toBe(200)
  const db = dbClient()
  const { data: rows } = await db
    .from('leading_inputs')
    .select('value_source, source_event, aggregate')
    .eq('key', inputKey)
  expect(rows?.[0]).toEqual({
    value_source: 'telemetry_event',
    source_event: 'spec_event',
    aggregate: 'distinct_monthly',
  })

  const back = await sync(request, metricKey, [{ key: inputKey, name: 'In', valueSource: 'external_push' }])
  expect(back.status()).toBe(400)
  expect((await back.json()).error).toContain('Cannot change value_source')
})

test('D6: aggregate is refused on an external_push input, and a re-sync without it counts per day again', async ({
  request,
}) => {
  const stamp = Date.now()
  const metricKey = `spec-aggregate-metric-${stamp}`
  const pushed = await sync(request, metricKey, [
    { key: `spec-agg-push-${stamp}`, name: 'P', valueSource: 'external_push', aggregate: 'distinct_monthly' },
  ])
  expect(pushed.status()).toBe(400)
  const unknown = await sync(request, metricKey, [
    {
      key: `spec-agg-bad-${stamp}`,
      name: 'B',
      valueSource: 'telemetry_event',
      sourceEvent: 'e',
      aggregate: 'sum',
    },
  ])
  expect(unknown.status()).toBe(400)

  const inputKey = `spec-agg-tel-${stamp}`
  const telemetry = { key: inputKey, name: 'T', valueSource: 'telemetry_event', sourceEvent: 'e' }
  expect((await sync(request, metricKey, [{ ...telemetry, aggregate: 'distinct_monthly' }])).status()).toBe(
    200
  )
  const list = await (
    await request.get('/api/v1/north-star', { headers: { Authorization: `Bearer ${PROJECT_ONE_KEY}` } })
  ).json()
  const listed = list.metrics.find((m: { key: string }) => m.key === metricKey)?.inputs?.[0]
  expect(listed).toMatchObject({ key: inputKey, aggregate: 'distinct_monthly' })

  expect((await sync(request, metricKey, [telemetry])).status()).toBe(200)
  const { data: rows } = await dbClient().from('leading_inputs').select('aggregate').eq('key', inputKey)
  expect(rows?.[0]?.aggregate).toBe('count')
})

test('D5: the database refuses distinct_monthly on an external_push input, whatever writes it', async ({
  request,
}) => {
  const inputKey = `spec-agg-db-${Date.now()}`
  expect(
    (
      await sync(request, `spec-agg-db-metric-${Date.now()}`, [
        { key: inputKey, name: 'P', valueSource: 'external_push' },
      ])
    ).status()
  ).toBe(200)
  const db = dbClient()
  const { data: input } = await db.from('leading_inputs').select('id').eq('key', inputKey).single()
  const { error } = await db
    .from('leading_inputs')
    .update({ aggregate: 'distinct_monthly' })
    .eq('id', input!.id)
  expect(error?.message ?? '').toContain('leading_inputs_aggregate_telemetry_only')
})

test('D8: a distinct_monthly input reads distinct senders this month; a count input over the same events reads events', async ({
  request,
}) => {
  const stamp = Date.now()
  const metricKey = `spec-distinct-metric-${stamp}`
  const featureKey = `spec_distinct_feature_${stamp}`
  const event = `spec_distinct_event_${stamp}`
  const distinctKey = `spec-distinct-${stamp}`
  const countKey = `spec-count-${stamp}`
  const headers = { Authorization: `Bearer ${PROJECT_ONE_KEY}` }
  expect(
    (
      await sync(request, metricKey, [
        {
          key: distinctKey,
          name: 'D',
          valueSource: 'telemetry_event',
          sourceEvent: event,
          aggregate: 'distinct_monthly',
        },
        { key: countKey, name: 'C', valueSource: 'telemetry_event', sourceEvent: event },
      ])
    ).status()
  ).toBe(200)
  for (const inputKey of [distinctKey, countKey]) {
    const link = await request.post(`/api/v1/features/${featureKey}/link-input`, {
      headers,
      data: { inputKey },
    })
    expect(link.status(), await link.text()).toBeLessThan(300)
  }
  // As the push route sends them (D2): the same subject twice, and a second subject.
  for (const userId of [`ws-a-${stamp}`, `ws-a-${stamp}`, `ws-b-${stamp}`]) {
    const tracked = await request.post('/api/v1/track', {
      headers,
      data: { event, userId, featureId: featureKey },
    })
    expect(tracked.status(), await tracked.text()).toBeLessThan(300)
  }
  const impact = await (await request.get(`/api/v1/features/${featureKey}/impact`, { headers })).json()
  const today = new Date().toISOString().slice(0, 10)
  const byKey = new Map(impact.inputs.map((i: { key: string }) => [i.key, i]))
  expect(byKey.get(distinctKey)).toMatchObject({
    aggregate: 'distinct_monthly',
    series: [{ date: today, value: 2 }],
  })
  expect(byKey.get(countKey)).toMatchObject({ aggregate: 'count', series: [{ date: today, value: 3 }] })
  expect(JSON.stringify(impact)).not.toContain(`ws-a-${stamp}`)
})
