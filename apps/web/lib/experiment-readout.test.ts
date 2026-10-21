// experiments-for-humans · Story 4.1 — the readout's words, from the REAL governed analysis.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { buildReadout } = await import('./experiment-readout.ts')
const { computeExperimentAnalysis } = await import('./experiment-analysis.ts')
const { sentenceText } = await import('./experiment-builder-plan.ts')
type Definition = import('./experiment-definition.ts').ExperimentDefinition
type Fact = import('./experiment-analysis.ts').ExperimentAnalysisFact

const START = '2026-09-01T00:00:00.000Z'
const definition: Definition = {
  hypothesis:
    'We believe showing New copy to merchants will raise signup completed because the funnel drops most at this step.',
  assignmentEntityType: 'merchant',
  eligibility: { description: '100% of merchants who reach it' },
  variants: [
    { key: 'off', weight: 50, label: 'Current' },
    { key: 'on', weight: 50, label: 'New copy' },
  ],
  controlVariantKey: 'off',
  primaryMetric: { event: 'signup_completed', direction: 'increase' },
  guardrailMetrics: [],
  segmentFields: [],
  plannedWindow: { startAt: START, endAt: '2026-09-29T00:00:00.000Z' },
  minimumSamplePerVariant: 100,
}

const at = (minute: number) => new Date(Date.parse(START) + minute * 60_000).toISOString()
function exposures(perArm: number, convertedControl: number, convertedTreatment: number): Fact[] {
  const facts: Fact[] = []
  for (const [arm, converted] of [
    ['off', convertedControl],
    ['on', convertedTreatment],
  ] as const) {
    for (let i = 0; i < perArm; i += 1) {
      const id = `${arm}-${i}`
      facts.push({
        id: `x-${id}`,
        event: 'experiment_exposed',
        featureId: 'copy_test',
        tags: { variant: arm, experiment_definition_version: 1 },
        subjectType: 'merchant',
        subjectId: id,
        occurredAt: at(i + 1),
        createdAt: at(i + 1),
      })
      if (i < converted)
        facts.push({
          id: `c-${id}`,
          event: 'signup_completed',
          featureId: null,
          tags: null,
          subjectType: 'merchant',
          subjectId: id,
          occurredAt: at(i + 2),
          createdAt: at(i + 2),
        })
    }
  }
  return facts
}

function readout(
  facts: Fact[],
  extras: {
    serving?: boolean
    now?: string
    decision?: { outcome: string; chosenVariantKey: string | null; rationale: string } | null
    lifecycle?: 'running' | 'stopped' | 'decided'
  } = {}
) {
  const now = extras.now ?? '2026-09-10T00:00:00.000Z'
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition,
    lifecycle: { status: extras.lifecycle ?? 'running', startedAt: START, endedAt: null },
    asOf: now,
    facts,
  })
  return buildReadout({
    definition,
    analysis,
    lifecycle: extras.lifecycle ?? 'running',
    decision: extras.decision ?? null,
    serving: extras.serving ?? true,
    now: new Date(now),
  })
}

test('waiting: live, no exposures yet — and a version can still be rolled out or kept (S6.3)', () => {
  const result = readout([])
  assert.equal(result.state, 'waiting')
  assert.equal(
    sentenceText(result.answer),
    'It’s live. Nobody has been counted yet. Merchants are being split 50 / 50 from now. It needs 100 per version.'
  )
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'stop'])
  assert.equal(result.chance, null)
})

test('gathering: ahead, with the range, the share of the sample, the counts and the chance — roll-out offered (S6.3)', () => {
  const result = readout(exposures(40, 10, 16))
  assert.equal(result.state, 'gathering')
  assert.match(
    sentenceText(result.answer),
    /^New copy is ahead, \+60\.0% \(range .+ to .+\)\. Guardrails fine, split checks out\. 40% of the planned sample, so any call now is directional\. About 14 more days to the planned sample\. So far: Current 10 of 40, New copy 16 of 40 — about \d+% likely New copy is really better\.$/
  )
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'stop'])
  assert.ok(result.chance !== null && result.chance > 0.8 && result.chance < 1)
})

