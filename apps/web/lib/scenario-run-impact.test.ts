import test from 'node:test'
import assert from 'node:assert/strict'
import { scenarioRunImpact, scenarioRunImpactState } from './scenario-run-impact.ts'

// drill-impact-for-agents D10/D11 — the run-impact rule, over a hand-built dashboard view.

const EXPERIMENT = { key: 'checkout-exp', definitionVersion: 2 }

function evidence(attempts: number) {
  return {
    experiment: EXPERIMENT,
    technical: {
      control: { attempts, failures: 0, latencyP95Ms: 120 },
      fault: { attempts, failures: 3, latencyP95Ms: null },
      failureRateDelta: 0.3,
      latencyP95DeltaMs: null,
    },
    claim: { status: 'internal_noncausal', causal: false, blockers: ['synthetic cohort'] },
  }
}

function run(id: string, status: string, scenarioVersionId = 'bound') {
  return { id, scenarioVersionId, status }
}

function view(overrides: Record<string, unknown> = {}) {
  return {
    definitions: [
      { id: 'bound', definition: { experiment: EXPERIMENT } },
      { id: 'plain', definition: {} },
    ],
    runs: [
      run('stopped-captured', 'stopped'),
      run('stopped-bare', 'stopped'),
      run('draft', 'draft'),
      run('running', 'running'),
      run('plain-run', 'stopped', 'plain'),
    ],
    impacts: [
      { id: 'old', runId: 'stopped-captured', createdAt: '2026-10-16T10:00:00.000Z', evidence: evidence(5) },
      { id: 'new', runId: 'stopped-captured', createdAt: '2026-10-16T11:00:00.000Z', evidence: evidence(10) },
    ],
    ...overrides,
  } as never
}

test('an unknown run is null', () => {
  assert.equal(scenarioRunImpact(view(), 'nope'), null)
})

test('a run whose definition has no experiment is unbound, even with a stray evidence row', () => {
  assert.deepEqual(scenarioRunImpact(view(), 'plain-run'), { state: 'unbound' })
})

test('a bound run with evidence is captured from the NEWEST row, control = control, treatment = fault', () => {
  const out = scenarioRunImpact(view(), 'stopped-captured')
  assert.equal(out?.state, 'captured')
  if (out?.state !== 'captured') return
  assert.equal(out.evidenceId, 'new')
  assert.equal(out.capturedAt, '2026-10-16T11:00:00.000Z')
  assert.deepEqual(out.experiment, EXPERIMENT)
  assert.equal(out.control.attempts, 10)
  assert.deepEqual(out.treatment, { attempts: 10, failures: 3, latencyP95Ms: null })
  assert.equal(out.failureRateDelta, 0.3)
  assert.equal(out.latencyP95DeltaMs, null)
  assert.deepEqual(out.claim, { status: 'internal_noncausal', causal: false, blockers: ['synthetic cohort'] })
})

test('newest-row selection does not depend on array order', () => {
  const reversed = view({ impacts: [...(view() as { impacts: unknown[] }).impacts].reverse() })
  const out = scenarioRunImpact(reversed, 'stopped-captured')
  assert.equal(out?.state === 'captured' && out.evidenceId, 'new')
})

test('not captured: draft, running, and the retry hint carry D11 reasons exactly', () => {
  assert.deepEqual(scenarioRunImpact(view(), 'draft'), {
    state: 'not_captured',
    reason: 'the run never started',
  })
  assert.deepEqual(scenarioRunImpact(view(), 'running'), {
    state: 'not_captured',
    reason: 'the run has not stopped',
  })
  assert.deepEqual(scenarioRunImpact(view(), 'stopped-bare'), {
    state: 'not_captured',
    reason: 'no capture recorded — run `frijoles scenarios impact stopped-bare --capture`',
  })
})

test('scenarioRunImpactState names just the state', () => {
  assert.equal(scenarioRunImpactState(view(), 'stopped-captured'), 'captured')
  assert.equal(scenarioRunImpactState(view(), 'draft'), 'not_captured')
  assert.equal(scenarioRunImpactState(view(), 'plain-run'), 'unbound')
})
