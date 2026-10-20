import 'server-only'
import Stripe from 'stripe'
import { stripeSecretKey } from './billing-decision'

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
