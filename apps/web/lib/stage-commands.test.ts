import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { BoardCard } from './hub-board.ts'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stageCommands } from './stage-commands.ts'

// board-sinks-and-scrumban · Sprint 2, Story 2.3 — one map keyed by stage, in the SESSION-KICKOFFS verbs.

const card = (over: Partial<BoardCard>): BoardCard => ({
  project: null,
  slug: 'demo',
  name: 'Demo epic',
  grain: 'Epic',
  stage: 'Ready to build',
  stageSource: null,
  type: 'Feature',
  risk: 'High',
  area: '02 Commercial',
  buildOrder: 18,
  appetite: 'M',
  bet: null,
  sprintProgress: null,
  goal: null,
  sprints: [
    { n: 1, title: 'One', done: 3, total: 3 },
    { n: 2, title: 'Two', done: 1, total: 4 },
  ],
  links: { readme: 'Roadmap/02-commercial/demo/README.md', seed: null, sprints: [], retro: null },
  pr: null,
  kickoff: null,
  shippedAt: null,
  result: null,
  finops: null,
  ...over,
})
const texts = (c: BoardCard) => stageCommands(c, 'ledgerly').map((x) => x.text)
const shorthands = (c: BoardCard) => stageCommands(c, 'ledgerly').map((x) => x.shorthand)

// one-epic-page · Sprint 1, Story 1.3 (lock D7) — plain lines that name the step, the epic and the product, and begin
// with the verb of the SESSION-KICKOFFS shorthand they expand from (which rides along, still valid).

test('To groom and Grooming: Groom and Bet, in plain words', () => {
  assert.deepEqual(texts(card({ stage: 'To groom', grain: 'Seed', name: 'An idea' })), [
    'Groom the demo idea in ledgerly',
  ])
  assert.deepEqual(shorthands(card({ stage: 'To groom', grain: 'Seed', name: 'An idea' })), [
    'Groom: An idea',
  ])
  assert.deepEqual(texts(card({ stage: 'Grooming', grain: 'Seed' })), [
    'Groom the demo idea in ledgerly, resuming at its approval gate',
    'Bet the demo idea at the wave boundary in ledgerly',
  ])
  assert.deepEqual(shorthands(card({ stage: 'Grooming', grain: 'Seed' })), ['Groom: demo', 'Bet the wave'])
})

test("Ready to build: an epic offers Build (the kickoff is the page's own action); a fixed-scope seed offers Build", () => {
  assert.deepEqual(texts(card({})), ['Build the demo epic in ledgerly'])
  assert.deepEqual(shorthands(card({})), ['Build epic demo'])
  assert.deepEqual(texts(card({ grain: 'Seed' })), ['Build demo in ledgerly, fixed scope'])
  assert.deepEqual(shorthands(card({ grain: 'Seed' })), ['Build: demo'])
})

test('Building: Resume first, then Wrap for the first sprint not yet done', () => {
  assert.deepEqual(texts(card({ stage: 'Building' })), [
    'Resume the demo epic in ledgerly where its last session stopped',
    'Wrap sprint 2 of the demo epic in ledgerly',
  ])
  assert.deepEqual(shorthands(card({ stage: 'Building' })), ['Resume', 'Wrap S2'])
  // A fixed-scope seed is built too, and is not an epic (codex re-review, #295).
  assert.deepEqual(texts(card({ stage: 'Building', grain: 'Seed' })), [
    'Resume the demo work in ledgerly where its last session stopped',
  ])
})

test('QA with an open PR: Review first, the routing command, then Close and its DoD check', () => {
  const pr = { number: 224, url: 'https://github.com/o/r/pull/224', state: 'OPEN', draft: false }
  assert.deepEqual(texts(card({ stage: 'QA', pr })), [
    'Review pull request #224 for the demo epic in ledgerly',
    'node scripts/review-route.mjs --builder <who-wrote-it> 224',
    'Close the demo epic in ledgerly',
    'node scripts/epic-dod.mjs --check 02-commercial/demo',
  ])
  assert.deepEqual(shorthands(card({ stage: 'QA', pr })), ['Review PR #224', null, 'Close epic demo', null])
})

test('QA after the merge (close-out owed): only the close commands', () => {
  const pr = { number: 98, url: 'https://github.com/o/r/pull/98', state: 'MERGED', draft: false }
  assert.deepEqual(texts(card({ stage: 'QA', pr })), [
    'Close the demo epic in ledgerly',
    'node scripts/epic-dod.mjs --check 02-commercial/demo',
  ])
})

test('Shipped owes nothing', () => {
  assert.deepEqual(stageCommands(card({ stage: 'Shipped' }), 'ledgerly'), [])
})

test('every plain line names its epic and product and begins with its shorthand verb (S1.3 acceptance)', () => {
  const pr = { number: 9, url: 'https://github.com/o/r/pull/9', state: 'OPEN', draft: false }
  let checked = 0
  for (const stage of ['To groom', 'Grooming', 'Ready to build', 'Building', 'QA', 'Shipped'] as const)
    for (const grain of ['Epic', 'Seed'] as const) {
      const commands = stageCommands(card({ stage, grain, pr }), 'ledgerly')
      if (stage !== 'Shipped') assert.ok(commands.length >= 1, `${stage}/${grain} offers no command`)
      for (const c of commands) {
        if (c.shorthand === null) {
          assert.match(c.text, /^node scripts\//, `"${c.text}" has no shorthand, so it must be a script`)
          continue
        }
        checked++
        assert.match(c.text, /\bdemo\b/, `"${c.text}" does not name the epic`)
        assert.match(c.text, / in ledgerly\b/, `"${c.text}" does not name the product`)
        const verb = c.shorthand.split(/[\s:]/)[0]
        assert.ok(c.text.startsWith(verb), `"${c.text}" does not begin with its shorthand's verb "${verb}"`)
      }
    }
  assert.ok(checked >= 10, `expected to check every plain line, checked ${checked}`)
})

test('every `node scripts/…` command a card offers exists in the template — a copied command must run (the CLASS, #226)', () => {
  const template = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    '..',
    'skills',
    'template',
    'scripts'
  )
  const pr = { number: 9, url: 'https://github.com/o/r/pull/9', state: 'OPEN', draft: false }
  const every = (['To groom', 'Grooming', 'Ready to build', 'Building', 'QA', 'Shipped'] as const).flatMap(
    (stage) =>
      (['Epic', 'Seed'] as const).flatMap((grain) => stageCommands(card({ stage, grain, pr }), 'ledgerly'))
  )
  // EVERY `scripts/` path anywhere in a command, whatever runs it (`node --flag scripts/x.mjs`, `./scripts/x.sh` …), and
  // a command that runs anything must name such a path — so a new runner form cannot slip past (round-3 review, #226).
  const scripts = [
    ...new Set(
      every.flatMap((c) => [...c.text.matchAll(/(?:^|\s)(?:\.\/)?(scripts\/\S+)/g)].map((m) => m[1]))
    ),
  ]
  for (const c of every)
    if (/(?:^|\s)(?:node|npx|npm|bash|sh)\s/.test(c.text))
      assert.match(
        c.text,
        /(?:^|\s)(?:\.\/)?scripts\//,
        `"${c.text}" runs something that is not a checked scripts/ path`
      )
  assert.ok(scripts.length >= 2, `expected the map to run some scripts, found: ${scripts.join(', ')}`)
  for (const script of scripts) {
    assert.ok(
      existsSync(join(template, script.replace(/^scripts\//, ''))),
      `${script} is not shipped by the template`
    )
  }
})
