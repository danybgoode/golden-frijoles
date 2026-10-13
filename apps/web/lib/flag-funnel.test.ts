import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  computeFlagFunnel,
  computeFunnel,
  personOf,
  type BetMeasure,
  type FunnelEvent,
} from './flag-funnel.ts'

const bet: BetMeasure = {
  flagKey: 'checkout.one_step',
  adoptedEvent: 'order_placed',
  retainedEvent: null,
  retentionDays: 7,
  satisfiedEvent: null,
}
const at = (day: number, hour = 0) => new Date(Date.UTC(2026, 9, day, hour)).toISOString()
const ev = (userId: string, event: string, day: number, extra: Partial<FunnelEvent> = {}): FunnelEvent => ({
  userId,
  event,
  createdAt: at(day),
  featureId: null,
  variant: null,
  ...extra,
})
const on = (userId: string, day: number) =>
  ev(userId, 'flag_evaluated', day, { featureId: 'checkout.one_step', variant: 'on' })
const off = (userId: string, day: number) =>
  ev(userId, 'flag_evaluated', day, { featureId: 'checkout.one_step', variant: 'off' })

test('one-bet-wired D2: base → targeted (everyone) → exposed (on) → adopted after exposure → retained in the window', () => {
  const events = [
    ev('a', 'page_viewed', 1),
    on('a', 1),
    ev('a', 'order_placed', 2),
    ev('a', 'order_placed', 5), // retained
    ev('b', 'page_viewed', 1),
    on('b', 1),
    ev('b', 'order_placed', 2),
    ev('b', 'order_placed', 20), // repeat too late
    ev('c', 'page_viewed', 1),
    off('c', 1),
    ev('c', 'order_placed', 3), // never exposed: beside the funnel
    ev('d', 'page_viewed', 1),
    on('d', 1), // exposed, did not adopt
    ev('e', 'page_viewed', 1),
    ev('system:server', '$error', 1),
    on('f', 1),
    ev('f', 'order_placed', 1, { createdAt: at(1, 0) }), // adoption at the same instant counts
  ]
  const f = computeFlagFunnel(events, bet)
  assert.deepEqual(
    {
      base: f.base,
      targeted: f.targeted,
      exposed: f.exposed,
      adopted: f.adopted,
      retained: f.retained,
      satisfied: f.satisfied,
      outside: f.adoptedWithoutExposure,
    },
    { base: 6, targeted: 6, exposed: 4, adopted: 3, retained: 1, satisfied: null, outside: 1 }
  )
  assert.equal(f.rates.targeted, 1)
  assert.equal(f.rates.exposed, 4 / 6)
  assert.equal(f.rates.adopted, 3 / 4)
  assert.equal(f.rates.retained, 1 / 3)
  assert.equal(f.rates.satisfied, null, 'not measured is not zero')
})

test('one-bet-wired D2: adopting before exposure is outside, unless the person adopts again after it', () => {
  const f = computeFlagFunnel(
    [
      ev('a', 'order_placed', 1),
      on('a', 2),
      ev('b', 'order_placed', 1),
      on('b', 2),
      ev('b', 'order_placed', 3),
    ],
    bet
  )
  assert.equal(f.adopted, 1)
  assert.equal(f.adoptedWithoutExposure, 1)
})

test('one-bet-wired D2: a named retention event and a satisfaction event among the retained', () => {
  const measured = { ...bet, retainedEvent: 'reorder', satisfiedEvent: 'rated_5' }
  const f = computeFlagFunnel(
    [
      on('a', 1),
      ev('a', 'order_placed', 1, { createdAt: at(1, 1) }),
      ev('a', 'reorder', 3),
      ev('a', 'rated_5', 4),
      on('b', 1),
      ev('b', 'order_placed', 1, { createdAt: at(1, 1) }),
      ev('b', 'order_placed', 3), // no reorder
      ev('c', 'rated_5', 1), // satisfied without adopting: not counted
    ],
    measured
  )
  assert.deepEqual([f.adopted, f.retained, f.satisfied], [2, 1, 1])
  assert.equal(f.rates.satisfied, 1)
})

