import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { deriveHorizon, type HorizonDestination, type HorizonEpicInput } from './horizon-destinations.ts'
import { parseRoadmapPush, summarizeRoadmap } from './roadmap-artifact-schema.ts'

// pod-report · Sprint 1, Story 1.3 — the destination badge rule; many-products S3.2 (D14) — now from artifact data.
//
// This module decides what the horizon view CLAIMS is delivered, so the case that matters most is
// the one where it must refuse to claim: `lit` has to be unreachable unless every contributing epic
// is genuinely shipped. Over-claiming ✅ is the single failure the poster rule forbids outright
// (under-claiming is merely untidy), and here it would mean showing an investor a destination as
// reached when it is not.

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, '..', '..', '..')

const dest = (id: string): HorizonDestination => ({ id, title: `T ${id}`, description: `D ${id}` })
const epic = (slug: string, shipped: boolean, destinations?: string[] | null): HorizonEpicInput => ({
  slug,
  name: slug,
  shipped,
  destinations,
})

const DESTS = [dest('alpha'), dest('beta'), dest('gamma')]

test('a destination whose every contributing epic is shipped is LIT', () => {
  const view = deriveHorizon(DESTS, [epic('a', true, ['alpha']), epic('b', true, ['alpha', 'beta'])])
  assert.equal(view.find((d) => d.id === 'alpha')!.status, 'lit')
  assert.equal(view.find((d) => d.id === 'beta')!.status, 'lit')
})

test('a destination with some but not all epics shipped is PARTIAL, never lit', () => {
  const view = deriveHorizon(DESTS, [epic('a', true, ['alpha']), epic('b', false, ['alpha'])])
  const d = view.find((x) => x.id === 'alpha')!
  assert.equal(d.status, 'partial')
  assert.notEqual(d.status, 'lit')
})

test('a destination with no shipped epics is COMING', () => {
  const view = deriveHorizon(DESTS, [epic('a', false, ['alpha'])])
  assert.equal(view.find((d) => d.id === 'alpha')!.status, 'coming')
})

test('a destination NO epic names is exactly as unshipped as one in flight — coming, never vacuously lit', () => {
  const view = deriveHorizon(DESTS, [])
  for (const d of view) {
    assert.equal(d.status, 'coming', `${d.id} must be coming on an empty roadmap`)
    assert.deepEqual(d.litBy, [], `${d.id} must list no contributing epics`)
  }
})

test('an epic that names no destination (absent, null or empty) lights nothing, silently', () => {
  const view = deriveHorizon(DESTS, [epic('x', true), epic('y', true, null), epic('z', true, [])])
  for (const d of view) assert.equal(d.status, 'coming')
})

test('an epic naming an id the horizon does not declare appears nowhere (the schema refuses it before this)', () => {
  const view = deriveHorizon(DESTS, [epic('a', true, ['ghost'])])
  for (const d of view) assert.ok(!d.litBy.some((e) => e.slug === 'a'))
})

test('litBy follows the epics order given, carrying each real shipped flag', () => {
  const view = deriveHorizon(DESTS, [epic('first', true, ['alpha']), epic('second', false, ['alpha'])])
  const d = view.find((x) => x.id === 'alpha')!
  assert.deepEqual(
    d.litBy.map((e) => e.slug),
    ['first', 'second']
  )
  assert.equal(d.litBy[0].shipped, true)
  assert.equal(d.litBy[1].shipped, false)
})

test('every DECLARED destination is returned, in declaration order, and an empty horizon returns none', () => {
  assert.deepEqual(
    deriveHorizon(DESTS, []).map((d) => d.id),
    ['alpha', 'beta', 'gamma']
  )
  assert.deepEqual(deriveHorizon([], [epic('a', true, ['alpha'])]), [])
})

test('deriveHorizon is pure — calling it twice yields equal results and mutates no input', () => {
  const input = [epic('a', true, ['alpha'])]
  const a = deriveHorizon(DESTS, input)
  const b = deriveHorizon(DESTS, input)
  assert.deepEqual(a, b)
  assert.deepEqual(input, [epic('a', true, ['alpha'])], 'input must not be mutated')
})

