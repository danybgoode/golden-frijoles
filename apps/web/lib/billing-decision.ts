// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25–D27) — what a Stripe event does to a workspace's plan, as a
// pure function of the event's fields. The webhook route verifies the signature, extracts these fields and applies the
// answer; every rule about money that can be decided without I/O lives here, so the unit layer pins it.
//
// ── Only the subscription moves a plan (verifier, #412) ───────────────────────────────────────────────────────────────
// The workspace's Stripe customer is recorded by OUR checkout route, from the session's own user, before Stripe is ever
// involved. So the plan follows `customer.subscription.*` events alone: they carry the subscription's status AND its price,
// and are resolved through the customer id (unique per workspace). A Checkout or Payment Link session can therefore never
// name a workspace, and a subscription on any other price grants nothing.
//
// ── Which subscription, and in what order ─────────────────────────────────────────────────────────────────────────────
// Stripe does not guarantee order and retries for days. The apply step (lib/billing.ts) only moves a workspace forward in
// event time (`stripe_subscription_event_at`), binds Growth only to an empty or the SAME subscription slot, and moves to
// Free only the subscription it holds — so a stale "active" after a deletion, or a second subscription's lifecycle, cannot
// change the plan.

/** The lookup key of the one price that sells Growth. The checkout route and the price script read this constant. */
export const GROWTH_PRICE_LOOKUP_KEY = 'gf_growth_monthly'

/** The Stripe fields the decision reads. Everything else in an event is ignored. */
export type BillingEventFacts =
  | {
      type:
        'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted'
      customerId: string | null
      subscriptionId: string | null
      status: string | null
      /** Every price lookup key on the subscription's items. */
      priceLookupKeys: string[]
      /** The event's `created`, seconds since the epoch. */
      createdAt: number
    }
  | { type: string }

export type BillingAction =
  /** Set the plan of the ONE workspace holding this Stripe customer, for this subscription, at this event time. */
  | { kind: 'set-plan'; customerId: string; plan: 'growth' | 'free'; subscriptionId: string; eventAt: string }
  /** Nothing to change; the event is still recorded. */
  | { kind: 'none'; reason: string }

// Stripe's id shapes. The apply step puts these inside PostgREST filters, so only an id of exactly this shape may ever
// reach one — even from a signature-verified event.
const CUSTOMER_ID = /^cus_[A-Za-z0-9]{1,250}$/
const SUBSCRIPTION_ID = /^sub_[A-Za-z0-9]{1,250}$/

/**
 * A subscription status → the plan it buys. Growth while Stripe still treats the subscription as live, including
 * `past_due` (Stripe is retrying the card; its dunning decides, not us) and a cancel scheduled for period end (still
 * paid for). Free once it can no longer be paid: canceled, unpaid, or never completed.
 */
export function planForSubscriptionStatus(status: string | null): 'growth' | 'free' | null {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return 'growth'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'free'
    default:
      // `incomplete` (first payment pending) and anything new: no change until Stripe says more.
      return null
  }
}

export function decideBillingAction(event: BillingEventFacts): BillingAction {
  if (
    event.type !== 'customer.subscription.created' &&
    event.type !== 'customer.subscription.updated' &&
    event.type !== 'customer.subscription.deleted'
  )
    return { kind: 'none', reason: `not acted on: ${event.type}` }
  const e = event as Extract<BillingEventFacts, { status: string | null }>
  if (!e.customerId || !CUSTOMER_ID.test(e.customerId))
    return { kind: 'none', reason: 'no customer on the subscription' }
  if (!e.subscriptionId || !SUBSCRIPTION_ID.test(e.subscriptionId))
    return { kind: 'none', reason: 'no subscription id' }
  if (!e.priceLookupKeys.includes(GROWTH_PRICE_LOOKUP_KEY))
    return { kind: 'none', reason: 'not the Growth price' }
  if (!Number.isSafeInteger(e.createdAt) || e.createdAt <= 0) return { kind: 'none', reason: 'no event time' }
  const plan = event.type === 'customer.subscription.deleted' ? 'free' : planForSubscriptionStatus(e.status)
  if (!plan) return { kind: 'none', reason: `subscription ${e.status ?? 'unknown'}` }
  return {
    kind: 'set-plan',
    customerId: e.customerId,
    plan,
    subscriptionId: e.subscriptionId,
    eventAt: new Date(e.createdAt * 1000).toISOString(),
  }
}

/** Stripe's `integration_identifier` label for our Checkout sessions: a fixed prefix plus 8 random letters (Stripe's
 *  guidance), so the Dashboard can compare this flow with any later one. */
export function integrationIdentifier(random: () => number = Math.random): string {
  const letters = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(random() * 26))).join(
    ''
  )
  return `gf-growth-checkout-${letters}`
}
