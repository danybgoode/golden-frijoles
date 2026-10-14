import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { HORIZON_ID_PATTERN, HORIZON_MAX, parseRoadmapPush } from './roadmap-artifact-schema.ts'

// many-products S3.1 (D14) — the roadmap push carries the product's horizon: optional, additive, and consistent.
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

// ── The push contract: horizon and destinations are optional, additive, and consistent ────────────────────────────
const row = (over: Record<string, unknown> = {}) => ({
  name: 'An epic',
  slug: 'an-epic',
  grain: 'Epic',
  status: 'Shipped',
  area: '01 Growth Engine',
  ...over,
})
const push = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  generatedAt: '2026-10-14T00:00:00.000Z',
  source: { commit: 'abc1234', ref: 'main' },
  items: [row()],
  ...over,
})
const HORIZON = [{ id: 'front-door', title: 'The front door', description: 'Where a new user lands.' }]

test('a push WITHOUT horizon or destinations still parses (additive)', () => {
  const r = parseRoadmapPush(push())
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value.horizon, undefined)
})

test('a push WITH horizon and a row naming a declared destination parses and keeps both', () => {
  const r = parseRoadmapPush(push({ horizon: HORIZON, items: [row({ destinations: ['front-door'] })] }))
  assert.equal(r.ok, true)
  if (r.ok) {
    assert.deepEqual(r.value.horizon, HORIZON)
    assert.deepEqual((r.value.items[0] as { destinations?: string[] }).destinations, ['front-door'])
  }
})

test('a row naming an id the horizon lacks is a 400 naming the epic', () => {
  const r = parseRoadmapPush(push({ horizon: HORIZON, items: [row({ destinations: ['ghost'] })] }))
  assert.equal(r.ok, false)
  if (!r.ok) assert.match(JSON.stringify(r.issues), /epic \\"an-epic\\" names destination \\"ghost\\"/)
})

test('a row naming a destination with NO horizon in the push is refused too', () => {
  const r = parseRoadmapPush(push({ items: [row({ destinations: ['front-door'] })] }))
  assert.equal(r.ok, false)
})

test('horizon is held to its grammar: kebab ids, no repeats, at most HORIZON_MAX, a title and a description', () => {
  const bad = (h: unknown) => parseRoadmapPush(push({ horizon: h })).ok
  assert.equal(bad([{ id: 'Bad_Id', title: 't', description: 'd' }]), false)
  assert.equal(bad([{ id: 'a', title: '', description: 'd' }]), false)
  assert.equal(bad([{ id: 'a', title: 't', description: '' }]), false)
  assert.equal(bad([HORIZON[0], HORIZON[0]]), false)
  const many = Array.from({ length: HORIZON_MAX + 1 }, (_, i) => ({
    id: `d${'abcdefghij'[i % 10]}${'abcdefghij'[Math.floor(i / 10)]}`,
    title: 't',
    description: 'd',
  }))
  assert.equal(bad(many), false)
  assert.equal(bad(many.slice(0, HORIZON_MAX)), true)
})

test("the kit's copy of the horizon grammar agrees with the schema's", async () => {
  const mod = (await import(pathToFileURL(join(REPO, 'scripts/lib/horizon.mjs')).href)) as {
    HORIZON_ID_RE: RegExp
    HORIZON_MAX: number
  }
  assert.equal(mod.HORIZON_ID_RE.source, HORIZON_ID_PATTERN.source)
  assert.equal(mod.HORIZON_MAX, HORIZON_MAX)
})
