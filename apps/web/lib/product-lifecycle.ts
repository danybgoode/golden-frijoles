import 'server-only'
import { getSupabaseServiceClient } from './supabase'
import { recordAudit } from './audit'
import { DEMO_PROJECT_SLUG } from './public-demo'
import { SELF_PROJECT_SLUG } from './self-track'

// many-products · Sprint 2, Stories 2.1 + 2.2 (Roadmap/02-commercial/many-products — lock D9, D10).
//
// Delete and purge, for the CLI routes and the console's Server Action alike. Both decisions are one SQL function each
// (20261015100000_many_products_soft_delete.sql), so ownership, liveness and the 30 days are judged in the statement that
// writes. `userId` is always the caller's resolved identity (a CLI token or the session), never a request field.
//
// The public demo and the self-tracking project refuse delete: rule #2's allow-list names the demo BY SLUG, so deleting
// it would 403 the landing's own proof — and the slugs are env-driven, so they are passed in rather than written in SQL.

export type DeleteOutcome = 'deleted' | 'not_found' | 'protected' | 'error'

export async function deleteProductForUser(userId: string, slug: string): Promise<DeleteOutcome> {
  const { data, error } = await getSupabaseServiceClient().rpc('delete_project', {
    p_slug: slug,
    p_user_id: userId,
    p_protected: [...new Set([DEMO_PROJECT_SLUG, SELF_PROJECT_SLUG])],
  })
  if (error) {
    console.error('[product-lifecycle] delete failed:', { code: error.code ?? 'unknown' })
    return 'error'
  }
  if (data === 'deleted') {
    await recordAudit({ action: 'product_deleted', projectId: null, actorUserId: userId, metadata: { slug } })
    return 'deleted'
  }
  return data === 'not_found' || data === 'protected' ? data : 'error'
}

export type PurgeOutcome =
  | { kind: 'purged' }
  | { kind: 'too_soon'; purgeAfter: string }
  | { kind: 'not_found' }
  | { kind: 'error' }

export async function purgeProductForUser(userId: string, slug: string): Promise<PurgeOutcome> {
  const { data, error } = await getSupabaseServiceClient().rpc('purge_deleted_project', {
    p_slug: slug,
    p_user_id: userId,
  })
  if (error) {
    console.error('[product-lifecycle] purge failed:', { code: error.code ?? 'unknown' })
    return { kind: 'error' }
  }
  const row = (Array.isArray(data) ? data[0] : data) as { outcome?: unknown; purge_after?: unknown } | undefined
  switch (row?.outcome) {
    case 'purged':
      // projectId null: the row is gone, and audit_log's project reference would only dangle.
      await recordAudit({ action: 'product_purged', projectId: null, actorUserId: userId, metadata: { slug } })
      return { kind: 'purged' }
    case 'too_soon':
      return typeof row.purge_after === 'string' ? { kind: 'too_soon', purgeAfter: row.purge_after } : { kind: 'error' }
    case 'not_found':
      return { kind: 'not_found' }
    default:
      return { kind: 'error' }
  }
}
