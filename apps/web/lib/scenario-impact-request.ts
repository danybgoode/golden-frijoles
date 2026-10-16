import { createHash } from 'node:crypto'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CANONICAL_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export type ScenarioImpactCaptureRequest = {
  runId: string
  asOf: string
  idempotencyKey: string
  reason: string
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

export function parseScenarioImpactCaptureRequest(
  input: unknown,
  now = new Date().toISOString()
): ScenarioImpactCaptureRequest | null {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return null
  const value = input as Record<string, unknown>
  if (!exactKeys(value, ['runId', 'asOf', 'idempotencyKey', 'reason'])) return null
  const reason = typeof value.reason === 'string' ? value.reason.trim() : ''
  if (
    typeof value.runId !== 'string' ||
    !UUID.test(value.runId) ||
    typeof value.idempotencyKey !== 'string' ||
    !UUID.test(value.idempotencyKey) ||
    typeof value.asOf !== 'string' ||
    reason.length < 1 ||
    reason.length > 500
  )
    return null
  if (!CANONICAL_INSTANT.test(value.asOf) || !CANONICAL_INSTANT.test(now)) return null
  const asOfMs = Date.parse(value.asOf)
  const nowMs = Date.parse(now)
  if (
    !Number.isFinite(asOfMs) ||
    !Number.isFinite(nowMs) ||
    new Date(asOfMs).toISOString() !== value.asOf ||
    asOfMs > nowMs
  )
    return null
  return {
    runId: value.runId,
    asOf: value.asOf,
    idempotencyKey: value.idempotencyKey,
    reason,
  }
}

// ── The owner door's fixed inputs (drill-impact-for-agents D6) ─────────────────────────────────────────────────────

export const OWNER_IMPACT_REASON = 'Impact captured for a stopped drill.'

/**
 * D6: the instant a capture reads, from the run's `stopped_at`. Postgres keeps microseconds and the evidence contract
 * takes milliseconds, so it rounds UP: everything up to the stop is inside the window, and a retry reads the same one.
 */
export function ownerImpactAsOf(stoppedAt: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(
    stoppedAt
  )
  if (!match) return null
  const [, date, time, fraction = '', zone] = match
  const whole = Date.parse(`${date}T${time}${zone === 'Z' ? 'Z' : zone.length === 3 ? `${zone}:00` : zone}`)
  if (!Number.isFinite(whole)) return null
  const millis = Number(fraction.slice(0, 3).padEnd(3, '0'))
  const remainder = /[1-9]/.test(fraction.slice(3)) ? 1 : 0
  return new Date(whole + millis + remainder).toISOString()
}

/** D6: one idempotency key per run, so a capture at stop and any number of retries name the same evidence. */
export function ownerImpactIdempotencyKey(runId: string): string {
  const hex = createHash('sha256').update(`owner-impact:${runId}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
