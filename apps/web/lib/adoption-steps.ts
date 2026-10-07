// outcome-report-v2 · Story 2.2 (D9) — the Steps of AI Adoption, explained: where you are, what the next step needs,
// and a prompt for your agent. ZERO IMPORTS.
//
// ⚠️ `STEP_LABELS` is a copy of the one in `scripts/lib/maturity-lens.mjs` — app code does not import `scripts/`
// (the roadmap-result.ts precedent), so `adoption-steps.test.ts` reads that file's source and pins the two together.
// The criteria are never retyped here: they arrive on the artifact's rows, scored by that same module.

export const STEP_LABELS: Readonly<Record<number, string>> = {
  0: 'Gated',
  1: 'Assisted',
  2: 'Parallel',
  3: 'Supervised autonomy',
  4: 'AI-native',
}

export const LAST_STEP = 4

/** Where the guide lives, and what it is, in one line. */
export const GUIDE_SOURCE = 'references/Steps-of-AI-Adoption.md'
export const GUIDE_LINE =
  'The Steps of AI Adoption is the published guide we score against: five steps from Gated to AI-native, each with ' +
  'the guardrails that make the next one safe.'

export type NextStep = {
  step: number
  label: string
  /** The next step's criteria that are met, of all the artifact scored for it. */
  met: number
  total: number
}

/**
 * The next step after `verdict.step` and how many of its criteria are met — or null at the last step or with no
 * verdict. Computed from the rows BEFORE a lens hides them, so the count is an aggregate every lens may show (like the
 * verdict's own "2 of 8").
 */
export function nextStepOf(
  verdict: { step: number } | null,
  rows: ReadonlyArray<{ ladderStep: number; status: string }>
): NextStep | null {
  if (!verdict || verdict.step >= LAST_STEP) return null
  const step = verdict.step + 1
  const criteria = rows.filter((r) => r.ladderStep === step)
  return {
    step,
    label: STEP_LABELS[step] ?? `Step ${step}`,
    met: criteria.filter((r) => r.status === 'met').length,
    total: criteria.length,
  }
}

/** The prompt the Copy button hands your agent — names the product and the next step (the story's exact words). */
export function agentPrompt(product: string, next: { label: string }): string {
  return `Read the ${product} outcome report and the Steps of AI Adoption, then suggest what we change to reach ${next.label}`
}
