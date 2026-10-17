// Growth Engine v1 · Sprint 3, Story 3.4 (Roadmap/01-growth-engine/growth-engine-v1) —
// pure daily-series aggregation for a 'telemetry_event'-sourced leading input. Zero
// DB/network import (Roadmap/LEARNINGS.md: keep pure logic import-free of framework/
// runtime-only modules), mirroring lib/tars.ts's pure/impure split — unit-testable
// directly against a synthetic event sequence.

export interface DailySeriesEvent {
  event: string
  createdAt: string
  /** Read only by `computeDistinctMonthlySeries`; the `count` read never selects it. */
  userId?: string
}

/** How a telemetry input counts its source event (`leading_inputs.aggregate`, proving-workspaces-reading D5). */
export type InputAggregate = 'count' | 'distinct_monthly'

export interface DailySeriesPoint {
  date: string // YYYY-MM-DD, UTC
  value: number
}

// Counts occurrences of `sourceEvent` per UTC calendar day. Only days with at least one
// matching event are returned (sorted ascending) — a day with zero events isn't a
// meaningful "0" data point to plot differently from "no data yet".
export function computeDailySeries(events: DailySeriesEvent[], sourceEvent: string): DailySeriesPoint[] {
  const countsByDay = new Map<string, number>()
  for (const e of events) {
    if (e.event !== sourceEvent) continue
    const day = new Date(e.createdAt).toISOString().slice(0, 10)
    countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
  }
  return [...countsByDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, value]) => ({ date, value }))
}

/**
 * proving-workspaces-reading D8 — the running number of DISTINCT `userId`s that sent `sourceEvent` since the 1st of
 * each UTC month: "workspaces this month", not "events per day".
 *
 * Each day with a matching event reads that month's distinct count through the end of that day. ⚠️ **And the 1st of
 * every later month, through `now`'s month, reads 0 when it has no event of its own.** A reading is taken as the
 * latest point on or before a day (`inputReadings`, lib/input-readings.ts), so without that reset a December with no
 * event yet would read November's number as December's.
 */
export function computeDistinctMonthlySeries(
  events: DailySeriesEvent[],
  sourceEvent: string,
  now: Date
): DailySeriesPoint[] {
  const matching = events
    .filter((e) => e.event === sourceEvent && e.userId)
    .map((e) => ({ day: new Date(e.createdAt).toISOString().slice(0, 10), userId: e.userId as string }))
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0))
  if (matching.length === 0) return []

  const byDay = new Map<string, number>()
  let month = ''
  let seen = new Set<string>()
  for (const { day, userId } of matching) {
    if (day.slice(0, 7) !== month) {
      month = day.slice(0, 7)
      seen = new Set()
    }
    seen.add(userId)
    byDay.set(day, seen.size)
  }

  const lastMonth = now.toISOString().slice(0, 7)
  for (let m = nextMonth(matching[0].day.slice(0, 7)); m <= lastMonth; m = nextMonth(m)) {
    const first = `${m}-01`
    if (!byDay.has(first)) byDay.set(first, 0)
  }
  return [...byDay.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, value]) => ({ date, value }))
}

/** `YYYY-MM` → the month after it. */
function nextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number)
  return mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`
}
