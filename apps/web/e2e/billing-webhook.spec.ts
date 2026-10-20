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

const GROWTH = 'gf_growth_monthly'
let clock = Math.floor(Date.now() / 1000)
/** A subscription event as Stripe sends it: the subscription object, its items' prices, the event's `created`. */
const subEvent = (
  type: string,
  customer: string,
  id: string,
  status: string,
  opts: { lookupKey?: string | null; created?: number } = {}
) => ({
  ...evt(type, {
    object: 'subscription',
    id,
    customer,
    status,
    items: {
      object: 'list',
      data: [
        {
          object: 'subscription_item',
          price: { object: 'price', lookup_key: opts.lookupKey === undefined ? GROWTH : opts.lookupKey },
        },
      ],
    },
  }),
  created: opts.created ?? ++clock,
})

const ids = () => ({
  customer: `cus_${randomBytes(6).toString('hex')}`,
  sub: `sub_${randomBytes(6).toString('hex')}`,
})

async function workspace(client: SupabaseClient, plan = 'free', customer?: string) {
  const { data, error } = await client
    .from('workspaces')
    .insert({
      name: `spec billing ${randomUUID().slice(0, 8)}`,
      plan,
      ...(customer ? { stripe_customer_id: customer } : {}),
    })
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

async function cleanup(client: SupabaseClient, ws: string, events: string[]) {
  if (events.length) await client.from('billing_events').delete().in('stripe_event_id', events)
  await client.from('workspaces').delete().eq('id', ws)
}

test('an unsigned or forged event is refused and changes nothing', async ({ request }) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  try {
    const event = subEvent('customer.subscription.created', customer, sub, 'active')
    expect((await request.post('/api/v1/billing/webhook', { data: event })).status()).toBe(400)
    expect((await send(request, event, 'whsec_not_the_real_secret')).status()).toBe(400)
    expect((await row(client, ws))?.plan).toBe('free')
    const { data: recorded } = await client
      .from('billing_events')
      .select('stripe_event_id')
      .eq('stripe_event_id', event.id)
    expect(recorded).toEqual([])
  } finally {
    await cleanup(client, ws, [])
  }
})

test("a Growth subscription puts the customer's workspace on Growth; a replay is a no-op; deletion returns it to Free", async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const created = subEvent('customer.subscription.created', customer, sub, 'active')
    events.push(created.id)
    expect((await send(request, created)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({
      plan: 'growth',
      product_limit: null,
      monthly_event_pool: 2000000,
      stripe_subscription_id: sub,
    })
    const replay = await send(request, created)
    expect(await replay.json()).toMatchObject({ duplicate: true })
    const { data: recorded } = await client
      .from('billing_events')
      .select('workspace_id')
      .eq('stripe_event_id', created.id)
    expect(recorded).toEqual([{ workspace_id: ws }])

    const deleted = subEvent('customer.subscription.deleted', customer, sub, 'canceled')
    events.push(deleted.id)
    expect((await send(request, deleted)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({
      plan: 'free',
      product_limit: 10,
      monthly_event_pool: 200000,
      stripe_subscription_id: null,
    })
  } finally {
    await cleanup(client, ws, events)
  }
})

test('an older "active" arriving after the deletion cannot put the workspace back on Growth (event order)', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const t = ++clock
    const created = subEvent('customer.subscription.created', customer, sub, 'active', { created: t })
    const staleUpdate = subEvent('customer.subscription.updated', customer, sub, 'active', { created: t + 1 })
    const deleted = subEvent('customer.subscription.deleted', customer, sub, 'canceled', { created: t + 2 })
    clock = t + 3
    events.push(created.id, staleUpdate.id, deleted.id)
    for (const e of [created, deleted, staleUpdate]) expect((await send(request, e)).status()).toBe(200)
    expect((await row(client, ws))?.plan).toBe('free')
  } finally {
    await cleanup(client, ws, events)
  }
})

test('a stale "active" in the SAME second as the deletion cannot undo it (a tie goes to Free)', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const t = ++clock
    const created = subEvent('customer.subscription.created', customer, sub, 'active', { created: t })
    const deleted = subEvent('customer.subscription.deleted', customer, sub, 'canceled', { created: t + 1 })
    const staleUpdate = subEvent('customer.subscription.updated', customer, sub, 'active', { created: t + 1 })
    clock = t + 2
    events.push(created.id, deleted.id, staleUpdate.id)
    for (const e of [created, deleted, staleUpdate]) expect((await send(request, e)).status()).toBe(200)
    expect((await row(client, ws))?.plan).toBe('free')
  } finally {
    await cleanup(client, ws, events)
  }
})

