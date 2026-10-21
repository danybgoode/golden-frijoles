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

/** The same guard for any other path that puts a customer id into a PostgREST filter. */
export function isCustomerId(value: string): boolean {
  return CUSTOMER_ID.test(value)
}

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

/** Trouble with a customer's Growth subscription that its owner must act on, from Stripe's own statuses: `past_due` (a payment
 *  failed and Stripe is retrying; the workspace keeps Growth) or `unpaid` (retries ran out; the workspace is on Free, and the
 *  subscription comes back the moment its invoice is paid). `unpaid` wins: it is the one that already cost them Growth. A
 *  second checkout while `unpaid` would be a second subscription (verifier r7, #412), so checkout refuses it. */
export type PaymentTrouble = 'past_due' | 'unpaid'
export function paymentTrouble(
  subscriptions: { status: string; priceLookupKeys: (string | null)[] }[]
): PaymentTrouble | null {
  const growth = subscriptions.filter((s) => s.priceLookupKeys.includes(GROWTH_PRICE_LOOKUP_KEY))
  if (growth.some((s) => s.status === 'unpaid')) return 'unpaid'
  if (growth.some((s) => s.status === 'past_due')) return 'past_due'
  return null
}

/** Why checkout refuses to open for a customer, from Stripe's own list: an UNPAID Growth subscription is paid, not
 *  replaced (a new checkout would be a second subscription), and a held one is already Growth. Null: sell. */
export function checkoutBlock(
  subscriptions: { status: string; priceLookupKeys: (string | null)[] }[]
): 'unpaid' | 'already' | null {
  if (paymentTrouble(subscriptions) === 'unpaid') return 'unpaid'
  if (holdsGrowthSubscription(subscriptions)) return 'already'
  return null
}

/** The money events that change no plan but need a person (verifier, #412; Stripe's go-live guidance). The webhook records
 *  them like any other and sends the operator one line each; the decision above never reads them. */
export const ALERTED_EVENT_TYPES = [
  'invoice.payment_failed',
  'charge.dispute.created',
  'charge.refunded',
  'radar.early_fraud_warning.created',
] as const

/** Only ids, amounts and Stripe's own codes: never a name or an email, since the alert leaves for Telegram. */
export type BillingAlertFacts = {
  type: string
  eventId: string
  customerId?: string | null
  subscriptionId?: string | null
  chargeId?: string | null
  /** Minor units (cents). */
  amount?: number | null
  currency?: string | null
  /** Stripe's code: the dispute's reason, or the early fraud warning's fraud type. */
  reason?: string | null
  attempt?: number | null
  /** Unix seconds; null when Stripe will not retry. */
  nextAttemptAt?: number | null
  workspaceId?: string | null
}

/** Stripe's zero-decimal currencies: their amounts are whole units, not cents. Growth sells in USD; another product's
 *  dispute or refund on the same account may not. */
const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
])

function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !currency) return 'an unknown amount'
  const code = currency.toLowerCase()
  return ZERO_DECIMAL.has(code)
    ? `${amount} ${code.toUpperCase()}`
    : `${(amount / 100).toFixed(2)} ${code.toUpperCase()}`
}

function utc(seconds: number): string | null {
  const date = new Date(seconds * 1000)
  return Number.isNaN(date.getTime()) ? null : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

/** The operator's one line for an alerted event, or null for every other type. */
export function billingAlert(f: BillingAlertFacts): string | null {
  const workspace = f.workspaceId ? `workspace ${f.workspaceId}` : 'no workspace of ours'
  const customer = f.customerId ? `customer ${f.customerId}, ` : ''
  switch (f.type) {
    case 'invoice.payment_failed':
      return `Payment failed: ${money(f.amount, f.currency)} for subscription ${f.subscriptionId ?? 'unknown'} (${customer}${workspace}), attempt ${f.attempt ?? '?'}. ${
        f.nextAttemptAt
          ? `Stripe retries ${utc(f.nextAttemptAt) ?? 'later'}; the owner sees it on Plan & billing.`
          : 'Stripe will not retry: the subscription goes unpaid and the workspace returns to Free.'
      } Event ${f.eventId}.`
    case 'charge.dispute.created':
      return `Dispute opened: ${money(f.amount, f.currency)} on charge ${f.chargeId ?? 'unknown'} (${f.reason ?? 'no reason given'}). Answer it in the Stripe Dashboard before its deadline. Event ${f.eventId}.`
    case 'charge.refunded':
      return `Refund: ${money(f.amount, f.currency)} refunded on charge ${f.chargeId ?? 'unknown'} (${customer}${workspace}). Check it was meant. Event ${f.eventId}.`
    case 'radar.early_fraud_warning.created':
      return `Early fraud warning on charge ${f.chargeId ?? 'unknown'} (${f.reason ?? 'no type given'}). Refunding it now usually prevents a dispute. Event ${f.eventId}.`
    default:
      return null
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