test('ready: a winner says you can call it; a flat result says it didn’t move — and both still offer the roll-out (S6.3)', () => {
  const winning = readout(exposures(150, 30, 75))
  assert.equal(winning.state, 'ready')
  assert.deepEqual(winning.verdict.actions, ['rollout', 'keep', 'stop'])
  assert.match(sentenceText(winning.answer), /you can call it\. So far: /)
  const flat = readout(exposures(150, 30, 31))
  assert.equal(flat.state, 'ready')
  // Flat is still the person's call: the sentence says it didn't move; rolling out stays available (S6.3).
  assert.deepEqual(flat.verdict.actions, ['rollout', 'keep', 'iterate', 'stop'])
  assert.match(sentenceText(flat.answer), /didn’t move\. So far: /)
})

test('running but not serving is its own state, with retry — before any number', () => {
  const result = readout(exposures(40, 10, 16), { serving: false })
  assert.equal(result.state, 'not_serving')
  assert.deepEqual(result.verdict.actions, ['retry-serving'])
})

test('decided: the answer names the decision; the roll-out stays available as its own write', () => {
  const result = readout(exposures(150, 30, 75), {
    lifecycle: 'decided',
    decision: {
      outcome: 'ship_treatment',
      chosenVariantKey: 'on',
      rationale: 'The main number improved and guardrails held',
    },
  })
  assert.equal(result.state, 'decided')
  assert.equal(
    sentenceText(result.answer),
    'Decided: ship New copy. The decision and its reason are recorded.'
  )
  assert.deepEqual(result.verdict.actions, ['rollout'])
})

test('stopped, undecided: never "live" or "keep it running" — the next step is the decision', () => {
  const gathering = readout(exposures(40, 10, 16), { lifecycle: 'stopped' })
  assert.equal(gathering.state, 'stopped')
  assert.match(
    sentenceText(gathering.answer),
    /^Stopped — nobody new is counted\. .* It stopped at 40% of the planned sample/
  )
  assert.doesNotMatch(sentenceText(gathering.answer), /live|keep it running|don’t call it yet/i)
  assert.equal(gathering.verdict.title, 'Record the decision.')
  assert.equal(gathering.verdict.actions.includes('stop'), false)
  // Stopped short of the sample: any version can still be rolled out or kept (S6.3), the call labelled directional.
  assert.deepEqual(gathering.verdict.actions, ['rollout', 'keep', 'iterate'])
  const empty = readout([], { lifecycle: 'stopped' })
  assert.equal(sentenceText(empty.answer).includes('Nobody has been counted yet'), false)
  const winning = readout(exposures(150, 30, 75), { lifecycle: 'stopped' })
  assert.deepEqual(winning.verdict.actions, ['rollout', 'keep', 'iterate'])
})

test('a decided iterate / inconclusive does not claim the control "stays"', () => {
  const result = readout(exposures(150, 30, 31), {
    lifecycle: 'decided',
    decision: {
      outcome: 'inconclusive',
      chosenVariantKey: null,
      rationale: 'Something outside the test decided it',
    },
  })
  assert.equal(result.verdict.title, 'No clear answer.')
  assert.deepEqual(result.verdict.actions, [])
})

test('stopped with a blocker says the numbers can’t be trusted — never "not enough people"', () => {
  // SRM detected: 200 vs 110 on a 50/50 plan, each above the 100 minimum.
  const facts = [...exposures(200, 40, 30)].filter(
    (fact) => !(fact.id.startsWith('x-on-') && Number(fact.id.split('-')[2]) >= 110)
  )
  const result = readout(facts, { lifecycle: 'stopped' })
  assert.equal(result.state, 'stopped')
  assert.match(
    sentenceText(result.answer),
    /The numbers can’t be trusted: people were not divided evenly between the groups\. So far: /
  )
  assert.doesNotMatch(sentenceText(result.answer), /srm|_/)
  assert.doesNotMatch(sentenceText(result.answer) + result.verdict.body, /enough people|planned sample/)
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'invalid', 'iterate'])
})

