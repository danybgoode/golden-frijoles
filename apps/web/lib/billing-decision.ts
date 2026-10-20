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
// Stripe does not guarantee order and retries for days. The apply step (lib/billing.ts → `apply_subscription_event`) keeps
// each subscription's LATEST state (`billing_subscription_states`: forward in event time, a same-second tie to Free, ended
// sticky) and sets the workspace from that record — Growth only into an empty or the SAME slot, Free only for the
// subscription held — so a stale "active", a Free delivered before `created`, or a second subscription cannot change it.

/** The lookup key of the one price that sells Growth. The checkout route and the price script read this constant. */
export const GROWTH_PRICE_LOOKUP_KEY = 'gf_growth_monthly'

/** What Growth costs: $49.00 USD, every month. A price under the lookup key that says anything else is never sold. */
export const GROWTH_PRICE = {
  unitAmount: 4900,
  currency: 'usd',
  interval: 'month',
  intervalCount: 1,
} as const

/**
 * Whether a Stripe price is exactly Growth's — the lookup key names a price, it does not vouch for it. A key moved onto a
 * wrong amount, currency or interval in the Dashboard must stop checkout, not silently charge it (codex r4, #412).
 */
export function isGrowthPrice(price: {
  unit_amount: number | null
  currency: string
  recurring: { interval: string; interval_count: number; usage_type?: string } | null
}): boolean {
  return (
    price.unit_amount === GROWTH_PRICE.unitAmount &&
    price.currency === GROWTH_PRICE.currency &&
    price.recurring?.interval === GROWTH_PRICE.interval &&
    price.recurring.interval_count === GROWTH_PRICE.intervalCount &&
    (price.recurring.usage_type ?? 'licensed') === 'licensed'
  )
}

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
  | {
      kind: 'set-plan'
      customerId: string
      plan: 'growth' | 'free'
      subscriptionId: string
      eventAt: string
      /** The subscription can never be live again (deleted, canceled, expired): recorded so Growth never binds it. */
      ended: boolean
    }
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
  if (!Number.isSafeInteger(e.createdAt) || e.createdAt <= 0) return { kind: 'none', reason: 'no event time' }
  const ended =
    event.type === 'customer.subscription.deleted' ||
    e.status === 'canceled' ||
    e.status === 'incomplete_expired'
  // Off the Growth price (never on it, or moved away): Free for THIS subscription. The apply step moves only a workspace
  // whose slot holds it, so a subscription on another price still grants nothing — and one moved off Growth takes back
  // exactly the Growth it held (codex r5, #412).
  const plan = !e.priceLookupKeys.includes(GROWTH_PRICE_LOOKUP_KEY)
    ? 'free'
    : ended
      ? 'free'
      : planForSubscriptionStatus(e.status)
  if (!plan) return { kind: 'none', reason: `subscription ${e.status ?? 'unknown'}` }
  return {
    kind: 'set-plan',
    customerId: e.customerId,
    plan,
    subscriptionId: e.subscriptionId,
    eventAt: new Date(e.createdAt * 1000).toISOString(),
    ended,
  }
}

/**
 * Whether a customer already holds a Growth subscription Stripe could still charge — the check the checkout route makes
 * against STRIPE (the source of truth) before opening a session, so a webhook that is late or retrying cannot let a second
 * one be sold (verifier r3, #412). `incomplete` counts: its first payment may still succeed.
 */
export function holdsGrowthSubscription(
  subscriptions: { status: string; priceLookupKeys: (string | null)[] }[]
): boolean {
  return subscriptions.some(
    (s) =>
      (planForSubscriptionStatus(s.status) === 'growth' || s.status === 'incomplete') &&
      s.priceLookupKeys.includes(GROWTH_PRICE_LOOKUP_KEY)
  )
}

/** Stripe's `integration_identifier` label for our Checkout sessions: a fixed prefix plus 8 random letters (Stripe's
 *  guidance), so the Dashboard can compare this flow with any later one. */
export function integrationIdentifier(random: () => number = Math.random): string {
  const letters = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(random() * 26))).join(
    ''
  )
  return `gf-growth-checkout-${letters}`
}

/** The Stripe key a deployment uses. Production uses ONLY `STRIPE_LIVE_SECRET_KEY` (a live restricted key, Production-scoped):
 *  the Stripe integration owns `STRIPE_SECRET_KEY` (one sandbox value across every environment, read-only in Vercel), and
 *  falling back to it would sell Growth for a test card and pin a sandbox customer on the workspace (verifier, #414). With
 *  no live key, production has no key, and every billing route fails closed ("unavailable"). Everywhere else the
 *  integration's key, so a live key in a local env file never makes dev or a preview charge a real card. */
export function stripeSecretKey(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.VERCEL_ENV === 'production') {
    const live = env.STRIPE_LIVE_SECRET_KEY?.trim()
    return live && /^(rk|sk)_live_/.test(live) ? live : undefined
  }
  return env.STRIPE_SECRET_KEY?.trim() || undefined
}
