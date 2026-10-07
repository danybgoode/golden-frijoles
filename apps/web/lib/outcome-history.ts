// outcome-report-v2 · Story 2.1 (D8) — How fast against the last two months. ZERO IMPORTS: the windows and the deltas
// are pure, so a spec reaches 0, 1 and 2 earlier versions without a database.
//
// `report_artifacts` is append-only and versioned, so "last month" is the latest version generated before the first
// day of the current artifact's month, and "the month before" the latest generated before the first day of the month
// before that. A gap month (nothing pushed) is not invented: the second read can land on the same version as the first,
// and is then dropped, and the page says how many months it has.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The two cut-offs (ISO, UTC midnight) for an artifact generated at `generatedAt`: this month's start, last month's. */
export function windowCutoffs(generatedAt: string): [string, string] | null {
  const t = new Date(generatedAt)
  if (Number.isNaN(t.getTime())) return null
  const y = t.getUTCFullYear()
  const m = t.getUTCMonth()
  return [new Date(Date.UTC(y, m, 1)).toISOString(), new Date(Date.UTC(y, m - 1, 1)).toISOString()]
}

/** `2026-09-30T23:29:37Z` → `Sep`. */
export function monthLabel(generatedAt: string): string {
  const t = new Date(generatedAt)
  return Number.isNaN(t.getTime()) ? 'an earlier month' : MONTHS[t.getUTCMonth()]
}

/** One earlier window, as the deltas need it: its month and each speed metric's raw number. */
export type EarlierWindow = {
  id: string
  version: number
  generatedAt: string
  speed: Array<{ key: string; raw: number | null }>
}

export type SpeedDelta = { month: string; version: number; delta: number | null }

export type SpeedHistory = {
  /** Null when the earlier versions could not be read — said on the page, never shown as "no history". */
  windows: number | null
  months: string[]
  /** Per speed metric key, one entry per earlier window, newest first. `delta` null when either side has no number. */
  byKey: Record<string, SpeedDelta[]>
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * The deltas of `current` against each earlier window, newest first. Windows that resolved to the same version are
 * kept once. `earlier === null` means the read failed.
 */
export function speedHistory(
  current: Array<{ key: string; raw: number | null }>,
  earlier: Array<EarlierWindow | null> | null
): SpeedHistory {
  if (earlier === null) return { windows: null, months: [], byKey: {} }
  const seen = new Set<string>()
  const windows = earlier.filter((w): w is EarlierWindow => {
    if (!w || seen.has(w.id)) return false
    seen.add(w.id)
    return true
  })
  const byKey: Record<string, SpeedDelta[]> = {}
  for (const row of current) {
    byKey[row.key] = windows.map((w) => {
      const then = w.speed.find((r) => r.key === row.key)?.raw ?? null
      return {
        month: monthLabel(w.generatedAt),
        version: w.version,
        delta: row.raw === null || then === null ? null : round(row.raw - then),
      }
    })
  }
  return { windows: windows.length, months: windows.map((w) => monthLabel(w.generatedAt)), byKey }
}

/** `▲ 0.5 vs Sep` · `▼ 1 vs Aug` · `±0 vs Sep` · `not measured in Sep`. Neutral: the arrow is direction, not a verdict. */
export function deltaWords(d: SpeedDelta): string {
  if (d.delta === null) return `no comparison with ${d.month}`
  if (d.delta === 0) return `±0 vs ${d.month}`
  return `${d.delta > 0 ? '▲' : '▼'} ${Math.abs(d.delta)} vs ${d.month}`
}

/** The line under How fast when it has fewer than two months to compare with. */
export function historyNote(h: SpeedHistory): string | null {
  if (h.windows === null)
    return 'The earlier months could not be read just now, so there is nothing to compare with.'
  if (h.windows === 0)
    return 'This is the first month with a report, so there is nothing to compare with yet.'
  if (h.windows === 1) return `Only one earlier month (${h.months[0]}) has a report to compare with.`
  return null
}
