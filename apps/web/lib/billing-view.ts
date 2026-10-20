// landing-launch-experiment · Sprint 4 (epic D27, D28's order) — what the Plan & billing page says, as pure functions so the
// unit layer pins every answer. The page (app/app/billing/page.tsx) reads the caller's OWN workspace and passes its facts
// in; nothing here reads a request, a database or Stripe.

export type BillingFacts = {
  plan: string
  productLimit: number | null
  monthlyEventPool: number | null
  hasStripeCustomer: boolean
  checkoutOn: boolean
}

export type Tile = { value: string; label: string }

export type BillingView = {
  plan: Tile
  products: Tile
  events: Tile
  /** "Get Growth": a Free workspace, while the checkout switch is on. */
  canBuy: boolean
  /** "Manage billing": any workspace Stripe knows, whatever its plan, so a payer can always cancel (D27). */
  canManage: boolean
  /** Free with the switch off: say when Growth can be bought instead of showing a button that 404s. */
  note: string | null
}

const PLANS: Record<string, Tile> = {
  free: { value: 'Free', label: 'plan' },
  growth: { value: 'Growth', label: 'plan, $49 a month' },
  comped: { value: 'Comped', label: 'plan, granted by Golden Frijoles' },
}

function count(n: number): string {
  return n.toLocaleString('en-US')
}

export function billingView(facts: BillingFacts): BillingView {
  const { plan, productLimit, monthlyEventPool, hasStripeCustomer, checkoutOn } = facts
  const canBuy = plan === 'free' && checkoutOn
  return {
    plan: Object.hasOwn(PLANS, plan) ? PLANS[plan] : { value: plan, label: 'plan' },
    products:
      productLimit === null
        ? { value: 'Unlimited', label: 'products' }
        : { value: count(productLimit), label: 'products at most' },
    events:
      monthlyEventPool === null
        ? { value: 'No limit', label: 'on monthly events' }
        : { value: count(monthlyEventPool), label: 'events a month, shared by every product' },
    canBuy,
    canManage: hasStripeCustomer,
    note:
      plan === 'free' && !checkoutOn
        ? 'Growth is not on sale yet. Nothing here can charge you; this page offers it the day it opens.'
        : null,
  }
}

/** What checkout and the portal send back as `?billing=…`. Every outcome a person can land on says what happened to their
 *  money, in a sentence, never a JSON error page. */
export const BILLING_MESSAGES = {
  confirmed: { tone: 'info', text: 'Payment received: this workspace is on Growth.' },
  success: {
    tone: 'info',
    text: 'Payment received. Growth switches on as soon as Stripe confirms it, usually within a minute: refresh to see it.',
  },
  already: {
    tone: 'info',
    text: 'This workspace already has everything Growth includes, so nothing was charged.',
  },
  busy: {
    tone: 'warn',
    text: 'A checkout is already starting for this workspace. Give it a few seconds, then try again.',
  },
  unavailable: {
    tone: 'warn',
    text: 'Billing is not available right now. Nothing was charged; try again later.',
  },
  failed: { tone: 'warn', text: 'We could not reach Stripe. Nothing was charged; try again.' },
  'no-workspace': {
    tone: 'warn',
    text: 'Only the person who created this workspace can buy or manage its plan.',
  },
} as const satisfies Record<string, { tone: 'info' | 'warn'; text: string }>

export type BillingOutcome = keyof typeof BILLING_MESSAGES

/** Own keys only: `?billing=constructor` must not render a function's name as a sentence. Back from Stripe with the
 *  webhook already in, "refresh to see it" would be wrong: the page says Growth is on instead. */
export function billingMessage(
  outcome: string | string[] | undefined,
  plan?: string
): (typeof BILLING_MESSAGES)[BillingOutcome] | null {
  const key = Array.isArray(outcome) ? outcome[0] : outcome
  if (key === 'success' && plan === 'growth') return BILLING_MESSAGES.confirmed
  return key && Object.hasOwn(BILLING_MESSAGES, key) ? BILLING_MESSAGES[key as BillingOutcome] : null
}

/** Where checkout and the portal send a person back to, with what happened. */
export const BILLING_PAGE = '/app/billing'
export function billingHref(outcome?: BillingOutcome): string {
  return outcome ? `${BILLING_PAGE}?billing=${outcome}` : BILLING_PAGE
}
