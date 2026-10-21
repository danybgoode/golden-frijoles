import type { ExperimentAnalysisResult } from './experiment-analysis'
import { isOpenEnded, type ExperimentDefinition } from './experiment-definition'
import { blockerWords } from './experiment-blocker-words'
import { chanceBetter, chanceWords } from './experiment-chance'
import { eventWords, entityPlural, type SentencePart } from './experiment-builder-plan'

// experiments-for-humans · Story 4.1 (epic README D10) — the decision-first readout, as DATA.
//
// Everything the Results tab SAYS comes from here, computed from the one governed analysis the page
// already loaded (`computeExperimentAnalysis` via the analysis query) — never a second statistic. The
// component renders what it is handed, so every sentence is testable without a browser.
//
// ⚠️ The cumulative chart is NOT drawn (the story names it as the first cut): it would need a per-day
// pass over the facts inside the governed analysis, and this epic does not change that module. The
// lift card keeps its number, its legend and the honest "one point a day" empty state; the interval
// and the who-saw-what bars stay, as the story requires.

export type ReadoutState =
  'not_serving' | 'paused' | 'waiting' | 'gathering' | 'blocked' | 'ready' | 'stopped' | 'decided'

/** `retry-serving` is Resume for a paused test (S6.6); `pause` takes the split off without ending the test. */
export type ReadoutAction = 'rollout' | 'keep' | 'iterate' | 'invalid' | 'stop' | 'retry-serving' | 'pause'

export type Readout = {
  state: ReadoutState
  /** The page's first line, as runs (`emphasis` is bold). */
  answer: SentencePart[]
  control: { key: string; label: string; exposed: number; rate: number | null }
  treatment: { key: string; label: string; exposed: number; rate: number | null }
  /** The primary metric's relative lift and its 95 % range, as percentages; `null` when not computable. */
  lift: { value: number; low: number; high: number; crossesZero: boolean } | null
  /** S6.3 — the chance the lead version is really better on the primary metric, 0–1, at ANY volume (lib/experiment-chance.ts).
   *  Reported, never a gate; null before anyone is counted. */
  chance: number | null
  /** `recommend` is the button the page's own reading points to (drawn primary); null when the numbers point nowhere yet.
   *  Every action stays available whatever it says (S6.3) — the recommendation is emphasis, never a gate. */
  verdict: {
    label: string
    title: string
    body: string
    actions: ReadoutAction[]
    recommend?: ReadoutAction | null
  }
  /** `plannedDays` is null for a test with no end date (S6.2). */
  progress: { fraction: number; needPerVersion: number; day: number; plannedDays: number | null }
  srm: 'clear' | 'detected' | 'not_evaluable'
  guardrails: Array<{
    event: string
    label: string
    delta: number | null
    /** The LEAD treatment's own result on this guardrail. */
    status: 'fine' | 'worse' | 'unknown'
    /** Labels of OTHER treatments that moved it the wrong way (named, never pinned on the lead). */
    harmedBy: string[]
  }>
}

export type ReadoutInput = {
  definition: ExperimentDefinition
  analysis: ExperimentAnalysisResult
  lifecycle: 'running' | 'stopped' | 'decided'
  /** The current decision record's outcome, when decided. */
  decision: { outcome: string; chosenVariantKey: string | null; rationale: string } | null
  /** Is the experiment's bound flag version the one Production serves? */
  serving: boolean
  /** S6.6 — not serving because someone PAUSED it (Production serves the feature without the test). */
  paused?: boolean
  now: Date
}

const DAY_MS = 86_400_000

function label(definition: ExperimentDefinition, key: string): string {
  return definition.variants.find((variant) => variant.key === key)?.label ?? key
}

function signed(percent: number): string {
  return `${percent > 0 ? '+' : ''}${percent.toFixed(1)}%`
}