test('three versions: the page leads with the treatment the RECORD names, and before that the one ahead', () => {
  const three: Definition = {
    ...definition,
    variants: [
      { key: 'off', weight: 34, label: 'Current' },
      { key: 'b', weight: 33, label: 'Version B' },
      { key: 'c', weight: 33, label: 'Version C' },
    ],
  }
  const facts: Fact[] = []
  for (const [arm, converted] of [
    ['off', 30],
    ['b', 31],
    ['c', 80],
  ] as const) {
    for (let i = 0; i < 150; i += 1) {
      const id = `${arm}-${i}`
      facts.push({
        id: `x-${id}`,
        event: 'experiment_exposed',
        featureId: 'copy_test',
        tags: { variant: arm, experiment_definition_version: 1 },
        subjectType: 'merchant',
        subjectId: id,
        occurredAt: at(i + 1),
        createdAt: at(i + 1),
      })
      if (i < converted)
        facts.push({
          id: `c-${id}`,
          event: 'signup_completed',
          featureId: null,
          tags: null,
          subjectType: 'merchant',
          subjectId: id,
          occurredAt: at(i + 2),
          createdAt: at(i + 2),
        })
    }
  }
  const build = (
    lifecycle: 'running' | 'decided',
    decision: { outcome: string; chosenVariantKey: string | null; rationale: string } | null
  ) => {
    const now = '2026-09-10T00:00:00.000Z'
    const analysis = computeExperimentAnalysis({
      experimentKey: 'copy_test',
      definitionVersion: 1,
      definition: three,
      lifecycle: { status: lifecycle, startedAt: START, endedAt: null },
      asOf: now,
      facts,
    })
    return buildReadout({
      definition: three,
      analysis,
      lifecycle,
      decision,
      serving: true,
      now: new Date(now),
    })
  }
  assert.equal(build('running', null).treatment.key, 'c')
  const decided = build('decided', {
    outcome: 'ship_treatment',
    chosenVariantKey: 'c',
    rationale: 'The main number improved and guardrails held',
  })
  assert.equal(
    sentenceText(decided.answer),
    'Decided: ship Version C. The decision and its reason are recorded.'
  )
  assert.equal(decided.verdict.title, 'Version C won.')
})

test('stopped on a SHORT sample is "not enough people", never "can’t be trusted" or invalid', () => {
  // 4 per version: too few to check the split (srm_not_evaluable) — which clears with more people.
  const result = readout(exposures(4, 1, 2), { lifecycle: 'stopped' })
  assert.equal(result.state, 'stopped')
  assert.match(
    sentenceText(result.answer),
    /It stopped at 4% of the planned sample, so any call is directional\. So far: Current 1 of 4, New copy 2 of 4 — about \d+% likely New copy is really better\.$/
  )
  assert.doesNotMatch(sentenceText(result.answer), /can’t be trusted/)
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'iterate'])
})

test('a REAL blocker on a short sample is still named — stopped offers invalid, running is blocked', () => {
  // 60 vs 20 on a 50/50 plan (minimum 100): the sample is short, and the split is provably off.
  const facts = exposures(60, 12, 4).filter(
    (fact) => !(fact.id.match(/^[xc]-on-(\d+)$/) && Number(fact.id.split('-')[2]) >= 20)
  )
  const stopped = readout(facts, { lifecycle: 'stopped' })
  assert.match(sentenceText(stopped.answer), /The numbers can’t be trusted: people were not divided evenly/)
  assert.deepEqual(stopped.verdict.actions, ['rollout', 'keep', 'invalid', 'iterate'])
  const running = readout(facts)
  assert.equal(running.state, 'blocked')
  assert.deepEqual(running.verdict.actions, ['rollout', 'keep', 'stop'])
})

