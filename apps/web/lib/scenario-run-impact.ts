import type { ScenarioDashboardView } from './scenario-dashboard'

// drill-impact-for-agents D10, D11 — ONE rule for "what is this run's impact?", read by the CLI route (S2.1) and the
// connector (S2.2). Pure, with no `server-only`, so unit tests can load it. The state is DERIVED from the
// dashboard view (the run, its definition's experiment binding, its newest evidence row), never stored.

type Arm = { attempts: number; failures: number; latencyP95Ms: number | null }

export type ScenarioRunImpact =
  | { state: 'unbound' }
  | {
      state: 'captured'
      experiment: { key: string; definitionVersion: number }
      capturedAt: string
      control: Arm
      treatment: Arm
      failureRateDelta: number | null
      latencyP95DeltaMs: number | null
      claim: { status: string; causal: boolean; blockers: string[] }
      evidenceId: string
    }
  | { state: 'not_captured'; reason: string }

export type ScenarioRunImpactState = ScenarioRunImpact['state']

/**
 * D11 — the reason, derived from the run's start and stop times: the SAME facts the capture checks
 * (`captureOwnerScenarioImpact`), so the read never sends a retry that the capture would refuse.
 */
function notCapturedReason(
  run: { startedAt: string | null; stoppedAt: string | null },
  runId: string
): string {
  if (!run.startedAt) return 'the run never started'
  if (!run.stoppedAt) return 'the run has not stopped'
  return `no capture recorded — run \`frijoles scenarios impact ${runId} --capture\``
}

/** `null` for a run the view does not hold. */
export function scenarioRunImpact(view: ScenarioDashboardView, runId: string): ScenarioRunImpact | null {
  const run = view.runs.find((candidate) => candidate.id === runId)
  if (!run) return null
  const definition = view.definitions.find((candidate) => candidate.id === run.scenarioVersionId)
  if (!definition?.definition.experiment) return { state: 'unbound' }

  // Newest row wins (a run normally has one; the ordering is defensive, not a feature).
  const newest = view.impacts
    .filter((impact) => impact.runId === runId)
    .reduce<(typeof view.impacts)[number] | null>(
      (best, impact) => (best === null || impact.createdAt > best.createdAt ? impact : best),
      null
    )
  if (!newest) return { state: 'not_captured', reason: notCapturedReason(run, runId) }

  const { evidence } = newest
  return {
    state: 'captured',
    experiment: {
      key: evidence.experiment.key,
      definitionVersion: evidence.experiment.definitionVersion,
    },
    capturedAt: newest.createdAt,
    control: evidence.technical.control,
    treatment: evidence.technical.fault,
    failureRateDelta: evidence.technical.failureRateDelta,
    latencyP95DeltaMs: evidence.technical.latencyP95DeltaMs,
    claim: {
      status: evidence.claim.status,
      causal: evidence.claim.causal,
      blockers: evidence.claim.blockers,
    },
    evidenceId: newest.id,
  }
}

/** Just the state word per run, for the connector (S2.2, D13): an unknown run cannot occur there, so it reads unbound. */
export function scenarioRunImpactState(view: ScenarioDashboardView, runId: string): ScenarioRunImpactState {
  return scenarioRunImpact(view, runId)?.state ?? 'unbound'
}
