import assert from 'node:assert/strict'
import { test } from 'node:test'
import { firstEventBand } from './first-event-band.ts'

const NOW = new Date('2026-10-09T12:00:00Z')

test('setup-instruments-connects D4: waiting, then arrived for a week, then nothing; a failed read is nothing', () => {
  assert.deepEqual(firstEventBand({ firstEvent: null }, NOW), { kind: 'waiting' })
  assert.deepEqual(firstEventBand({ firstEvent: { event: 'signed_up', at: '2026-10-09T11:58:00Z' } }, NOW), {
    kind: 'arrived',
    event: 'signed_up',
    at: '2026-10-09T11:58:00Z',
  })
  assert.equal(
    firstEventBand({ firstEvent: { event: 'signed_up', at: '2026-10-02T12:00:00Z' } }, NOW)?.kind,
    'arrived'
  )
  assert.equal(firstEventBand({ firstEvent: { event: 'signed_up', at: '2026-10-02T11:59:00Z' } }, NOW), null)
  assert.equal(firstEventBand(null, NOW), null, 'could not read is not waiting')
})