// ── Golden Frijoles' own horizon: moved from a hard-coded registry into Roadmap/horizon.md ────────────────
//
// The registry that lived in this module, frozen verbatim as it stood before S3.2. The test derives the old answer
// from it with the OLD rule and demands the new derivation (this repo's horizon.md + the epics' `destination:` lines,
// read by the real extractor) agree on every destination, for every combination of shipped epics.
const LEGACY: Array<{ id: string; epics: string[] }> = [
  { id: 'byo-agent-frontdoor', epics: ['commercial-shell', 'multi-tenant-activation'] },
  { id: 'inverted-loop', epics: ['event-destination-router', 'signals-loop'] },
  { id: 'pods-proof', epics: ['pod-report'] },
  {
    id: 'primitives-grid',
    epics: ['growth-engine-v1', 'experiment-governance-v2', 'entity-journeys-projections'],
  },
  { id: 'self-serve-tenancy', epics: ['multi-tenant-activation'] },
  { id: 'agent-legible-surface', epics: ['commercial-shell'] },
]

function legacyStatus(epics: string[], shipped: Set<string>) {
  const present = epics // every legacy epic exists in this repo's artifact
  const n = present.filter((s) => shipped.has(s)).length
  return present.length > 0 && n === present.length ? 'lit' : n > 0 ? 'partial' : 'coming'
}

async function ownHorizon() {
  const mod = (await import(pathToFileURL(join(REPO, 'scripts/lib/horizon.mjs')).href)) as {
    parseHorizonMd: (md: string) => HorizonDestination[]
  }
  const ext = (await import(pathToFileURL(join(REPO, 'scripts/roadmap-extract.mjs')).href)) as {
    buildRows: (o: object) => Array<{ slug: string; grain: string; destinations?: string[] }>
  }
  const horizon = mod.parseHorizonMd(readFileSync(join(REPO, 'Roadmap/horizon.md'), 'utf8'))
  const rows = ext.buildRows({ root: REPO, dates: false, facts: { mode: 'docs', prs: [], branches: [] } })
  return { horizon, rows }
}

test("Golden Frijoles' own six destinations come out of horizon.md in the order they were registered", async () => {
  const { horizon } = await ownHorizon()
  assert.deepEqual(
    horizon.map((d) => d.id),
    LEGACY.map((d) => d.id)
  )
  for (const d of horizon) {
    assert.ok(d.title.trim() && d.description.trim(), `${d.id} needs a title and a description`)
  }
})

test('the moved list lights exactly what the registry lit: same status for every combination of shipped epics', async () => {
  const { horizon, rows } = await ownHorizon()
  const epicRows = rows.filter((r) => r.grain === 'Epic')
  const slugs = [...new Set(LEGACY.flatMap((d) => d.epics))]
  for (const s of slugs)
    assert.ok(
      epicRows.some((r) => r.slug === s),
      `${s} must exist in Roadmap/`
    )
  // Each legacy mapping is reproduced by the epics' own `destination:` lines.
  for (const d of LEGACY) {
    const named = epicRows.filter((r) => r.destinations?.includes(d.id)).map((r) => r.slug)
    assert.deepEqual([...named].sort(), [...d.epics].sort(), `${d.id}: epics naming it`)
  }
  for (let mask = 0; mask < 1 << slugs.length; mask++) {
    const shipped = new Set(slugs.filter((_, i) => mask & (1 << i)))
    const view = deriveHorizon(
      horizon,
      epicRows.map((r) => ({
        slug: r.slug,
        name: r.slug,
        shipped: shipped.has(r.slug),
        destinations: r.destinations,
      }))
    )
    for (const d of LEGACY) {
      assert.equal(
        view.find((v) => v.id === d.id)!.status,
        legacyStatus(d.epics, shipped),
        `${d.id} @ ${mask}`
      )
    }
  }
})

const HORIZON = [{ id: 'front-door', title: 'The front door', description: 'Where a new user lands.' }]
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

test('summarizeRoadmap carries an epic row’s destinations through to deriveHorizon', () => {
  const parsed = parseRoadmapPush(push({ horizon: HORIZON, items: [row({ destinations: ['front-door'] })] }))
  assert.ok(parsed.ok)
  if (!parsed.ok) return
  const summary = summarizeRoadmap(parsed.value.items)
  const view = deriveHorizon(
    parsed.value.horizon!,
    summary.epics.map((e) => ({
      slug: e.slug,
      name: e.name,
      shipped: e.shipped,
      destinations: e.destinations,
    }))
  )
  assert.equal(view[0].status, 'lit')
  assert.deepEqual(
    view[0].litBy.map((e) => e.slug),
    ['an-epic']
  )
})
