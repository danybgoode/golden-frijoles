// landing-launch-experiment D24 — the pool notice on Today.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { poolNotice } from './workspace-pool-notice.ts'

test('no pool, or well under it, says nothing', () => {
  assert.equal(poolNotice({ used: 5, pool: null, plan: 'comped' }), null)
  assert.equal(poolNotice({ used: 0, pool: 200000, plan: 'free' }), null)
  assert.equal(poolNotice({ used: 159_999, pool: 200000, plan: 'free' }), null)
})

test('from 80% it warns; at the pool it says the next event is refused', () => {
  assert.deepEqual(poolNotice({ used: 160_000, pool: 200000, plan: 'free' }), {
    kind: 'near',
    used: 160_000,
    pool: 200000,
    canUpgrade: true,
  })
  assert.equal(poolNotice({ used: 200000, pool: 200000, plan: 'free' })?.kind, 'over')
  assert.equal(poolNotice({ used: 250000, pool: 200000, plan: 'free' })?.kind, 'over')
})

test('only Free is offered the upgrade; a nonsense reading is no notice', () => {
  assert.equal(poolNotice({ used: 2_000_000, pool: 2_000_000, plan: 'growth' })?.canUpgrade, false)
  assert.equal(poolNotice({ used: -1, pool: 10, plan: 'free' }), null)
  assert.equal(poolNotice({ used: 5, pool: 0, plan: 'free' }), null)
})