test('a deletion delivered BEFORE its creation is final: the late "created" cannot grant Growth', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const t = ++clock
    const created = subEvent('customer.subscription.created', customer, sub, 'active', { created: t })
    const deleted = subEvent('customer.subscription.deleted', customer, sub, 'canceled', { created: t + 5 })
    clock = t + 6
    events.push(created.id, deleted.id)
    for (const e of [deleted, created]) expect((await send(request, e)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({ plan: 'free', stripe_subscription_id: null })
  } finally {
    await cleanup(client, ws, events)
    await client.from('billing_subscription_states').delete().eq('stripe_subscription_id', sub)
  }
})

test('a deleted subscription is ended for good: even a LATER-stamped "active" for it cannot grant Growth', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const t = ++clock
    const created = subEvent('customer.subscription.created', customer, sub, 'active', { created: t })
    const deleted = subEvent('customer.subscription.deleted', customer, sub, 'canceled', { created: t + 1 })
    const after = subEvent('customer.subscription.updated', customer, sub, 'active', { created: t + 2 })
    clock = t + 3
    events.push(created.id, deleted.id, after.id)
    for (const e of [created, deleted, after]) expect((await send(request, e)).status()).toBe(200)
    expect(await row(client, ws)).toMatchObject({ plan: 'free', stripe_subscription_id: null })
  } finally {
    await cleanup(client, ws, events)
    await client.from('billing_subscription_states').delete().eq('stripe_subscription_id', sub)
  }
})

test('an "unpaid" or a move off the price delivered BEFORE "created" still wins: the late "created" cannot grant Growth', async ({
  request,
}) => {
  const client = db()
  const events: string[] = []
  const made: { ws: string; sub: string }[] = []
  try {
    for (const early of ['unpaid', 'moved-price'] as const) {
      const { customer, sub } = ids()
      const ws = await workspace(client, 'free', customer)
      made.push({ ws, sub })
      const t = ++clock
      const created = subEvent('customer.subscription.created', customer, sub, 'active', { created: t })
      const later =
        early === 'unpaid'
          ? subEvent('customer.subscription.updated', customer, sub, 'unpaid', { created: t + 5 })
          : subEvent('customer.subscription.updated', customer, sub, 'active', {
              created: t + 5,
              lookupKey: 'someone_elses_price',
            })
      clock = t + 6
      events.push(created.id, later.id)
      for (const e of [later, created]) expect((await send(request, e)).status()).toBe(200)
      expect(await row(client, ws), early).toMatchObject({ plan: 'free', stripe_subscription_id: null })
    }
  } finally {
    if (events.length) await client.from('billing_events').delete().in('stripe_event_id', events)
    for (const { ws, sub } of made) {
      await client.from('workspaces').delete().eq('id', ws)
      await client.from('billing_subscription_states').delete().eq('stripe_subscription_id', sub)
    }
  }
})

test('a held Growth subscription moved off the Growth price, or deleted after its key moved, loses Growth', async ({
  request,
}) => {
  const client = db()
  const events: string[] = []
  const made: { ws: string; sub: string }[] = []
  try {
    for (const ending of ['moved-price', 'deleted-without-key'] as const) {
      const { customer, sub } = ids()
      const ws = await workspace(client, 'free', customer)
      made.push({ ws, sub })
      const created = subEvent('customer.subscription.created', customer, sub, 'active')
      const off =
        ending === 'moved-price'
          ? subEvent('customer.subscription.updated', customer, sub, 'active', {
              lookupKey: 'someone_elses_price',
            })
          : subEvent('customer.subscription.deleted', customer, sub, 'canceled', { lookupKey: null })
      events.push(created.id, off.id)
      expect((await send(request, created)).status()).toBe(200)
      expect((await row(client, ws))?.plan).toBe('growth')
      expect((await send(request, off)).status()).toBe(200)
      expect(await row(client, ws), ending).toMatchObject({ plan: 'free', stripe_subscription_id: null })
    }
  } finally {
    if (events.length) await client.from('billing_events').delete().in('stripe_event_id', events)
    for (const { ws, sub } of made) {
      await client.from('workspaces').delete().eq('id', ws)
      await client.from('billing_subscription_states').delete().eq('stripe_subscription_id', sub)
    }
  }
})

