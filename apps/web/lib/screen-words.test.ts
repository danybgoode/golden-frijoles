// one-header-one-name · Sprint 2, Story 2.2 (D8) — the label module's own test, carried over from plain-outcome-rename
// S5.1: "one label module with a test".

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ROADMAP_STAGES } from './roadmap-artifact-schema.ts'
import { SCREEN_RENAMES, SCREEN_WORDS, stageLabel } from './screen-words.ts'
import { RETIRED_SCREEN_WORDS } from '../design-system/vocabulary.ts'

test('the board columns read the decision-2 words, in the keys’ order', () => {
  assert.deepEqual(ROADMAP_STAGES.map(stageLabel), [
    'Backlog',
    'Grooming',
    'Ready',
    'Building',
    'QA',
    'Shipped',
  ])
})

test('the stage KEYS are untouched — a renamed key silently empties a board column', () => {
  assert.deepEqual(
    [...ROADMAP_STAGES],
    ['To groom', 'Grooming', 'Ready to build', 'Building', 'QA', 'Shipped']
  )
})

test('every rename points at a settled word, and no retired word is also a new one', () => {
  const settled = new Set<string>([...Object.values(SCREEN_WORDS), ...ROADMAP_STAGES.map(stageLabel)])
  const retired = new Set(SCREEN_RENAMES.map((rename) => rename.retired))
  for (const rename of SCREEN_RENAMES) {
    assert.ok(
      settled.has(rename.now),
      `${rename.retired} → ${rename.now}, which is not a settled screen word`
    )
    assert.equal(retired.has(rename.now), false, `${rename.now} is both retired and the replacement`)
  }
})

test('Horizon’s "destinations" is not renamed — it is a different thing from Setup’s', () => {
  // Only Setup's capitalised label is retired; nothing is renamed TO a destination word.
  assert.deepEqual(
    SCREEN_RENAMES.filter((rename) => /destination/i.test(rename.retired)).map((rename) => rename.retired),
    ['Destinations']
  )
  assert.equal(
    SCREEN_RENAMES.some((rename) => rename.now.toLowerCase().includes('destination')),
    false
  )
})

// The weld: the guard's list (design-system/vocabulary.ts) and this module's list are the same words, so adding a
// rename here without guarding it — or guarding a word nobody renamed — is red.
test('the guard bans exactly the words this module retired', () => {
  assert.deepEqual(
    RETIRED_SCREEN_WORDS.map((entry) => entry.word).sort(),
    SCREEN_RENAMES.map((rename) => rename.retired).sort()
  )
  for (const entry of RETIRED_SCREEN_WORDS) {
    assert.equal(entry.insteadSay, SCREEN_RENAMES.find((rename) => rename.retired === entry.word)?.now)
  }
})

// The inventory takes no runtime import, so its nav labels are literals; this is what keeps them the module's words.
test('the nav labels are the settled words', async () => {
  const { PROJECT_ROUTE_INVENTORY } = await import('./project-route-inventory.ts')
  const label = (segment: string) =>
    PROJECT_ROUTE_INVENTORY.find((row) => row.routeSegment === segment)?.label
  assert.equal(label('flags'), SCREEN_WORDS.flags)
  assert.equal(label('experiments'), SCREEN_WORDS.abTests)
  assert.equal(label('tasks'), SCREEN_WORDS.agentQueue)
  assert.equal(label('flag-audit'), SCREEN_WORDS.flagHistory)
  assert.equal(label('destinations'), SCREEN_WORDS.webhooks)
  assert.equal(label('hub/report'), SCREEN_WORDS.outcomeReport)
})
