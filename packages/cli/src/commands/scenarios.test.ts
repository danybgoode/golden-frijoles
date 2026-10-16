import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown

// The same extensionless-import hook golden.test.ts uses: source ships extensionless relative imports.
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/packages/cli/src/') &&
      specifier.startsWith('.') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { parseFlagRef, parsePositiveInt, describeWindow, describeImpactCapture, describeRunImpact } =
  await import('./scenarios.ts')

test('parseFlagRef splits <flagKey>@<version> and refuses everything else', () => {
  assert.deepEqual(parseFlagRef('checkout.fault@3'), { flagKey: 'checkout.fault', flagVersion: 3 })
  for (const bad of ['', 'checkout.fault', '@3', 'a@', 'a@0', 'a@-1', 'a@1.5', 'a@x']) {
    assert.equal(parseFlagRef(bad), null, bad)
  }
})

test('parsePositiveInt: absent is undefined, a bad value is null', () => {
  assert.equal(parsePositiveInt(undefined), undefined)
  assert.equal(parsePositiveInt('30'), 30)
  for (const bad of ['0', '-1', '1.5', 'abc']) assert.equal(parsePositiveInt(bad), null, bad)
})

test('describeWindow shows start to end, or a dash', () => {
  assert.equal(
    describeWindow({ startAt: '2026-10-13T10:00:00.000Z', expiresAt: '2026-10-13T10:05:00.000Z' }),
    '2026-10-13T10:00 → 2026-10-13T10:05'
  )
  assert.equal(describeWindow({}), '—')
})

test('a stop or a capture says what happened to the run’s impact, and how to retry a failed capture', () => {
  const run = '062daf1b-6475-4be5-8fde-c4712c6a553e'
  assert.equal(
    describeImpactCapture({ state: 'captured', evidenceId: 'e', createdAt: 't', created: true }, run),
    `impact: captured — frijoles scenarios impact ${run}`
  )
  assert.match(
    describeImpactCapture({ state: 'captured', evidenceId: 'e', createdAt: 't', created: false }, run),
    /already recorded/
  )
  assert.equal(describeImpactCapture({ state: 'unbound' }, run), 'impact: none — not bound to an experiment')
  assert.equal(
    describeImpactCapture({ state: 'not_captured', reason: 'the run has not stopped' }, run),
    `impact: not captured (the run has not stopped) — retry: frijoles scenarios impact ${run} --capture`
  )
})

test('describeRunImpact: one line for unbound and for not captured', () => {
  assert.equal(describeRunImpact({ state: 'unbound' }), 'not bound to an experiment')
  assert.equal(
    describeRunImpact({ state: 'not_captured', reason: 'the run has not stopped' }),
    'not captured yet (the run has not stopped)'
  )
})

test('describeRunImpact: captured prints the header and the arm table, null latency as a dash', () => {
  const text = describeRunImpact({
    state: 'captured',
    experiment: { key: 'checkout-exp', definitionVersion: 2 },
    capturedAt: '2026-10-16T11:00:00.000Z',
    claim: { status: 'internal_noncausal' },
    control: { attempts: 10, failures: 0, latencyP95Ms: 120 },
    treatment: { attempts: 10, failures: 3, latencyP95Ms: null },
  })
  const lines = text.split('\n')
  assert.equal(
    lines[0],
    'experiment checkout-exp@2 · claim internal_noncausal · captured 2026-10-16T11:00:00.000Z'
  )
  assert.match(lines[1], /^ARM\s+ATTEMPTS\s+FAILURES\s+P95 MS$/)
  assert.match(lines[3], /^control\s+10\s+0\s+120$/)
  assert.match(lines[4], /^treatment\s+10\s+3\s+—$/)
})