test('a second subscription cannot take the slot, and its deletion cannot demote the workspace', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const second = `sub_${randomBytes(6).toString('hex')}`
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    for (const e of [
      subEvent('customer.subscription.created', customer, sub, 'active'),
      subEvent('customer.subscription.created', customer, second, 'active'),
      subEvent('customer.subscription.deleted', customer, second, 'canceled'),
    ]) {
      events.push(e.id)
      expect((await send(request, e)).status()).toBe(200)
    }
    expect(await row(client, ws)).toMatchObject({ plan: 'growth', stripe_subscription_id: sub })
  } finally {
    await cleanup(client, ws, events)
  }
})

test('a subscription on another price grants nothing; an unknown customer changes nothing', async ({
  request,
}) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'free', customer)
  const events: string[] = []
  try {
    const other = subEvent('customer.subscription.created', customer, sub, 'active', {
      lookupKey: 'someone_elses_price',
    })
    const stranger = subEvent(
      'customer.subscription.created',
      `cus_${randomBytes(6).toString('hex')}`,
      sub,
      'active'
    )
    events.push(other.id, stranger.id)
    expect((await send(request, other)).status()).toBe(200)
    expect((await send(request, stranger)).status()).toBe(200)
    expect((await row(client, ws))?.plan).toBe('free')
  } finally {
    await cleanup(client, ws, events)
  }
})

test('a comped workspace is never touched by a payment event', async ({ request }) => {
  const client = db()
  const { customer, sub } = ids()
  const ws = await workspace(client, 'comped', customer)
  const events: string[] = []
  try {
    for (const e of [
      subEvent('customer.subscription.created', customer, sub, 'active'),
      subEvent('customer.subscription.deleted', customer, sub, 'canceled'),
    ]) {
      events.push(e.id)
      expect((await send(request, e)).status()).toBe(200)
    }
    expect((await row(client, ws))?.plan).toBe('comped')
  } finally {
    await cleanup(client, ws, events)
  }
})

test('checkout does not exist while the switch is off; the portal always answers, and both need a session', async ({
  request,
}) => {
  const checkout = await request.post('/api/v1/billing/checkout', { maxRedirects: 0 })
  const portal = await request.post('/api/v1/billing/portal', { maxRedirects: 0 })
  // The portal is never gated: a paying customer can always cancel. Signed out, it asks for a session.
  expect(portal.status()).toBe(303)
  expect(portal.headers().location).toContain('/login')
  if (process.env.BILLING_CHECKOUT_ENABLED === 'true') {
    // Signed out: sent to sign in, never to Stripe.
    expect(checkout.status()).toBe(303)
    expect(checkout.headers().location).toContain(`/login?next=${encodeURIComponent('/#pricing')}`)
  } else {
    expect(checkout.status()).toBe(404)
  }
})

test('Plan & billing needs a session, and sign-in brings the reader back to it', async ({ request }) => {
  const page = await request.get('/app/billing', { maxRedirects: 0 })
  expect([303, 307]).toContain(page.status())
  expect(page.headers().location).toContain(`/login?next=${encodeURIComponent('/app/billing')}`)
})

test('apply_subscription_event() is NOT executable by the anon role — only the webhook (service role) moves a plan', async () => {
  // The PROPERTY, not the REVOKE statement (delivery-outbox's discipline): a function-level denial, never an RLS error
  // (which would mean EXECUTE leaked and the body ran as anon).
  const url = process.env.SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  test.skip(!url || !anon, 'anon key not in env')
  const anonClient = createClient(url!, anon!, { auth: { persistSession: false } })
  const { error } = await anonClient.rpc('apply_subscription_event', {
    p_customer: 'cus_x',
    p_subscription: 'sub_x',
    p_plan: 'growth',
    p_event_at: new Date().toISOString(),
    p_ended: false,
  })
  expect(error).not.toBeNull()
  const code = error?.code ?? ''
  const message = (error?.message ?? '').toLowerCase()
  expect(
    (code === '42501' && message.includes('function')) ||
      code === 'PGRST202' ||
      message.includes('could not find the function')
  ).toBe(true)
  expect(message).not.toContain('row-level security')
})
