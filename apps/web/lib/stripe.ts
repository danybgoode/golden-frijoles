import 'server-only'
import Stripe from 'stripe'
import { paymentTrouble, stripeSecretKey, type PaymentTrouble } from './billing-decision'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25–D27) — the ONE Stripe client. Server-only: the secret key never
// reaches a browser bundle. Instantiated per call site through this function (Stripe's guidance: a client instance, never
// the deprecated module-level key), and `null` when the key is unset, so a route answers 503 instead of throwing.

/** Pinned so a Stripe-side default change can never silently change what our webhook receives. */
export const STRIPE_API_VERSION = '2026-09-30.endive'

/** The Growth price is found by its lookup key (lib/billing-decision.ts), not by an id in config: the same code reads the
 *  sandbox's price and, after the claim, the live account's — `scripts/stripe-ensure-growth-price.mjs` creates it. */
export { GROWTH_PRICE_LOOKUP_KEY } from './billing-decision'

export function getStripe(): Stripe | null {
  const key = stripeSecretKey()
  if (!key) return null
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion })
}

/** A customer's Growth subscriptions, as the pure checks read them: Stripe's status and the prices' lookup keys. */
export function subscriptionFacts(subscriptions: Stripe.Subscription[]) {
  return subscriptions.map((sub) => ({
    status: sub.status,
    priceLookupKeys: sub.items.data.map((item) => item.price.lookup_key),
  }))
}

/** For Plan & billing: whether the customer's Growth subscription has a failed payment, asked of Stripe (we keep no status
 *  of our own). Never throws: a failed ask shows no warning rather than breaking the page, and is logged. */
export async function growthPaymentTrouble(customerId: string): Promise<PaymentTrouble | null> {
  const stripe = getStripe()
  if (!stripe) return null
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 })
    return paymentTrouble(subscriptionFacts(subscriptions.data))
  } catch (err) {
    console.error(
      '[billing] could not read the subscription status:',
      err instanceof Error ? err.message : err
    )
    return null
  }
}
