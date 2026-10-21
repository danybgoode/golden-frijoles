import 'server-only'
import {
  parseExperimentDecisionCommand,
  prepareExperimentDecisionSnapshot,
} from './experiment-decision-contract'
import { recordExperimentDecision } from './experiment-decision-query'
import { getExperimentAnalysisByProjectId } from './experiment-analysis-query'
import { listExperimentRegistries, transitionExperimentVersion } from './experiments'
import { validateExperimentKey } from './experiment-definition'
import { buildReadout, type Readout } from './experiment-readout'
import type { BuilderIo } from './experiment-builder-io'
import type { ExperimentLifecycleState } from './experiment-registry-view'

// landing-launch-experiment · Sprint 6, Story 6.4 — the experiment writes and reads that are not the builder's, for EVERY
// surface: the console's server actions and the CLI's `/api/v1/cli/experiments` call these, so an agent and a person run
// one path and meet the same rules (S6.1–S6.3). Each takes an owner (or member, for reads) ALREADY resolved server-side —
// from a browser session or a CLI token — and never a project id from a request. The database functions underneath
// re-check ownership themselves (42501), so a mistake in this layer is refused, not served.

export type ExperimentOwner = { projectId: string; userId: string; slug: string }

type Failure = { ok: false; error: string }

/** The newest version of `key` in this project, or null. */
export async function latestExperimentVersion(projectId: string, key: string) {
  const registries = await listExperimentRegistries(projectId)
  const registry = registries.find((row) => row.key === key)
  if (!registry || registry.versions.length === 0) return null
  const latest = [...registry.versions].sort((a, b) => b.version - a.version)[0]!
  return { experimentId: registry.id, ...latest }
}

export type ExperimentSummary = {
  key: string
  version: number
  status: ExperimentLifecycleState
  flagKey: string | null
  startedAt: string | null
  endedAt: string | null
}

/** Every experiment in the project, newest version each — `frijoles experiments ls`. */
export async function listExperimentSummaries(projectId: string): Promise<ExperimentSummary[]> {
  const registries = await listExperimentRegistries(projectId)
  return registries
    .filter((row) => row.versions.length > 0)
    .map((row) => {
      const latest = [...row.versions].sort((a, b) => b.version - a.version)[0]!
      return {
        key: row.key,
        version: latest.version,
        status: latest.status,
        flagKey: null,
        startedAt: latest.startedAt,
        endedAt: latest.endedAt,
      }
    })
}

/** The same readout the results page draws, for one experiment's newest version — `frijoles experiments show`. Null
 *  readout for a draft or invalidated version (nothing is counted). */
export async function readExperiment(
  projectId: string,
  slug: string,
  key: string,
  io: Pick<BuilderIo, 'servingState'>
): Promise<
  | { ok: true; key: string; version: number; status: ExperimentLifecycleState; readout: Readout | null }
  | { ok: false; reason: 'not_found' | 'unavailable' }
> {
  if (!validateExperimentKey(key)) return { ok: false, reason: 'not_found' }
  const latest = await latestExperimentVersion(projectId, key)
  if (!latest) return { ok: false, reason: 'not_found' }
  if (latest.status === 'draft' || latest.status === 'invalid')
    return { ok: true, key, version: latest.version, status: latest.status, readout: null }
  const result = await getExperimentAnalysisByProjectId(projectId, slug, key, {
    version: latest.version,
    asOf: new Date().toISOString(),
  })
  if (!result.ok)
    return {
      ok: false,
      reason:
        result.reason === 'experiment_not_found' || result.reason === 'version_not_found'
          ? 'not_found'
          : 'unavailable',
    }
  const state = await io.servingState(projectId, latest.id)
  const current = result.decisions.current
  const readout = buildReadout({
    definition: result.experiment.definition,
    analysis: result.analysis,
    lifecycle: result.experiment.lifecycle,
    decision: current
      ? { outcome: current.outcome, chosenVariantKey: current.chosenVariantKey, rationale: current.rationale }
      : null,
    serving: state === null || state === 'split',
    paused: state === 'paused',
    now: new Date(),
  })
  return { ok: true, key, version: latest.version, status: latest.status, readout }
}

/** Stop a running experiment's newest version: nobody new is counted. */
export async function stopExperimentCommand(
  owner: ExperimentOwner,
  key: string
): Promise<{ ok: true; version: number } | Failure> {
  if (!validateExperimentKey(key)) return { ok: false, error: 'Invalid experiment key.' }
  const latest = await latestExperimentVersion(owner.projectId, key)
  if (!latest) return { ok: false, error: `No experiment "${key}" in ${owner.slug}.` }
  if (latest.status !== 'running')
    return { ok: false, error: `${key} v${latest.version} is ${latest.status}, not running.` }
  const result = await transitionExperimentVersion(
    owner.projectId,
    latest.experimentId,
    latest.id,
    'stopped',
    owner.userId
  )
  return result.ok ? { ok: true, version: latest.version } : { ok: false, error: result.error }
}

export type DecisionInput = {
  recordKind: unknown
  supersedesRecordId: unknown
  outcome: unknown
  chosenVariantKey: unknown
  rationale: unknown
  idempotencyKey: unknown
}

/**
 * Record a decision on a stopped (or, as a correction, decided) version. The evidence is ALWAYS recomputed here, never
 * taken from the caller: the browser or the CLI supplies only the human choice and stable identifiers, so neither can
 * forge plan or analysis evidence.
 */
export async function recordDecisionCommand(
  owner: ExperimentOwner,
  key: unknown,
  definitionVersion: unknown,
  input: DecisionInput
): Promise<Awaited<ReturnType<typeof recordExperimentDecision>> | Failure> {
  if (!validateExperimentKey(key)) return { ok: false, error: 'Invalid experiment key.' }
  const version = typeof definitionVersion === 'number' ? definitionVersion : Number(definitionVersion)
  if (!Number.isSafeInteger(version) || version < 1 || version > 1_000_000)
    return { ok: false, error: 'Invalid experiment definition version.' }

  const capturedAt = new Date().toISOString()
  const governed = await getExperimentAnalysisByProjectId(owner.projectId, owner.slug, key, {
    version,
    asOf: capturedAt,
  })
  if (!governed.ok) return { ok: false, error: 'Could not capture governed analysis for this decision.' }
  const parsed = parseExperimentDecisionCommand(input, {
    definition: governed.experiment.definition,
    lifecycle: governed.experiment.lifecycle,
    currentDecisionId: governed.decisions.current?.id ?? null,
  })
  if (!parsed.ok) return parsed

  let analysisSnapshot: Record<string, unknown>
  try {
    analysisSnapshot = prepareExperimentDecisionSnapshot(governed.analysis, capturedAt)
  } catch (error) {
    console.error('[experiments] decision snapshot rejected:', error)
    return { ok: false, error: 'The governed analysis snapshot is not safe to record.' }
  }
  return recordExperimentDecision(
    owner.projectId,
    governed.experiment.id,
    governed.experiment.versionId,
    owner.userId,
    parsed.command,
    analysisSnapshot
  )
}
