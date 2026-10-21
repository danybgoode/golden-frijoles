// landing-launch-experiment · S4.3 follow-up (verifier r7, #412) — Stripe's live Growth subscriptions against the workspaces
// on Growth, as one pure comparison so the unit layer pins every finding. scripts/stripe-reconcile-growth.mjs fetches both
// sides and prints what this returns.
//
// The case it exists for: two live Growth subscriptions on one customer, where the webhook's slot guard (rightly) gives the
// workspace only one, and the other is paid for nothing. Every finding names ids only, never a person.

export const GROWTH_PRICE_LOOKUP_KEY = 'gf_growth_monthly';

/** Statuses Stripe can still charge, or is charging: the ones a person may be paying for. */
const CHARGING = new Set(['active', 'trialing', 'past_due', 'unpaid']);

/**
 * @param {{ id: string, customer: string, status: string, priceLookupKeys: (string|null)[] }[]} subscriptions
 * @param {{ id: string, plan: string, customer: string|null, subscription: string|null }[]} workspaces
 * @returns {{ kind: string, text: string }[]}
 */
export function reconcileGrowth(subscriptions, workspaces) {
  const findings = [];
  const growth = subscriptions.filter(
    (s) => s.priceLookupKeys.includes(GROWTH_PRICE_LOOKUP_KEY) && CHARGING.has(s.status)
  );
  const bySubscription = new Map(workspaces.filter((w) => w.subscription).map((w) => [w.subscription, w]));
  const byCustomer = new Map(workspaces.filter((w) => w.customer).map((w) => [w.customer, w]));

  // Only the ones being paid: an `unpaid` subscription beside a live one is owed, not double-charged.
  const perCustomer = new Map();
  for (const s of growth.filter((g) => g.status !== 'unpaid'))
    perCustomer.set(s.customer, [...(perCustomer.get(s.customer) ?? []), s.id]);
  for (const [customer, ids] of perCustomer)
    if (ids.length > 1)
      findings.push({
        kind: 'two-subscriptions',
        text: `customer ${customer} has ${ids.length} live Growth subscriptions (${ids.join(', ')}): one is paid for nothing — cancel and refund it`,
      });

  for (const s of growth) {
    const holder = bySubscription.get(s.id);
    if (holder) {
      // `unpaid` is a Free workspace by design (the invoice is owed); anything else charging should be Growth.
      if (s.status !== 'unpaid' && holder.plan !== 'growth')
        findings.push({
          kind: 'paid-not-growth',
          text: `subscription ${s.id} is ${s.status}, but workspace ${holder.id} is on ${holder.plan}`,
        });
      continue;
    }
    if (s.status === 'unpaid') continue;
    const owner = byCustomer.get(s.customer);
    findings.push(
      owner && !owner.subscription && owner.plan === 'free'
        ? {
            // The lost-webhook case: our checkout recorded the customer, Stripe charged it, and the subscription event
            // never moved the workspace. The fix is a replay, not a refund (verifier, #420).
            kind: 'paid-still-free',
            text: `subscription ${s.id} is ${s.status}, but workspace ${owner.id} is still on Free: resend its customer.subscription.* event from the Stripe Dashboard (the webhook missed it)`,
          }
        : owner
          ? {
              kind: 'paid-not-held',
              text: `subscription ${s.id} is ${s.status}, but workspace ${owner.id} holds ${owner.subscription ?? 'no subscription'}: cancel and refund it if it is a second charge`,
            }
          : {
              kind: 'no-workspace',
              text: `subscription ${s.id} (customer ${s.customer}) is ${s.status} and matches no workspace`,
            }
    );
  }

  const live = new Set(growth.filter((s) => s.status !== 'unpaid').map((s) => s.id));
  for (const w of workspaces)
    if (w.plan === 'growth' && !(w.subscription && live.has(w.subscription)))
      findings.push({
        kind: 'growth-not-paid',
        text: `workspace ${w.id} is on Growth, but ${w.subscription ? `its subscription ${w.subscription} is not live in Stripe` : 'it holds no subscription'}`,
      });
  return findings;
}
