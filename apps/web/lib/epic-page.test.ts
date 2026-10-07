import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BOARD_STAGES, type BoardCard } from './hub-board.ts'
import { TRACK_STEPS, epicTrack } from './epic-page.ts'
import { currentSprint, nowLine, stageWhen } from './stage-commands.ts'

// one-epic-page · Sprint 1, Story 1.2 — the track marks the right step for each of the seven.

test('the track is the six board stages, then Read', () => {
  assert.deepEqual(TRACK_STEPS.slice(0, 6), [...BOARD_STAGES])
  assert.equal(TRACK_STEPS[6], 'Read')
})

const lit = (stage: BoardCard['stage'], verdict = false) =>
  epicTrack(stage, verdict)
    .filter((s) => s.state === 'current')
    .map((s) => s.key)

test('each of the seven positions is lit by its own stage, and only one step is current', () => {
  for (const stage of BOARD_STAGES) assert.deepEqual(lit(stage), [stage])
  assert.deepEqual(lit('Shipped', true), ['Read'])
})

test('every step before the current one is done, every step after is to do', () => {
  const track = epicTrack('Building', false)
  assert.deepEqual(
    track.map((s) => s.state),
    ['done', 'done', 'done', 'current', 'todo', 'todo', 'todo']
  )
  assert.deepEqual(
    epicTrack('Shipped', true).map((s) => s.state),
    ['done', 'done', 'done', 'done', 'done', 'done', 'current']
  )
})

test('a verdict on an unshipped row does not jump the track — the Hub never computes a stage', () => {
  assert.deepEqual(lit('Building', true), ['Building'])
})

const card = (over: Partial<BoardCard>): BoardCard => ({
  project: null,
  slug: 'overdue-reminders',
  name: 'Overdue reminders',
  grain: 'Epic',
  stage: 'Building',
  stageSource: 'git: feat/overdue-reminders · snapshot@2026-10-07T12:39:41.280Z',
  type: 'Feature',
  risk: 'High',
  area: 'invoices',
  buildOrder: 12,
  appetite: 'S',
  bet: 'wave-2026-10',
  sprintProgress: '4/9 stories',
  goal: null,
  sprints: [
    { n: 1, title: 'Know which invoices are late', done: 3, total: 3 },
    { n: 2, title: 'The reminder itself', done: 1, total: 3 },
    { n: 3, title: 'Know if it worked', done: 0, total: 3 },
  ],
  links: { readme: null, seed: null, sprints: [], retro: null },
  pr: null,
  kickoff: null,
  shippedAt: null,
  result: null,
  finops: null,
  ...over,
})

test('the Now line says what is happening, from the row alone', () => {
  assert.equal(nowLine(card({})), 'Sprint 2 of 3: The reminder itself · 1 of 3 stories done.')
  assert.equal(currentSprint(card({}))?.n, 2)
  const pr = { number: 42, url: 'https://github.com/o/r/pull/42', state: 'OPEN', draft: false }
  assert.equal(nowLine(card({ stage: 'QA', pr })), 'Pull request #42 is open for review.')
  assert.equal(
    nowLine(card({ stage: 'QA', pr: { ...pr, state: 'MERGED' } })),
    'Merged. The close-out is owed.'
  )
  assert.match(nowLine(card({ stage: 'Ready to build' })), /^Funded \(wave-2026-10\), #12 in the build order/)
  assert.match(nowLine(card({ stage: 'Ready to build', bet: null })), /not funded yet/)
})

test('the "when" drops the pusher machine timestamp and prefers a PR or a ship date', () => {
  assert.equal(stageWhen(card({})), 'read from git: feat/overdue-reminders')
  assert.equal(stageWhen(card({ shippedAt: '2026-10-06' })), 'shipped 2026-10-06')
  const pr = { number: 42, url: 'https://github.com/o/r/pull/42', state: 'OPEN', draft: true }
  assert.equal(stageWhen(card({ pr })), 'pull request #42 · draft')
  assert.equal(stageWhen(card({ stageSource: null })), null)
})
