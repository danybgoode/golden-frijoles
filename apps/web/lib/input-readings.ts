// result-record D14 — one North Star input's readings, as an agent asks for them. FRAMEWORK-FREE (no runtime imports),
// so the CLI route, the connector tool and a unit spec read the SAME rule.
//
// The series comes from `getProjectNorthStarByProjectId` (`lib/north-star-query.ts`) — pushed values or daily telemetry
// counts — and this module only picks the input, cuts at `to` and names the latest reading. It never invents one: an
// input with no reading on or before `to` has `latest: null`, which is "nothing to read", not a zero.

export type InputReading = { date: string; value: number }

export type InputReadingsView = {
  input: { key: string; name: string; valueSource: string }
  readings: InputReading[]
  /** The last reading on or before `to` (or overall when `to` is absent); null when there is none. */
  latest: InputReading | null
}

type InputWithSeries = {
  key: string
  name: string
  valueSource: string
  series: { date: string; value: number }[]
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** Whether `to` is a usable cut: absent, or a day written `YYYY-MM-DD`. */
export function isReadingsCut(to: string | null | undefined): boolean {
  if (to === null || to === undefined) return true
  if (!DAY.test(to)) return false
  const t = new Date(`${to}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === to // a real day: not 2026-02-30
}

/** The one input named `key` from a project's inputs, cut at `to`. Null when the project has no such input. */
export function inputReadings(
  inputs: readonly InputWithSeries[],
  key: string,
  to?: string | null
): InputReadingsView | null {
  const input = inputs.find((i) => i.key === key)
  if (!input) return null
  const readings = input.series
    .filter((p) => typeof p.date === 'string' && Number.isFinite(p.value))
    .map((p) => ({ date: p.date.slice(0, 10), value: p.value }))
    .filter((p) => !to || p.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date))
  return {
    input: { key: input.key, name: input.name, valueSource: input.valueSource },
    readings,
    latest: readings.length ? readings[readings.length - 1] : null,
  }
}
