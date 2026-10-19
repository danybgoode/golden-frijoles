// landing-launch-experiment · Sprint 2, Story 2.1 (epic D1) — the per-visitor variant, against the SDK's evaluator.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  A_UNASSIGNED,
  EXPERIMENT_FLAGS,
  isVisitorId,
  resolveVariant,
  type VariantSource,
} from './variant-decision.ts'

const KEY = EXPERIMENT_FLAGS.landingVariantB.key
const variants = [
  { key: 'off', value: false },
  { key: 'on', value: true },
]
const definition = (rules: unknown[], metadata?: Record<string, string | number | boolean>) => ({
  valueType: 'boolean',
  description: 'landing B',
  defaultVariantKey: 'off',
  variants,
  rules,
  ...(metadata ? { metadata } : {}),
})
const source = (def: unknown, extra: Partial<VariantSource> = {}): VariantSource => ({
  activation: 'on',
  flag: { key: KEY, definitionVersion: 3, definition: def },
  snapshotVersion: 41,
  ...extra,
})
const half = (metadata?: Record<string, string | number | boolean>) =>
  definition([{ priority: 0, clauses: [], rollout: { basisPoints: 5000 }, variantKey: 'on' }], metadata)

test('the experiment flag table names exactly the landing switch (D1)', () => {
  assert.deepEqual(EXPERIMENT_FLAGS, { landingVariantB: { key: 'landing.variant_b_enabled' } })
})

test('a 50% rollout splits 10,000 visitors about evenly, and each visitor keeps their side (D1)', () => {
  const ids = Array.from({ length: 10_000 }, () => randomUUID())
  const first = ids.map((id) => resolveVariant(source(half()), id).b)
  const again = ids.map((id) => resolveVariant(source(half()), id).b)
  assert.deepEqual(again, first, 'the same visitor got a different variant on a second evaluation')
  const shareB = first.filter(Boolean).length / ids.length
  assert.ok(shareB > 0.47 && shareB < 0.53, `B share ${shareB} is not ~50%`)
})

test('off serves A to everyone, on serves B to everyone', () => {
  const off = definition([])
  const on = { ...definition([]), defaultVariantKey: 'on' }
  for (const id of ['a1', 'b2', randomUUID()]) {
    assert.equal(resolveVariant(source(off), id).b, false)
    assert.equal(resolveVariant(source(on), id).b, true)
  }
})

test('every unreadable answer is A with no experiment, never B (D1)', () => {
  const bound = half({ experiment_key: 'landing-b', experiment_version: 1, experiment_rules: '0' })
  const id = randomUUID()
  const cases: Array<[string, VariantSource | undefined, unknown]> = [
    ['no catalog row', undefined, id],
    ['taken out', source({ ...definition([]), defaultVariantKey: 'on' }, { activation: 'off' }), id],
    ['nothing served', { activation: 'never' }, id],
    ['a corrupt definition', source({ valueType: 'boolean', variants: 'nope' }), id],
    ['a string flag', source({ ...definition([]), valueType: 'string' }), id],
    ['no visitor id', source(bound), undefined],
    ['an empty visitor id', source(bound), ''],
    ['an id with a space', source(bound), 'a b'],
    ['an email as an id', source(bound), 'person@example.com'],
  ]
  for (const [name, row, visitor] of cases) assert.deepEqual(resolveVariant(row, visitor), A_UNASSIGNED, name)
})

test('a visitor assigned by a running experiment rule carries the experiment; the default does not (D1, D3)', () => {
  const bound = half({ experiment_key: 'landing-b', experiment_version: 2, experiment_rules: '0' })
  const ids = Array.from({ length: 400 }, () => randomUUID())
  const answers = ids.map((id) => resolveVariant(source(bound), id))
  const inB = answers.filter((answer) => answer.b)
  const inA = answers.filter((answer) => !answer.b)
  assert.ok(inB.length > 0 && inA.length > 0)
  for (const answer of inB) {
    assert.deepEqual(answer.experiment, { key: 'landing-b', definitionVersion: 2 })
    assert.equal(answer.flagVersion, 3)
    assert.equal(answer.snapshotVersion, 41)
  }
  // The default arm here is NOT an experiment rule, so it is a holdout: no exposure (experimentForResolution).
  for (const answer of inA) assert.equal(answer.experiment, undefined)
})

test('a plain rollout with no experiment metadata never binds an experiment (D10: why launch is Start)', () => {
  const answers = Array.from({ length: 200 }, () => resolveVariant(source(half()), randomUUID()))
  assert.ok(answers.some((answer) => answer.b))
  assert.ok(answers.every((answer) => answer.experiment === undefined))
})

test('visitor ids: a UUID passes; prose, emails and over-long ids do not', () => {
  assert.equal(isVisitorId(randomUUID()), true)
  assert.equal(isVisitorId('x'.repeat(129)), false)
  assert.equal(isVisitorId('person@example.com'), false)
  assert.equal(isVisitorId(42), false)
})
