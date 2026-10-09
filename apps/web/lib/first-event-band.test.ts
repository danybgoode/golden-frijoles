import assert from 'node:assert/strict'
import { test } from 'node:test'
import { firstEventBand } from './first-event-band.ts'

test('setup-instruments-connects D4: waiting, then arrived inside the window, then nothing; a failed read is nothing', () => {
  assert.deepEqual(firstEventBand({ hasOlder: false, firstInWindow: null }), { kind: 'waiting' })
  assert.deepEqual(
    firstEventBand({ hasOlder: false, firstInWindow: { event: 'signed_up', at: '2026-10-09T11:58:00Z' } }),
    {
      kind: 'arrived',
      event: 'signed_up',
      at: '2026-10-09T11:58:00Z',
    }
  )
  assert.equal(
    firstEventBand({ hasOlder: true, firstInWindow: null }),
    null,
    'a project with history needs no message'
  )
  assert.equal(firstEventBand(null), null, 'could not read is not waiting')
})
