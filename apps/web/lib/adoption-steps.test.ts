import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { agentPrompt, GUIDE_SOURCE, LAST_STEP, nextStepOf, STEP_LABELS } from './adoption-steps.ts'

// outcome-report-v2 S2.2 (D9) — the step names come from the guide's scorer, never from the page. App code does not
// import `scripts/` (roadmap-result.test.ts's precedent), so this reads maturity-lens.mjs's source and compares.

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const lens = readFileSync(join(repo, 'scripts', 'lib', 'maturity-lens.mjs'), 'utf8')

test('STEP_LABELS is maturity-lens.mjs’s, step for step', () => {
  const block = lens.slice(
    lens.indexOf('export const STEP_LABELS'),
    lens.indexOf('};', lens.indexOf('export const STEP_LABELS'))
  )
  const fromScripts = Object.fromEntries(
    [...block.matchAll(/(\d+):\s*'([^']+)'/g)].map(([, n, label]) => [Number(n), label])
  )
  assert.deepEqual({ ...STEP_LABELS }, fromScripts)
  assert.equal(Object.keys(fromScripts).length, LAST_STEP + 1, 'five steps, 0–4')
})

test('the guide the page names is the file the scorer cites', () => {
  // `references/` is gitignored (local-only, AGENTS.md), so CI cannot open the guide itself — pin the citation instead.
  assert.ok(lens.includes(`source: '${GUIDE_SOURCE}'`))
})

test('the next step and its criteria, from the rows the scorer wrote', () => {
  const rows = [
    { ladderStep: 2, status: 'met' },
    { ladderStep: 2, status: 'not_instrumented' },
    { ladderStep: 2, status: 'not_met' },
    { ladderStep: 3, status: 'met' },
  ]
  assert.deepEqual(nextStepOf({ step: 1 }, rows), { step: 2, label: 'Parallel', met: 1, total: 3 })
  assert.deepEqual(nextStepOf({ step: 2 }, rows), { step: 3, label: 'Supervised autonomy', met: 1, total: 1 })
  assert.equal(nextStepOf({ step: 4 }, rows), null, 'nothing past AI-native')
  assert.equal(nextStepOf(null, rows), null)
})

test('the prompt names the product and the next step', () => {
  assert.equal(
    agentPrompt('golden-beans-demo', { label: 'Parallel' }),
    'Read the golden-beans-demo outcome report and the Steps of AI Adoption, then suggest what we change to reach Parallel'
  )
})
