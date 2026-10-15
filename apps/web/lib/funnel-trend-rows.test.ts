import assert from 'node:assert/strict'
import test from 'node:test'
import { funnelTrendRows } from './funnel-trend-rows.ts'
import type { FunnelTrendRead } from './flag-funnel-read.ts'
import type { Funnel } from './flag-funnel.ts'

const funnel = (over: Partial<Funnel>): Funnel => ({
  base: 10,
  targeted: 10,
  exposed: 4,
  adopted: 3,
  retained: 2,
  satisfied: null,
  adoptedWithoutExposure: 1,
  rates: { targeted: null, exposed: null, adopted: null, retained: null, satisfied: null },
  ...over,
})
const source = { kind: 'feature', featureKey: 'f', targetEvent: 'e' } as const

test('not exposed renders as the bare state', () => {
  assert.deepEqual(funnelTrendRows({ state: 'not_exposed', source, by: 'month' }), { state: 'not_exposed' })
})

test('read and unreadable periods render as plain rows, counts only', () => {
  const trend: FunnelTrendRead = {
    state: 'measured',
    source,
    by: 'month',
    from: '2026-09-03T00:00:00.000Z',
    to: '2026-10-15T00:00:00.000Z',
    periods: [
      { label: '2026-09', start: 's1', end: 'e1', maturing: false, state: 'read', funnel: funnel({}) },
      {
        label: '2026-10',
        start: 'e1',
        end: 'e2',
        maturing: true,
        state: 'read',
        funnel: funnel({ retained: null }),
      },
      { label: '2026-08', start: 's0', end: 's1', maturing: false, state: 'unreadable', reason: 'cut' },
    ],
  }
  const out = funnelTrendRows(trend)
  assert.equal(out.state, 'measured')
  if (out.state !== 'measured') return
  assert.deepEqual(out.periods[0], {
    label: '2026-09',
    start: 's1',
    end: 'e1',
    maturing: false,
    state: 'read',
    exposed: 4,
    adopted: 3,
    retained: 2,
    adoptedWithoutExposure: 1,
  })
  assert.equal(out.periods[1].maturing, true)
  assert.deepEqual(out.periods[2], {
    label: '2026-08',
    start: 's0',
    end: 's1',
    maturing: false,
    state: 'unreadable',
    reason: 'cut',
  })
  assert.equal('funnel' in out.periods[0], false)
})
