import { test, expect, type APIRequestContext } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomBytes, randomUUID } from 'node:crypto'
import Stripe from 'stripe'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D26) — the billing webhook, driven with events signed by Stripe's
// own helper under the run's `STRIPE_WEBHOOK_SECRET` (CI and the local runner generate it per run). Nothing here talks
// to Stripe: the route verifies a signature and writes one workspace, and that is what is asserted, on the rows.

const secret = process.env.STRIPE_WEBHOOK_SECRET
test.skip(!secret, 'needs STRIPE_WEBHOOK_SECRET — the e2e runners generate one')

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

const signer = new Stripe('sk_placeholder_for_signing_only')

function send(request: APIRequestContext, event: Record<string, unknown>, signWith = secret!) {
  const payload = JSON.stringify(event)
  const header = signer.webhooks.generateTestHeaderString({ payload, secret: signWith })
  return request.post('/api/v1/billing/webhook', {
    headers: { 'content-type': 'application/json', 'stripe-signature': header },
    data: payload,
  })
}

const evt = (type: string, object: Record<string, unknown>) => ({
  id: `evt_spec_${randomBytes(8).toString('hex')}`,
  object: 'event',
  type,
  api_version: '2026-09-30.endive',
  created: Math.floor(Date.now() / 1000),
  data: { object },
})

const completed = (workspaceId: string, customer: string, subscription: string) =>
  evt('checkout.session.completed', {
    object: 'checkout.session',
    id: `cs_spec_${randomBytes(6).toString('hex')}`,
    mode: 'subscription',
    payment_status: 'paid',
    client_reference_id: workspaceId,
    customer,
    subscription,
  })

const subscriptionEvent = (type: string, customer: string, id: string, status: string) =>
  evt(type, { object: 'subscription', id, customer, status })

async function workspace(client: SupabaseClient, plan = 'free') {
  const { data, error } = await client
    .from('workspaces')
    .insert({ name: `spec billing ${randomUUID().slice(0, 8)}`, plan })
    .select('id')
    .single()
  if (error || !data) throw new Error(`workspace fixture: ${error?.message}`)
  return data.id as string
}

async function row(client: SupabaseClient, id: string) {
  const { data } = await client
    .from('workspaces')
    .select('plan, product_limit, monthly_event_pool, stripe_customer_id, stripe_subscription_id')
    .eq('id', id)
    .single()
  return data
}

test('an unsigned or forged event is refused and changes nothing', async ({ request }) => {
  const client = db()
  const ws = await workspace(client)
  try {
    const event = completed(
      ws,
      `cus_${randomBytes(6).toString('hex')}`,
      `sub_${randomBytes(6).toString('hex')}`
    )
    const unsigned = await request.post('/api/v1/billing/webhook', { data: event })
    expect(unsigned.status()).toBe(400)
    const forged = await send(request, event, 'whsec_not_the_real_secret')
    expect(forged.status()).toBe(400)
    expect((await row(client, ws))?.plan).toBe('free')
    const { data: recorded } = await client
      .from('billing_events')
      .select('stripe_event_id')
      .eq('stripe_event_id', event.id)
    expect(recorded).toEqual([])
  } finally {
    await client.from('workspaces').delete().eq('id', ws)
  }
})

test('a paid checkout puts OUR workspace on Growth; a replay is a no-op; cancellation returns it to Free', async ({
  request,
}) => {
  const client = db()
  const ws = await workspace(client)
  const customer = `cus_${randomBytes(6).toString('hex')}`
  const subscription = `sub_${randomBytes(6).toString('hex')}`
  const ids: string[] = []
  try {
    const paid = completed(ws, customer, subscription)
    ids.push(paid.id)
    expect((await send(request, paid)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({
      plan: 'growth',
      product_limit: null,
      monthly_event_pool: 2000000,
      stripe_customer_id: customer,
      stripe_subscription_id: subscription,
    })

    // Stripe redelivers: the same event id must change nothing and be recorded once.
    const replay = await send(request, paid)
    expect(replay.status()).toBe(200)
    expect(await replay.json()).toMatchObject({ duplicate: true })
    const { data: recorded } = await client
      .from('billing_events')
      .select('workspace_id')
      .eq('stripe_event_id', paid.id)
    expect(recorded).toEqual([{ workspace_id: ws }])

    // A cancel in the portal schedules the end; Stripe deletes the subscription at period end.
    const deleted = subscriptionEvent('customer.subscription.deleted', customer, subscription, 'canceled')
    ids.push(deleted.id)
    expect((await send(request, deleted)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({
      plan: 'free',
      product_limit: 10,
      monthly_event_pool: 200000,
      stripe_customer_id: customer,
      stripe_subscription_id: null,
    })
  } finally {
    await client.from('billing_events').delete().in('stripe_event_id', ids)
    await client.from('workspaces').delete().eq('id', ws)
  }
})

test('a comped workspace is never touched by a payment event', async ({ request }) => {
  const client = db()
  const ws = await workspace(client, 'comped')
  const customer = `cus_${randomBytes(6).toString('hex')}`
  await client.from('workspaces').update({ stripe_customer_id: customer }).eq('id', ws)
  const ids: string[] = []
  try {
    const deleted = subscriptionEvent(
      'customer.subscription.deleted',
      customer,
      `sub_${randomBytes(6).toString('hex')}`,
      'canceled'
    )
    ids.push(deleted.id)
    expect((await send(request, deleted)).status()).toBe(200)
    const paid = completed(ws, customer, `sub_${randomBytes(6).toString('hex')}`)
    ids.push(paid.id)
    expect((await send(request, paid)).status()).toBe(200)
    expect((await row(client, ws))?.plan).toBe('comped')
  } finally {
    await client.from('billing_events').delete().in('stripe_event_id', ids)
    await client.from('workspaces').delete().eq('id', ws)
  }
})

test('a checkout naming a workspace with a DIFFERENT customer cannot take it over', async ({ request }) => {
  const client = db()
  const ws = await workspace(client)
  const owner = `cus_${randomBytes(6).toString('hex')}`
  await client.from('workspaces').update({ stripe_customer_id: owner }).eq('id', ws)
  const ids: string[] = []
  try {
    const intruder = completed(
      ws,
      `cus_${randomBytes(6).toString('hex')}`,
      `sub_${randomBytes(6).toString('hex')}`
    )
    ids.push(intruder.id)
    expect((await send(request, intruder)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({ plan: 'free', stripe_customer_id: owner })
  } finally {
    await client.from('billing_events').delete().in('stripe_event_id', ids)
    await client.from('workspaces').delete().eq('id', ws)
  }
})

test('checkout and the portal do not exist while the switch is off, and need a session when it is on', async ({
  request,
}) => {
  const checkout = await request.get('/api/v1/billing/checkout', { maxRedirects: 0 })
  const portal = await request.get('/api/v1/billing/portal', { maxRedirects: 0 })
  if (process.env.BILLING_CHECKOUT_ENABLED === 'true') {
    // Signed out: sent to sign in, never to Stripe.
    expect(checkout.status()).toBe(303)
    expect(checkout.headers().location).toContain('/login?next=/api/v1/billing/checkout')
    expect(portal.status()).toBe(303)
    expect(portal.headers().location).toContain('/login')
  } else {
    expect(checkout.status()).toBe(404)
    expect(portal.status()).toBe(404)
  }
})
