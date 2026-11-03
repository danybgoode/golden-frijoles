// traffic-relaunch D7 — counts per UTC day, and per tag value with --by.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bucketEventCounts, isGroupableTag } from './event-count.ts'

const rows = [
  { created_at: '2026-11-01T23:59:00.000Z', tags: { source: 'tiktok' } },
  { created_at: '2026-11-02T00:01:00.000Z', tags: { source: 'tiktok' } },
  { created_at: '2026-11-02T10:00:00.000Z', tags: { source: 'google.com' } },
  { created_at: '2026-11-02T11:00:00.000Z', tags: { source: 'tiktok' } },
  { created_at: '2026-11-02T12:00:00.000Z', tags: {} },
  { created_at: '2026-11-02T13:00:00.000Z', tags: null },
]

test('per UTC day, oldest first', () => {
  assert.deepEqual(bucketEventCounts(rows, null), [
    { day: '2026-11-01', count: 1 },
    { day: '2026-11-02', count: 5 },
  ])
})

test('per day and tag value, biggest first; a missing tag is (none)', () => {
  assert.deepEqual(bucketEventCounts(rows, 'source'), [
    { day: '2026-11-01', value: 'tiktok', count: 1 },
    { day: '2026-11-02', value: '(none)', count: 2 },
    { day: '2026-11-02', value: 'tiktok', count: 2 },
    { day: '2026-11-02', value: 'google.com', count: 1 },
  ])
})

test('nothing in, nothing out', () => {
  assert.deepEqual(bucketEventCounts([], 'source'), [])
})

test('only tag-shaped names can be grouped on', () => {
  for (const ok of ['source', 'utm_source', 'chapter']) assert.equal(isGroupableTag(ok), true, ok)
  for (const bad of ['', 'Source', 'a-b', 'x'.repeat(41), "tags->>'x'", null, 3])
    assert.equal(isGroupableTag(bad), false, String(bad))
})
