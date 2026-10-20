import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { getStripe } from '@/lib/stripe'
import { ownWorkspaceForBilling } from '@/lib/billing'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D27) — "Manage billing": Stripe's own portal for the caller's OWN
// workspace's customer. The portal is the only cancel path; a cancel there ends the subscription at period end and the
// webhook moves the workspace to Free when Stripe deletes it. NOT gated by `billing.checkout_enabled` (codex, #412):
// switching new checkouts off must never stop a paying customer from cancelling. A workspace with no Stripe customer is
// sent to pricing; nothing else is exposed.
export const dynamic = 'force-dynamic'

export async function POST() {
  const site = getSiteUrl()
  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login?next=/app', site), 303)
  const workspace = await ownWorkspaceForBilling(user.id)
  if (!workspace?.stripeCustomerId) return NextResponse.redirect(new URL('/#pricing', site), 303)
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ ok: false, error: 'Billing is not configured.' }, { status: 503 })
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: new URL('/app', site).toString(),
    })
    return NextResponse.redirect(session.url, 303)
  } catch (err) {
    console.error('[billing/portal] failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Could not open billing. Try again.' }, { status: 502 })
  }
}