export function buildReadout(input: ReadoutInput): Readout {
  const { definition, analysis } = input
  const controlKey = definition.controlVariantKey
  const metricRow = (key: string) => analysis.primaryMetric.variants.find((row) => row.key === key)
  // Which treatment the page leads with (general pass, PR #172): once decided, the one the RECORD
  // names; before that, the one furthest ahead in the wanted direction; the first only when no
  // treatment has a measurable lift yet. A three-version test must never read "B won" over "ship C".
  const treatments = definition.variants.filter((variant) => variant.key !== controlKey)
  const wanted = definition.primaryMetric.direction === 'increase' ? 1 : -1
  const recorded =
    input.lifecycle === 'decided' && input.decision?.outcome === 'ship_treatment'
      ? treatments.find((variant) => variant.key === input.decision?.chosenVariantKey)
      : undefined
  const measured = treatments
    .map((variant) => ({ key: variant.key, interval: metricRow(variant.key)?.liftInterval }))
    .filter((row) => row.interval?.ok)
    .sort((a, b) => wanted * ((b.interval as { lift: number }).lift - (a.interval as { lift: number }).lift))
  // No measurable lift yet (a control that converted nobody has no interval — the common low-traffic case): lead with the
  // treatment most likely to be better, never simply the first (verifier, #422 — C at 6 of 10 must not hide behind B).
  const counts = (key: string) => ({
    exposed: metricRow(key)?.exposedSubjects ?? 0,
    converted: metricRow(key)?.convertedSubjects ?? 0,
  })
  const byChance = treatments
    // A treatment nobody has seen has no rate yet, so it cannot lead (verifier r2, #422).
    .filter((variant) => counts(variant.key).exposed > 0)
    .map((variant) => ({
      key: variant.key,
      chance: chanceBetter(counts(controlKey), counts(variant.key), wanted === 1) ?? 0,
    }))
    .sort((a, b) => b.chance - a.chance)
  const treatmentKey = recorded?.key ?? measured[0]?.key ?? byChance[0]?.key ?? treatments[0]!.key
  const controlRow = metricRow(controlKey)
  const treatmentRow = metricRow(treatmentKey)
  const interval = treatmentRow?.liftInterval
  const lift =
    interval && interval.ok
      ? {
          value: interval.lift * 100,
          low: interval.low * 100,
          high: interval.high * 100,
          crossesZero: interval.crossesZero,
        }
      : null

  const start = Date.parse(definition.plannedWindow.startAt)
  const end = Date.parse(definition.plannedWindow.endAt)
  // S6.2: a test with no end date has no planned length; its progress is the days it has run (plannedDays: null).
  const openEnded = isOpenEnded(definition.plannedWindow.endAt)
  // Counted up to where the analysis reads — a stopped test's days stop at its stop (verifier, #423).
  const readTo = Math.min(input.now.getTime(), Date.parse(analysis.window.endAt))
  const daysIn = Math.max(
    0,
    Math.floor(((Number.isFinite(readTo) ? readTo : input.now.getTime()) - start) / DAY_MS)
  )
  const plannedDays = openEnded ? null : Math.max(1, Math.round((end - start) / DAY_MS))
  const day = plannedDays === null ? daysIn : Math.min(plannedDays, daysIn)
  const smallest = Math.min(...analysis.variants.map((row) => row.observedSubjects))
  const need = definition.minimumSamplePerVariant
  const fraction = Math.min(1, smallest / need)
  const exposed = analysis.diagnostics.validExposureSubjects
  const perDay = day > 0 ? smallest / day : 0
  const remaining = fraction >= 1 || perDay <= 0 ? null : Math.ceil((need - smallest) / perDay)

  const A = label(definition, controlKey)
  const B = label(definition, treatmentKey)
  const metric = eventWords(definition.primaryMetric.event)
  const wantUp = definition.primaryMetric.direction === 'increase'
  const favourable = lift ? (wantUp ? lift.low > 0 : lift.high < 0) : false
  const unfavourable = lift ? (wantUp ? lift.high < 0 : lift.low > 0) : false
  const guardrails = analysis.guardrailMetrics.map((guard) => {
    const row = guard.variants.find((variant) => variant.key === treatmentKey)
    // The lead's row states the LEAD's result; any other treatment that harmed the guardrail is NAMED
    // beside it (Codex, #172 round 6 — it must appear; fresh reviewer, round 7 — never pinned on the
    // lead, whose clean win must not be withheld for another arm's harm).
    const harmedBy = guard.variants
      .filter(
        (variant) =>
          variant.key !== controlKey &&
          variant.key !== treatmentKey &&
          variant.directionalStatus === 'unfavorable'
      )
      .map((variant) => label(definition, variant.key))
    const delta =
      row?.liftFromControl === null || row?.liftFromControl === undefined ? null : row.liftFromControl * 100
    return {
      event: guard.event,
      label: eventWords(guard.event),
      delta,
      status:
        row?.directionalStatus === 'unfavorable'
          ? ('worse' as const)
          : delta === null
            ? ('unknown' as const)
            : ('fine' as const),
      harmedBy,
    }
  })
  const guardHeld = !guardrails.some((guard) => guard.status === 'worse')
  // A roll-out is offered only for a win that cost nothing the owner said must hold.
  const canShip = favourable && guardHeld
  const others = [...new Set(guardrails.flatMap((guard) => guard.harmedBy))]
  const guardWords = !guardHeld
    ? 'A guardrail moved the wrong way'
    : others.length > 0
      ? `Guardrails fine for ${B}, but ${others.join(' and ')} moved one the wrong way`
      : 'Guardrails fine'
  const srm = analysis.diagnostics.srm.status
  const srmWords =
    srm === 'clear'
      ? 'split checks out'
      : srm === 'detected'
        ? 'the split is off'
        : 'split can’t be checked yet'

  // S6.3 (Daniel, 2026-10-20): what a founder can act on today, whatever the volume — each version's counts and the chance
  // the lead is really better. The interval above answers "is it significant?"; this answers "which way is it leaning?".
  const controlCounts = {
    exposed: controlRow?.exposedSubjects ?? 0,
    converted: controlRow?.convertedSubjects ?? 0,
  }
  const treatmentCounts = {
    exposed: treatmentRow?.exposedSubjects ?? 0,
    converted: treatmentRow?.convertedSubjects ?? 0,
  }
  // Both versions must have been seen: a version nobody saw has no rate to compare (verifier, #422).
  const chance =
    controlCounts.exposed === 0 || treatmentCounts.exposed === 0
      ? null
      : chanceBetter(controlCounts, treatmentCounts, definition.primaryMetric.direction === 'increase')
  const common = {
    control: {
      key: controlKey,
      label: A,
      exposed: controlRow?.exposedSubjects ?? 0,
      rate: controlRow?.conversionRate ?? null,
    },
    treatment: {
      key: treatmentKey,
      label: B,
      exposed: treatmentRow?.exposedSubjects ?? 0,
      rate: treatmentRow?.conversionRate ?? null,
    },
    lift,
    chance,
    progress: { fraction, needPerVersion: need, day, plannedDays },
    srm,
    guardrails,
  }
  const plain = (text: string): SentencePart => ({ text, emphasis: false })
  const bold = (text: string): SentencePart => ({ text, emphasis: true })

  // The blockers in words, never their storage codes (Sprint contract #9; general pass, #172 round 3).
  // Only `srm_not_evaluable` is a SAMPLE fact — too few people to check the split, clearing itself
  // as more arrive — so only it waits for the sample; every other blocker is real at any size
  // (fresh reviewer, #172 round 4).
  const trustBlockers = analysis.blockers.filter(
    (blocker) => !(blocker === 'srm_not_evaluable' && analysis.sampleStatus !== 'met')
  )
  const blockerSentences = trustBlockers
    .map((blocker) => blockerWords(blocker).what)
    .join(' ')
    .replace(/^./, (c) => c.toLowerCase())
  const lead: SentencePart[] = lift
    ? [
        bold(
          Math.abs(lift.value) < 0.5
            ? 'No difference yet'
            : `${B} is ${lift.value > 0 === wantUp ? 'ahead' : 'behind'}, ${signed(lift.value)}`
        ),
        plain(` (range ${signed(lift.low)} to ${signed(lift.high)}). ${guardWords}, ${srmWords}.`),
      ]
    : [bold(`No comparison on ${metric} yet`), plain(`. ${guardWords}, ${srmWords}.`)]
  const countsLine: SentencePart[] =
    chance === null
      ? []
      : [
          plain(
            ` So far: ${A} ${controlCounts.converted} of ${controlCounts.exposed}, ${B} ${treatmentCounts.converted} of ${treatmentCounts.exposed} — ${chanceWords(chance)} likely ${B} is really better.`
          ),
        ]
  // Every live or stopped test can be rolled out or kept at any time, whatever the numbers (Daniel, 2026-10-20). The
  // sentence above says how sure it is; the buttons never wait for a sample.
  const anyTime: ReadoutAction[] = ['rollout', 'keep']
  if (input.lifecycle === 'decided' && input.decision) {
    const shipped = input.decision.outcome === 'ship_treatment'
    return {
      ...common,
      state: 'decided',
      answer: [
        bold(
          `Decided: ${shipped ? `ship ${B}` : input.decision.outcome === 'keep_control' ? `keep ${A}` : input.decision.outcome.replace(/_/g, ' ')}.`
        ),
        plain(' The decision and its reason are recorded.'),
      ],
      verdict: {
        label: 'Decision',
        title: shipped
          ? `${B} won.`
          : input.decision.outcome === 'keep_control'
            ? `${A} stays.`
            : input.decision.outcome === 'iterate'
              ? 'Change it and run again.'
              : input.decision.outcome === 'invalid'
                ? 'The result was marked invalid.'
                : 'No clear answer.',
        body: `${input.decision.rationale}.`,
        actions:
          input.decision.outcome === 'ship_treatment' || input.decision.outcome === 'keep_control'
            ? ['rollout']
            : [],
      },
    }
  }
  // Stopped, not yet decided (fresh reviewer, PR #172): nobody new is counted, so nothing here may say
  // "live" or "keep it running" — the one thing left to do is record the decision.
  if (input.lifecycle === 'stopped') {
    const ready = analysis.decisionReady
    // A blocker is not a short sample (fresh reviewer, #172 round 2): say the numbers can't be
    // trusted, and let "invalid" be the honest call — before any sentence about the sample.
    // A short sample's `srm_not_evaluable` is "not enough people", never "invalid" (round 3);
    // `trustBlockers` keeps every other blocker (round 4).
    if (exposed > 0 && trustBlockers.length > 0) {
      return {
        ...common,
        state: 'stopped',
        answer: [
          bold('Stopped — nobody new is counted.'),
          plain(' '),
          ...lead,
          plain(` The numbers can’t be trusted: ${blockerSentences}`),
          ...countsLine,
        ],
        verdict: {
          label: 'What happens next',
          title: 'Record the decision.',
          body: 'The checks found a problem, so these numbers may not mean what they say. You can still roll a version out or keep the current one.',
          actions: [...anyTime, 'invalid', 'iterate'],
          recommend: 'invalid',
        },
      }
    }
    return {
      ...common,
      state: 'stopped',
      answer: [
        bold('Stopped — nobody new is counted.'),
        plain(' '),
        ...(exposed === 0
          ? [plain('It stopped before anyone was counted.')]
          : [
              ...lead,
              plain(
                ready
                  ? ' Record the decision.'
                  : ` It stopped at ${Math.round(fraction * 100)}% of the planned sample, so any call is directional.`
              ),
              ...countsLine,
            ]),
      ],
      verdict: {
        label: 'What happens next',
        title: 'Record the decision.',
        body: ready
          ? favourable && !guardHeld
            ? `${B} came out ahead, but a guardrail moved the wrong way; weigh the cost before shipping it.`
            : favourable
              ? `${B} came out ahead with enough people to trust it.`
              : unfavourable
                ? `${B} came out worse with enough people to trust it.`
                : 'There were enough people, and no real difference showed up.'
          : 'Below the planned sample, so the call is directional: roll out the version you believe in, keep the current one, or change it and run again.',
        actions: [...anyTime, 'iterate'],
        recommend: ready ? (canShip ? 'rollout' : 'keep') : null,
      },
    }
  }
  if (input.lifecycle === 'running' && !input.serving && input.paused) {
    return {
      ...common,
      state: 'paused',
      answer: [
        bold('Paused.'),
        plain(
          ` Everyone sees what they saw before the test, and nobody new enters it. Conversions while paused still count for the group each person was in. Resume and the split serves again — each person lands in the same group.`
        ),
        ...countsLine,
      ],
      verdict: {
        label: 'What happens next',
        title: 'Resume it, or decide.',
        body: 'Its people are kept while it is paused; anything they do counts for their group, even though they see the current version. You can also roll a version out, keep the current one, or stop it.',
        actions: ['retry-serving', ...anyTime, 'stop'],
        recommend: 'retry-serving',
      },
    }
  }
  if (input.lifecycle === 'running' && !input.serving) {
    return {
      ...common,
      state: 'not_serving',
      answer: [
        bold('Running, but the split isn’t serving yet.'),
        plain(' Nobody is being counted until Production serves this test’s version of the feature.'),
      ],
      verdict: {
        label: 'What happens next',
        title: 'Serve the split.',
        body: 'Retry turns this test’s version of the feature on in Production. Nothing else changes.',
        actions: ['retry-serving'],
        recommend: null,
      },
    }
  }
  if (exposed === 0) {
    return {
      ...common,
      state: 'waiting',
      answer: [
        bold('It’s live. Nobody has been counted yet.'),
        plain(
          ` ${entityPlural(definition.assignmentEntityType).replace(/^./, (c) => c.toUpperCase())} are being split ${definition.variants.map((v) => v.weight).join(' / ')} from now. It needs ${need.toLocaleString('en-US')} per version.`
        ),
      ],
      verdict: {
        label: 'What happens next',
        title: 'Let it run.',
        body: 'Results appear here as soon as the first person is counted. You can roll a version out or stop it at any time.',
        actions: [...anyTime, 'pause', 'stop'],
        recommend: null,
      },
    }
  }
  if (trustBlockers.length > 0) {
    return {
      ...common,
      state: 'blocked',
      answer: [...lead, plain(` The numbers can’t be trusted yet: ${blockerSentences}`), ...countsLine],
      verdict: {
        label: 'What happens next',
        title: 'Fix what the checks found before trusting the number.',
        body: 'The checks found a problem, so the number may not mean what it says. You can still roll a version out or keep the current one.',
        actions: [...anyTime, 'pause', 'stop'],
        recommend: null,
      },
    }
  }
  if (!analysis.decisionReady) {
    return {
      ...common,
      state: 'gathering',
      answer: [
        ...lead,
        plain(
          ` ${Math.round(fraction * 100)}% of the planned sample, so any call now is directional.${remaining !== null ? ` About ${remaining} more day${remaining === 1 ? '' : 's'} to the planned sample.` : ''}`
        ),
        ...countsLine,
      ],
      verdict: {
        label: 'What happens next',
        title:
          remaining !== null
            ? `Keep it running. About ${remaining} more day${remaining === 1 ? '' : 's'}.`
            : 'Keep it running.',
        body: 'Keep it running for a surer answer, or roll out the version you believe in now.',
        actions: [...anyTime, 'pause', 'stop'],
        recommend: null,
      },
    }
  }
  return {
    ...common,
    state: 'ready',
    answer: [
      ...lead,
      plain(
        canShip
          ? ' The whole range is on the right side of zero, so you can call it.'
          : favourable
            ? ' The main number moved the right way, but a guardrail didn’t, so weigh the cost before calling it.'
            : ' The range still includes no difference, so the honest call is that it didn’t move.'
      ),
      ...countsLine,
    ],
    verdict: canShip
      ? {
          label: 'Ready',
          title: `${B} is winning. Roll it out?`,
          body: `${metric.replace(/^./, (c) => c.toUpperCase())} moved the way you wanted and the split checks out.`,
          actions: [...anyTime, 'pause', 'stop'],
          recommend: 'rollout',
        }
      : favourable
        ? {
            label: 'Ready',
            title: `${B} is ahead, but a guardrail moved the wrong way.`,
            body: 'Look at what it cost before deciding; rolling it out is your call.',
            actions: [...anyTime, 'iterate', 'pause', 'stop'],
            recommend: null,
          }
        : unfavourable
          ? {
              label: 'Ready',
              title: `${B} is worse. Keep ${A}.`,
              body: 'There were enough people to see a change, and it went the wrong way.',
              actions: [...anyTime, 'iterate', 'pause', 'stop'],
              recommend: 'keep',
            }
          : {
              label: 'Ready',
              title: `No real difference. Keep ${A}?`,
              body: 'There were enough people to see the change you planned for, and it didn’t show up.',
              actions: [...anyTime, 'iterate', 'pause', 'stop'],
              recommend: 'keep',
            },
  }
}
