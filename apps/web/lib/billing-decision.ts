// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25–D27) — what a Stripe event does to a workspace's plan, as a
// pure function of the event's fields. The webhook route verifies the signature, extracts these fields and applies the
// answer; every rule about money that can be decided without I/O lives here, so the unit layer pins it.
//
// ── Events map to workspaces through Stripe's own objects, not metadata (Stripe's guidance) ──────────────────────────
// The ONE place a workspace id enters is `checkout.session.completed`'s `client_reference_id`, which OUR server wrote when
// it created the session for the caller's own workspace (D25) — never the browser. That event links the workspace to its
// Stripe customer; every later event is resolved through the customer id, which is unique per workspace in the database.

export type Plan = 'free' | 'growth' | 'comped'

/** The Stripe fields the decision reads. Everything else in an event is ignored. */
export type BillingEventFacts =
  | {
      type: 'checkout.session.completed' | 'checkout.session.async_payment_succeeded'
      mode: string | null
      paymentStatus: string | null
      clientReferenceId: string | null
      customerId: string | null
      subscriptionId: string | null
    }
  | {
      type:
        'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted'
      customerId: string | null
      subscriptionId: string | null
      status: string | null
    }
  | { type: string }

export type BillingAction =
  /** Bind the workspace named by our own client_reference_id to its Stripe customer, on Growth. */
  | { kind: 'link'; workspaceId: string; customerId: string; subscriptionId: string | null }
  /** Set the plan of the ONE workspace holding this Stripe customer. */
  | { kind: 'set-plan'; customerId: string; plan: 'growth' | 'free'; subscriptionId: string | null }
  /** Nothing to change; the event is still recorded. */
  | { kind: 'none'; reason: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Stripe's id shapes. The apply step puts the customer id inside a PostgREST filter, so only an id of exactly this shape
// may ever reach it — even from a signature-verified event.
const CUSTOMER_ID = /^cus_[A-Za-z0-9]{1,250}$/
const SUBSCRIPTION_ID = /^sub_[A-Za-z0-9]{1,250}$/
const subscriptionOrNull = (id: string | null) => (id && SUBSCRIPTION_ID.test(id) ? id : null)

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
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const e = event as Extract<BillingEventFacts, { mode: string | null }>
    if (e.mode !== 'subscription') return { kind: 'none', reason: 'not a subscription checkout' }
    // An async method (a bank debit) completes the session before the money arrives; Growth waits for
    // `async_payment_succeeded`. `no_payment_required` covers a fully discounted first invoice.
    if (e.paymentStatus !== 'paid' && e.paymentStatus !== 'no_payment_required')
      return { kind: 'none', reason: `payment ${e.paymentStatus ?? 'unknown'}` }
    if (!e.clientReferenceId || !UUID.test(e.clientReferenceId))
      return { kind: 'none', reason: 'no workspace on the session' }
    if (!e.customerId || !CUSTOMER_ID.test(e.customerId))
      return { kind: 'none', reason: 'no customer on the session' }
    return {
      kind: 'link',
      workspaceId: e.clientReferenceId,
      customerId: e.customerId,
      subscriptionId: subscriptionOrNull(e.subscriptionId),
    }
  }
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const e = event as Extract<BillingEventFacts, { status: string | null }>
    if (!e.customerId || !CUSTOMER_ID.test(e.customerId))
      return { kind: 'none', reason: 'no customer on the subscription' }
    const plan = event.type === 'customer.subscription.deleted' ? 'free' : planForSubscriptionStatus(e.status)
    if (!plan) return { kind: 'none', reason: `subscription ${e.status ?? 'unknown'}` }
    return {
      kind: 'set-plan',
      customerId: e.customerId,
      plan,
      subscriptionId: subscriptionOrNull(e.subscriptionId),
    }
  }
  return { kind: 'none', reason: `not acted on: ${event.type}` }
}

/** Stripe's `integration_identifier` label for our Checkout sessions: a fixed prefix plus 8 random letters (Stripe's
 *  guidance), so the Dashboard can compare this flow with any later one. */
export function integrationIdentifier(random: () => number = Math.random): string {
  const letters = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(random() * 26))).join(
    ''
  )
  return `gf-growth-checkout-${letters}`
}
