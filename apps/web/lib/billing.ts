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

/**
 * Applies a decided action. Idempotent by construction (it sets a value, never increments one), so a replay that slips
 * past `billingEventSeen` does no harm. Returns the workspace it touched, or null. Throws on a database error so the
 * route answers 500 and Stripe retries.
 */
export async function applyBillingAction(action: BillingAction): Promise<string | null> {
  const supabase = getSupabaseServiceClient()
  if (action.kind === 'none') return null
  if (action.kind === 'link') {
    // Only the workspace our server named, only if it is not comped, and only if it has no OTHER customer.
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        plan: 'growth',
        stripe_customer_id: action.customerId,
        stripe_subscription_id: action.subscriptionId,
      })
      .eq('id', action.workspaceId)
      .neq('plan', 'comped')
      .or(`stripe_customer_id.is.null,stripe_customer_id.eq.${action.customerId}`)
      .select('id')
    if (error) throw new Error(`billing link failed: ${error.message}`)
    return (data?.[0]?.id as string | undefined) ?? null
  }
  const { data, error } = await supabase
    .from('workspaces')
    .update({
      plan: action.plan,
      stripe_subscription_id: action.plan === 'growth' ? action.subscriptionId : null,
    })
    .eq('stripe_customer_id', action.customerId)
    .neq('plan', 'comped')
    .select('id')
  if (error) throw new Error(`billing plan update failed: ${error.message}`)
  return (data?.[0]?.id as string | undefined) ?? null
}