test('another arm’s guardrail harm is named — and neither pinned on the clean lead nor blocking its roll-out', () => {
  const three: Definition = {
    ...definition,
    variants: [
      { key: 'off', weight: 34, label: 'Current' },
      { key: 'b', weight: 33, label: 'Version B' },
      { key: 'c', weight: 33, label: 'Version C' },
    ],
    guardrailMetrics: [{ event: 'refund_requested', direction: 'decrease' }],
  }
  const facts: Fact[] = []
  for (const [arm, converted, refunded] of [
    ['off', 30, 5],
    ['b', 80, 5],
    ['c', 31, 90],
  ] as const) {
    for (let i = 0; i < 150; i += 1) {
      const id = `${arm}-${i}`
      const base = { subjectType: 'merchant', subjectId: id }
      facts.push({
        id: `x-${id}`,
        event: 'experiment_exposed',
        featureId: 'copy_test',
        tags: { variant: arm, experiment_definition_version: 1 },
        ...base,
        occurredAt: at(i + 1),
        createdAt: at(i + 1),
      })
      if (i < converted)
        facts.push({
          id: `c-${id}`,
          event: 'signup_completed',
          featureId: null,
          tags: null,
          ...base,
          occurredAt: at(i + 2),
          createdAt: at(i + 2),
        })
      if (i < refunded)
        facts.push({
          id: `r-${id}`,
          event: 'refund_requested',
          featureId: null,
          tags: null,
          ...base,
          occurredAt: at(i + 3),
          createdAt: at(i + 3),
        })
    }
  }
  const now = '2026-09-10T00:00:00.000Z'
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition: three,
    lifecycle: { status: 'running', startedAt: START, endedAt: null },
    asOf: now,
    facts,
  })
  const result = buildReadout({
    definition: three,
    analysis,
    lifecycle: 'running',
    decision: null,
    serving: true,
    now: new Date(now),
  })
  // B is a clean winner: its row is fine and its roll-out is offered; C's harm is NAMED, never pinned on B.
  assert.equal(result.treatment.key, 'b')
  assert.equal(result.guardrails[0].status, 'fine')
  assert.deepEqual(result.guardrails[0].harmedBy, ['Version C'])
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'stop'])
  assert.match(
    sentenceText(result.answer),
    /Guardrails fine for Version B, but Version C moved one the wrong way/
  )
})

test('the LEAD harming a guardrail is named in the title — and rolling it out is still the person’s call (S6.3)', () => {
  const guarded: Definition = {
    ...definition,
    guardrailMetrics: [{ event: 'refund_requested', direction: 'decrease' }],
  }
  const facts: Fact[] = exposures(150, 30, 75)
  for (let i = 0; i < 90; i += 1)
    facts.push({
      id: `r-on-${i}`,
      event: 'refund_requested',
      featureId: null,
      tags: null,
      subjectType: 'merchant',
      subjectId: `on-${i}`,
      occurredAt: at(i + 3),
      createdAt: at(i + 3),
    })
  for (let i = 0; i < 5; i += 1)
    facts.push({
      id: `r-off-${i}`,
      event: 'refund_requested',
      featureId: null,
      tags: null,
      subjectType: 'merchant',
      subjectId: `off-${i}`,
      occurredAt: at(i + 3),
      createdAt: at(i + 3),
    })
  const now = '2026-09-10T00:00:00.000Z'
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition: guarded,
    lifecycle: { status: 'running', startedAt: START, endedAt: null },
    asOf: now,
    facts,
  })
  const result = buildReadout({
    definition: guarded,
    analysis,
    lifecycle: 'running',
    decision: null,
    serving: true,
    now: new Date(now),
  })
  assert.equal(result.guardrails[0].status, 'worse')
  assert.deepEqual(result.verdict.actions, ['rollout', 'keep', 'iterate', 'stop'])
  assert.equal(result.verdict.title, 'New copy is ahead, but a guardrail moved the wrong way.')
  assert.match(result.verdict.body, /your call/)
})

