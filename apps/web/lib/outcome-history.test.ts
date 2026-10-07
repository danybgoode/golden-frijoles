import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  deltaWords,
  historyNote,
  monthLabel,
  speedHistory,
  windowCutoffs,
  type EarlierWindow,
} from './outcome-history.ts'

// outcome-report-v2 S2.1 (D8) — How fast against the last two months, with 0, 1 and 2 earlier versions.

const CURRENT = [
  { key: 'epic_lead_time', raw: 2 },
  { key: 'epic_throughput', raw: 5.37 },
  { key: 'review_latency', raw: null },
]

const window = (id: string, generatedAt: string, lead: number | null, through: number): EarlierWindow => ({
  id,
  version: Number(id),
  generatedAt,
  speed: [
    { key: 'epic_lead_time', raw: lead },
    { key: 'epic_throughput', raw: through },
    { key: 'review_latency', raw: null },
  ],
})

test('the cut-offs are this month’s start and last month’s, in UTC — across a year boundary too', () => {
  assert.deepEqual(windowCutoffs('2026-10-07T14:05:21.703Z'), [
    '2026-10-01T00:00:00.000Z',
    '2026-09-01T00:00:00.000Z',
  ])
  assert.deepEqual(windowCutoffs('2027-01-03T00:00:00Z'), [
    '2027-01-01T00:00:00.000Z',
    '2026-12-01T00:00:00.000Z',
  ])
  assert.equal(windowCutoffs('not a date'), null)
  assert.equal(monthLabel('2026-09-30T23:29:37Z'), 'Sep')
})

test('two earlier versions: a delta per metric per month, newest first; no number on either side is no delta', () => {
  const h = speedHistory(CURRENT, [
    window('191', '2026-09-30T23:29:37Z', 2, 3.9),
    window('99', '2026-08-31T20:02:35Z', 2.5, 3.71),
  ])
  assert.equal(h.windows, 2)
  assert.deepEqual(h.months, ['Sep', 'Aug'])
  assert.deepEqual(h.byKey.epic_throughput, [
    { month: 'Sep', version: 191, delta: 1.47 },
    { month: 'Aug', version: 99, delta: 1.66 },
  ])
  assert.equal(deltaWords(h.byKey.epic_throughput[0]), '▲ 1.47 vs Sep')
  assert.equal(deltaWords(h.byKey.epic_lead_time[0]), '±0 vs Sep')
  assert.equal(deltaWords(h.byKey.epic_lead_time[1]), '▼ 0.5 vs Aug')
  assert.equal(deltaWords(h.byKey.review_latency[0]), 'no comparison with Sep')
  assert.equal(historyNote(h), null)
})

test('one earlier version — or two reads landing on the same version — says how many it has', () => {
  const one = speedHistory(CURRENT, [window('191', '2026-09-30T23:29:37Z', 2, 3.9), null])
  assert.equal(one.windows, 1)
  assert.equal(historyNote(one), 'Only one earlier month (Sep) has a report to compare with.')
  const same = window('191', '2026-08-30T00:00:00Z', 2, 3.9)
  assert.equal(speedHistory(CURRENT, [same, same]).windows, 1)
})

test('none: the first month says so; a failed read says so differently', () => {
  const none = speedHistory(CURRENT, [null, null])
  assert.equal(none.windows, 0)
  assert.match(historyNote(none) ?? '', /first month/)
  const failed = speedHistory(CURRENT, null)
  assert.equal(failed.windows, null)
  assert.match(historyNote(failed) ?? '', /could not be read/)
})
