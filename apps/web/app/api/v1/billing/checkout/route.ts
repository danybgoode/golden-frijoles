import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { isBillingCheckoutEnabled } from '@/lib/flags'
import { getStripe, GROWTH_PRICE_LOOKUP_KEY } from '@/lib/stripe'
import { ownWorkspaceForBilling, rememberStripeCustomer } from '@/lib/billing'
import { integrationIdentifier } from '@/lib/billing-decision'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25) — "Get Growth": a GET that sends the signed-in owner to Stripe
// Checkout for THEIR OWN workspace, or to sign in first. A redirect rather than a page: no new console surface, and the
// pricing CTA can be a plain link. A cross-site GET can only send someone to a Stripe page they then choose to pay on.
//
// Every id that matters is resolved here, on the server: the workspace from the session's user (created AND owned, in
// lib/billing.ts), and it travels to Stripe as `client_reference_id` — the one field the webhook trusts to name a
// workspace, because only this route writes it. Nothing from the request body or query is used.
export const dynamic = 'force-dynamic'

export async function GET() {
  // FIRST: while the switch is off the route does not exist, exactly like every other gated surface.
  if (!(await isBillingCheckoutEnabled()))
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
  const site = getSiteUrl()

  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login?next=/api/v1/billing/checkout', site), 303)

  const workspace = await ownWorkspaceForBilling(user.id)
  if (!workspace) return NextResponse.redirect(new URL('/app?billing=no-workspace', site), 303)
  // Growth and comped already have everything Growth sells; a second subscription would charge twice.
  if (workspace.plan !== 'free') return NextResponse.redirect(new URL('/app?billing=already', site), 303)

  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 503 })

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
      customerId = (await ownWorkspaceForBilling(user.id))?.stripeCustomerId ?? customer.id
    }

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