test('one-bet-wired D2: another flag, an off evaluation and an empty period give no rates, never NaN', () => {
  const f = computeFlagFunnel([ev('a', 'flag_evaluated', 1, { featureId: 'other.flag', variant: 'on' })], bet)
  assert.equal(f.exposed, 0)
  assert.equal(f.rates.adopted, null)
  assert.deepEqual(computeFlagFunnel([], bet).rates, {
    targeted: null,
    exposed: null,
    adopted: null,
    retained: null,
    satisfied: null,
  })
})

test('verifier #341: the retention window is inclusive at its edge; satisfied counts at the adoption instant and only among the retained', () => {
  const measured = { ...bet, satisfiedEvent: 'rated_5' }
  const adoptAt = Date.UTC(2026, 9, 1, 12)
  const iso = (ms: number) => new Date(ms).toISOString()
  const f = computeFlagFunnel(
    [
      {
        userId: 'edge',
        event: 'flag_evaluated',
        createdAt: iso(adoptAt - 1),
        featureId: 'checkout.one_step',
        variant: 'on',
      },
      { userId: 'edge', event: 'order_placed', createdAt: iso(adoptAt), featureId: null, variant: null },
      {
        userId: 'edge',
        event: 'order_placed',
        createdAt: iso(adoptAt + 7 * 86_400_000),
        featureId: null,
        variant: null,
      },
      { userId: 'edge', event: 'rated_5', createdAt: iso(adoptAt), featureId: null, variant: null },
      {
        userId: 'late',
        event: 'flag_evaluated',
        createdAt: iso(adoptAt - 1),
        featureId: 'checkout.one_step',
        variant: 'on',
      },
      { userId: 'late', event: 'order_placed', createdAt: iso(adoptAt), featureId: null, variant: null },
      {
        userId: 'late',
        event: 'order_placed',
        createdAt: iso(adoptAt + 7 * 86_400_000 + 1),
        featureId: null,
        variant: null,
      },
      { userId: 'late', event: 'rated_5', createdAt: iso(adoptAt + 1), featureId: null, variant: null },
    ],
    measured
  )
  assert.equal(f.retained, 1, 'a repeat exactly at the window edge counts; one millisecond past it does not')
  assert.equal(
    f.satisfied,
    1,
    'satisfied at the adoption instant counts, and only for the retained (late is not)'
  )
})

test('verifier #341: a separately read base joins the funnel people, without system users', () => {
  const f = computeFlagFunnel([on('a', 1)], bet, { basePeople: new Set(['a', 'b', 'c', 'system:server']) })
  assert.equal(f.base, 3)
  assert.equal(f.rates.exposed, 1 / 3)
})

test('verifier #341: the base is the union of the separate read and the funnel people', () => {
  const f = computeFlagFunnel([on('a', 1), ev('a', 'order_placed', 2)], bet, { basePeople: new Set(['b']) })
  assert.equal(f.base, 2, 'a is in the funnel even when the (newest-first, capped) base read missed them')
})

test('verifier #341: the person is a user subject, else the event’s own user (an order or merchant subject is not a person)', () => {
  assert.equal(personOf({ user_id: 'system:server', subject_type: 'user', subject_id: 'u1' }), 'u1')
  assert.equal(personOf({ user_id: 'u1', subject_type: 'order', subject_id: 'o1' }), 'u1')
  assert.equal(personOf({ user_id: 'u1', subject_type: 'merchant', subject_id: 'm1' }), 'u1')
  assert.equal(personOf({ user_id: 'u1', subject_type: null, subject_id: null }), 'u1')
  assert.equal(personOf({ user_id: 'u1', subject_type: 'user', subject_id: null }), 'u1')
})

// tars-one-model D2 — Daniel, 2026-10-12: "if i want to check how the features performed over the last year i should".
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString()
const at2 = (userId: string, event: string, iso: string, extra: Partial<FunnelEvent> = {}): FunnelEvent => ({
  userId,
  event,
  createdAt: iso,
  featureId: null,
  variant: null,
  ...extra,
})
const onAt = (userId: string, iso: string) =>
  at2(userId, 'flag_evaluated', iso, { featureId: 'checkout.one_step', variant: 'on' })

