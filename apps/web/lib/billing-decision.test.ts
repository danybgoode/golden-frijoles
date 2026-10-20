// landing-launch-experiment · Sprint 4, Story 4.3 (epic D26) — what a Stripe event does to a plan.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  GROWTH_PRICE_LOOKUP_KEY,
  decideBillingAction,
  holdsGrowthSubscription,
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

test('a subscription on any other price grants nothing (a Payment Link, another product)', () => {
  assert.equal(
    decideBillingAction(sub('customer.subscription.created', { priceLookupKeys: [] })).kind,
    'none'
  )
  assert.equal(
    decideBillingAction(sub('customer.subscription.created', { priceLookupKeys: ['someone_elses_price'] }))
      .kind,
    'none'
  )
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

test('the integration identifier is the prefix plus 8 lowercase letters', () => {
  assert.match(integrationIdentifier(), /^gf-growth-checkout-[a-z]{8}$/)
  assert.equal(
    integrationIdentifier(() => 0),
    'gf-growth-checkout-aaaaaaaa'
  )
})
