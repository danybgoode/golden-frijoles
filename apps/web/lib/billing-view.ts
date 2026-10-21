// landing-launch-experiment · Sprint 4 (epic D27, D28's order) — what the Plan & billing page says, as pure functions so the
// unit layer pins every answer. The page (app/app/billing/page.tsx) reads the caller's OWN workspace and passes its facts
// in; nothing here reads a request, a database or Stripe.

export type BillingFacts = {
  plan: string
  productLimit: number | null
  monthlyEventPool: number | null
  hasStripeCustomer: boolean
  checkoutOn: boolean
  /** Stripe's word on the customer's Growth subscription (lib/billing-decision.ts → paymentTrouble), asked when the page
   *  renders; null when all is well, when Stripe does not know the workspace, or when the ask failed. */
  trouble?: 'past_due' | 'unpaid' | null
}

export type Tile = { value: string; label: string }

export type BillingView = {
  plan: Tile
  products: Tile
  events: Tile
  /** "Get Growth": a Free workspace, while the checkout switch is on, unless an unpaid Growth subscription would make it a
   *  second one. */
  canBuy: boolean
  /** "Manage billing": any workspace Stripe knows, whatever its plan, so a payer can always cancel (D27). */
  canManage: boolean
  /** Free with the switch off: say when Growth can be bought instead of showing a button that 404s. A failed payment: say
   *  what Stripe does next and what to do about it. */
  note: string | null
  /** A failed payment is a warning; "not on sale yet" is not. */
  noteTone: 'info' | 'warn'
}

const PLANS: Record<string, Tile> = {
  free: { value: 'Free', label: 'plan' },
  growth: { value: 'Growth', label: 'plan, $49 a month' },
  comped: { value: 'Comped', label: 'plan, granted by Golden Frijoles' },
}

function count(n: number): string {
  return n.toLocaleString('en-US')
}

/** What the owner is told about a failed payment. Stripe also emails them, if its failed-payment emails are on. */
export const TROUBLE_NOTES = {
  past_due:
    'Your last payment for Growth failed. Stripe will try again; update your card in Manage billing so the workspace keeps Growth.',
  unpaid:
    'An invoice for Growth is unpaid, so this workspace is back on Free. Pay it from Manage billing and Growth comes back; buying again would start a second subscription.',
} as const

export function billingView(facts: BillingFacts): BillingView {
  const { plan, productLimit, monthlyEventPool, hasStripeCustomer, checkoutOn } = facts
  // "Back on Free" is only true on Free: a comped workspace, or one on Growth through another subscription, is not told it.
  const trouble = facts.trouble === 'unpaid' && plan !== 'free' ? null : (facts.trouble ?? null)
  const canBuy = plan === 'free' && checkoutOn && trouble !== 'unpaid'
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
    note: trouble
      ? TROUBLE_NOTES[trouble]
      : plan === 'free' && !checkoutOn
        ? 'Growth is not on sale yet. Nothing here can charge you; this page offers it the day it opens.'
        : null,
    noteTone: trouble ? 'warn' : 'info',
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
  // Checkout's own failure can follow a payment made in another tab (the expire of a session that was just paid throws),
  // and Stripe's errors do not say whether money moved: so this never claims nothing was charged (verifier, #414).
  failed: {
    tone: 'warn',
    text: 'Checkout could not start. If you just paid in another tab, Growth appears here within a minute: refresh before trying again.',
  },
  unpaid: {
    tone: 'warn',
    text: 'This workspace has an unpaid Growth invoice. Nothing was charged: pay it from Manage billing instead, and Growth comes back.',
  },
  'portal-failed': { tone: 'warn', text: 'We could not open billing. Nothing changed; try again.' },
  'no-workspace': {
    tone: 'warn',
    text: 'We could not find a workspace you own. Only the person who created a workspace can buy or manage its plan.',
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

/** S4.4 (D28) — what the landing's Growth tier offers, on A and B alike. Signed in: the POST form to checkout (the route
 *  resolves the workspace itself, and lands every outcome on Plan & billing). Signed out: sign-up first — `/signup` takes no
 *  `next`, so the route's own signed-out answer would lose the visitor's place (codex r4, #412). With the checkout switch
 *  off, Growth is paused, not hidden: the tier keeps its price and says so. No `/signup` either: the page's waitlist. */
export type GrowthCta = 'checkout' | 'signup' | 'paused' | 'waitlist'
export function growthCta(facts: { checkoutOn: boolean; signedIn: boolean; signupOn: boolean }): GrowthCta {
  if (facts.checkoutOn && facts.signedIn) return 'checkout'
  if (!facts.signupOn) return 'waitlist'
  return facts.checkoutOn ? 'signup' : 'paused'
}

/** The sentence under the Growth tier's button, for each answer above. */
export const GROWTH_CTA_NOTE: Record<GrowthCta, string> = {
  checkout: 'Billed monthly through Stripe. Cancel any time from Plan & billing.',
  signup:
    'Create your free account, then upgrade from Plan & billing. Billed monthly through Stripe; cancel any time.',
  paused:
    'Growth is paused for new subscriptions right now. Start free; your workspace can upgrade when it reopens.',
  waitlist: 'Growth opens to new accounts with sign-up. Join the waitlist to hear when.',
}
