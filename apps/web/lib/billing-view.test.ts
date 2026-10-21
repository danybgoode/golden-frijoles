// landing-launch-experiment · Sprint 4 — the Plan & billing page's answers (lib/billing-view.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  billingHref,
  billingMessage,
  billingView,
  GROWTH_CTA_NOTE,
  growthCta,
  TROUBLE_NOTES,
} from './billing-view.ts'

const free = { plan: 'free', productLimit: 10, monthlyEventPool: 200_000, hasStripeCustomer: false }

test('Free with checkout on: Get Growth, no portal until Stripe knows the workspace', () => {
  const view = billingView({ ...free, checkoutOn: true })
  assert.deepEqual(view.plan, { value: 'Free', label: 'plan' })
  assert.deepEqual(view.products, { value: '10', label: 'products at most' })
  assert.deepEqual(view.events, { value: '200,000', label: 'events a month, shared by every product' })
  assert.equal(view.canBuy, true)
  assert.equal(view.canManage, false)
  assert.equal(view.note, null)
})

test('Free with checkout off: no button that would 404, a note instead', () => {
  const view = billingView({ ...free, checkoutOn: false })
  assert.equal(view.canBuy, false)
  assert.match(view.note ?? '', /not on sale yet/)
})

test('Growth: never sold twice; the portal whatever the switch says (D27)', () => {
  for (const checkoutOn of [true, false]) {
    const view = billingView({
      plan: 'growth',
      productLimit: null,
      monthlyEventPool: 2_000_000,
      hasStripeCustomer: true,
      checkoutOn,
    })
    assert.deepEqual(view.plan, { value: 'Growth', label: 'plan, $49 a month' })
    assert.deepEqual(view.products, { value: 'Unlimited', label: 'products' })
    assert.equal(view.canBuy, false)
    assert.equal(view.canManage, true)
    assert.equal(view.note, null)
  }
})

test('Comped: no limits, nothing to buy', () => {
  const view = billingView({
    plan: 'comped',
    productLimit: null,
    monthlyEventPool: null,
    hasStripeCustomer: false,
    checkoutOn: true,
  })
  assert.equal(view.plan.value, 'Comped')
  assert.deepEqual(view.events, { value: 'No limit', label: 'on monthly events' })
  assert.equal(view.canBuy, false)
  assert.equal(view.canManage, false)
})

test('a Free workspace that once paid keeps the portal (its invoices, its card)', () => {
  assert.equal(billingView({ ...free, hasStripeCustomer: true, checkoutOn: false }).canManage, true)
})

test('billingMessage: known outcomes only, own keys only, first of a repeated param', () => {
  assert.equal(billingMessage('success')?.tone, 'info')
  assert.equal(billingMessage(['busy', 'success'])?.tone, 'warn')
  assert.equal(billingMessage('constructor'), null)
  assert.equal(billingMessage('nope'), null)
  assert.equal(billingMessage(undefined), null)
})

test('billingHref', () => {
  assert.equal(billingHref(), '/app/billing')
  assert.equal(billingHref('success'), '/app/billing?billing=success')
})

test('an unknown plan is shown as itself, and an inherited key is not a plan', () => {
  assert.equal(billingView({ ...free, plan: 'enterprise', checkoutOn: true }).plan.value, 'enterprise')
  assert.equal(billingView({ ...free, plan: 'constructor', checkoutOn: true }).plan.value, 'constructor')
})

test('back from Stripe: "switches on" while the webhook is pending, "is on Growth" once it landed', () => {
  assert.match(billingMessage('success', 'free')?.text ?? '', /refresh to see it/)
  assert.equal(billingMessage('success', 'growth')?.text, 'Payment received: this workspace is on Growth.')
})

test('no failure sentence denies a charge it cannot rule out (verifier, #414)', () => {
  assert.doesNotMatch(billingMessage('failed')?.text ?? '', /nothing was charged/i)
  assert.match(billingMessage('failed')?.text ?? '', /refresh before trying again/)
  assert.ok(billingMessage('portal-failed'))
})

test("the landing's Growth button (S4.4): checkout signed in, sign-up first signed out, paused when the switch is off", () => {
  assert.equal(growthCta({ checkoutOn: true, signedIn: true, signupOn: true }), 'checkout')
  assert.equal(growthCta({ checkoutOn: true, signedIn: true, signupOn: false }), 'checkout')
  assert.equal(growthCta({ checkoutOn: true, signedIn: false, signupOn: true }), 'signup')
  assert.equal(growthCta({ checkoutOn: false, signedIn: true, signupOn: true }), 'paused')
  assert.equal(growthCta({ checkoutOn: false, signedIn: false, signupOn: true }), 'paused')
  assert.equal(growthCta({ checkoutOn: true, signedIn: false, signupOn: false }), 'waitlist')
  assert.equal(growthCta({ checkoutOn: false, signedIn: false, signupOn: false }), 'waitlist')
})

test('no Growth note says billing is not live, and only the paused one says it cannot be bought', () => {
  for (const [state, note] of Object.entries(GROWTH_CTA_NOTE)) {
    assert.doesNotMatch(note, /not live|cannot be charged|nobody can be charged/i, state)
    assert.equal(/paused/.test(note), state === 'paused', state)
  }
})

test('a failed payment: past_due keeps Growth and says to update the card; unpaid blocks a second purchase', () => {
  const growth = { plan: 'growth', productLimit: null, monthlyEventPool: 2_000_000, hasStripeCustomer: true }
  const pastDue = billingView({ ...growth, checkoutOn: true, trouble: 'past_due' })
  assert.equal(pastDue.note, TROUBLE_NOTES.past_due)
  assert.equal(pastDue.canManage, true)
  const unpaid = billingView({ ...free, hasStripeCustomer: true, checkoutOn: true, trouble: 'unpaid' })
  assert.equal(unpaid.canBuy, false, 'a second checkout would be a second subscription')
  assert.equal(unpaid.canManage, true, 'the portal is how the invoice gets paid')
  assert.equal(unpaid.note, TROUBLE_NOTES.unpaid)
  assert.equal(unpaid.noteTone, 'warn')
  assert.equal(billingView({ ...free, checkoutOn: false }).noteTone, 'info')
  assert.equal(
    billingView({ ...free, hasStripeCustomer: true, checkoutOn: true, trouble: null }).canBuy,
    true
  )
  assert.equal(billingMessage('unpaid')?.tone, 'warn')
})

test('"back on Free" is said only on Free: a comped workspace with an old unpaid subscription is not told it', () => {
  const comped = {
    plan: 'comped',
    productLimit: null,
    monthlyEventPool: null,
    hasStripeCustomer: true,
    checkoutOn: true,
  }
  assert.equal(billingView({ ...comped, trouble: 'unpaid' }).note, null)
  assert.equal(billingView({ ...comped, trouble: 'past_due' }).note, TROUBLE_NOTES.past_due)
})
