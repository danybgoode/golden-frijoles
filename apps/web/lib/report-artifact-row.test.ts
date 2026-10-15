import { test } from 'node:test'
import assert from 'node:assert/strict'
import { artifactFromRow } from './report-artifact-row.ts'

// owed-on-screen D5 — every read but the registered raw one hands back a payload with no owed checks.

const row = {
  id: 'a',
  version: 3,
  schema_version: 1,
  payload: { items: [{ slug: 'e', grain: 'Epic' }], owed: [{ text: 'x' }] },
  source_commit: 'abc1234',
  source_ref: 'main',
  generated_at: '2026-10-15T00:00:00Z',
  created_at: '2026-10-15T00:00:01Z',
}

test('keepOwed: false strips the owed checks and keeps the rest', () => {
  const a = artifactFromRow<{ items: unknown[]; owed?: unknown }>(row, { keepOwed: false })
  assert.equal('owed' in a.payload, false)
  assert.deepEqual(a.payload.items, row.payload.items)
  assert.equal(a.version, 3)
  assert.equal(a.schemaVersion, 1)
  assert.equal(a.sourceCommit, 'abc1234')
  assert.equal(a.generatedAt, '2026-10-15T00:00:00Z')
})

test('keepOwed: true returns the payload as stored (the push compare, the member read)', () => {
  const a = artifactFromRow<{ owed?: unknown[] }>(row, { keepOwed: true })
  assert.deepEqual(a.payload.owed, [{ text: 'x' }])
})
