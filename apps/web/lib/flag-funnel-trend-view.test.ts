import assert from 'node:assert/strict'
import { test } from 'node:test'
import { funnelTrendView, trendByLinks } from './flag-funnel-view.ts'
import type { Funnel, TrendPeriod } from './flag-funnel.ts'
import type { FunnelTrendRead } from './flag-funnel-read.ts'

// funnel-truth S1.3 (D5) — the trend on screen, pure.

const funnel = (
  exposed: number,
  adopted: number | null,
  retained: number | null,
  satisfied: number | null = null
): Funnel => ({
  base: 10,
  targeted: 10,
  exposed,
  adopted,
  retained,
  satisfied,
  adoptedWithoutExposure: 0,
  rates: { targeted: 1, exposed: null, adopted: null, retained: null, satisfied: null },
})
const read = (label: string, f: Funnel, maturing = false): TrendPeriod => ({
  label,
  start: `${label}-01T00:00:00.000Z`,
  end: `${label}-28T00:00:00.000Z`,
  maturing,
  state: 'read',
  funnel: f,
})
const cut = (label: string): TrendPeriod => ({
  label,
  start: `${label}-01T00:00:00.000Z`,
  end: `${label}-28T00:00:00.000Z`,
  maturing: true,
  state: 'unreadable',
  reason: 'More exposures than one read covers.',
})
const trend = (periods: TrendPeriod[]): FunnelTrendRead => ({
  state: 'measured',
  source: { kind: 'flag', flagKey: 'x' },
  by: 'month',
  from: '2026-07-01T00:00:00.000Z',
  to: '2026-10-15T00:00:00.000Z',
  periods,
})

test('D5: a failed read and nobody exposed say so in words, never a zero', () => {
  assert.equal(funnelTrendView(null).kind, 'unreadable')
  assert.equal(
    funnelTrendView({ state: 'not_exposed', source: { kind: 'flag', flagKey: 'x' }, by: 'month' }).kind,
    'not_exposed'
  )
})

test('D5/D2: one chart per stage; a maturing cohort’s retention is not a point and reads "still maturing"', () => {
  const v = funnelTrendView(
    trend([
      read('2026-08', funnel(10, 4, 2)),
      read('2026-09', funnel(20, 10, 5)),
      read('2026-10', funnel(5, 2, 0), true),
    ])
  )
  if (v.kind !== 'measured') throw new Error(v.kind)
  assert.deepEqual(
    v.stages.map((s) => [s.label, s.series.map((p) => p.value), s.value]),
    [
      ['Got it (people)', [10, 20, 5], 5],
      ['Adopted (% who got it)', [40, 50, 40], 40],
      ['Retained (% of adopters)', [50, 50], 50], // October is maturing: no point, never a drop to 0
    ]
  )
  assert.deepEqual(v.rows[2], {
    period: '2026-10',
    gotIt: '5',
    adopted: '2 (40%)',
    retained: 'still maturing',
    satisfied: null,
  })
  assert.deepEqual(v.unreadable, [])
})

test('D5/D3: an unreadable period is never a point or a number; it is named in words', () => {
  const v = funnelTrendView(
    trend([read('2026-08', funnel(10, 4, 2)), read('2026-09', funnel(20, 10, 5)), cut('2026-10')])
  )
  if (v.kind !== 'measured') throw new Error(v.kind)
  assert.deepEqual(
    v.stages[0].series.map((p) => p.date),
    ['2026-08-01', '2026-09-01']
  )
  assert.deepEqual(v.rows[2], {
    period: '2026-10',
    gotIt: 'couldn’t be read',
    adopted: '',
    retained: '',
    satisfied: null,
  })
  assert.deepEqual(v.unreadable, ['2026-10: More exposures than one read covers.'])
})

test('D5: no adoption event means one stage and "not measured"; satisfaction appears only when measured', () => {
  const unmeasured = funnelTrendView(trend([read('2026-09', funnel(3, null, null))]))
  if (unmeasured.kind !== 'measured') throw new Error(unmeasured.kind)
  assert.deepEqual(
    unmeasured.stages.map((s) => s.label),
    ['Got it (people)']
  )
  assert.equal(unmeasured.rows[0].adopted, 'not measured')
  const happy = funnelTrendView(trend([read('2026-08', funnel(10, 4, 2, 1))]))
  if (happy.kind !== 'measured') throw new Error(happy.kind)
  assert.equal(happy.stages.at(-1)!.label, 'Satisfied (% of retained)')
  assert.equal(happy.rows[0].satisfied, '1 (50%)')
})

test('D5: the grouping links mark the current one', () => {
  assert.deepEqual(
    trendByLinks('week').map((l) => [l.by, l.current]),
    [
      ['month', false],
      ['week', true],
    ]
  )
})

test('D12 (Codex, #379): a cut segment read is unreadable, never a measured funnel; the trend caption names its period', async () => {
  const { flagFunnelView } = await import('./flag-funnel-view.ts')
  const cutSegment = flagFunnelView(
    {
      state: 'measured',
      source: { kind: 'flag', flagKey: 'x' },
      period: 'all',
      funnel: funnel(5, 2, 1),
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-10-15T00:00:00.000Z',
      truncated: { exposures: false, events: false, base: false, segment: true },
    },
    'power-users'
  )
  assert.equal(cutSegment.kind, 'unreadable')
  const weekly = funnelTrendView({ ...trend([read('2026-10', funnel(3, 1, 0))]), by: 'week' }, 'power-users')
  assert.ok(weekly.kind === 'measured' && /Each week counts/.test(weekly.segment ?? ''))
})
