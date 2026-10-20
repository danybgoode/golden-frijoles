// landing-launch-experiment · Sprint 4, Story 4.2 (epic D24) — when Today warns about the workspace's monthly event
// pool, as a pure function (no imports) so the unit layer pins every answer. No email (Daniel, 2026-10-19): this notice
// is the whole alert.

export type PoolNotice = { kind: 'near' | 'over'; used: number; pool: number; canUpgrade: boolean }

/** Warn from 80% of the pool; "over" once the counter has reached it (the next event is refused). */
export const POOL_WARN_SHARE = 0.8

export function poolNotice(input: { used: number; pool: number | null; plan: string }): PoolNotice | null {
  const { used, pool, plan } = input
  if (pool === null || !(pool > 0) || !(used >= 0)) return null
  const canUpgrade = plan === 'free'
  if (used >= pool) return { kind: 'over', used, pool, canUpgrade }
  if (used >= pool * POOL_WARN_SHARE) return { kind: 'near', used, pool, canUpgrade }
  return null
}
