// one-product-project · S2.1 — the catalog cache (cross-family review of #319, Codex: the rules a kill depends on
// were only exercised in production). A fake reader and a fake clock; real timers, kept short.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogCache, type ServedCatalog } from './gates-decision.ts'

const catalogWith = (serving: boolean): ServedCatalog =>
  new Map([['x.y_enabled', [{ environment: 'production', serving, readable: true }]]])
const servingOf = (catalog: ServedCatalog) => catalog?.get('x.y_enabled')?.[0]?.serving ?? 'fallback'
const later = <T>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

function harness(reads: Array<() => Promise<ServedCatalog>>) {
  let clock = 0
  let calls = 0
  const get = createCatalogCache(() => reads[Math.min(calls++, reads.length - 1)](), {
    cacheMs: 100,
    timeoutMs: 20,
    now: () => clock,
  })
  return { get, advance: (ms: number) => (clock += ms), calls: () => calls }
}

test('one read answers every gate until it expires', async () => {
  const h = harness([async () => catalogWith(true), async () => catalogWith(false)])
  assert.equal(servingOf(await h.get()), true)
  assert.equal(servingOf(await h.get()), true)
  assert.equal(h.calls(), 1)
  h.advance(101)
  assert.equal(servingOf(await h.get()), false, 'a kill lands once the window passes')
})

test('before any read succeeds, the fallbacks answer (null)', async () => {
  const h = harness([async () => null])
  assert.equal(await h.get(), null)
})

test('a failed read keeps the last good catalog — one bad read cannot re-open a killed gate', async () => {
  const h = harness([
    async () => catalogWith(false),
    async () => null,
    async () => Promise.reject(new Error('db')),
  ])
  assert.equal(servingOf(await h.get()), false)
  h.advance(101)
  assert.equal(servingOf(await h.get()), false, 'failed read')
  h.advance(101)
  assert.equal(servingOf(await h.get()), false, 'rejected read')
})

test('a slow read is bounded by the timeout, and still lands for the next request', async () => {
  const h = harness([async () => catalogWith(true), () => later(60, catalogWith(false))])
  assert.equal(servingOf(await h.get()), true)
  h.advance(101)
  assert.equal(servingOf(await h.get()), true, 'timed out at 20 ms: the last good catalog answers')
  await later(70, null)
  assert.equal(servingOf(await h.get()), false, 'the late read became the cached answer')
})

test('an older read that answers late never overwrites a newer one', async () => {
  const h = harness([
    async () => catalogWith(true),
    () => later(80, catalogWith(true)), // R1: started before the kill, stalls
    async () => catalogWith(false), // R2: started after the kill
  ])
  await h.get()
  h.advance(101)
  await h.get() // R1 starts and times out
  h.advance(101)
  assert.equal(servingOf(await h.get()), false, 'R2 lands the kill')
  await later(90, null) // R1 finally answers
  await tick()
  assert.equal(servingOf(await h.get()), false, 'the stale R1 did not turn the gate back on')
})
