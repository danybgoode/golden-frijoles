// landing-launch-experiment · Sprint 6, Story 6.3 — the chance a version is really better (lib/experiment-chance.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chanceBetter, chanceWords } from './experiment-chance.ts'

const near = (actual: number | null, expected: number, tol = 0.01) =>
  assert.ok(actual !== null && Math.abs(actual - expected) <= tol, `${actual} ≈ ${expected}`)

test('no data, or identical data, is a coin flip', () => {
  near(chanceBetter({ exposed: 0, converted: 0 }, { exposed: 0, converted: 0 }, true), 0.5, 1e-9)
  near(chanceBetter({ exposed: 40, converted: 4 }, { exposed: 40, converted: 4 }, true), 0.5, 1e-9)
})

test('the known closed form: one conversion of one vs none of one is 5/6 likely better, and symmetric', () => {
  // Beta(2,1) vs Beta(1,2): P(X > Y) = 5/6 for X~Beta(2,1), Y~Beta(1,2).
  near(chanceBetter({ exposed: 1, converted: 0 }, { exposed: 1, converted: 1 }, true), 5 / 6, 0.002)
  near(chanceBetter({ exposed: 1, converted: 1 }, { exposed: 1, converted: 0 }, true), 1 / 6, 0.002)
})

test('direction: when lower is better the chance flips', () => {
  const up = chanceBetter({ exposed: 50, converted: 5 }, { exposed: 50, converted: 10 }, true)!
  const down = chanceBetter({ exposed: 50, converted: 5 }, { exposed: 50, converted: 10 }, false)!
  near(up + down, 1, 1e-9)
  assert.ok(up > 0.85)
})

test('a large clear win is near certain; a tiny sample stays near even', () => {
  assert.ok(chanceBetter({ exposed: 5000, converted: 250 }, { exposed: 5000, converted: 400 }, true)! > 0.999)
  const tiny = chanceBetter({ exposed: 3, converted: 0 }, { exposed: 3, converted: 1 }, true)!
  assert.ok(tiny > 0.5 && tiny < 0.9, String(tiny))
})

test('impossible counts are refused, not computed', () => {
  assert.equal(chanceBetter({ exposed: 2, converted: 3 }, { exposed: 2, converted: 1 }, true), null)
  assert.equal(chanceBetter({ exposed: -1, converted: 0 }, { exposed: 2, converted: 1 }, true), null)
  assert.equal(chanceBetter({ exposed: 1.5, converted: 0 }, { exposed: 2, converted: 1 }, true), null)
})

test('words never claim 0% or 100%', () => {
  assert.equal(chanceWords(0.781), 'about 78%')
  assert.equal(chanceWords(1), 'about 99%')
  assert.equal(chanceWords(0), 'about 1%')
})