test('tars-one-model D2: a year-old feature reads its whole life — an adoption months ago still counts', () => {
  const events = [
    onAt('nov', day(2025, 11, 3)),
    at2('nov', 'order_placed', day(2025, 12, 1)), // adopted 10 months ago
    onAt('sep', day(2026, 9, 20)),
    at2('sep', 'order_placed', day(2026, 9, 25)),
    onAt('idle', day(2026, 1, 5)),
  ]
  const whole = computeFlagFunnel(events, bet)
  assert.equal(whole.exposed, 3)
  assert.equal(whole.adopted, 2, 'the November adopter is not lost to a 90-day window')
  const recent = computeFlagFunnel(events, bet, { since: Date.parse(day(2026, 9, 1)) })
  assert.equal(recent.exposed, 1, 'a period is the people first exposed in it')
  assert.equal(recent.adopted, 1)
  assert.equal(
    recent.adoptedWithoutExposure,
    0,
    'an earlier cohort’s adoption is neither in nor beside this period'
  )
})

test('tars-one-model D1: a registry feature exposes by its target event, scoped to the feature; no adoption event is not measured', () => {
  const f = (userId: string, event: string, d: number) => ev(userId, event, d, { featureId: 'export' })
  const events = [
    f('a', 'export_viewed', 1),
    f('a', 'export_done', 2),
    f('a', 'export_done', 4),
    f('b', 'export_done', 2), // adopted, never saw it: beside
    ev('c', 'export_viewed', 1), // another feature's event of the same name: not this exposure
  ]
  const rule = { kind: 'feature', featureKey: 'export', targetEvent: 'export_viewed' } as const
  const measure = { adoptedEvent: 'export_done', retainedEvent: null, retentionDays: 7, satisfiedEvent: null }
  const funnel = computeFunnel(events, rule, measure)
  assert.deepEqual(
    [funnel.exposed, funnel.adopted, funnel.retained, funnel.adoptedWithoutExposure],
    [1, 1, 1, 1]
  )
  const unnamed = computeFunnel(events, rule, { ...measure, adoptedEvent: null })
  assert.equal(unnamed.exposed, 1)
  assert.deepEqual([unnamed.adopted, unnamed.retained, unnamed.satisfied], [null, null, null])
  assert.equal(unnamed.rates.adopted, null, 'not measured, never 0%')
  const anyEvent = computeFunnel(events, { ...rule, targetEvent: null }, measure)
  assert.equal(anyEvent.exposed, 2, 'no target event: any event of the feature exposes')
})

test('tars-one-model D2: an earlier cohort active in the period is not exposed in it; an old unexposed adoption is not beside it', () => {
  const events = [
    onAt('nov', day(2025, 11, 3)),
    at2('nov', 'page_viewed', day(2026, 9, 10)), // active now, but first got it last year
    at2('old', 'order_placed', day(2025, 12, 1)), // adopted without exposure, last year
    onAt('sep', day(2026, 9, 20)),
  ]
  const recent = computeFlagFunnel(events, bet, { since: Date.parse(day(2026, 9, 1)) })
  assert.equal(recent.base, 2, 'nov and sep were active in the period')
  assert.equal(recent.exposed, 1, 'only sep first got it in the period')
  assert.equal(recent.adoptedWithoutExposure, 0)
  assert.equal(
    computeFlagFunnel(events, bet).adoptedWithoutExposure,
    1,
    'over the whole life, old is beside it'
  )
})

test('verifier #344: the cohort is decided by the EARLIEST exposure, whatever order the events arrive in', () => {
  // Older first, then newer: a rule that keeps the LAST exposure seen would wrongly put them in this period.
  const events = [onAt('late', day(2025, 11, 3)), onAt('late', day(2026, 9, 20))]
  const recent = computeFlagFunnel([...events, at2('late', 'page_viewed', day(2026, 9, 21))], bet, {
    since: Date.parse(day(2026, 9, 1)),
  })
  assert.equal(recent.exposed, 0, 'first exposed last year, so not in this period’s cohort')
  const newestFirst = computeFlagFunnel(
    [...[...events].reverse(), at2('late', 'page_viewed', day(2026, 9, 21))],
    bet,
    {
      since: Date.parse(day(2026, 9, 1)),
    }
  )
  assert.equal(
    newestFirst.exposed,
    0,
    'and newest first: a rule that keeps the FIRST exposure seen is wrong too'
  )
})
