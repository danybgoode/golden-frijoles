import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { isBillingCheckoutEnabled } from '@/lib/flags'
import { getStripe, GROWTH_PRICE_LOOKUP_KEY } from '@/lib/stripe'
import { claimCheckout, ownWorkspaceForBilling, rememberStripeCustomer } from '@/lib/billing'
import { integrationIdentifier } from '@/lib/billing-decision'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25) — "Get Growth": a POST (a form button, never a link: a
// prefetch, crawler or <img> must never create a Stripe customer — codex, #412) that sends the signed-in owner to Stripe
// Checkout for THEIR OWN workspace, or to sign in first. A redirect rather than a page: no new console surface.
//
// Every id that matters is resolved here, on the server: the workspace from the session's user (created AND owned, in
// lib/billing.ts), and its Stripe customer, recorded HERE before Stripe is involved. That customer id is how the webhook
// finds the workspace later (lib/billing-decision.ts: only subscription events move a plan, never a session field), so
// nothing a browser can set ever names a workspace. Nothing from the request body or query is used.
export const dynamic = 'force-dynamic'

export async function POST() {
  // FIRST: while the switch is off the route does not exist, exactly like every other gated surface.
  if (!(await isBillingCheckoutEnabled()))
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
  const site = getSiteUrl()

  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login?next=/#pricing', site), 303)

  const workspace = await ownWorkspaceForBilling(user.id)
  if (!workspace) return NextResponse.redirect(new URL('/app?billing=no-workspace', site), 303)
  // Growth and comped already have everything Growth sells; a second subscription would charge twice.
  if (workspace.plan !== 'free') return NextResponse.redirect(new URL('/app?billing=already', site), 303)

  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 503 })
  // One checkout at a time for this workspace (lib/billing.ts → claimCheckout); the loser is told, never given a second
  // payable session.
  if (!(await claimCheckout(workspace.id)))
    return NextResponse.json(
      { ok: false, error: 'A checkout is already starting for this workspace.' },
      { status: 409 }
    )

  try {
    const prices = await stripe.prices.list({
      lookup_keys: [GROWTH_PRICE_LOOKUP_KEY],
      active: true,
      limit: 1,
    })
    const price = prices.data[0]
    if (!price) {
      console.error('[billing/checkout] no active price with lookup key', GROWTH_PRICE_LOOKUP_KEY)
      return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 503 })
    }

    let customerId = workspace.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { workspace_id: workspace.id },
      })
      await rememberStripeCustomer(workspace.id, customer.id)
      // Re-read: a concurrent checkout may have recorded ITS customer first; use the one the workspace holds.
      const held = (await ownWorkspaceForBilling(user.id))?.stripeCustomerId
      // Fail closed: a workspace that holds no customer after the write is not one to charge (codex, #412).
      if (!held)
        return NextResponse.json(
          { ok: false, error: 'Could not start checkout. Try again.' },
          { status: 502 }
        )
      customerId = held
    }

    // Two tabs must not become two subscriptions (verifier, #412): this customer's other OPEN sessions are expired first,
    // so at most one can be paid. (The webhook's subscription slot is the second guard.)
    const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 20 })
    for (const stale of open.data) await stripe.checkout.sessions.expire(stale.id)

    // Never `payment_method_types` (Stripe's guidance): the Dashboard decides which methods are offered.
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: workspace.id,
      subscription_data: { metadata: { workspace_id: workspace.id } },
      success_url: new URL('/app?billing=success', site).toString(),
      cancel_url: new URL('/#pricing', site).toString(),
      integration_identifier: integrationIdentifier(),
    } as Parameters<typeof stripe.checkout.sessions.create>[0])
    if (!session.url) throw new Error('Checkout session has no url')
    return NextResponse.redirect(session.url, 303)
  } catch (err) {
    console.error('[billing/checkout] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Could not start checkout. Try again.' }, { status: 502 })
  }
}
