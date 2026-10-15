import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeFunnel,
  computeFunnelTrend,
  segmentMembers,
  type ExposureRule,
  type FunnelEvent,
  type FunnelMeasure,
  type FunnelTrend,
  type SegmentRule,
} from './flag-funnel.ts'

// funnel-truth S2.2 (D11, D12) — Targeted is the segment, pure.

const rule: ExposureRule = { kind: 'flag', flagKey: 'checkout.one_step' }
const measure: FunnelMeasure = {
  adoptedEvent: 'order_placed',
  retainedEvent: null,
  retentionDays: 7,
  satisfiedEvent: null,
}
const power: SegmentRule = { key: 'power-users', event: 'report_run', minCount: 2, days: 30 }
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

test('D11: a segment is the people with at least N of its event in the D days up to a moment, never system users', () => {
  const events = [
    ev('a', 'report_run', 9, 1),
    ev('a', 'report_run', 9, 20),
    ev('b', 'report_run', 9, 20), // once: below the minimum
    ev('c', 'report_run', 8, 1), // too old for 30 days before 2026-09-25
    ev('c', 'report_run', 9, 20),
    ev('system:server', 'report_run', 9, 20),
    ev('system:server', 'report_run', 9, 21),
    ev('d', 'report_run', 9, 24),
    ev('d', 'report_run', 9, 26), // after the moment
  ]
  assert.deepEqual([...segmentMembers(events, power, Date.UTC(2026, 8, 25))], ['a'])
  // The window is (at − days, at]: an event exactly at `at` counts, one exactly `days` before does not.
  const edge = [ev('e', 'report_run', 9, 25), ev('e', 'report_run', 8, 26)]
  assert.deepEqual([...segmentMembers(edge, power, Date.UTC(2026, 8, 25))], [])
  assert.deepEqual(
    [...segmentMembers([...edge, ev('e', 'report_run', 8, 27)], power, Date.UTC(2026, 8, 25))],
    ['e']
  )
})

test('D12: Targeted is the segment’s share of the base; exposed people outside it and their adoptions go beside', () => {
  const events = [
    ev('a', 'page_viewed', 9, 1),
    on('a', 9, 2),
    ev('a', 'order_placed', 9, 3),
    ev('b', 'page_viewed', 9, 1),
    on('b', 9, 2), // in the segment, did not adopt
    ev('c', 'page_viewed', 9, 1),
    on('c', 9, 2), // outside the segment, adopted: beside
    ev('c', 'order_placed', 9, 4),
    on('d', 9, 2), // outside, did not adopt
    ev('e', 'page_viewed', 9, 1), // active, outside, never exposed
  ]
  const f = computeFunnel(events, rule, measure, { segment: new Set(['a', 'b', 'z']) }) // z is not in the base
  assert.deepEqual(
    [f.base, f.targeted, f.exposed, f.adopted, f.outside],
    [5, 2, 2, 1, { exposed: 2, adopted: 1 }]
  )
  assert.equal(f.rates.targeted, 2 / 5)
  assert.equal(f.rates.exposed, 1, 'both targeted people got it')
  assert.equal(f.rates.adopted, 1 / 2, 'c’s adoption is beside the funnel, not in its rate')
  const unmeasured = computeFunnel(
    events,
    rule,
    { ...measure, adoptedEvent: null },
    { segment: new Set(['a']) }
  )
  assert.deepEqual(unmeasured.outside, { exposed: 3, adopted: null }, 'not measured is not zero')
})

test('D12: everyone is today’s funnel exactly — no `outside`, the same numbers', () => {
  const events = [
    ev('a', 'page_viewed', 9, 1),
    on('a', 9, 2),
    ev('a', 'order_placed', 9, 3),
    ev('c', 'order_placed', 9, 4),
  ]
  const f = computeFunnel(events, rule, measure)
  assert.equal('outside' in f, false)
  assert.deepEqual(f, {
    base: 2,
    targeted: 2,
    exposed: 1,
    adopted: 1,
    retained: 0,
    satisfied: null,
    adoptedWithoutExposure: 1,
    rates: { targeted: 1, exposed: 0.5, adopted: 1, retained: 0, satisfied: null },
  })
})

test('D12: the trend takes each period’s segment as of its end', () => {
  const events = [
    ev('a', 'report_run', 8, 10),
    ev('a', 'report_run', 8, 12), // a power user in August …
    on('a', 8, 15),
    on('b', 9, 15), // b never runs reports: outside in September
    ev('a', 'page_viewed', 9, 16), // … but no longer as of September's end (30 days)
    on('c', 9, 16),
    ev('c', 'report_run', 9, 17),
    ev('c', 'report_run', 9, 18),
  ]
  const t: FunnelTrend = computeFunnelTrend(events, rule, measure, {
    by: 'month',
    now: Date.UTC(2026, 9, 15),
    segment: power,
  })!
  const aug = t.periods[0]
  const sep = t.periods[1]
  assert.ok(aug.state === 'read' && sep.state === 'read')
  assert.deepEqual(
    [aug.funnel.targeted, aug.funnel.exposed, aug.funnel.outside],
    [1, 1, { exposed: 0, adopted: 0 }]
  )
  assert.deepEqual(
    [sep.funnel.targeted, sep.funnel.exposed, sep.funnel.outside],
    [1, 1, { exposed: 1, adopted: 0 }]
  )
})
