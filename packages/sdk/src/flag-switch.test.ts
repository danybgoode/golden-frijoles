import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flagReach, flagSwitchState, hasFlagSwitch } from './flag-switch.ts'

// The deep cases live beside their first caller (apps/web/lib/flag-list-view.test.ts); this pins the public export.
const variants = [
  { key: 'off', value: false },
  { key: 'on', value: true },
]
test('the SDK exports the one switch rule: on, off, and who an On flag reaches', () => {
  assert.equal(flagSwitchState({ valueType: 'boolean', variants, defaultVariantKey: 'on', rules: [] }), 'on')
  assert.equal(
    flagSwitchState({ valueType: 'boolean', variants, defaultVariantKey: 'off', rules: [] }),
    'off'
  )
  assert.equal(flagReach({ valueType: 'boolean', variants, defaultVariantKey: 'on', rules: [] }), 'everyone')
  assert.equal(
    flagReach({
      valueType: 'boolean',
      variants,
      defaultVariantKey: 'off',
      rules: [{ priority: 1, clauses: [], rollout: { basisPoints: 5000 }, variantKey: 'on' }],
    }),
    '50% of people'
  )
  assert.equal(hasFlagSwitch({ valueType: 'boolean', variants }), true)
  assert.equal(flagSwitchState(undefined), 'off')
})
