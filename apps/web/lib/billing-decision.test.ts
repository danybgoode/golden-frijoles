// landing-launch-experiment · Sprint 4, Story 4.3 (epic D26) — what a Stripe event does to a plan.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decideBillingAction, integrationIdentifier, planForSubscriptionStatus } from './billing-decision.ts'

const WS = '9e58bc7d-a0a8-43c9-89a2-c544cab854f2'
const paid = {
  type: 'checkout.session.completed' as const,
  mode: 'subscription',
  paymentStatus: 'paid',
  clientReferenceId: WS,
  customerId: 'cus_123',
  subscriptionId: 'sub_123',
}

test('a paid subscription checkout links OUR workspace to its customer, on Growth', () => {
  assert.deepEqual(decideBillingAction(paid), {
    kind: 'link',
    workspaceId: WS,
    customerId: 'cus_123',
    subscriptionId: 'sub_123',
  })
  assert.equal(
    decideBillingAction({ ...paid, type: 'checkout.session.async_payment_succeeded' }).kind,
    'link'
  )
})

test('an unpaid, non-subscription or unattributed checkout changes nothing', () => {
  for (const [name, facts] of [
    ['async payment still pending', { ...paid, paymentStatus: 'unpaid' }],
    ['a one-time payment', { ...paid, mode: 'payment' }],
    ['no workspace', { ...paid, clientReferenceId: null }],
    ['a workspace id that is not ours to name', { ...paid, clientReferenceId: 'robert"); drop table' }],
    ['no customer', { ...paid, customerId: null }],
    ['a customer id that is not Stripe-shaped', { ...paid, customerId: 'cus_x),plan.eq.free' }],
  ] as const)
    assert.equal(decideBillingAction(facts).kind, 'none', name)
})

test('the subscription lifecycle sets the plan through the customer, never through metadata', () => {
  const sub = { customerId: 'cus_123', subscriptionId: 'sub_123' }
  assert.deepEqual(decideBillingAction({ type: 'customer.subscription.updated', status: 'active', ...sub }), {
    kind: 'set-plan',
    customerId: 'cus_123',
    plan: 'growth',
    subscriptionId: 'sub_123',
  })
  assert.equal(
    (
      decideBillingAction({ type: 'customer.subscription.deleted', status: 'active', ...sub }) as {
        plan: string
      }
    ).plan,
    'free',
    'deleted is Free whatever the last status said'
  )
  assert.equal(
    (
      decideBillingAction({ type: 'customer.subscription.updated', status: 'unpaid', ...sub }) as {
        plan: string
      }
    ).plan,
    'free'
  )
  assert.equal(
    decideBillingAction({ type: 'customer.subscription.updated', status: 'incomplete', ...sub }).kind,
    'none'
  )
  assert.equal(
    decideBillingAction({
      type: 'customer.subscription.updated',
      status: 'active',
      customerId: null,
      subscriptionId: null,
    }).kind,
    'none'
  )
})

test('a cancel scheduled for period end keeps Growth until Stripe deletes the subscription', () => {
  // cancel_at_period_end leaves status `active`; only `customer.subscription.deleted` (at period end) moves to Free.
  assert.equal(planForSubscriptionStatus('active'), 'growth')
  assert.equal(planForSubscriptionStatus('past_due'), 'growth')
  assert.equal(planForSubscriptionStatus('canceled'), 'free')
  assert.equal(planForSubscriptionStatus('incomplete'), null)
  assert.equal(planForSubscriptionStatus(null), null)
})

test('events we do not act on are recorded, not applied', () => {
  for (const type of [
    'charge.dispute.created',
    'charge.refunded',
    'radar.early_fraud_warning.created',
    'invoice.paid',
  ])
    assert.equal(decideBillingAction({ type }).kind, 'none', type)
})

test('the integration identifier is the prefix plus 8 lowercase letters', () => {
  assert.match(integrationIdentifier(), /^gf-growth-checkout-[a-z]{8}$/)
  assert.equal(
    integrationIdentifier(() => 0),
    'gf-growth-checkout-aaaaaaaa'
  )
})
