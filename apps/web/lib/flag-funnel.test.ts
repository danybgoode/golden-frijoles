import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeFlagFunnel, type BetMeasure, type FunnelEvent } from './flag-funnel.ts'

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
