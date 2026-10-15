import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeFunnel,
  computeFunnelTrend,
  periodStart,
  trendPeriods,
  type ExposureRule,
  type FunnelEvent,
  type FunnelMeasure,
} from './flag-funnel.ts'

// funnel-truth S1.1 (D1, D2) — the funnel by cohort period, pure.

const rule: ExposureRule = { kind: 'flag', flagKey: 'checkout.one_step' }
const measure: FunnelMeasure = {
  adoptedEvent: 'order_placed',
  retainedEvent: null,
  retentionDays: 7,
  satisfiedEvent: null,
}
const at = (month: number, day: number) => new Date(Date.UTC(2026, month - 1, day)).toISOString()
const ev = (
  userId: string,
  event: string,
  month: number,
  day: number,
  extra: Partial<FunnelEvent> = {}
): FunnelEvent => ({
  userId,
  event,
  createdAt: at(month, day),
  featureId: null,
  variant: null,
  ...extra,
})
const on = (u: string, month: number, day: number) =>
  ev(u, 'flag_evaluated', month, day, { featureId: 'checkout.one_step', variant: 'on' })
const now = Date.UTC(2026, 9, 15) // 2026-10-15

const counts = (f: ReturnType<typeof computeFunnel>) => [f.exposed, f.adopted, f.retained]

test('D1: nobody exposed has no trend (not an empty line)', () => {
  assert.equal(computeFunnelTrend([], rule, measure, { by: 'month', now }), null)
  assert.equal(computeFunnelTrend([ev('a', 'order_placed', 8, 1)], rule, measure, { by: 'month', now }), null)
})

test('D1: one period — the first exposure in the current month gives one cohort', () => {
  const t = computeFunnelTrend([on('a', 10, 2), ev('a', 'order_placed', 10, 3)], rule, measure, {
    by: 'month',
    now,
  })!
  assert.deepEqual(
    t.periods.map((p) => p.label),
    ['2026-10']
  )
  const p = t.periods[0]
  assert.equal(p.state, 'read')
  assert.deepEqual(p.state === 'read' && counts(p.funnel), [1, 1, 0])
})

test('D1: a gap month is a real zero, and a cohort is followed past its own month', () => {
  const events = [
    on('a', 7, 10),
    ev('a', 'order_placed', 9, 2), // adopts two months later: still July's cohort
    ev('a', 'order_placed', 9, 4), // retained within 7 days of adopting
    on('b', 9, 20),
    ev('b', 'order_placed', 9, 21),
    on('a', 9, 25), // a later exposure never moves a person out of the cohort of their first
  ]
  const t = computeFunnelTrend(events, rule, measure, { by: 'month', now })!
  assert.deepEqual(
    t.periods.map((p) => [p.label, p.state === 'read' ? counts(p.funnel) : null]),
    [
      ['2026-07', [1, 1, 1]],
      ['2026-08', [0, 0, 0]],
      ['2026-09', [1, 1, 0]],
      ['2026-10', [0, 0, 0]],
    ]
  )
})

test('D2: a cohort younger than retention_days past its end is maturing; older ones are not', () => {
  const t = computeFunnelTrend([on('a', 9, 1)], rule, measure, { by: 'month', now: Date.UTC(2026, 9, 5) })!
  // September ends 2026-10-01; + 7 days = 2026-10-08 > now (2026-10-05): still maturing. October is the current period.
  assert.deepEqual(
    t.periods.map((p) => [p.label, p.maturing]),
    [
      ['2026-09', true],
      ['2026-10', true],
    ]
  )
  const later = computeFunnelTrend([on('a', 9, 1)], rule, measure, {
    by: 'month',
    now: Date.UTC(2026, 9, 9),
  })!
  assert.deepEqual(
    later.periods.map((p) => [p.label, p.maturing]),
    [
      ['2026-09', false],
      ['2026-10', true],
    ]
  )
})

test('D1: the whole-life funnel exposed is the sum of the cohorts’ exposed (months and weeks)', () => {
  const events = [
    on('a', 6, 30),
    on('b', 7, 1),
    on('c', 7, 31),
    on('d', 8, 1),
    on('b', 8, 3),
    on('e', 10, 14),
    ev('a', 'order_placed', 7, 2),
    ev('x', 'order_placed', 7, 2), // never exposed
    ev('f', 'page_viewed', 7, 5), // active in July, first exposed in September: September's cohort only
    on('f', 9, 1),
  ]
  const all = computeFunnel(events, rule, measure)
  for (const by of ['month', 'week'] as const) {
    const t = computeFunnelTrend(events, rule, measure, { by, now })!
    const sum = t.periods.reduce((n, p) => n + (p.state === 'read' ? p.funnel.exposed : 0), 0)
    assert.equal(sum, all.exposed, by)
    const beside = t.periods.reduce(
      (n, p) => n + (p.state === 'read' ? p.funnel.adoptedWithoutExposure : 0),
      0
    )
    assert.equal(beside, all.adoptedWithoutExposure, `${by}: beside the funnel, partitioned too`)
  }
})

test('D1: a period’s base is the people active in it, from the read and from the funnel’s own events', () => {
  const t = computeFunnelTrend([on('a', 9, 3)], rule, measure, {
    by: 'month',
    now,
    baseActivity: [
      { person: 'z', at: Date.UTC(2026, 8, 10) },
      { person: 'y', at: Date.UTC(2026, 9, 1) }, // October's, not September's
      { person: 'system:server', at: Date.UTC(2026, 8, 10) },
    ],
  })!
  const [sep, oct] = t.periods
  assert.equal(sep.state === 'read' && sep.funnel.base, 2)
  assert.equal(oct.state === 'read' && oct.funnel.base, 1)
})

test('D1: until absent is today’s funnel exactly; until closes the cohort, not the follow-through', () => {
  const events = [
    on('a', 9, 1),
    on('b', 9, 20),
    ev('a', 'order_placed', 9, 25),
    ev('c', 'order_placed', 9, 2),
  ]
  assert.deepEqual(
    computeFunnel(events, rule, measure, { until: undefined }),
    computeFunnel(events, rule, measure)
  )
  const closed = computeFunnel(events, rule, measure, { until: Date.UTC(2026, 8, 10) })
  assert.deepEqual([closed.exposed, closed.adopted, closed.adoptedWithoutExposure], [1, 1, 1])
})

test('D1: weeks start on Monday 00:00 UTC; months on the 1st', () => {
  const thu = Date.UTC(2026, 9, 15, 13) // Thursday
  assert.equal(new Date(periodStart(thu, 'week')).toISOString(), '2026-10-12T00:00:00.000Z')
  assert.equal(new Date(periodStart(Date.UTC(2026, 9, 12), 'week')).toISOString(), '2026-10-12T00:00:00.000Z')
  assert.equal(
    new Date(periodStart(Date.UTC(2026, 9, 11, 23), 'week')).toISOString(),
    '2026-10-05T00:00:00.000Z'
  )
  assert.deepEqual(
    trendPeriods(Date.UTC(2025, 11, 31), Date.UTC(2026, 1, 1), 'month').map((p) => p.label),
    ['2025-12', '2026-01', '2026-02']
  )
})
