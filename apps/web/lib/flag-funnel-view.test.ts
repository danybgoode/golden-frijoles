import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flagFunnelView } from './flag-funnel-view.ts'

const funnel = {
  base: 10,
  targeted: 10,
  exposed: 4,
  adopted: 2,
  retained: 1,
  satisfied: null,
  adoptedWithoutExposure: 1,
  rates: { targeted: 1, exposed: 0.4, adopted: 0.5, retained: 0.5, satisfied: null },
}

test('one-bet-wired D7: each stage with its share; satisfied not measured; outside adopters beside; failures said', () => {
  const v = flagFunnelView({
    state: 'measured',
    flagKey: 'k',
    funnel,
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-10T00:00:00Z',
    truncated: { exposures: false, events: false, base: false },
  })
  assert.equal(v.kind, 'measured')
  if (v.kind !== 'measured') return
  assert.deepEqual(
    v.rows.map((r) => `${r.stage}: ${r.people} ${r.share}`.trim()),
    [
      'Active users: 10',
      'Targeted (everyone): 10 100%',
      'Got the flag on: 4 40%',
      'Adopted: 2 50%',
      'Retained: 1 50%',
      'Satisfied: not measured',
    ]
  )
  assert.match(v.beside, /^1 person adopted without the flag on/)
  assert.equal(v.note, null)
  assert.equal(flagFunnelView(null).kind, 'unreadable')
  assert.match(
    (flagFunnelView({ state: 'not_exposed', flagKey: 'k' }) as { text: string }).text,
    /No one has been counted with this flag on yet/
  )
})

test('one-bet-wired D7: a funnel shows only for an Epic with a flag and an adoption event (both pages use this)', async () => {
  const { funnelBetOf } = await import('./flag-funnel-view.ts')
  const measure = {
    targetSegment: 'everyone' as const,
    adoptedEvent: 'order_placed',
    retainedEvent: null,
    retentionDays: 7,
    satisfiedEvent: null,
  }
  assert.deepEqual(funnelBetOf({ grain: 'Epic', flagKey: 'a.b_enabled', measure }), {
    flagKey: 'a.b_enabled',
    adoptedEvent: 'order_placed',
    retainedEvent: null,
    retentionDays: 7,
    satisfiedEvent: null,
  })
  assert.equal(funnelBetOf({ grain: 'Epic', flagKey: null, measure }), null)
  assert.equal(funnelBetOf({ grain: 'Epic', flagKey: 'a.b_enabled', measure: null }), null)
  assert.equal(funnelBetOf({ grain: 'Seed', flagKey: 'a.b_enabled', measure }), null)
})

test('verifier #341: a capped read says which numbers it skews', () => {
  const view = flagFunnelView({
    state: 'measured',
    flagKey: 'k',
    funnel,
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-10T00:00:00Z',
    truncated: { exposures: true, events: false, base: true },
  })
  assert.equal(view.kind, 'measured')
  if (view.kind !== 'measured') return
  assert.match(view.note ?? '', /got-the-flag-on and adopted read low.*the first two shares may read high/)
})
