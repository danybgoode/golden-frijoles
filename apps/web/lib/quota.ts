import 'server-only'
import { checkRateLimit } from './rate-limit'
import { getSupabaseServiceClient } from './supabase'
import { monthWindowStart, monthWindowEnd, MAX_TRACK_PAYLOAD_BYTES } from './quota-window'

// Re-exported so callers have ONE import site for the guardrails, pure and impure alike.
export { MAX_TRACK_PAYLOAD_BYTES, monthWindowStart, monthWindowEnd }

// multi-tenant-activation · Sprint 2, Story 2.2 — per-tenant isolation guardrails on the shared
// ingest path. Open signup means a stranger's runaway loop shares this route with Miyagi's real
// traffic and with the bill, so ingest needs three independent bounds:
//
//   1. a PAYLOAD cap        — bytes, checked before parsing (below)
//   2. a per-KEY rate limit — bursts, per api_keys row
//   3. a per-PROJECT quota  — sustained volume, per calendar month
//
// (2) and (3) are the SAME primitive at two different window sizes. Rather than building a second
// counter table, both ride lib/rate-limit.ts's `increment_rate_limit()` — a single atomic
// `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`, which is exactly the shape a quota
// needs and is already proven under concurrency (see the rate_limit migration's note on why the
// naive select-then-insert races). This is AGENTS.md's "reuse before rebuild" applied literally:
// a monthly quota is a fixed-window counter whose window happens to be a month.
//
// The alternative — `SELECT count(*) FROM events WHERE project_id = ? AND created_at >= ?` on
// every single ingest call — was rejected: it is an unbounded scan that gets slower exactly as a
// tenant gets more valuable, and it races the same way the naive rate limit did.
//
// Both bounds inherit rate-limit.ts's FAIL-OPEN behaviour on a DB error, deliberately: a counter
// outage must not take down ingest for every tenant. The failure mode is "briefly unenforced",
// not "everyone is down".

/** Per-key ingest burst window. Paired with `projects.ingest_rate_per_min` (per project row, so
 *  a real customer's ceiling is an UPDATE, never a deploy). */
const INGEST_WINDOW_MS = 60 * 1000

export type GuardResult = { ok: true } | { ok: false; status: number; error: string }

// Per-API-KEY, not per project: one runaway integration must not starve a tenant's other,
// healthy integrations, and revoking that one key is then a complete fix.
export async function checkIngestRate(apiKeyId: string, perMinute: number): Promise<GuardResult> {
  const result = await checkRateLimit(`ingest:${apiKeyId}`, {
    windowMs: INGEST_WINDOW_MS,
    max: perMinute,
  })
  if (result.ok) return { ok: true }
  return {
    ok: false,
    status: 429,
    error: `Ingest rate limit exceeded for this API key (${perMinute}/min). Slow down, or ask for a higher ceiling.`,
  }
}

// The window is the calendar month in UTC, passed to checkRateLimit EXPLICITLY rather than as a
// windowMs — see lib/quota-window.ts for why that distinction is load-bearing.
export async function checkMonthlyQuota(projectId: string, quota: number): Promise<GuardResult> {
  const windowStart = monthWindowStart()
  const result = await checkRateLimit(`quota:${projectId}`, { windowStart, max: quota })
  if (result.ok) return { ok: true }

  // REFUND THE REJECTED CALL. The counter increments before the comparison (that is what makes it
  // atomic), so without this an over-quota tenant whose integration keeps retrying drives the
  // count arbitrarily far above their ceiling — and then "raise the ceiling" (the documented, and
  // only, remedy) silently fails to restore service, because the count is already past the new
  // number too. The counter must mean "events accepted this month", not "requests attempted"
  // (cross-review, Codex 2026-07-20).
  //
  // Deliberately NOT done for the per-key rate limit: that one is a burst guard, inflating it
  // under a hammering caller is the desired behaviour, and its window resets every 60 seconds
  // rather than persisting for a month.
  await refundMonthlyQuota(projectId)

  const resetsOn = monthWindowEnd(windowStart).toISOString().slice(0, 10)
  return {
    ok: false,
    status: 429,
    error: `Monthly event quota exceeded (${quota} events). It resets on ${resetsOn}.`,
  }
}

// landing-launch-experiment · Sprint 4, Story 4.2 (epic D24) — the WORKSPACE pool: one counter for every product in the
// workspace, so more products never multiply the allowance. Charged AFTER the project quota and exactly like it
// (increment, compare, refund on reject), under its own key. A NULL pool (comped) or a key with no workspace skips it.
// Past the pool: the same 429 shape, never a charge (Daniel, 2026-10-19 — no overage billing, no email yet).
export async function checkWorkspacePool(
  workspaceId: string | null,
  pool: number | null
): Promise<GuardResult> {
  if (!workspaceId || pool === null) return { ok: true }
  const windowStart = monthWindowStart()
  const result = await checkRateLimit(poolKey(workspaceId), { windowStart, max: pool })
  if (result.ok) return { ok: true }
  await refundCounter(poolKey(workspaceId))
  const resetsOn = monthWindowEnd(windowStart).toISOString().slice(0, 10)
  return {
    ok: false,
    status: 429,
    error: `This workspace's monthly event pool is used up (${pool} events across its products). It resets on ${resetsOn}; Growth raises it.`,
  }
}

const poolKey = (workspaceId: string) => `quota:ws:${workspaceId}`

/**
 * landing-launch-experiment D24 (Daniel, 2026-10-19) — whether a product's OWN monthly quota applies. Only on Free (and for a
 * key with no workspace read): on Growth and comped the workspace pool is the only monthly limit, or a one-product Growth
 * workspace could never reach the 2,000,000 it bought.
 */
export function projectQuotaApplies(workspacePlan: string | null): boolean {
  return workspacePlan !== 'growth' && workspacePlan !== 'comped'
}

/** Both monthly charges back, for an event that was charged and then failed to persist (the ingest route). */
export async function refundEventCharges(charged: {
  projectId: string
  workspaceId: string | null
  monthlyEventPool: number | null
  workspacePlan: string | null
}): Promise<void> {
  // Refund exactly what was charged: the project counter only where it applies.
  if (projectQuotaApplies(charged.workspacePlan)) await refundMonthlyQuota(charged.projectId)
  if (charged.workspaceId && charged.monthlyEventPool !== null) await refundCounter(poolKey(charged.workspaceId))
}

// Hands back one unit of monthly quota. Called only when an event was CHARGED (the counter was
// incremented) but then failed to persist — see the ingest route. Best-effort by design: a failed
// refund must not turn a 500 into two problems, and the ceiling self-heals at the month boundary
// regardless.
export async function refundMonthlyQuota(projectId: string): Promise<void> {
  await refundCounter(`quota:${projectId}`)
}

async function refundCounter(key: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient()
    const { error } = await supabase.rpc('decrement_rate_limit', {
      p_key: key,
      p_window_start: monthWindowStart().toISOString(),
    })
    if (error) console.error('[quota] refund failed:', error)
  } catch (err) {
    console.error('[quota] refund threw:', err)
  }
}
