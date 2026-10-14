import assert from 'node:assert/strict'
import { test } from 'node:test'
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

const { describeServing } = await import('./flags-read.ts')
const { nowServes } = await import('./flags-sync.ts')

// one-flag-switch — the cell `frijoles flags ls/get` prints is the flags page's On / Off, with who an On flag reaches.
const row = (over: Partial<Parameters<typeof describeServing>[0]>) => ({
  environment: 'production',
  state: 'on' as const,
  reach: 'everyone',
  version: 3,
  serving: true,
  readable: true,
  updatedAt: null,
  ...over,
})

test('an On flag prints who it reaches, beside its version', () => {
  assert.equal(describeServing(row({})), 'on (everyone)  v3')
  assert.equal(describeServing(row({ reach: '25% of people' })), 'on (25% of people)  v3')
  assert.equal(
    describeServing(row({ reach: 'a segment (not named yet)' })),
    'on (a segment (not named yet))  v3'
  )
})

test('an Off flag prints off and its version; nothing served prints a bare off', () => {
  assert.equal(describeServing(row({ state: 'off', reach: null, serving: false })), 'off  v3')
  assert.equal(describeServing(row({ state: 'off', reach: null, serving: null, version: null })), 'off')
})

test('an older server with no reach field still prints on', () => {
  assert.equal(describeServing(row({ reach: undefined })), 'on  v3')
})

test('a value flag prints the value it serves', () => {
  assert.equal(describeServing(row({ serving: { kind: 'none' }, reach: null })), '{"kind":"none"}  v3')
})

test('the sync output says what a NEW flag now serves, by the same rule as the page', () => {
  const variants = [
    { key: 'off', value: false },
    { key: 'on', value: true },
  ]
  assert.equal(
    nowServes({ valueType: 'boolean', variants, defaultVariantKey: 'on', rules: [] }),
    'on (everyone)'
  )
  assert.equal(nowServes({ valueType: 'boolean', variants, defaultVariantKey: 'off', rules: [] }), 'off')
  assert.equal(
    nowServes({
      valueType: 'boolean',
      variants,
      defaultVariantKey: 'off',
      rules: [{ priority: 1, clauses: [], rollout: { basisPoints: 5000 }, variantKey: 'on' }],
    }),
    'on (50% of people)'
  )
  assert.equal(
    nowServes({ valueType: 'string', variants: [{ key: 'a', value: 'x' }], defaultVariantKey: 'a' }),
    'its value'
  )
})
