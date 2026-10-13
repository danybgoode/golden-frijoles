// scenarios-light-up S2.2 (D7) — Golden Frijoles' own site as a drill target, like any customer app would be.
//
// The probe is the one instrumented seam a drill's fault lands on. It is reached only by the drill script
// (`scripts/scenario-drill.mjs`), with the probe secret, for a `synthetic:` subject; no visitor request ever runs
// through it. It does exactly what the SDK README tells a customer to do: resolve the scenario for this target,
// reserve a lease, apply the closed fault at this seam, settle, and record the execution. Pure over its dependencies,
// so the whole sequence is tested without a server (`scenario-probe.test.ts`).
import type {
  ScenarioExecutionTelemetryInput,
  ScenarioProvider,
} from '@golden-frijoles/sdk'

/** The most a probe will wait, whatever the fault says. The SDK already caps a delay; this is our own ceiling. */
export const PROBE_MAX_DELAY_MS = 5_000
const SYNTHETIC_SUBJECT = /^synthetic:[A-Za-z0-9][A-Za-z0-9_.:-]{0,100}$/

export type ProbeEnvironment = 'development' | 'preview' | 'production'

export type ProbeResult = {
  /** `idle` = no run is active for this target (or the subject is not in it): nothing was reserved or applied. */
  arm: 'idle' | 'control' | 'fault'
  faultKind: 'none' | 'delay' | 'synthetic_error'
  runId: string | null
  admitted: boolean
  latencyMs: number
  /** The status the probe answers with: 503 when the fault is a synthetic error, else 200. */
  status: 200 | 503
  reason: string
}

export function isSyntheticSubject(value: unknown): value is string {
  return typeof value === 'string' && SYNTHETIC_SUBJECT.test(value)
}

export function probeEnvironment(vercelEnv: string | undefined): ProbeEnvironment {
  return vercelEnv === 'production' ? 'production' : vercelEnv === 'preview' ? 'preview' : 'development'
}

export async function runScenarioProbe(
  deps: {
    provider: Pick<ScenarioProvider, 'refresh' | 'resolveScenario' | 'reserveExecution' | 'settleExecution' | 'getSnapshot'>
    track: ((input: ScenarioExecutionTelemetryInput) => Promise<unknown>) | null
    sleep: (ms: number) => Promise<void>
    now: () => number
  },
  input: { targetKey: string; subject: string; environment: ProbeEnvironment }
): Promise<ProbeResult> {
  const started = deps.now()
  const idle = (reason: string): ProbeResult => ({
    arm: 'idle',
    faultKind: 'none',
    runId: null,
    admitted: false,
    latencyMs: deps.now() - started,
    status: 200,
    reason,
  })
  if (!isSyntheticSubject(input.subject)) return idle('not a synthetic subject')

  await deps.provider.refresh()
  const resolution = deps.provider.resolveScenario(input.targetKey, { targetingKey: input.subject })
  if (!('runId' in resolution) || !resolution.runId || !resolution.runRevision) return idle(resolution.reason)
  const runId = resolution.runId

  const reservation = await deps.provider.reserveExecution(runId, resolution.runRevision)
  if (!reservation.ok || !reservation.admitted) {
    return { ...idle(reservation.ok ? reservation.reason : reservation.errorMessage), runId }
  }

  const fault = resolution.value
  const arm = fault.kind === 'none' ? 'control' : 'fault'
  let failed = false
  try {
    if (fault.kind === 'delay') await deps.sleep(Math.min(Math.max(0, fault.delayMs), PROBE_MAX_DELAY_MS))
    if (fault.kind === 'synthetic_error') failed = true
  } finally {
    await deps.provider.settleExecution(runId, reservation.leaseId, !failed)
  }
  const latencyMs = deps.now() - started

  const entry = deps.provider.getSnapshot()?.scenarios.find((candidate) => candidate.runId === runId)
  if (deps.track && entry && resolution.scenarioKey && resolution.scenarioVersion && resolution.variant && resolution.cohort) {
    // Telemetry never decides the probe's answer: a failed send is the engine's to notice, not the drill's.
    await deps
      .track({
        scenarioKey: resolution.scenarioKey,
        scenarioVersion: resolution.scenarioVersion,
        runId,
        runRevision: resolution.runRevision,
        leaseId: reservation.leaseId,
        targetKey: input.targetKey,
        cohort: resolution.cohort,
        environment: input.environment,
        arm,
        faultKind: fault.kind,
        failed,
        latencyMs: Math.min(latencyMs, 300_000),
        subject: { type: 'synthetic_probe', id: input.subject.slice('synthetic:'.length) },
        flag: {
          key: entry.flag.key,
          definitionVersion: entry.flag.definitionVersion,
          variant: resolution.variant,
          reason: resolution.reason,
          snapshotVersion: deps.provider.getSnapshot()!.revision,
        },
        ...(entry.experiment
          ? { experiment: { key: entry.experiment.key, definitionVersion: entry.experiment.definitionVersion } }
          : {}),
      })
      .catch(() => undefined)
  }

  return {
    arm,
    faultKind: fault.kind,
    runId,
    admitted: true,
    latencyMs,
    status: failed ? 503 : 200,
    reason: resolution.reason,
  }
}
