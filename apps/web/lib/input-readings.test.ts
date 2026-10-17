import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inputReadings, isReadingsCut, readingsSummary } from './input-readings.ts'

// result-record D14 — the readings an agent gets: one input, cut at `to`, the latest named, nothing invented.

const inputs = [
  {
    key: 'grounded_bets_share',
    name: 'Grounded bets',
    valueSource: 'external_push',
    series: [
      { date: '2026-11-05', value: 0.72 },
      { date: '2026-10-01', value: 0.61 },
      { date: '2026-11-01', value: 0.68 },
    ],
  },
  { key: 'other', name: 'Other', valueSource: 'telemetry_event', series: [] },
]

test('the input, its readings in day order, and the latest one', () => {
  const view = inputReadings(inputs, 'grounded_bets_share')
  assert.deepEqual(
    view?.readings.map((r) => r.date),
    ['2026-10-01', '2026-11-01', '2026-11-05']
  )
  assert.deepEqual(view?.latest, { date: '2026-11-05', value: 0.72 })
  assert.deepEqual(view?.input, {
    key: 'grounded_bets_share',
    name: 'Grounded bets',
    valueSource: 'external_push',
  })
})

test('`to` cuts the series: latest is the last reading on or before it', () => {
  assert.deepEqual(inputReadings(inputs, 'grounded_bets_share', '2026-11-04')?.latest, {
    date: '2026-11-01',
    value: 0.68,
  })
  assert.deepEqual(inputReadings(inputs, 'grounded_bets_share', '2026-11-01')?.latest?.date, '2026-11-01')
  assert.equal(
    inputReadings(inputs, 'grounded_bets_share', '2026-09-01')?.latest,
    null,
    'nothing yet is not a zero'
  )
})

test('an unknown input is null (not grounded); an input with no readings has latest null', () => {
  assert.equal(inputReadings(inputs, 'nope'), null)
  assert.equal(inputReadings(inputs, 'other')?.latest, null)
})

test('the cut must be a day', () => {
  assert.equal(isReadingsCut(undefined), true)
  assert.equal(isReadingsCut('2026-11-04'), true)
  assert.equal(isReadingsCut('4 Nov'), false)
  assert.equal(isReadingsCut('2026-02-30'), false)
  assert.equal(isReadingsCut('2026-11-04T00:00:00Z'), false)
})

// proving-workspaces-reading (verifier, #401) — a running distinct count is a level, never a sum.
test('readingsSummary sums a count series and names the latest level of a distinct_monthly one', () => {
  const series = [
    { date: '2026-11-03', value: 1 },
    { date: '2026-11-09', value: 2 },
    { date: '2026-11-20', value: 3 },
    { date: '2026-12-01', value: 0 },
  ]
  assert.equal(readingsSummary({ series }), '4 readings, totalling 6 across 2026-11-03 → 2026-12-01.')
  const distinct = readingsSummary({ aggregate: 'distinct_monthly', series })
  assert.ok(distinct.startsWith('3 days with a reading; 0 distinct this month on 2026-12-01'), distinct)
  assert.ok(!distinct.includes('totalling'))
  assert.equal(readingsSummary({ aggregate: 'distinct_monthly', series: [] }), 'Nothing recorded yet.')
})
