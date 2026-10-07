import type { EpicResult } from './roadmap-result'
import type { EpicFinops } from './roadmap-finops'
import {
  expectedLines,
  headlineLine,
  paceSentence,
  type MetricLine,
  type MetricSource,
  type PaceSentence,
  type TargetedEpic,
} from './outcome-expected'

// outcome-report-v2 · Stories 1.1–1.3 (D3, D4) — "is it paying off", as data: the sentence, the lines, the four
// figures and the epics table. Type-only imports from the roadmap readers: the caller hands over each epic already read
// through `epicResult` and `epicFinops` (the ONE derivation of a target, a verdict and a spend), so nothing here
// re-parses a pushed row. Neutral by construction: overspend is "▲ … over …", never a colour; gold comes only from the
// Bean, which the result carries.

/** One pushed Epic row, read through both readers, plus its ship day. */
export type OutcomeEpic = { result: EpicResult; finops: EpicFinops; shippedAt: string | null }

export type FigureNow = {
  metric: string | null
  name: string | null
  actual: number | null
  expected: number | null
  gap: number | null
  /** Set when there is no expected value to show — the figure says why instead. */
  none: string | null
}

export type FigurePaidOff = { proven: number; read: number; unread: number }

export type FigureSpend = {
  spent: number
  /** Epics with a measured spend. */
  measured: number
  /** Σ quote over the epics that have BOTH a quote and a spend — so the comparison is like with like. */
  quoteLow: number | null
  quoteHigh: number | null
  quotedSpent: number | null
  /** Spend over the summed quote's top; 0 when within; null without a quote. */
  over: number | null
  unquoted: number
}

export type FigureCostPerWin = { perWin: number | null; proven: number }

export type EpicTableRow = {
  slug: string
  name: string
  hypothesis: string | null
  metric: string | null
  metricName: string | null
  from: number | null
  to: number | null
  actual: number | null
  /** actual − to, once read. */
  gap: number | null
  readDue: boolean
  bean: EpicResult['bean']
  shippedAt: string | null
  spend: number | null
  quoteLow: number | null
  quoteHigh: number | null
}

export type PayingOffView = {
  unavailable: boolean
  sentence: PaceSentence
  lines: MetricLine[]
  figures: {
    now: FigureNow
    paidOff: FigurePaidOff
    /** Team-only (D5); null under another lens. */
    spend: FigureSpend | null
    costPerWin: FigureCostPerWin | null
  }
  /** Team-only (D5); [] under another lens. */
  epics: EpicTableRow[]
}

const DAY = /^\d{4}-\d{2}-\d{2}$/
const cents = (n: number) => Math.round(n * 100) / 100

export function targetedEpic(e: OutcomeEpic): TargetedEpic {
  const r = e.result
  return {
    slug: r.slug,
    name: r.name,
    shippedAt: e.shippedAt && DAY.test(e.shippedAt) ? e.shippedAt : null,
    shipped: r.shipped,
    metric: r.metric,
    from: r.from,
    to: r.to,
    readDate: r.readDate,
    late: r.late,
    bean: r.bean,
  }
}

function nowFigure(lines: MetricLine[]): FigureNow {
  const head = headlineLine(lines)
  const empty = { metric: null, name: null, actual: null, expected: null, gap: null }
  if (!head)
    return { ...empty, none: 'No epic targets the North Star or its inputs yet, so nothing is expected.' }
  if (!head.latest) {
    const actual = head.actual.at(-1)?.value ?? null
    return {
      ...empty,
      metric: head.metric,
      name: head.name,
      actual,
      none:
        head.actual.length === 0
          ? `${head.name} has no recorded value yet.`
          : `No reading of ${head.name} since its first targeted epic shipped.`,
    }
  }
  return {
    metric: head.metric,
    name: head.name,
    actual: head.latest.actual,
    expected: head.latest.expected,
    gap: head.latest.gap,
    none: null,
  }
}

function paidOffFigure(epics: OutcomeEpic[]): FigurePaidOff {
  const verdicts = epics.filter((e) => e.result.verdict !== null)
  return {
    proven: verdicts.filter((e) => e.result.verdict === 'proven').length,
    read: verdicts.length,
    unread: epics.filter((e) => e.result.bean === 'growing').length,
  }
}

function spendFigure(epics: OutcomeEpic[]): FigureSpend {
  const measured = epics.filter((e) => e.finops.actualUsd !== null)
  const quoted = measured.filter((e) => e.finops.quoteLow !== null && e.finops.quoteHigh !== null)
  const spent = cents(measured.reduce((s, e) => s + (e.finops.actualUsd as number), 0))
  if (quoted.length === 0) {
    return {
      spent,
      measured: measured.length,
      quoteLow: null,
      quoteHigh: null,
      quotedSpent: null,
      over: null,
      unquoted: measured.length,
    }
  }
  const quoteLow = cents(quoted.reduce((s, e) => s + (e.finops.quoteLow as number), 0))
  const quoteHigh = cents(quoted.reduce((s, e) => s + (e.finops.quoteHigh as number), 0))
  const quotedSpent = cents(quoted.reduce((s, e) => s + (e.finops.actualUsd as number), 0))
  return {
    spent,
    measured: measured.length,
    quoteLow,
    quoteHigh,
    quotedSpent,
    over: cents(Math.max(0, quotedSpent - quoteHigh)),
    unquoted: measured.length - quoted.length,
  }
}

