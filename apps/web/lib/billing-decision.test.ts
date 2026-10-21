// landing-launch-experiment · Sprint 4, Story 4.3 (epic D26) — what a Stripe event does to a plan.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ALERTED_EVENT_TYPES,
  billingAlert,
  paymentTrouble,
  stripeSecretKey,
  GROWTH_PRICE_LOOKUP_KEY,
  decideBillingAction,
  holdsGrowthSubscription,
  isGrowthPrice,
  integrationIdentifier,
  planForSubscriptionStatus,
} from './billing-decision.ts'

const sub = (
  type: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted',
  over: Record<string, unknown> = {}
) => ({
  type,
  customerId: 'cus_123',
  subscriptionId: 'sub_123',
  status: 'active',
  priceLookupKeys: [GROWTH_PRICE_LOOKUP_KEY],
  createdAt: 1_790_000_000,
  ...over,
})

test('an active Growth subscription sets Growth for its customer, stamped with the event time', () => {
  assert.deepEqual(decideBillingAction(sub('customer.subscription.created')), {
    kind: 'set-plan',
    customerId: 'cus_123',
    plan: 'growth',
    subscriptionId: 'sub_123',
    eventAt: new Date(1_790_000_000 * 1000).toISOString(),
    ended: false,
  })
})

test('deleted is Free whatever the last status said; unpaid is Free; incomplete waits', () => {
  assert.equal((decideBillingAction(sub('customer.subscription.deleted')) as { plan: string }).plan, 'free')
  assert.equal(
    (decideBillingAction(sub('customer.subscription.updated', { status: 'unpaid' })) as { plan: string })
      .plan,
    'free'
  )
  assert.equal(
    decideBillingAction(sub('customer.subscription.updated', { status: 'incomplete' })).kind,
    'none'
  )
})

test('off the Growth price is Free for THAT subscription: never a grant, and a held Growth moved off it is taken back', () => {
  // The apply step moves only a workspace whose slot holds this subscription, so a Payment Link or another product's
  // subscription grants nothing, while one moved off Growth (or whose key was moved) loses it (codex r5, verifier r5).
  for (const priceLookupKeys of [[], ['someone_elses_price']])
    for (const type of ['customer.subscription.created', 'customer.subscription.updated'] as const)
      assert.equal(
        (decideBillingAction(sub(type, { priceLookupKeys })) as { plan: string }).plan,
        'free',
        `${type} ${priceLookupKeys}`
      )
})

test('deleted, canceled and expired END the subscription (recorded, so Growth never binds it); unpaid does not', () => {
  const ended = (over: Record<string, unknown>, type = 'customer.subscription.updated' as const) =>
    (decideBillingAction(sub(type, over)) as { ended: boolean }).ended
  assert.equal(ended({}, 'customer.subscription.deleted' as never), true)
  assert.equal(ended({ priceLookupKeys: [] }, 'customer.subscription.deleted' as never), true)
  assert.equal(ended({ status: 'canceled' }), true)
  assert.equal(ended({ status: 'incomplete_expired' }), true)
  assert.equal(ended({ status: 'unpaid' }), false)
  assert.equal(ended({ status: 'active' }), false)
})

test('only Stripe-shaped ids reach the apply step (they go inside PostgREST filters)', () => {
  for (const over of [
    { customerId: null },
    { customerId: 'cus_x),plan.eq.free' },
    { subscriptionId: 'sub_1),plan.eq.growth' },
    { subscriptionId: null },
    { createdAt: 0 },
  ])
    assert.equal(
      decideBillingAction(sub('customer.subscription.updated', over)).kind,
      'none',
      JSON.stringify(over)
    )
})

test('checkout and every other event move no plan — only the subscription does', () => {
  for (const type of [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'charge.dispute.created',
    'charge.refunded',
    'radar.early_fraud_warning.created',
    'invoice.payment_failed',
  ])
    assert.equal(decideBillingAction({ type }).kind, 'none', type)
})

test('statuses: live ones are Growth, ended ones Free, pending ones nothing', () => {
  assert.equal(planForSubscriptionStatus('active'), 'growth')
  assert.equal(planForSubscriptionStatus('past_due'), 'growth')
  assert.equal(planForSubscriptionStatus('canceled'), 'free')
  assert.equal(planForSubscriptionStatus('incomplete'), null)
  assert.equal(planForSubscriptionStatus(null), null)
})

