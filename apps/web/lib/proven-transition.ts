import { createHmac } from 'node:crypto'

// proving-workspaces-reading D1 + D3 — when a roadmap push records a bet newly `proven`, and who the platform says
// proved it. Pure (node:crypto only), so the rule is unit-tested without a server; the route does the I/O.
//
// The platform never reads a tenant's data to count proving workspaces. The push route already holds the pushing
// project's previous artifact (D16); comparing the two is a read of that one project, and what leaves it is one event
// in Golden Frijoles' own project whose subject is an HMAC of the workspace id.

/** The fields of a roadmap row this rule reads. */
export type VerdictRow = { slug: string; grain: string; verdict?: string | null }

/** At most this many events per push: one per epic, and past a handful they add nothing to a distinct-per-month count. */
export const MAX_PROVEN_EVENTS_PER_PUSH = 10

/**
 * The slugs of the Epic rows that read `proven` in `items` and did not in `previous` (D1).
 *
 * `previous` is `null` when the project has never pushed: then every proven epic is new to the platform and counts.
 * A FAILED read of the previous artifact is the caller's to refuse — it is not `null` here, because an unknown previous
 * cannot prove a transition, and treating it as "none" would count a workspace in a month it proved nothing.
 */
export function newlyProvenEpics(
  previous: readonly VerdictRow[] | null,
  items: readonly VerdictRow[]
): string[] {
  const wasProven = new Set(
    (previous ?? []).filter((row) => row.grain === 'Epic' && row.verdict === 'proven').map((row) => row.slug)
  )
  const slugs: string[] = []
  for (const row of items) {
    if (
      row.grain !== 'Epic' ||
      row.verdict !== 'proven' ||
      wasProven.has(row.slug) ||
      slugs.includes(row.slug)
    )
      continue
    slugs.push(row.slug)
  }
  return slugs
}

/**
 * The opaque subject a workspace is counted as (D3): HMAC-SHA256 keyed by the server secret, hex. Without the secret a
 * public reader of the self project cannot map it back to a workspace id. `null` when the secret is unset or blank:
 * then nothing is sent, and the push itself is unaffected.
 */
export function workspaceSubject(workspaceId: string, secret: string | undefined): string | null {
  const key = secret?.trim()
  if (!key || !workspaceId) return null
  return createHmac('sha256', key).update(workspaceId, 'utf8').digest('hex')
}
