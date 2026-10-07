// result-record · Story 1.3 (D7) — an epic's target and verdict, read off the roadmap artifact. FRAMEWORK-FREE (no
// imports), so the board, Today, the epic page and the Outcome report (launch epics 5 and 6) and a unit spec all read
// the SAME derivation — the `roadmap-finops.ts` pattern.
//
// The fields come from the epic README's frontmatter (D1), carried by the ordinary roadmap push (D6); the default read
// date and the late mark are derived by the pusher's extract (D5), never here. Absent is "no target", never a zero.

/**
 * ⚠️ Copies of `READ_DEFAULT_DAYS` / `READ_CAP_DAYS` in `scripts/lib/result-dates.mjs`, pinned by the spec. Exported
 * for the Hub pages that will say "30 days after shipping" (epics 5 and 6); the extract already applied them.
 */
export const READ_DEFAULT_DAYS = 30
export const READ_CAP_DAYS = 90

export type ResultVerdict = 'proven' | 'disproven' | 'unclear'
/** The Bean a card shows: the verdict, or `growing` for a shipped epic with a target that has not been read yet. */
export type BeanKind = ResultVerdict | 'growing'

export type EpicResult = {
  slug: string
  name: string | null
  shipped: boolean
  hypothesis: string | null
  metric: string | null
  from: number | null
  to: number | null
  readDate: string | null
  /** The read date was not written: it is 30 days after shipping, derived by the extract. */
  readDateDerived: boolean
  verdict: ResultVerdict | null
  actual: number | null
  evidence: string | null
  /**
   * The evidence as a link a page may render — only an `https://` URL, else null. A reader that wants a link uses this
   * and never `evidence`, which is the owner's free text (a reason, or a `north-star:`/`ab:` pointer).
   */
  evidenceHref: string | null
  verdictAt: string | null
  /** The verdict came more than 90 days after shipping: kept, and not counted for the North Star. */
  late: boolean
  /** Whether the metric is one of the project's North Star inputs — null when the caller did not say which exist. */
  grounded: boolean | null
  readDue: boolean
  bean: BeanKind | null
}

/** ⚠️ A copy of `VERDICTS` in `scripts/lib/roadmap-contract.mjs`, pinned by the spec like the day constants. */
export const RESULT_VERDICTS: readonly ResultVerdict[] = ['proven', 'disproven', 'unclear']
const DAY = /^\d{4}-\d{2}-\d{2}$/

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
// A real calendar day only (codex review, #290) — the shape alone lets `2026-02-30` through. Restated, not imported:
// this module stays import-free; `roadmap-result.test.ts` holds both to the same cases.
const day = (v: unknown): string | null => {
  if (typeof v !== 'string' || !DAY.test(v)) return null
  const t = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === v ? v : null
}

/** An `https://` URL that parses, else null — never a `javascript:` or `http:` link (security lens, #290). */
function httpsHref(v: unknown): string | null {
  if (typeof v !== 'string') return null
  try {
    return new URL(v).protocol === 'https:' ? v : null
  } catch {
    return null
  }
}

/** Today in UTC, `YYYY-MM-DD` — the same day the pusher's scripts use. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** One roadmap row → its result view. */
export function epicResult(
  row: Record<string, unknown>,
  opts: { today?: string; inputKeys?: readonly string[] } = {}
): EpicResult {
  const today = opts.today ?? todayUtc()
  const shipped = (str(row.status) ?? '').trim().toLowerCase() === 'shipped'
  const metric = str(row.target_metric)
  const verdict = RESULT_VERDICTS.includes(row.verdict as ResultVerdict)
    ? (row.verdict as ResultVerdict)
    : null
  const readDate = day(row.read_date)
  return {
    slug: String(row.slug ?? ''),
    name: str(row.name),
    shipped,
    hypothesis: str(row.hypothesis),
    metric,
    from: num(row.target_from),
    to: num(row.target_to),
    readDate,
    readDateDerived: readDate !== null && row.read_date_derived === true,
    verdict,
    actual: verdict ? num(row.verdict_actual) : null,
    evidence: verdict ? str(row.verdict_evidence) : null,
    evidenceHref: verdict ? httpsHref(row.verdict_evidence) : null,
    verdictAt: verdict ? day(row.verdict_at) : null,
    late: verdict !== null && row.read_late === true,
    grounded: metric && opts.inputKeys ? opts.inputKeys.includes(metric) : null,
    readDue: shipped && metric !== null && verdict === null && readDate !== null && today >= readDate,
    bean: verdict ?? (shipped && metric ? 'growing' : null),
  }
}

/** Every EPIC row of a roadmap artifact's payload, as result views. Not an artifact payload → []. */
export function epicResultsFromArtifact(
  payload: unknown,
  opts: { today?: string; inputKeys?: readonly string[] } = {}
): EpicResult[] {
  const items = (payload as { items?: unknown } | null)?.items
  if (!Array.isArray(items)) return []
  return items
    .filter(
      (i): i is Record<string, unknown> =>
        typeof i === 'object' && i !== null && (i as { grain?: unknown }).grain === 'Epic'
    )
    .map((i) => epicResult(i, opts))
}

/** The epics whose read is due today, oldest read date first — Today's "Read due" lines (D10). */
export function readsDue(payload: unknown, today: string = todayUtc()): EpicResult[] {
  return epicResultsFromArtifact(payload, { today })
    .filter((r) => r.readDue)
    .sort((a, b) => (a.readDate ?? '').localeCompare(b.readDate ?? '') || a.slug.localeCompare(b.slug))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `2026-11-04` → `4 Nov`. */
export function shortDay(d: string): string {
  const [, m, dd] = d.split('-')
  return `${Number(dd)} ${MONTHS[Number(m) - 1]}`
}

const figure = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

/** The Bean's word, for a screen reader and for the line beside it. */
export const BEAN_WORDS: Record<BeanKind, string> = {
  proven: 'Proven',
  growing: 'Growing',
  disproven: 'Disproven',
  unclear: 'Unclear',
}

/**
 * The one line under a card's bean: `61 → 72 (target 70)` once read; `61 → 70 · read 3 Nov` (or `· read due`) while
 * growing; null when there is no target to show. The verdict's reason stands in for an unclear read with no number.
 */
export function resultLine(r: EpicResult): string | null {
  if (!r.metric) return null
  if (r.verdict) {
    if (r.actual === null) return r.evidence
    const from = r.from !== null ? `${figure(r.from)} → ` : ''
    const target = r.to !== null ? ` (target ${figure(r.to)})` : ''
    return `${from}${figure(r.actual)}${target}${r.late ? ' · read late' : ''}`
  }
  const move = r.from !== null && r.to !== null ? `${figure(r.from)} → ${figure(r.to)}` : r.metric
  if (r.readDue) return `${move} · read due`
  return r.readDate ? `${move} · read ${shortDay(r.readDate)}` : move
}
