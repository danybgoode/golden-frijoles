import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flagFunnelView, funnelModelNote, FUNNEL_MODEL_NOTE_UNTIL, periodLinks } from './flag-funnel-view.ts'

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
    source: { kind: 'flag', flagKey: 'k' },
    period: 'all',
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
    (
      flagFunnelView({ state: 'not_exposed', source: { kind: 'flag', flagKey: 'k' }, period: 'all' }) as {
        text: string
      }
    ).text,
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
    source: { kind: 'flag', flagKey: 'k' },
    period: 'all',
    funnel,
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-10T00:00:00Z',
    truncated: { exposures: true, events: false, base: true },
  })
  assert.equal(view.kind, 'measured')
  if (view.kind !== 'measured') return
  assert.match(view.note ?? '', /got-the-flag-on and adopted read low.*the first two shares may read high/)
})

test('tars-one-model D1: a stage with no event named reads "not measured", never 0 or "null"', () => {
  const unmeasured = {
    ...funnel,
    adopted: null,
    retained: null,
    satisfied: null,
    rates: { ...funnel.rates, adopted: null, retained: null, satisfied: null },
  }
  const view = flagFunnelView({
    state: 'measured',
    source: { kind: 'flag', flagKey: 'k' },
    period: 'all',
    funnel: unmeasured,
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-10T00:00:00Z',
    truncated: { exposures: false, events: false, base: false },
  })
  assert.equal(view.kind, 'measured')
  if (view.kind !== 'measured') return
  for (const stage of ['Adopted', 'Retained', 'Satisfied'])
    assert.deepEqual(
      view.rows.find((r) => r.stage === stage),
      { stage, people: 'not measured', share: '' }
    )
})

const featureRead = (targetEvent: string | null, over: Partial<typeof funnel> = {}) =>
  ({
    state: 'measured',
    source: { kind: 'feature', featureKey: 'setup_guide', targetEvent },
    period: '30d',
    funnel: { ...funnel, ...over },
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-10T00:00:00Z',
    truncated: { exposures: false, events: false, base: false },
  }) as const

test('tars-one-model S2.1: a feature source says "Saw it", "without seeing it"; flag words are unchanged', () => {
  const v = flagFunnelView(featureRead('guide_opened'))
  assert.equal(v.kind, 'measured')
  if (v.kind !== 'measured') return
  assert.equal(v.rows[2].stage, 'Saw it (guide_opened)')
  assert.match(v.beside, /^1 person adopted without seeing it/)
  assert.equal(v.note, null)
  const none = flagFunnelView(featureRead('guide_opened', { adoptedWithoutExposure: 0 }))
  assert.equal((none as { beside: string }).beside, 'Nobody adopted without seeing it.')
  const any = flagFunnelView(featureRead(null))
  assert.equal((any as { rows: { stage: string }[] }).rows[2].stage, 'Used it')
})

test('tars-one-model S2.1: a feature with no adoption event says so, and "not measured" is not a zero', () => {
  const v = flagFunnelView(featureRead('guide_opened', { adopted: null, retained: null }))
  assert.equal(v.kind, 'measured')
  if (v.kind !== 'measured') return
  assert.equal(v.rows[3].people, 'not measured')
  assert.match(v.note ?? '', /Name an adoption event for this feature to read adoption\./)
})

test('tars-one-model S2.1: a feature that nobody has been counted for says which event', () => {
  const v = flagFunnelView({
    state: 'not_exposed',
    source: { kind: 'feature', featureKey: 'f', targetEvent: 'guide_opened' },
    period: 'all',
  })
  assert.match(
    (v as { text: string }).text,
    /Nobody has been counted with this feature’s guide_opened event yet/
  )
})

test('tars-one-model S2.1: the three period choices, with the current one marked', () => {
  assert.deepEqual(periodLinks('90d'), [
    { period: 'all', label: 'Whole life', current: false },
    { period: '90d', label: 'Last 90 days', current: true },
    { period: '30d', label: 'Last 30 days', current: false },
  ])
})

test('tars-one-model S2.3 D8: the model note shows until FUNNEL_MODEL_NOTE_UNTIL, then nothing', () => {
  assert.equal(FUNNEL_MODEL_NOTE_UNTIL, '2026-11-12')
  assert.match(
    funnelModelNote(new Date('2026-11-11T23:59:59Z')) ?? '',
    /^Funnels now count adoption among the people who got the feature, across its whole life\. Numbers before 12 Oct 2026 counted it differently\.$/
  )
  assert.equal(funnelModelNote(new Date('2026-11-12T00:00:00Z')), null)
  assert.equal(funnelModelNote(new Date('2027-01-01T00:00:00Z')), null)
})
