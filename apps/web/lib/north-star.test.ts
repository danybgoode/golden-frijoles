import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDailySeries, computeDistinctMonthlySeries, type DailySeriesEvent } from './north-star.ts'

// proving-workspaces-reading D8 — the distinct-per-month series, and the `count` series every existing input reads,
// pinned unchanged.

const ev = (createdAt: string, userId: string, event = 'workspace_proved_bet'): DailySeriesEvent => ({
  event,
  createdAt,
  userId,
})
const NOW = new Date('2026-12-15T12:00:00Z')

test('count (every existing input): events per UTC day, days with events only, ascending — pinned', () => {
  const events = [
    ev('2026-11-02T23:59:59Z', 'u1'),
    ev('2026-11-01T10:00:00Z', 'u1'),
    ev('2026-11-01T11:00:00Z', 'u1'),
    ev('2026-11-01T12:00:00Z', 'u2', 'other_event'),
  ]
  assert.deepEqual(computeDailySeries(events, 'workspace_proved_bet'), [
    { date: '2026-11-01', value: 2 },
    { date: '2026-11-02', value: 1 },
  ])
})

test('repeats by one id count once in the month', () => {
  const series = computeDistinctMonthlySeries(
    [ev('2026-12-02T09:00:00Z', 'w1'), ev('2026-12-02T10:00:00Z', 'w1'), ev('2026-12-05T10:00:00Z', 'w1')],
    'workspace_proved_bet',
    NOW
  )
  assert.deepEqual(series, [
    { date: '2026-12-02', value: 1 },
    { date: '2026-12-05', value: 1 },
  ])
})

test('two ids: the running count reaches 2', () => {
  const series = computeDistinctMonthlySeries(
    [ev('2026-12-03T10:00:00Z', 'w2'), ev('2026-12-02T10:00:00Z', 'w1'), ev('2026-12-09T10:00:00Z', 'w1')],
    'workspace_proved_bet',
    NOW
  )
  assert.deepEqual(series, [
    { date: '2026-12-02', value: 1 },
    { date: '2026-12-03', value: 2 },
    { date: '2026-12-09', value: 2 },
  ])
})

test('the month boundary resets the count, and a month with no event yet reads 0 from its 1st', () => {
  const series = computeDistinctMonthlySeries(
    [ev('2026-10-20T10:00:00Z', 'w1'), ev('2026-10-31T23:59:59Z', 'w2'), ev('2026-11-01T00:00:00Z', 'w2')],
    'workspace_proved_bet',
    NOW
  )
  assert.deepEqual(series, [
    { date: '2026-10-20', value: 1 },
    { date: '2026-10-31', value: 2 },
    { date: '2026-11-01', value: 1 }, // w2 again, but a new month: counted afresh, w1 not carried over
    { date: '2026-12-01', value: 0 }, // nothing yet in December: the reading on 15 Dec is 0, never November's 1
  ])
})

test('the reset crosses a year and stops at now', () => {
  const series = computeDistinctMonthlySeries(
    [ev('2026-12-20T10:00:00Z', 'w1')],
    'workspace_proved_bet',
    new Date('2027-02-03T00:00:00Z')
  )
  assert.deepEqual(series, [
    { date: '2026-12-20', value: 1 },
    { date: '2027-01-01', value: 0 },
    { date: '2027-02-01', value: 0 },
  ])
})

test('other events and events without an id are not counted; nothing at all is an empty series', () => {
  assert.deepEqual(
    computeDistinctMonthlySeries(
      [
        ev('2026-12-02T10:00:00Z', 'w1', 'other'),
        { event: 'workspace_proved_bet', createdAt: '2026-12-02T10:00:00Z' },
      ],
      'workspace_proved_bet',
      NOW
    ),
    []
  )
})
