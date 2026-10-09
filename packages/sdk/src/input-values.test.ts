import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inputValuesProblems } from './input-values.ts'

test('the same rules as the route: a real date, a finite number, no day twice, at least one value', () => {
  assert.deepEqual(inputValuesProblems('revenue', [{ occurredOn: '2024-02-29', value: 0 }]), [])
  assert.equal(inputValuesProblems('revenue', [{ occurredOn: '2025-02-29', value: 0 }]).length, 1)
  assert.equal(inputValuesProblems('revenue', [{ occurredOn: '2026-10-08', value: Infinity }]).length, 1)
  assert.equal(inputValuesProblems('revenue', null).length, 1)
  assert.equal(inputValuesProblems(' ', [{ occurredOn: '2026-10-08', value: 1 }]).length, 1)
})