// ── S6.3 follow-ups (verifier, #422) ──────────────────────────────────────────────────────────
function armsFacts(arms: Array<[string, number, number]>): Fact[] {
  const facts: Fact[] = []
  for (const [arm, perArm, converted] of arms)
    for (let i = 0; i < perArm; i += 1) {
      const id = `${arm}-${i}`
      facts.push({
        id: `x-${id}`,
        event: 'experiment_exposed',
        featureId: 'copy_test',
        tags: { variant: arm, experiment_definition_version: 1 },
        subjectType: 'merchant',
        subjectId: id,
        occurredAt: at(i + 1),
        createdAt: at(i + 1),
      })
      if (i < converted)
        facts.push({
          id: `c-${id}`,
          event: 'signup_completed',
          featureId: null,
          tags: null,
          subjectType: 'merchant',
          subjectId: id,
          occurredAt: at(i + 2),
          createdAt: at(i + 2),
        })
    }
  return facts
}
function readoutOf(def: Definition, facts: Fact[]) {
  const now = '2026-09-10T00:00:00.000Z'
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition: def,
    lifecycle: { status: 'running', startedAt: START, endedAt: null },
    asOf: now,
    facts,
  })
  return buildReadout({
    definition: def,
    analysis,
    lifecycle: 'running',
    decision: null,
    serving: true,
    now: new Date(now),
  })
}

test('three versions at low volume, control converted nobody: the page leads with the version most likely better', () => {
  const three: Definition = {
    ...definition,
    variants: [
      { key: 'off', weight: 34, label: 'Current' },
      { key: 'b', weight: 33, label: 'Version B' },
      { key: 'c', weight: 33, label: 'Version C' },
    ],
  }
  const result = readoutOf(
    three,
    armsFacts([
      ['off', 10, 0],
      ['b', 10, 0],
      ['c', 10, 6],
    ])
  )
  assert.equal(result.treatment.key, 'c')
  assert.match(
    sentenceText(result.answer),
    /Version C 6 of 10 — about \d+% likely Version C is really better/
  )
})

test('a primary metric where LOWER is better: the chance is read in that direction', () => {
  const lower: Definition = {
    ...definition,
    primaryMetric: { event: 'signup_completed', direction: 'decrease' },
  }
  const result = readoutOf(
    lower,
    armsFacts([
      ['off', 40, 16],
      ['on', 40, 10],
    ])
  )
  assert.ok(result.chance !== null && result.chance > 0.85, String(result.chance))
  const worse = readoutOf(
    lower,
    armsFacts([
      ['off', 40, 10],
      ['on', 40, 16],
    ])
  )
  assert.ok(worse.chance !== null && worse.chance < 0.15, String(worse.chance))
})

test('a version nobody has seen yet has no chance figure', () => {
  const result = readoutOf(definition, armsFacts([['off', 3, 0]]))
  assert.equal(result.chance, null)
  assert.doesNotMatch(sentenceText(result.answer), /likely/)
})

test('the emphasised button follows the reading: roll out a winner, keep on worse or flat, nothing urged while gathering', () => {
  assert.equal(readout(exposures(150, 30, 75)).verdict.recommend, 'rollout')
  assert.equal(readout(exposures(150, 75, 30)).verdict.recommend, 'keep')
  assert.equal(readout(exposures(150, 30, 31)).verdict.recommend, 'keep')
  assert.equal(readout(exposures(40, 10, 16)).verdict.recommend, null)
  for (const facts of [exposures(150, 75, 30), exposures(40, 10, 16)])
    assert.ok(readout(facts).verdict.actions.includes('rollout'), 'available, whatever it recommends')
})

