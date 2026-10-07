import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  expectedLines,
  headlineLine,
  isGrounded,
  metricLine,
  paceSentence,
  READ_FALLBACK_DAYS,
  type MetricSource,
  type TargetedEpic,
} from './outcome-expected.ts'
import { READ_DEFAULT_DAYS } from './roadmap-result.ts'

// outcome-report-v2 S1.1 (D1, D2) — the expected line counts only grounded epics, per metric, and never invents a flat
// line; the sentence matches the gap.

const epic = (over: Partial<TargetedEpic> = {}): TargetedEpic => ({
  slug: 'overdue-reminders',
  name: 'Overdue reminders',
  shippedAt: '2026-09-01',
  shipped: true,
  metric: 'paid_on_time',
  from: 60,
  to: 70,
  readDate: '2026-10-01',
  late: false,
  bean: 'growing',
  ...over,
})

const input = (series: Array<[string, number]>, over: Partial<MetricSource> = {}): MetricSource => ({
  key: 'paid_on_time',
  name: 'Paid on time',
  isNorthStar: false,
  series: series.map(([date, value]) => ({ date, value })),
  ...over,
})

test('the fallback read day is the result record’s default', () => {
  assert.equal(READ_FALLBACK_DAYS, READ_DEFAULT_DAYS)
})

test('none: no grounded epic means no expected line and the sentence says it cannot tell', () => {
  const lines = expectedLines([input([['2026-09-10', 64]])], [])
  assert.deepEqual(lines[0].expected, [])
  assert.equal(lines[0].pace, null)
  assert.equal(lines[0].actual.length, 1)
  assert.equal(headlineLine(lines), null)
  assert.deepEqual(paceSentence('Ledgerly', lines), {
    kind: 'no_targets',
    text: "No targets yet, so we can't say if it's on pace.",
  })
})

test('grounded means shipped on a day, a complete target on a known metric, and not late', () => {
  const keys = ['paid_on_time']
  assert.equal(isGrounded(epic(), keys), true)
  assert.equal(isGrounded(epic({ shipped: false }), keys), false)
  assert.equal(isGrounded(epic({ shippedAt: null }), keys), false)
  assert.equal(isGrounded(epic({ to: null }), keys), false)
  assert.equal(isGrounded(epic({ metric: 'something_else' }), keys), false)
  assert.equal(isGrounded(epic({ late: true }), keys), false)
})

test('one: the line moves from → to between ship and read, and the pace reads the gap', () => {
  const behind = metricLine(input([['2026-09-16', 60]]), [epic()], ['paid_on_time'])
  assert.deepEqual(behind.expected, [
    { date: '2026-09-01', value: 60 },
    { date: '2026-10-01', value: 70 },
  ])
  assert.deepEqual(behind.latest, { date: '2026-09-16', actual: 60, expected: 65, gap: -5 })
  assert.equal(behind.pace, 'behind')
  assert.equal(paceSentence('Ledgerly', [behind]).text, 'Ledgerly is behind the pace you planned.')

  const on = metricLine(input([['2026-09-16', 66]]), [epic()], ['paid_on_time'])
  assert.equal(on.pace, 'on')
  const ahead = metricLine(input([['2026-10-20', 75]]), [epic()], ['paid_on_time'])
  assert.equal(ahead.pace, 'ahead')
  // The line is extended flat to the latest reading after the read day.
  assert.deepEqual(ahead.expected.at(-1), { date: '2026-10-20', value: 70 })
  assert.equal(paceSentence('Ledgerly', [ahead]).text, 'Ledgerly is ahead of the pace you planned.')
})

test('several: deltas add, starting from the first epic’s from', () => {
  const line = metricLine(
    input([['2026-11-15', 80]]),
    [
      epic(),
      epic({ slug: 'smart-defaults', shippedAt: '2026-10-01', from: 70, to: 75, readDate: '2026-10-31' }),
    ],
    ['paid_on_time']
  )
  assert.equal(line.grounded, 2)
  assert.equal(line.expected.at(-1)?.value, 75)
  assert.equal(line.markers.map((m) => m.slug).join(), 'overdue-reminders,smart-defaults')
})

