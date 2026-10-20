import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { decideBillingAction, type BillingEventFacts } from '@/lib/billing-decision'
import { applyBillingAction, billingEventSeen, recordBillingEvent, workspaceForCustomer } from '@/lib/billing'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D26) — Stripe's webhook. The only path that changes a plan.
//
// Order, and why:
//   1. Verify the signature over the RAW body (Stripe's constant-time check, `STRIPE_WEBHOOK_SECRET`) before reading a
//      single field. No secret configured → 500, never "accept unsigned": fail closed.
//   2. Seen this event id before → 200, nothing done (Stripe redelivers; a replay must be a no-op).
//   3. Decide (pure, lib/billing-decision.ts) and apply (lib/billing.ts) — one workspace, never a comped one, only the
//      Growth price, only forward in event time, only the subscription the workspace holds.
//   4. Record the event id LAST. If applying throws, nothing is recorded and the 500 makes Stripe retry; the apply is a
//      set, not an increment, so a retry that races a slow first delivery cannot double anything.
//
// Not gated by `billing.checkout_enabled`: switching off new checkouts must never stop an existing subscription's
// cancellation or renewal from reaching the workspace.
export const dynamic = 'force-dynamic'

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

/** The fields the decision reads, from the event's own subscription object. Everything else is ignored. */
function factsOf(event: Stripe.Event): BillingEventFacts {
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    return {
      type: event.type,
      customerId: idOf(subscription.customer as string | { id: string } | null),
      subscriptionId: subscription.id ?? null,
      status: subscription.status ?? null,
      priceLookupKeys: (subscription.items?.data ?? [])
        .map((item) => item.price?.lookup_key)
        .filter((key): key is string => typeof key === 'string'),
      createdAt: event.created,
    }
  }
  return { type: event.type }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const stripe = getStripe()
  if (!secret || !stripe) {
    console.error(
      '[billing/webhook] STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY is not set; refusing every event'
    )
    return NextResponse.json({ ok: false, error: 'Webhook is not configured.' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ ok: false, error: 'Missing signature.' }, { status: 400 })
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch {
    // The same answer for a forged, tampered or stale signature: a caller learns nothing about which check failed.
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    if (await billingEventSeen(event.id)) return NextResponse.json({ ok: true, duplicate: true })
    const action = decideBillingAction(factsOf(event))
    let workspaceId = await applyBillingAction(action)
    if (action.kind === 'set-plan' && workspaceId === null) {
      // Two different things, told apart: a customer nobody of ours holds is LOUD (money with no workspace to give it to —
      // CODE-QUALITY #7); a known customer whose guards declined (a stale or second subscription) is the guards working.
      const holder = await workspaceForCustomer(action.customerId)
      if (!holder)
        console.error(`[billing/webhook] ${event.type} ${event.id}: Stripe customer matches NO workspace`)
      // A SECOND live Growth subscription on a workspace that already holds one: the slot guard (rightly) declined it, but
      // that customer is being charged for nothing — loud, so someone refunds it (verifier, #412).
      else if (
        action.plan === 'growth' &&
        holder.subscriptionId &&
        holder.subscriptionId !== action.subscriptionId
      )
        console.error(
          `[billing/webhook] ${event.type} ${event.id}: a second Growth subscription is being charged for workspace ${holder.id}; refund it`
        )
      workspaceId = holder?.id ?? null
    }
    await recordBillingEvent(event.id, event.type, workspaceId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[billing/webhook] failed; Stripe will retry:', err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: 'Could not process the event.' }, { status: 500 })
  }
}