test('the price script sells the lookup key the app reads (one key, two files that must agree)', () => {
  const script = readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'scripts', 'stripe-ensure-growth-price.mjs'),
    'utf8'
  )
  assert.match(script, new RegExp(`GROWTH_PRICE_LOOKUP_KEY = '${GROWTH_PRICE_LOOKUP_KEY}'`))
})

test('a customer holding a live or pending Growth subscription is not sold another; an ended one or another price is', () => {
  const growth = [GROWTH_PRICE_LOOKUP_KEY]
  for (const status of ['active', 'trialing', 'past_due', 'incomplete'])
    assert.equal(holdsGrowthSubscription([{ status, priceLookupKeys: growth }]), true, status)
  for (const status of ['canceled', 'unpaid', 'incomplete_expired'])
    assert.equal(holdsGrowthSubscription([{ status, priceLookupKeys: growth }]), false, status)
  assert.equal(
    holdsGrowthSubscription([{ status: 'active', priceLookupKeys: ['someone_elses_price', null] }]),
    false
  )
  assert.equal(holdsGrowthSubscription([]), false)
})

test('only $49.00 USD a month, licensed, is Growth: any other amount, currency or interval stops the sale', () => {
  const growth = {
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' },
  }
  assert.equal(isGrowthPrice(growth), true)
  for (const wrong of [
    { ...growth, unit_amount: 490 },
    { ...growth, unit_amount: null },
    { ...growth, currency: 'eur' },
    { ...growth, recurring: null },
    { ...growth, recurring: { ...growth.recurring, interval: 'year' } },
    { ...growth, recurring: { ...growth.recurring, interval_count: 3 } },
    { ...growth, recurring: { ...growth.recurring, usage_type: 'metered' } },
  ])
    assert.equal(isGrowthPrice(wrong), false, JSON.stringify(wrong))
})

test("the price script's own check agrees with the app's on every case", async () => {
  // A plain .mjs with no types: imported by a computed path, and typed here by the one function the test reads.
  const scriptPath = '../../../scripts/stripe-ensure-growth-price.mjs'
  const script = (await import(scriptPath)) as { isGrowthPrice: (price: unknown) => boolean }
  const growth = {
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month', interval_count: 1, usage_type: 'licensed' },
  }
  for (const price of [
    growth,
    { ...growth, recurring: { interval: 'month', interval_count: 1 } },
    { ...growth, unit_amount: 490 },
    { ...growth, currency: 'eur' },
    { ...growth, recurring: null },
    { ...growth, recurring: { ...growth.recurring, interval: 'year' } },
    { ...growth, recurring: { ...growth.recurring, interval_count: 3 } },
    { ...growth, recurring: { ...growth.recurring, usage_type: 'metered' } },
  ])
    assert.equal(script.isGrowthPrice(price), isGrowthPrice(price as never), JSON.stringify(price))
})

test('the price script creates exactly what the app will sell', () => {
  const script = readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'scripts', 'stripe-ensure-growth-price.mjs'),
    'utf8'
  )
  assert.match(script, new RegExp(`GROWTH_UNIT_AMOUNT = ${4900}`))
  assert.match(script, /currency: 'usd'/)
  assert.match(script, /recurring: \{ interval: 'month' \}/)
})

test('the integration identifier is the prefix plus 8 lowercase letters', () => {
  assert.match(integrationIdentifier(), /^gf-growth-checkout-[a-z]{8}$/)
  assert.equal(
    integrationIdentifier(() => 0),
    'gf-growth-checkout-aaaaaaaa'
  )
})

