import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'
import type { OutcomeEpic } from './outcome-figures.ts'

// outcome-figures.ts imports its sibling extensionless (the app's style); the unit runner needs the `.ts` — the same
// resolve hook console-palette.test.ts registers, then a dynamic import.
type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { buildPayingOff, dollars, epicTableRows, gapMark, metricCell, spendVsQuote, unavailablePayingOff } =
  await import('./outcome-figures.ts')
import { epicResult } from './roadmap-result.ts'
import { epicFinops } from './roadmap-finops.ts'

// outcome-report-v2 S1.2 + S1.3 (D3, D4) — four figures each against expected, and the epics table. Rows are built
// through the real roadmap readers, so a figure cannot disagree with the board or FinOps about a pushed field.

const TODAY = '2026-11-10'
const row = (over: Record<string, unknown>): OutcomeEpic => {
  const r: Record<string, unknown> = { grain: 'Epic', status: 'Shipped', ...over }
  return {
    result: epicResult(r, { today: TODAY }),
    finops: epicFinops(r),
    shippedAt: (r.shipped_at as string) ?? null,
  }
}

const LEDGERLY: OutcomeEpic[] = [
  row({
    slug: 'overdue-reminders',
    name: 'Overdue reminders',
    hypothesis: 'a reminder gets invoices paid on time',
    shipped_at: '2026-09-01',
    target_metric: 'paid_on_time',
    target_from: 61,
    target_to: 70,
    read_date: '2026-10-01',
    verdict: 'proven',
    verdict_actual: 72,
    verdict_at: '2026-10-02',
    actual_usd: 9.8,
    quote_low_usd: 7,
    quote_high_usd: 16,
  }),
  row({
    slug: 'smart-defaults',
    name: 'Smart defaults',
    hypothesis: 'sensible defaults finish setup',
    shipped_at: '2026-09-10',
    target_metric: 'setup_completed',
    target_from: 44,
    target_to: 55,
    read_date: '2026-10-10',
    verdict: 'disproven',
    verdict_actual: 43,
    verdict_at: '2026-10-11',
    actual_usd: 11.3,
    quote_low_usd: 5,
    quote_high_usd: 8,
  }),
  row({
    slug: 'export-csv',
    name: 'Export CSV',
    hypothesis: 'teams that export come back weekly',
    shipped_at: '2026-10-20',
    target_metric: 'weekly_teams',
    target_from: 120,
    target_to: 140,
    read_date: '2026-11-19',
    actual_usd: 4.1,
    quote_low_usd: 3,
    quote_high_usd: 6,
  }),
  row({ slug: 'cli', name: 'The CLI', shipped_at: '2026-09-18', actual_usd: 207.81 }),
  row({ slug: 'unshipped-untargeted', name: 'Nothing yet', status: 'Building' }),
]

const SOURCES = [
  {
    key: 'paid_on_time',
    name: 'Paid on time',
    isNorthStar: false,
    series: [{ date: '2026-11-01', value: 72 }],
  },
  { key: 'setup_completed', name: 'Setup completed', isNorthStar: false, series: [] },
  { key: 'weekly_teams', name: 'Weekly active teams', isNorthStar: false, series: [] },
]

test('figure 1: the headline metric now against expected, with the gap', () => {
  const v = buildPayingOff({ product: 'Ledgerly', epics: LEDGERLY, sources: SOURCES })
  assert.equal(v.figures.now.name, 'Paid on time')
  assert.equal(v.figures.now.actual, 72)
  assert.equal(v.figures.now.expected, 70)
  assert.equal(v.figures.now.gap, 2)
  assert.equal(v.figures.now.none, null)
  assert.equal(v.sentence.text, 'Ledgerly is on the pace you planned.')
})

test('figure 1 says there is no expected value when nothing is targeted', () => {
  const v = buildPayingOff({ product: 'Ledgerly', epics: [LEDGERLY[3]], sources: SOURCES })
  assert.equal(v.figures.now.expected, null)
  assert.match(v.figures.now.none ?? '', /nothing is expected/)
  assert.equal(v.sentence.kind, 'no_targets')
})

test('figure 2: paid off of those read, and the unread still counted', () => {
  const v = buildPayingOff({ product: 'Ledgerly', epics: LEDGERLY, sources: SOURCES })
  assert.deepEqual(v.figures.paidOff, { proven: 1, read: 2, unread: 1 })
})

test('figure 3: spend against the summed quote of the epics that have both — neutral wording', () => {
  const spend = buildPayingOff({ product: 'Ledgerly', epics: LEDGERLY, sources: SOURCES }).figures.spend!
  assert.equal(spend.spent, 233.01)
  assert.equal(spend.measured, 4)
  assert.equal(spend.quoteLow, 15)
  assert.equal(spend.quoteHigh, 30)
  assert.equal(spend.quotedSpent, 25.2)
  assert.equal(spend.over, 0)
  assert.equal(spend.unquoted, 1)
  assert.equal(spendVsQuote(11.3, 5, 8), '▲ $3.30 over $5–8')
  assert.equal(spendVsQuote(9.8, 7, 16), 'within $7–16')
  assert.equal(spendVsQuote(207.81, null, null), 'not quoted')
})

test('figure 4: cost per epic that paid off, or none when nothing has', () => {
  const v = buildPayingOff({ product: 'Ledgerly', epics: LEDGERLY, sources: SOURCES })
  assert.deepEqual(v.figures.costPerWin, { perWin: 233.01, proven: 1 })
  const none = buildPayingOff({ product: 'Ledgerly', epics: [LEDGERLY[3]], sources: SOURCES })
  assert.equal(none.figures.costPerWin?.perWin, null)
})

test('the table: targeted, verdicted and shipped-with-spend epics, newest ship first, metric name in the cell', () => {
  const rows = epicTableRows(LEDGERLY, Object.fromEntries(SOURCES.map((s) => [s.key, s.name])))
  assert.deepEqual(
    rows.map((r) => r.slug),
    ['export-csv', 'cli', 'smart-defaults', 'overdue-reminders']
  )
  const [csv, cli, defaults, reminders] = rows
  assert.equal(metricCell(reminders), 'Paid on time · 61 → 70 · actual 72 (▲ 2)')
  assert.equal(metricCell(defaults), 'Setup completed · 44 → 55 · actual 43 (▼ 12)')
  assert.equal(metricCell(csv), 'Weekly active teams · 120 → 140 · not read yet')
  assert.equal(metricCell(cli), 'No target')
  assert.equal(reminders.hypothesis, 'a reminder gets invoices paid on time')
  assert.equal(reminders.bean, 'proven')
  assert.equal(csv.bean, 'growing')
  assert.equal(cli.bean, null)
})

test('words: dollars, neutral gap marks', () => {
  assert.equal(dollars(55.44), '$55.44')
  assert.equal(dollars(207.81), '$208')
  assert.equal(gapMark(2), '▲ 2')
  assert.equal(gapMark(-12), '▼ 12')
  assert.equal(gapMark(0), '±0')
})

test('the unavailable state says so and claims no targets were missing', () => {
  const v = unavailablePayingOff()
  assert.equal(v.unavailable, true)
  assert.notEqual(v.sentence.kind, 'no_targets')
})