test('a reading from before the first epic shipped says nothing about the plan', () => {
  const line = metricLine(input([['2026-08-20', 50]]), [epic()], ['paid_on_time'])
  assert.equal(line.latest, null)
  assert.equal(line.pace, null)
  assert.equal(paceSentence('Ledgerly', [line]).kind, 'no_reading')
})

test('a missing read day falls back to 30 days after shipping', () => {
  const line = metricLine(input([]), [epic({ readDate: null })], ['paid_on_time'])
  assert.deepEqual(line.expected.at(-1), { date: '2026-10-01', value: 70 })
})

test('lower is better: a falling target reads a lower actual as ahead', () => {
  const line = metricLine(
    input([['2026-10-05', 30]], { key: 'churn', name: 'Churn' }),
    [epic({ metric: 'churn', from: 40, to: 35 })],
    ['churn']
  )
  assert.equal(line.pace, 'ahead')
})

test('input vs North Star: an input epic moves only its input; a North Star epic has no actual to read', () => {
  const sources = [
    input([['2026-09-16', 60]]),
    { key: 'payable_sellers', name: 'Payable sellers', isNorthStar: true, series: [] },
  ]
  const lines = expectedLines(sources, [
    epic(),
    epic({ slug: 'ns-epic', metric: 'payable_sellers', from: 10, to: 20 }),
  ])
  assert.equal(lines[0].metric, 'payable_sellers', 'the North Star leads')
  assert.equal(lines[0].grounded, 1)
  assert.deepEqual(lines[0].actual, [])
  assert.equal(lines[0].pace, null)
  assert.equal(lines[1].grounded, 1)
  assert.equal(lines[1].expected[0].value, 60)
  // Only the input has a reading, so the sentence reads it.
  assert.equal(paceSentence('Ledgerly', lines).kind, 'behind')
})

test('mixed paces name each metric', () => {
  const lines = expectedLines(
    [input([['2026-09-16', 60]]), input([['2026-09-16', 80]], { key: 'setup', name: 'Setup completed' })],
    [epic(), epic({ slug: 'b', metric: 'setup', from: 60, to: 70 })]
  )
  assert.equal(
    paceSentence('Ledgerly', lines).text,
    'Mixed: ahead on Setup completed; behind on Paid on time.'
  )
  assert.equal(headlineLine(lines)?.metric, 'paid_on_time', 'ties go by key')
})

// ── Fresh review + codex, PR #299 ────────────────────────────────────────────────────────────────────────────────

test('an impossible ship or read day is no day: excluded, and nothing throws', () => {
  assert.equal(isGrounded(epic({ shippedAt: '2026-13-01' }), ['paid_on_time']), false)
  assert.equal(isGrounded(epic({ shippedAt: '2026-02-30' }), ['paid_on_time']), false)
  const line = metricLine(
    input([['2026-09-16', 60]]),
    [epic({ shippedAt: '2026-13-01' }), epic({ slug: 'b', readDate: '2026-02-30' })],
    ['paid_on_time']
  )
  assert.equal(line.grounded, 1)
  // The impossible read day falls back to 30 days after shipping.
  assert.deepEqual(line.expected.at(-1), { date: '2026-10-01', value: 70 })
})

test('a metric stored as a fraction can be behind: the tolerance scales with the metric', () => {
  const line = metricLine(
    input([['2026-10-05', 0.01]], { key: 'rate', name: 'Rate' }),
    [epic({ metric: 'rate', from: 0.1, to: 0.2 })],
    ['rate']
  )
  assert.equal(line.pace, 'behind')
})

test('a targeted metric with no reading yet is named, not folded into "all agree"', () => {
  const lines = expectedLines(
    [input([['2026-10-20', 75]]), input([], { key: 'setup', name: 'Setup completed' })],
    [epic(), epic({ slug: 'b', metric: 'setup', from: 60, to: 70 })]
  )
  assert.equal(
    paceSentence('Ledgerly', lines).text,
    'Ledgerly is ahead of the pace you planned on Paid on time. Setup completed has no reading yet.'
  )
})

test('no North Star registered says so, rather than "no targets"', () => {
  assert.equal(
    paceSentence('Ledgerly', []).text,
    "No North Star is registered yet, so we can't say if it's on pace."
  )
})
