import test from 'node:test'
import assert from 'node:assert/strict'
import { toScenarioToolView } from './mcp-scenario-view.ts'

const view = {
  targets: [
    {
      id: 't-id',
      key: 'api',
      kind: 'http',
      origin: 'https://x.test',
      status: 'verified',
      verifiedAt: '2026-10-01',
    },
  ],
  definitions: [
    {
      id: 'd-id',
      scenarioKey: 'drill',
      version: 2,
      productionSecurityApproved: true,
      createdAt: 'x',
      definition: {
        contractVersion: 1,
        kind: 'resilience',
        targetKey: 'api',
        environment: 'production',
        cohort: 'synthetic',
        startAt: 'a',
        expiresAt: 'b',
        limits: { requestCap: 1, concurrencyCap: 1, leaseTtlSeconds: 1 },
        guardrails: { abortAfterFailures: 1, maxErrorRateBasisPoints: 1 },
        flag: { key: 'f', definitionVersion: 3 },
      },
    },
  ],
  faultFlags: [],
  runs: [
    {
      id: 'r1',
      scenarioVersionId: 'sv',
      scenarioKey: 'drill',
      definitionVersion: 2,
      kind: 'resilience',
      cohort: 'synthetic',
      targetKey: 'api',
      environment: 'production',
      status: 'running',
      revision: 4,
      requestCount: 5,
      successCount: 4,
      failureCount: 1,
      createdAt: 'c',
      startedAt: 's',
      stoppedAt: null,
      stopReason: null,
    },
    {
      id: 'r2',
      scenarioVersionId: 'sv',
      scenarioKey: 'drill',
      definitionVersion: 2,
      kind: 'resilience',
      cohort: 'synthetic',
      targetKey: 'api',
      environment: 'production',
      status: 'stopped',
      revision: 4,
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: 'c',
      startedAt: null,
      stoppedAt: null,
      stopReason: 'x',
    },
  ],
  securityResults: [{ id: 'sr' }],
  impacts: [{ id: 'im' }],
  malformedImpactCount: 0,
  policies: [{ id: 'p' }],
  trips: [{ id: 'tr' }],
} as never

test('toScenarioToolView keeps the allow-listed fields', () => {
  const out = toScenarioToolView(view)
  assert.deepEqual(out.targets[0], {
    key: 'api',
    origin: 'https://x.test',
    status: 'verified',
    verifiedAt: '2026-10-01',
  })
  assert.equal(out.definitions[0].flag.definitionVersion, 3)
  assert.equal(out.definitions[0].limits.requestCap, 1)
  assert.equal(out.runs.length, 2)
  assert.equal(out.runs[0].requestCount, 5)
  assert.match(out.note, /frijoles scenarios/)
})

test('toScenarioToolView leaks no ids, policies, trips, audit or hashes', () => {
  const text = JSON.stringify(toScenarioToolView(view))
  for (const absent of [
    't-id',
    'd-id',
    'scenarioVersionId',
    'policies',
    'trips',
    'securityResults',
    'impacts',
    'actor',
    'audit',
    'hash',
    'revision',
    'guardrails',
  ]) {
    assert.ok(!text.includes(absent), absent)
  }
})

test('status filters runs only', () => {
  const out = toScenarioToolView(view, 'stopped')
  assert.deepEqual(
    out.runs.map((r) => r.id),
    ['r2']
  )
  assert.equal(out.definitions.length, 1)
})
