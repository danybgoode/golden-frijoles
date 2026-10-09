// sdk-1-0 D4 — a North Star input's daily values, checked before they are sent.
//
// The route (`POST /api/v1/inputs/<key>/values`) is append-only and idempotent per day: re-pushing a day is a no-op,
// never an update. The checks here are the route's own (a real calendar date, a finite number, no day twice), so a
// caller learns about a bad value without a round-trip; the route stays the authority.

export interface InputValue {
  /** The day the value belongs to, YYYY-MM-DD. */
  occurredOn: string
  value: number
}

export type PushInputValuesResult =
  | {
      ok: true
      inputKey: string
      /** Days appended now. */
      inserted: number
      /** Days already on file, left as they were (append-only). */
      skippedDuplicates: number
      /** Of those, the days whose pushed value differs from the one on file (a correction needs a backfill). */
      mismatchedDuplicates: string[]
    }
  | { ok: false; error: string; code?: string; issues?: unknown }

function isCalendarDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

/** Pure: the problems with a key and its values, empty when they can be sent. */
export function inputValuesProblems(inputKey: unknown, values: unknown): string[] {
  const problems: string[] = []
  if (typeof inputKey !== 'string' || inputKey.trim().length === 0)
    problems.push('inputKey must be a non-empty string')
  if (!Array.isArray(values) || values.length === 0) return [...problems, 'values must be a non-empty array']
  const seen = new Set<string>()
  values.forEach((entry, i) => {
    const v = entry as Partial<InputValue> | null
    if (!v || !isCalendarDate(v.occurredOn))
      problems.push(`values[${i}].occurredOn must be a real YYYY-MM-DD date`)
    if (!v || typeof v.value !== 'number' || !Number.isFinite(v.value))
      problems.push(`values[${i}].value must be a finite number`)
    if (v && typeof v.occurredOn === 'string') {
      if (seen.has(v.occurredOn)) problems.push(`values[${i}].occurredOn ${v.occurredOn} appears twice`)
      seen.add(v.occurredOn)
    }
  })
  return problems
}
