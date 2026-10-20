#!/usr/bin/env node
// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25) — make sure the Stripe account behind STRIPE_SECRET_KEY sells
// Growth: one Product ("Golden Frijoles Growth") and one monthly USD price of $49 carrying the lookup key the checkout
// route reads (`apps/web/lib/stripe.ts → GROWTH_PRICE_LOOKUP_KEY`). Idempotent: an existing active price with that key is
// reported and nothing is created. One Product per plan (Stripe's guidance), so Checkout and invoices name the plan.
//
// Usage:   STRIPE_SECRET_KEY=… node scripts/stripe-ensure-growth-price.mjs [--dry-run]
// It prints whether the key is a TEST or LIVE key before doing anything, and never prints the key.
import Stripe from 'stripe';
import { isMain } from './lib/is-main.mjs';

export const GROWTH_PRICE_LOOKUP_KEY = 'gf_growth_monthly';
export const GROWTH_UNIT_AMOUNT = 4900;

export async function main(argv = process.argv.slice(2), env = process.env) {
  const key = env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    process.stderr.write('stripe-ensure-growth-price: STRIPE_SECRET_KEY is not set.\n');
    return 2;
  }
  const mode = /_live_/.test(key) ? 'LIVE' : /_test_/.test(key) ? 'TEST' : 'UNKNOWN';
  const dryRun = argv.includes('--dry-run');
  process.stdout.write(`stripe-ensure-growth-price: ${mode} account${dryRun ? ' (dry run)' : ''}\n`);
  const stripe = new Stripe(key, { apiVersion: '2026-09-30.endive' });

  const existing = await stripe.prices.list({
    lookup_keys: [GROWTH_PRICE_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) {
    const price = existing.data[0];
    const described = `${price.id} · ${price.unit_amount} ${price.currency}/${price.recurring?.interval_count ?? '?'} ${price.recurring?.interval ?? 'one-off'} · lookup ${GROWTH_PRICE_LOOKUP_KEY}`;
    // The app sells only exactly this (apps/web/lib/billing-decision.ts → isGrowthPrice); a key on anything else is a
    // misconfiguration to fix in the Dashboard, never "already there" (codex r4, #412).
    const exact =
      price.unit_amount === GROWTH_UNIT_AMOUNT &&
      price.currency === 'usd' &&
      price.recurring?.interval === 'month' &&
      price.recurring.interval_count === 1 &&
      (price.recurring.usage_type ?? 'licensed') === 'licensed';
    if (!exact) {
      process.stderr.write(
        `stripe-ensure-growth-price: WRONG price under the lookup key: ${described}. Checkout refuses it; move the key to a $49.00 USD/month price.\n`
      );
      return 1;
    }
    process.stdout.write(`already there: ${described}\n`);
    return 0;
  }
  if (dryRun) {
    process.stdout.write(
      `would create: Product "Golden Frijoles Growth" + $49.00 USD/month, lookup ${GROWTH_PRICE_LOOKUP_KEY}\n`
    );
    return 0;
  }
  const product = await stripe.products.create({
    name: 'Golden Frijoles Growth',
    description: 'Unlimited products, a 2,000,000-event monthly pool, for one workspace.',
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: GROWTH_UNIT_AMOUNT,
    recurring: { interval: 'month' },
    lookup_key: GROWTH_PRICE_LOOKUP_KEY,
  });
  process.stdout.write(
    `created: ${product.id} · ${price.id} · $49.00 USD/month · lookup ${GROWTH_PRICE_LOOKUP_KEY}\n`
  );
  return 0;
}

if (isMain(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      process.stderr.write(`stripe-ensure-growth-price: ${err instanceof Error ? err.message : err}\n`);
      process.exit(1);
    }
  );
}