test('three versions, unequal exposure, LOWER is better, no interval: the lead is the likeliest better one, and an unseen one never leads', () => {
  const three: Definition = {
    ...definition,
    primaryMetric: { event: 'signup_completed', direction: 'decrease' },
    variants: [
      { key: 'off', weight: 34, label: 'Current' },
      { key: 'b', weight: 33, label: 'Version B' },
      { key: 'c', weight: 33, label: 'Version C' },
    ],
  }
  // Lower is better: C converting 6 of 12 is worse than B's 0 of 8, so B leads; the counts come from B's own row.
  const result = readoutOf(
    three,
    armsFacts([
      ['off', 10, 0],
      ['b', 8, 0],
      ['c', 12, 6],
    ])
  )
  assert.equal(result.treatment.key, 'b')
  assert.equal(result.treatment.exposed, 8)
  const unseen = readoutOf(
    three,
    armsFacts([
      ['off', 1, 0],
      ['c', 1, 0],
    ])
  )
  assert.equal(unseen.treatment.key, 'c', 'B has no exposures, so it cannot lead')
})

test('stopped: a check that failed recommends marking it invalid; a short sample recommends nothing; a full winner, the roll-out', () => {
  const facts = exposures(60, 12, 4).filter(
    (fact) => !(fact.id.match(/^[xc]-on-(\d+)$/) && Number(fact.id.split('-')[2]) >= 20)
  )
  assert.equal(readout(facts, { lifecycle: 'stopped' }).verdict.recommend, 'invalid')
  assert.equal(readout(exposures(4, 1, 2), { lifecycle: 'stopped' }).verdict.recommend, null)
  assert.equal(readout(exposures(150, 30, 75), { lifecycle: 'stopped' }).verdict.recommend, 'rollout')
  assert.equal(readout(exposures(150, 75, 30), { lifecycle: 'stopped' }).verdict.recommend, 'keep')
})

test('S6.2 a test with no end date counts every day it runs, with no planned length, and reads past any "end"', async () => {
  const { OPEN_ENDED_AT } = await import('./experiment-definition.ts')
  const open: Definition = { ...definition, plannedWindow: { startAt: START, endAt: OPEN_ENDED_AT } }
  const now = '2027-03-01T00:00:00.000Z' // far past what a weeks plan would have allowed
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition: open,
    lifecycle: { status: 'running', startedAt: START, endedAt: null },
    asOf: now,
    facts: exposures(40, 10, 16),
  })
  const result = buildReadout({
    definition: open,
    analysis,
    lifecycle: 'running',
    decision: null,
    serving: true,
    now: new Date(now),
  })
  assert.equal(result.progress.plannedDays, null)
  assert.equal(result.progress.day, 181)
  assert.equal(result.control.exposed + result.treatment.exposed, 80, 'every exposure still counts')
})

test('S6.2 a STOPPED test with no end date counts its days up to the stop, not to today (verifier, #423)', async () => {
  const { OPEN_ENDED_AT } = await import('./experiment-definition.ts')
  const open: Definition = { ...definition, plannedWindow: { startAt: START, endAt: OPEN_ENDED_AT } }
  const stoppedAt = '2026-09-11T00:00:00.000Z' // 10 days in
  const now = '2027-03-01T00:00:00.000Z'
  const analysis = computeExperimentAnalysis({
    experimentKey: 'copy_test',
    definitionVersion: 1,
    definition: open,
    lifecycle: { status: 'stopped', startedAt: START, endedAt: stoppedAt },
    asOf: now,
    facts: exposures(40, 10, 16),
  })
  const result = buildReadout({
    definition: open,
    analysis,
    lifecycle: 'stopped',
    decision: null,
    serving: true,
    now: new Date(now),
  })
  assert.equal(result.progress.day, 10)
})
