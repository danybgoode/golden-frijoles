import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { isBillingCheckoutEnabled } from '@/lib/flags'
import { getStripe } from '@/lib/stripe'
import { ownWorkspaceForBilling } from '@/lib/billing'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D27) — "Manage billing": Stripe's own portal for the caller's OWN
// workspace's customer. The portal is the only cancel path; a cancel there ends the subscription at period end and the
// webhook moves the workspace to Free when Stripe deletes it. Same gate as checkout.
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isBillingCheckoutEnabled()))
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 })
  const site = getSiteUrl()
  const user = await getSessionUser()
  if (!user) return NextResponse.redirect(new URL('/login?next=/api/v1/billing/portal', site), 303)
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