/** The table's rows (D4): every epic with a target or a verdict, and every shipped epic with a measured spend. */
export function epicTableRows(epics: OutcomeEpic[], metricNames: Record<string, string>): EpicTableRow[] {
  return epics
    .filter(
      (e) =>
        e.result.bean !== null ||
        e.result.verdict !== null ||
        (e.result.shipped && e.finops.actualUsd !== null) ||
        (e.result.metric !== null && e.result.from !== null && e.result.to !== null)
    )
    .map((e) => {
      const r = e.result
      return {
        slug: r.slug,
        name: r.name ?? r.slug,
        hypothesis: r.hypothesis,
        metric: r.metric,
        metricName: r.metric ? (metricNames[r.metric] ?? r.metric) : null,
        from: r.from,
        to: r.to,
        actual: r.actual,
        gap: r.actual !== null && r.to !== null ? cents(r.actual - r.to) : null,
        readDue: r.readDue,
        bean: r.bean,
        shippedAt: e.shippedAt && DAY.test(e.shippedAt) ? e.shippedAt : null,
        spend: e.finops.actualUsd,
        quoteLow: e.finops.quoteLow,
        quoteHigh: e.finops.quoteHigh,
      }
    })
    .sort(
      (a, b) =>
        Number(b.shippedAt !== null) - Number(a.shippedAt !== null) ||
        (b.shippedAt ?? '').localeCompare(a.shippedAt ?? '') ||
        a.slug.localeCompare(b.slug)
    )
}

/**
 * The whole "is it paying off" half, team view. `sources` is the North Star and its inputs, each with its series;
 * `null` means there is no North Star registered (every line is then absent and the sentence says no targets).
 */
export function buildPayingOff({
  product,
  epics,
  sources,
}: {
  product: string
  epics: OutcomeEpic[]
  sources: MetricSource[]
}): PayingOffView {
  const lines = expectedLines(sources, epics.map(targetedEpic))
  const proven = paidOffFigure(epics)
  const spend = spendFigure(epics)
  const names = Object.fromEntries(sources.map((s) => [s.key, s.name]))
  return {
    unavailable: false,
    sentence: paceSentence(product, lines),
    lines,
    figures: {
      now: nowFigure(lines),
      paidOff: proven,
      spend,
      costPerWin: {
        perWin: proven.proven > 0 ? cents(spend.spent / proven.proven) : null,
        proven: proven.proven,
      },
    },
    epics: epicTableRows(epics, names),
  }
}

/** The third state (D6): the roadmap or North Star read failed. Says so; never "no targets". */
export function unavailablePayingOff(): PayingOffView {
  return {
    unavailable: true,
    sentence: {
      kind: 'no_reading',
      text: "The plan couldn't be read just now, so we can't say if it's on pace.",
    },
    lines: [],
    figures: {
      now: {
        metric: null,
        name: null,
        actual: null,
        expected: null,
        gap: null,
        none: 'Could not be read just now.',
      },
      paidOff: { proven: 0, read: 0, unread: 0 },
      spend: null,
      costPerWin: null,
    },
    epics: [],
  }
}

// ── Words ────────────────────────────────────────────────────────────────────────────────────────────────────────

const fig = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

/** `$55.44`, `$208` — the FinOps rounding. */
export function dollars(n: number): string {
  return `$${n >= 100 || Number.isInteger(n) ? Math.round(n) : n.toFixed(2)}`
}

/** `▲ 2` / `▼ 12` / `±0` — a gap, neutral: the arrow is the direction, never a judgement. */
export function gapMark(gap: number): string {
  if (gap === 0) return '±0'
  return `${gap > 0 ? '▲' : '▼'} ${fig(Math.abs(gap))}`
}

/** `within $22–34` · `▲ $3.30 over $5–8` · `not quoted`. */
export function spendVsQuote(spend: number | null, low: number | null, high: number | null): string {
  if (low === null || high === null) return 'not quoted'
  const quote = `${dollars(low)}–${high >= 100 || Number.isInteger(high) ? Math.round(high) : high.toFixed(2)}`
  if (spend === null) return `quote ${quote}, not measured yet`
  return spend > high ? `▲ ${dollars(cents(spend - high))} over ${quote}` : `within ${quote}`
}

/** The table's metric cell: `Paid on time · 61 → 70 · actual 72 (▲ 2)` and its unread / untargeted forms. */
export function metricCell(r: EpicTableRow): string {
  if (r.metric === null || r.from === null || r.to === null) return 'No target'
  const move = `${r.metricName} · ${fig(r.from)} → ${fig(r.to)}`
  if (r.actual !== null)
    return `${move} · actual ${fig(r.actual)}${r.gap !== null ? ` (${gapMark(r.gap)})` : ''}`
  return `${move} · ${r.readDue ? 'read due' : 'not read yet'}`
}

export { fig as figure }
