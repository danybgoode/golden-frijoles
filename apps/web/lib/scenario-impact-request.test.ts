import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ownerImpactAsOf,
  ownerImpactIdempotencyKey,
  parseScenarioImpactCaptureRequest,
} from './scenario-impact-request.ts'

const request = {
  runId: '018f0d3a-2577-7a53-8d41-b7c189e23f30',
  asOf: '2026-07-29T12:00:00.000Z',
  idempotencyKey: '018f0d3a-2655-7d97-816f-33d7b8df7281',
  reason: 'Capture the stopped internal drill evidence.',
}

test('impact capture accepts one exact bounded command and canonicalizes time', () => {
  assert.deepEqual(parseScenarioImpactCaptureRequest(request, '2026-07-29T12:01:00.000Z'), request)
})

test('impact capture rejects future timestamps and caller-selected evidence', () => {
  assert.equal(parseScenarioImpactCaptureRequest(request, '2026-07-29T11:59:00.000Z'), null)
  assert.equal(
    parseScenarioImpactCaptureRequest(
      { ...request, technical: { fault: { attempts: 999 } } },
      '2026-07-29T12:01:00.000Z'
    ),
    null
  )
})

test("an owner capture reads as of the stop, rounded up to the millisecond, in the contract's canonical form", () => {
  const now = '2026-10-16T22:00:00.000Z'
  // Postgres keeps microseconds: the remainder rounds UP, so nothing before the stop falls outside the window.
  const asOf = ownerImpactAsOf('2026-10-13T20:54:29.518225+00:00')
  assert.equal(asOf, '2026-10-13T20:54:29.519Z')
  // Exactly on a millisecond: unchanged. No fraction, and a bare-hour offset, both read.
  assert.equal(ownerImpactAsOf('2026-10-13T20:54:29.518000+00:00'), '2026-10-13T20:54:29.518Z')
  assert.equal(ownerImpactAsOf('2026-10-13 20:54:29+00'), '2026-10-13T20:54:29.000Z')
  assert.equal(ownerImpactAsOf('2026-10-13T22:54:29.5+02:00'), '2026-10-13T20:54:29.500Z')
  assert.equal(ownerImpactAsOf('not a time'), null)
  // What it returns is a valid capture instant.
  assert.ok(parseScenarioImpactCaptureRequest({ ...request, asOf }, now))
})

test('one idempotency key per run: stable, distinct per run, and a UUID the capture parser accepts', () => {
  const runId = '062daf1b-6475-4be5-8fde-c4712c6a553e'
  const key = ownerImpactIdempotencyKey(runId)
  assert.equal(key, ownerImpactIdempotencyKey(runId))
  assert.notEqual(key, ownerImpactIdempotencyKey(request.runId))
  assert.ok(
    parseScenarioImpactCaptureRequest({ ...request, idempotencyKey: key }, '2026-10-16T22:00:00.000Z')
  )
})
