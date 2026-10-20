import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import type { BillingAction } from './billing-decision'

// landing-launch-experiment · Sprint 4, Story 4.3 (epic D25–D27) — the billing reads and writes, each pinned to ONE workspace.
//
// Tenancy: checkout and the portal act on the CALLER's own workspace — the one they created AND own — resolved here from
// the session's user id, never from the request. The webhook acts on the workspace OUR server named when it created the
// Checkout session, or later on the one workspace holding the Stripe customer (`stripe_customer_id` is unique). A comped
// workspace is never touched by a webhook: a grant is not something a payment event can take away.

export type BillingWorkspace = { id: string; plan: string; stripeCustomerId: string | null }

/** The workspace `userId` created and owns, or null. Two checks, because creation alone is not ownership. */
export async function ownWorkspaceForBilling(userId: string): Promise<BillingWorkspace | null> {
  const supabase = getSupabaseServiceClient()
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, plan, stripe_customer_id')
    .eq('created_by', userId)
    .maybeSingle()
  if (error || !workspace) return null
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id as string)
    .eq('user_id', userId)
    .maybeSingle()
  if (member?.role !== 'owner') return null
  return {
    id: workspace.id as string,
    plan: workspace.plan as string,
    stripeCustomerId: (workspace.stripe_customer_id as string | null) ?? null,
  }
}

/** How long one checkout's claim holds: longer than creating a session takes, short enough that a retry is not stuck. */
export const CHECKOUT_CLAIM_SECONDS = 30

/**
 * One checkout at a time per workspace (codex, #412): two concurrent requests could both expire the open sessions and then
 * both create one — two payable sessions, two subscriptions. A single conditional UPDATE is atomic, so exactly one request
 * wins the claim; the other is told a checkout is already starting. A later request (after the window) expires the
 * earlier session before creating its own, so at most one session is ever open.
 */
export async function claimCheckout(workspaceId: string, now = new Date()): Promise<boolean> {
  const cutoff = new Date(now.getTime() - CHECKOUT_CLAIM_SECONDS * 1000).toISOString()
  const { data, error } = await getSupabaseServiceClient()
    .from('workspaces')
    .update({ checkout_started_at: now.toISOString() })
    .eq('id', workspaceId)
    .or(`checkout_started_at.is.null,checkout_started_at.lt."${cutoff}"`)
    .select('id')
  if (error) throw new Error(`checkout claim failed: ${error.message}`)
  return (data?.length ?? 0) === 1
}

/** Records the workspace's Stripe customer the first time; a workspace that already has one keeps it. */
export async function rememberStripeCustomer(workspaceId: string, customerId: string): Promise<boolean> {
  const { error } = await getSupabaseServiceClient()
    .from('workspaces')
    .update({ stripe_customer_id: customerId })
    .eq('id', workspaceId)
    .is('stripe_customer_id', null)
  if (error) console.error('[billing] could not record the Stripe customer:', error.message)
  return !error
}

export async function billingEventSeen(eventId: string): Promise<boolean> {
  const { data, error } = await getSupabaseServiceClient()
    .from('billing_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', eventId)
    .maybeSingle()
  if (error) throw new Error(`billing_events read failed: ${error.message}`)
  return data !== null
}

export async function recordBillingEvent(
  eventId: string,
  type: string,
  workspaceId: string | null
): Promise<void> {
  const { error } = await getSupabaseServiceClient()
    .from('billing_events')
    .upsert(
      { stripe_event_id: eventId, type, workspace_id: workspaceId },
      { onConflict: 'stripe_event_id', ignoreDuplicates: true }
    )
  if (error) throw new Error(`billing_events write failed: ${error.message}`)
}

/** Whether any workspace holds this Stripe customer — to tell "an event about nobody of ours" from "a stale event". */
export async function workspaceForCustomer(
  customerId: string
): Promise<{ id: string; subscriptionId: string | null } | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from('workspaces')
    .select('id, stripe_subscription_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  if (error) throw new Error(`workspace lookup failed: ${error.message}`)
  return data
    ? { id: data.id as string, subscriptionId: (data.stripe_subscription_id as string | null) ?? null }
    : null
}

/**
 * Applies a decided action to the ONE workspace holding the customer, never a comped one, and only forward in event time.
 * Growth binds to an empty or the SAME subscription slot (a second subscription cannot take the slot); Free applies only to
 * the subscription the workspace holds (another subscription's deletion cannot demote it). Idempotent: it sets values.
 * Returns the workspace it changed, or null when the guards left it alone. Throws on a database error (→ 500, Stripe retries).
 */
export async function applyBillingAction(action: BillingAction): Promise<string | null> {
  if (action.kind === 'none') return null
  const supabase = getSupabaseServiceClient()
  let query = supabase
    .from('workspaces')
    .update({
      plan: action.plan,
      stripe_subscription_id: action.plan === 'growth' ? action.subscriptionId : null,
      stripe_subscription_event_at: action.eventAt,
    })
    .eq('stripe_customer_id', action.customerId)
    .neq('plan', 'comped')
    .or(`stripe_subscription_event_at.is.null,stripe_subscription_event_at.lte."${action.eventAt}"`)
  query =
    action.plan === 'growth'
      ? query.or(`stripe_subscription_id.is.null,stripe_subscription_id.eq.${action.subscriptionId}`)
      : query.eq('stripe_subscription_id', action.subscriptionId)
  const { data, error } = await query.select('id')
  if (error) throw new Error(`billing plan update failed: ${error.message}`)
  return (data?.[0]?.id as string | undefined) ?? null
}
