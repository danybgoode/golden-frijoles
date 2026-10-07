// outcome-report-v2 · Story 1.1 (D1, D2) — the expected line, and whether the product is on pace. ZERO IMPORTS, so a
// unit spec reaches every branch and the Hub page and the share page cannot derive it two ways.
//
// "Expected" is never a number we invent: it is the sum of the epics' own targets. An epic is GROUNDED when it shipped
// on a known day, carries a complete target (metric + from + to), targets the North Star or one of its inputs, and its
// verdict was not late. Each grounded epic moves its metric's line from `from` toward `to`, linearly, from its ship day
// to its read day, and holds after. A metric no grounded epic targets has no expected line — never a flat one.
//
// ⚠️ The North Star metric itself has no recorded level (lib/north-star-query.ts, `ProjectNorthStarResult`): only its
// inputs have series. An epic that targets the North Star key gets an expected line and "no recorded value" as its
// actual. Nothing here derives a North Star level from its inputs.

export type SeriesPoint = { date: string; value: number }

/** One epic, as much of it as the line needs. Built from the pushed roadmap row by `lib/outcome-figures.ts`. */
export type TargetedEpic = {
  slug: string
  name: string | null
  /** `YYYY-MM-DD`, or null when the row carries no valid ship day. */
  shippedAt: string | null
  shipped: boolean
  metric: string | null
  from: number | null
  to: number | null
  /** The read day the pusher derived or the owner wrote; null falls back to `READ_FALLBACK_DAYS` after shipping. */
  readDate: string | null
  late: boolean
  bean: 'proven' | 'disproven' | 'unclear' | 'growing' | null
}

export type MetricSource = { key: string; name: string; isNorthStar: boolean; series: SeriesPoint[] }

export type Pace = 'ahead' | 'on' | 'behind'

export type MetricLine = {
  metric: string
  name: string
  isNorthStar: boolean
  /** Ascending by date. Empty for the North Star key (no recorded level) or an input with no values yet. */
  actual: SeriesPoint[]
  /** Breakpoints of the expected line, ascending; empty when no grounded epic targets this metric. */
  expected: SeriesPoint[]
  /** Where each grounded epic shipped, for the chart's beans. `slug`/`name` are null when a lens withholds which (D5). */
  markers: Array<{ slug: string | null; name: string | null; date: string; bean: TargetedEpic['bean'] }>
  grounded: number
  /** The latest actual point against the expected value that day — null when either side is missing. */
  latest: { date: string; actual: number; expected: number; gap: number } | null
  pace: Pace | null
}

/** ⚠️ Mirrors `READ_DEFAULT_DAYS` in lib/roadmap-result.ts — restated so this module stays import-free; pinned by spec. */
export const READ_FALLBACK_DAYS = 30
/**
 * Within this share of the expected value, or of the planned move (Σ to − from) when that is larger, the metric is on
 * pace. Both scale with the metric: an absolute floor made every metric stored as a 0–1 fraction "on pace" forever
 * (fresh review, PR #299 — 0.01 against an expected 0.20 read as on pace).
 */
export const ON_PACE_SHARE = 0.05
export const ON_PACE_MOVE_SHARE = 0.1

const DAY = /^\d{4}-\d{2}-\d{2}$/
/**
 * A real calendar day only — the shape alone lets `2026-02-30` through, and `2026-13-01` makes `toISOString()` throw
 * (codex + fresh review, #299). Restated from `roadmap-result.ts`'s `day()` so this module stays import-free.
 */
export const isDay = (v: string | null | undefined): v is string => {
  if (typeof v !== 'string' || !DAY.test(v)) return false
  const t = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === v
}
const dayMs = (d: string) => Date.parse(`${d}T00:00:00Z`)
const addDays = (d: string, n: number) => new Date(dayMs(d) + n * 86_400_000).toISOString().slice(0, 10)

/** Whether an epic counts toward a metric's expected line (D1). */
export function isGrounded(e: TargetedEpic, metricKeys: readonly string[]): boolean {
  return (
    e.shipped &&
    isDay(e.shippedAt) &&
    e.metric !== null &&
    e.from !== null &&
    e.to !== null &&
    metricKeys.includes(e.metric) &&
    !e.late
  )
}

type Ramp = { start: number; end: number; delta: number }

function rampOf(e: TargetedEpic): Ramp {
  const start = dayMs(e.shippedAt as string)
  const read = isDay(e.readDate)
    ? dayMs(e.readDate)
    : dayMs(addDays(e.shippedAt as string, READ_FALLBACK_DAYS))
  return { start, end: Math.max(start, read), delta: (e.to as number) - (e.from as number) }
}

function valueAt(base: number, ramps: Ramp[], t: number): number {
  let v = base
  for (const r of ramps) {
    if (t < r.start) continue
    // A zero-length ramp (read day on or before the ship day) is a step: the whole move lands on the ship day itself
    // (codex round 2, #299 — skipping `t === start` left such a line stuck at `from`).
    if (r.end === r.start || t >= r.end) v += r.delta
    else v += (r.delta * (t - r.start)) / (r.end - r.start)
  }
  return v
}

const round = (n: number) => Math.round(n * 1000) / 1000

