// landing-launch-experiment D8 — consent is deny by default.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyticsAllowed, parseStoredConsent, serializeConsent } from './consent.ts'

test('nothing loads without an explicit, readable yes', () => {
  for (const raw of [
    null,
    undefined,
    '',
    'granted',
    '{}',
    '{"choice":"granted"}',
    '{"choice":"yes","at":"x"}',
    'not json',
  ])
    assert.equal(analyticsAllowed(parseStoredConsent(raw)), false, String(raw))
  assert.equal(analyticsAllowed(parseStoredConsent(serializeConsent('denied', new Date(0)))), false)
  assert.equal(analyticsAllowed(parseStoredConsent(serializeConsent('granted', new Date(0)))), true)
})

test('the stored answer keeps its date', () => {
  assert.deepEqual(parseStoredConsent(serializeConsent('granted', new Date('2026-10-19T00:00:00Z'))), {
    choice: 'granted',
    at: '2026-10-19T00:00:00.000Z',
  })
})

test('traffic-relaunch D3 — a stored answer wins over the region; no answer follows it', () => {
  const yes = parseStoredConsent(serializeConsent('granted', new Date(0)))
  const no = parseStoredConsent(serializeConsent('denied', new Date(0)))
  assert.equal(analyticsAllowed(null, false), true, 'outside the opt-in regions, no answer loads')
  assert.equal(analyticsAllowed(null, true), false, 'inside them, no answer loads nothing')
  assert.equal(analyticsAllowed(null), false, 'the default is consent required')
  assert.equal(analyticsAllowed(no, false), false, 'a stored no wins everywhere')
  assert.equal(analyticsAllowed(yes, true), true)
  assert.equal(analyticsAllowed(parseStoredConsent('not json'), false), true, 'unreadable = no answer')
})