test('stripeSecretKey: production uses ONLY a live key, never the sandbox fallback; elsewhere the integration key', () => {
  const both = { STRIPE_LIVE_SECRET_KEY: ' rk_live_x ', STRIPE_SECRET_KEY: 'sk_test_y' }
  assert.equal(stripeSecretKey({ ...both, VERCEL_ENV: 'production' }), 'rk_live_x')
  assert.equal(stripeSecretKey({ ...both, VERCEL_ENV: 'preview' }), 'sk_test_y')
  assert.equal(stripeSecretKey(both), 'sk_test_y')
  // Production with no live key, an empty one, or a test key under the live name: no key at all → the routes fail closed.
  assert.equal(stripeSecretKey({ VERCEL_ENV: 'production', STRIPE_SECRET_KEY: 'sk_test_y' }), undefined)
  assert.equal(
    stripeSecretKey({
      VERCEL_ENV: 'production',
      STRIPE_LIVE_SECRET_KEY: '  ',
      STRIPE_SECRET_KEY: 'sk_test_y',
    }),
    undefined
  )
  assert.equal(stripeSecretKey({ VERCEL_ENV: 'production', STRIPE_LIVE_SECRET_KEY: 'rk_test_z' }), undefined)
  assert.equal(
    stripeSecretKey({ VERCEL_ENV: 'production', STRIPE_LIVE_SECRET_KEY: 'sk_live_w' }),
    'sk_live_w'
  )
})

// S4.3 follow-ups (verifier, #412) — the money events that need a person, and the trouble the owner is shown.
const growthSub = (status: string) => ({ status, priceLookupKeys: [GROWTH_PRICE_LOOKUP_KEY] })

test('paymentTrouble: unpaid beats past_due, and only on the Growth price', () => {
  assert.equal(paymentTrouble([growthSub('active')]), null)
  assert.equal(paymentTrouble([growthSub('past_due')]), 'past_due')
  assert.equal(paymentTrouble([growthSub('unpaid')]), 'unpaid')
  assert.equal(paymentTrouble([growthSub('past_due'), growthSub('unpaid')]), 'unpaid')
  assert.equal(paymentTrouble([{ status: 'unpaid', priceLookupKeys: ['someone_elses_price'] }]), null)
  assert.equal(paymentTrouble([]), null)
})

test('every alerted event type has a line; any other type has none', () => {
  for (const type of ALERTED_EVENT_TYPES) assert.ok(billingAlert({ type, eventId: 'evt_1' }), type)
  for (const type of ['customer.subscription.updated', 'invoice.paid', 'charge.succeeded'])
    assert.equal(billingAlert({ type, eventId: 'evt_1' }), null, type)
})

test('a failed payment names the money, the ids and what Stripe does next', () => {
  const retrying = billingAlert({
    type: 'invoice.payment_failed',
    eventId: 'evt_9',
    customerId: 'cus_A',
    subscriptionId: 'sub_A',
    amount: 4900,
    currency: 'usd',
    attempt: 2,
    nextAttemptAt: Date.UTC(2026, 10, 3, 14, 5) / 1000,
    workspaceId: 'ws-1',
  })!
  assert.match(retrying, /49\.00 USD/)
  assert.match(retrying, /sub_A/)
  assert.match(retrying, /customer cus_A, workspace ws-1/)
  assert.match(retrying, /attempt 2/)
  assert.match(retrying, /retries 2026-11-03 14:05 UTC/)
  assert.match(retrying, /evt_9/)
  const last = billingAlert({ type: 'invoice.payment_failed', eventId: 'evt_9', nextAttemptAt: null })!
  assert.match(last, /will not retry/)
  assert.match(last, /no workspace of ours/)
  assert.match(last, /an unknown amount/)
})

test('a dispute, a refund and a fraud warning each name the charge', () => {
  const dispute = billingAlert({
    type: 'charge.dispute.created',
    eventId: 'e',
    chargeId: 'ch_1',
    amount: 4900,
    currency: 'usd',
    reason: 'fraudulent',
  })!
  assert.match(dispute, /ch_1/)
  assert.match(dispute, /fraudulent/)
  assert.match(dispute, /49\.00 USD/)
  assert.match(
    billingAlert({ type: 'charge.refunded', eventId: 'e', chargeId: 'ch_2', amount: 100, currency: 'usd' })!,
    /1\.00 USD refunded on charge ch_2/
  )
  assert.match(
    billingAlert({
      type: 'radar.early_fraud_warning.created',
      eventId: 'e',
      chargeId: 'ch_3',
      reason: 'card_never_received',
    })!,
    /ch_3 \(card_never_received\)/
  )
})