/** One metric's line: its actual, its expected breakpoints and its pace. */
export function metricLine(
  source: MetricSource,
  epics: readonly TargetedEpic[],
  allKeys: readonly string[]
): MetricLine {
  const grounded = epics
    .filter((e) => e.metric === source.key && isGrounded(e, allKeys))
    .sort(
      (a, b) => (a.shippedAt as string).localeCompare(b.shippedAt as string) || a.slug.localeCompare(b.slug)
    )
  const actual = [...source.series].filter((p) => isDay(p.date) && Number.isFinite(p.value))
  actual.sort((a, b) => a.date.localeCompare(b.date))

  const base: SeriesPoint[] = []
  let latest: MetricLine['latest'] = null
  let pace: Pace | null = null
  if (grounded.length > 0) {
    const start = grounded[0].from as number
    const ramps = grounded.map(rampOf)
    const days = new Set<string>()
    for (const e of grounded) {
      const r = rampOf(e)
      days.add(new Date(r.start).toISOString().slice(0, 10))
      days.add(new Date(r.end).toISOString().slice(0, 10))
    }
    const last = actual.at(-1)
    if (last && last.date > [...days].sort().at(-1)!) days.add(last.date)
    for (const d of [...days].sort()) base.push({ date: d, value: round(valueAt(start, ramps, dayMs(d))) })

    // Pace is read on the latest actual day, and only once the first grounded epic has shipped — before that nothing
    // was expected yet, and a reading from then says nothing about the plan.
    if (last && last.date >= (grounded[0].shippedAt as string)) {
      const expected = round(valueAt(start, ramps, dayMs(last.date)))
      const gap = round(last.value - expected)
      const move = ramps.reduce((s, r) => s + r.delta, 0)
      const direction = Math.sign(move) || 1
      const tolerance = Math.max(Math.abs(expected) * ON_PACE_SHARE, Math.abs(move) * ON_PACE_MOVE_SHARE)
      latest = { date: last.date, actual: last.value, expected, gap }
      pace = Math.abs(gap) <= tolerance ? 'on' : gap * direction > 0 ? 'ahead' : 'behind'
    }
  }

  return {
    metric: source.key,
    name: source.name,
    isNorthStar: source.isNorthStar,
    actual,
    expected: base,
    markers: grounded.map((e) => ({ slug: e.slug, name: e.name, date: e.shippedAt as string, bean: e.bean })),
    grounded: grounded.length,
    latest,
    pace,
  }
}

/** Every metric's line, the North Star first, then inputs by key. */
export function expectedLines(
  sources: readonly MetricSource[],
  epics: readonly TargetedEpic[]
): MetricLine[] {
  const keys = sources.map((s) => s.key)
  return [...sources]
    .sort((a, b) => Number(b.isNorthStar) - Number(a.isNorthStar) || a.key.localeCompare(b.key))
    .map((s) => metricLine(s, epics, keys))
}

/** The metric figure 1 leads with: the most grounded epics, ties by key; null when no metric has a target. */
export function headlineLine(lines: readonly MetricLine[]): MetricLine | null {
  const targeted = lines.filter((l) => l.grounded > 0)
  if (targeted.length === 0) return null
  return [...targeted].sort((a, b) => b.grounded - a.grounded || a.metric.localeCompare(b.metric))[0]
}

export type PaceSentence = {
  kind: 'no_targets' | 'no_reading' | Pace | 'mixed'
  text: string
}

const PACE_WORDS: Record<Pace, string> = { ahead: 'ahead of', on: 'on', behind: 'behind' }

/** The one sentence the report opens with (D2). */
export function paceSentence(product: string, lines: readonly MetricLine[]): PaceSentence {
  if (lines.length === 0) {
    return { kind: 'no_targets', text: "No North Star is registered yet, so we can't say if it's on pace." }
  }
  if (!lines.some((l) => l.grounded > 0)) {
    return { kind: 'no_targets', text: "No targets yet, so we can't say if it's on pace." }
  }
  const read = lines.filter((l) => l.pace !== null)
  if (read.length === 0) {
    return {
      kind: 'no_reading',
      text: `${product} has targets, but no reading since they shipped, so we can't say if it's on pace yet.`,
    }
  }
  // A targeted metric with no reading yet is named, never folded into "all agree" (fresh review, #299).
  const unread = lines.filter((l) => l.grounded > 0 && l.pace === null).map((l) => l.name)
  const tail =
    unread.length > 0 ? ` ${unread.join(', ')} ${unread.length === 1 ? 'has' : 'have'} no reading yet.` : ''
  const paces = new Set(read.map((l) => l.pace as Pace))
  if (paces.size === 1) {
    const pace = read[0].pace as Pace
    const subject =
      unread.length > 0
        ? `${product} is ${PACE_WORDS[pace]} the pace you planned on ${read.map((l) => l.name).join(', ')}.`
        : `${product} is ${PACE_WORDS[pace]} the pace you planned.`
    return { kind: pace, text: subject + tail }
  }
  const named = (p: Pace) =>
    read
      .filter((l) => l.pace === p)
      .map((l) => l.name)
      .join(', ')
  const parts = (['ahead', 'on', 'behind'] as const)
    .filter((p) => paces.has(p))
    .map((p) => (p === 'on' ? `on pace for ${named(p)}` : `${p} on ${named(p)}`))
  return { kind: 'mixed', text: `Mixed: ${parts.join('; ')}.${tail}` }
}
