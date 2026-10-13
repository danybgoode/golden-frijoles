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

const { parseFlagRef, parsePositiveInt, describeWindow } = await import('./scenarios.ts')

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
