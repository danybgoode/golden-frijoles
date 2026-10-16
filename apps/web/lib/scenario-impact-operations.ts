import 'server-only'
import { getExperimentAnalysisByProjectId } from './experiment-analysis-query'
import { buildScenarioImpactEvidence, type ScenarioImpactEvidence } from './scenario-impact'
import {
  OWNER_IMPACT_REASON,
  ownerImpactAsOf,
  ownerImpactIdempotencyKey,
  type ScenarioImpactCaptureRequest,
} from './scenario-impact-request'
import { getSupabaseServiceClient } from './supabase'

type Source = {
  projectId: string
  projectSlug: string
  scenarioId: string
  scenarioVersionId: string
  scenarioKey: string
  scenarioVersion: number
  runRevision: number
  cohort: 'synthetic' | 'internal' | 'external'
  flagId: string
  flagVersionId: string
  flagKey: string
  flagDefinitionVersion: number
  experimentId: string
  experimentVersionId: string
  experimentKey: string
  experimentDefinitionVersion: number
  technical: {
    control: { attempts: number; failures: number; latencyP95Ms: number | null }
    fault: { attempts: number; failures: number; latencyP95Ms: number | null }
  }
  relatedEvidence: {
    errorSignalIds: string[]
    frictionSignalIds: string[]
    taskIds: string[]
  }
}

export type StoredScenarioImpactEvidence = {
  id: string
  runId: string
  scenarioKey: string
  scenarioVersion: number
  evidence: ScenarioImpactEvidence
  reason: string
  /** NULL for an owner's capture (D4): only the Miyagi key path has an external actor. */
  externalActorId: string | null
  createdAt: string
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function counterArm(value: unknown): value is Source['technical']['control'] {
  return (
    record(value) &&
    Number.isSafeInteger(value.attempts) &&
    Number(value.attempts) >= 0 &&
    Number.isSafeInteger(value.failures) &&
    Number(value.failures) >= 0 &&
    Number(value.failures) <= Number(value.attempts) &&
    (value.latencyP95Ms === null ||
      (typeof value.latencyP95Ms === 'number' &&
        Number.isFinite(value.latencyP95Ms) &&
        value.latencyP95Ms >= 0))
  )
}

function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === 'string')
}

function mapSource(row: unknown): Source | null {
  if (!record(row) || !record(row.technical) || !record(row.related_evidence)) return null
  if (
    !counterArm(row.technical.control) ||
    !counterArm(row.technical.fault) ||
    !stringArray(row.related_evidence.errorSignalIds) ||
    !stringArray(row.related_evidence.frictionSignalIds) ||
    !stringArray(row.related_evidence.taskIds)
  )
    return null
  const strings = [
    'project_id',
    'project_slug',
    'scenario_id',
    'scenario_version_id',
    'scenario_key',
    'flag_id',
    'flag_version_id',
    'flag_key',
    'experiment_id',
    'experiment_version_id',
    'experiment_key',
  ] as const
  if (strings.some((key) => typeof row[key] !== 'string')) return null
  if (
    !Number.isSafeInteger(row.scenario_version) ||
    !Number.isSafeInteger(row.run_revision) ||
    !Number.isSafeInteger(row.flag_definition_version) ||
    !Number.isSafeInteger(row.experiment_definition_version) ||
    (row.cohort !== 'synthetic' && row.cohort !== 'internal' && row.cohort !== 'external')
  )
    return null
  return {
    projectId: row.project_id as string,
    projectSlug: row.project_slug as string,
    scenarioId: row.scenario_id as string,
    scenarioVersionId: row.scenario_version_id as string,
    scenarioKey: row.scenario_key as string,
    scenarioVersion: Number(row.scenario_version),
    runRevision: Number(row.run_revision),
    cohort: row.cohort,
    flagId: row.flag_id as string,
    flagVersionId: row.flag_version_id as string,
    flagKey: row.flag_key as string,
    flagDefinitionVersion: Number(row.flag_definition_version),
    experimentId: row.experiment_id as string,
    experimentVersionId: row.experiment_version_id as string,
    experimentKey: row.experiment_key as string,
    experimentDefinitionVersion: Number(row.experiment_definition_version),
    technical: {
      control: row.technical.control,
      fault: row.technical.fault,
    },
    relatedEvidence: {
      errorSignalIds: row.related_evidence.errorSignalIds,
      frictionSignalIds: row.related_evidence.frictionSignalIds,
      taskIds: row.related_evidence.taskIds,
    },
  }
}

function mutationStatus(code: string | undefined): 400 | 401 | 409 | 500 {
  if (code === '22023') return 400
  if (code === '23505' || code === '55000') return 409
  return 500
}

/**
 * The step both doors share: the canonical experiment analysis as of `asOf`, wrapped into the evidence contract.
 * `409` = the analysis no longer names the experiment version the drill was bound to.
 */
async function buildCapturedEvidence(
  source: Source,
  runId: string,
  asOf: string
): Promise<
  { ok: true; evidence: ScenarioImpactEvidence } | { ok: false; status: 400 | 409 | 500; reason: string }
> {
  const analysis = await getExperimentAnalysisByProjectId(
    source.projectId,
    source.projectSlug,
    source.experimentKey,
    { version: source.experimentDefinitionVersion, asOf }
  )
  if (!analysis.ok) {
    if (analysis.reason === 'invalid_request')
      return { ok: false, status: 400, reason: 'the experiment analysis refused the request' }
    console.error('[scenario-impact] canonical experiment analysis unavailable', {
      reason: analysis.reason,
    })
    return { ok: false, status: 500, reason: `experiment analysis unavailable: ${analysis.reason}` }
  }
  if (
    analysis.experiment.id !== source.experimentId ||
    analysis.experiment.versionId !== source.experimentVersionId
  )
    return { ok: false, status: 409, reason: 'the experiment version changed since the drill was defined' }

  return {
    ok: true,
    evidence: buildScenarioImpactEvidence({
      generatedAt: asOf,
      scenario: {
        key: source.scenarioKey,
        definitionVersion: source.scenarioVersion,
        runId,
        runRevision: source.runRevision,
      },
      flag: {
        key: source.flagKey,
        definitionVersion: source.flagDefinitionVersion,
      },
      experiment: {
        key: source.experimentKey,
        definitionVersion: source.experimentDefinitionVersion,
      },
      cohort: source.cohort,
      technical: source.technical,
      canonicalAnalysis: analysis.analysis,
      relatedEvidence: source.relatedEvidence,
    }),
  }
}

function recordedRow(
  data: unknown
): { evidenceId: string; createdAt: string; created: boolean } | 'missing' | 'malformed' {
  const row = (Array.isArray(data) ? data[0] : undefined) as Record<string, unknown> | undefined
  if (!row) return 'missing'
  if (
    typeof row.evidence_id !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.created !== 'boolean'
  )
    return 'malformed'
  return { evidenceId: row.evidence_id, createdAt: row.created_at, created: row.created }
}

export async function captureScenarioImpactEvidence(input: {
  keyHash: string
  actor: string
  request: ScenarioImpactCaptureRequest
}): Promise<
  | { ok: true; evidenceId: string; createdAt: string; created: boolean; evidence: ScenarioImpactEvidence }
  | { ok: false; status: 400 | 401 | 409 | 500 }
> {
  const supabase = getSupabaseServiceClient()
  const { data: sourceRows, error: sourceError } = await supabase.rpc('get_scenario_impact_source', {
    p_key_hash: input.keyHash,
    p_run_id: input.request.runId,
    p_as_of: input.request.asOf,
  })
  if (sourceError) {
    const status = mutationStatus(sourceError.code)
    if (status === 500) console.error('[scenario-impact] source failed', { code: sourceError.code })
    return { ok: false, status }
  }
  const source = mapSource(sourceRows?.[0])
  if (!source) return { ok: false, status: sourceRows?.length ? 500 : 401 }

  const built = await buildCapturedEvidence(source, input.request.runId, input.request.asOf)
  if (!built.ok) return { ok: false, status: built.status }
  const { evidence } = built
  const { data, error } = await supabase.rpc('record_scenario_impact_evidence', {
    p_key_hash: input.keyHash,
    p_run_id: input.request.runId,
    p_evidence: evidence,
    p_reason: input.request.reason,
    p_external_actor_id: input.actor,
    p_idempotency_key: input.request.idempotencyKey,
  })
  if (error) {
    const status = mutationStatus(error.code)
    if (status === 500) console.error('[scenario-impact] record failed', { code: error.code })
    return { ok: false, status }
  }
  const row = recordedRow(data)
  if (row === 'missing') return { ok: false, status: 401 }
  if (row === 'malformed') return { ok: false, status: 500 }
  return { ok: true, ...row, evidence }
}

// ── The owner door (drill-impact-for-agents D5–D7) ─────────────────────────────────────────────────────────────────

/** What a stop, or `frijoles scenarios impact --capture`, says about a run's impact. */
export type OwnerImpactCapture =
  | { state: 'captured'; evidenceId: string; createdAt: string; created: boolean }
  | { state: 'not_captured'; reason: string }
  | { state: 'unbound' }

/**
 * D5–D7: capture a stopped run's impact through the owner functions. Never throws: every failure is a `not_captured`
 * with a plain reason, because a stop that reaches here has already happened and must still answer ok.
 */
export async function captureOwnerScenarioImpact(owner: {
  projectId: string
  userId: string
  runId: string
}): Promise<OwnerImpactCapture> {
  try {
    const supabase = getSupabaseServiceClient()
    const { data: run, error: runError } = await supabase
      .from('scenario_runs')
      .select('id, scenario_version_id, status, started_at, stopped_at')
      .eq('project_id', owner.projectId)
      .eq('id', owner.runId)
      .maybeSingle()
    if (runError) {
      console.error('[scenario-impact] owner run read failed', { code: runError.code })
      return { state: 'not_captured', reason: 'the run could not be read' }
    }
    if (!run) return { state: 'not_captured', reason: 'no such run in this project' }
    const { data: version, error: versionError } = await supabase
      .from('scenario_definition_versions')
      .select('experiment_id')
      .eq('project_id', owner.projectId)
      .eq('id', String(run.scenario_version_id))
      .maybeSingle()
    if (versionError || !version) {
      if (versionError)
        console.error('[scenario-impact] owner version read failed', { code: versionError.code })
      return { state: 'not_captured', reason: 'the drill definition could not be read' }
    }
    if (!version.experiment_id) return { state: 'unbound' }

    const { data: existing, error: existingError } = await supabase
      .from('scenario_impact_evidence')
      .select('id, created_at')
      .eq('project_id', owner.projectId)
      .eq('run_id', owner.runId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) {
      console.error('[scenario-impact] owner evidence read failed', { code: existingError.code })
      return { state: 'not_captured', reason: "the run's evidence could not be read" }
    }
    if (existing?.[0])
      return {
        state: 'captured',
        evidenceId: String(existing[0].id),
        createdAt: String(existing[0].created_at),
        created: false,
      }

    if (!run.started_at) return { state: 'not_captured', reason: 'the run never started' }
    if (!run.stopped_at) return { state: 'not_captured', reason: 'the run has not stopped' }
    const asOf = ownerImpactAsOf(String(run.stopped_at))
    if (!asOf) return { state: 'not_captured', reason: "the run's stop time could not be read" }

    const { data: sourceRows, error: sourceError } = await supabase.rpc('owner_get_scenario_impact_source', {
      p_project_id: owner.projectId,
      p_actor_user_id: owner.userId,
      p_run_id: owner.runId,
      p_as_of: asOf,
    })
    if (sourceError) {
      if (sourceError.code === '42501')
        return { state: 'not_captured', reason: 'project ownership is required' }
      console.error('[scenario-impact] owner source failed', { code: sourceError.code })
      return { state: 'not_captured', reason: 'the impact source could not be read' }
    }
    const source = mapSource(sourceRows?.[0])
    if (!source)
      return {
        state: 'not_captured',
        reason: 'the run has no impact source (a resilience run bound to an experiment)',
      }

    const built = await buildCapturedEvidence(source, owner.runId, asOf)
    if (!built.ok) return { state: 'not_captured', reason: built.reason }
    const { data, error } = await supabase.rpc('owner_record_scenario_impact_evidence', {
      p_project_id: owner.projectId,
      p_actor_user_id: owner.userId,
      p_run_id: owner.runId,
      p_evidence: built.evidence,
      p_reason: OWNER_IMPACT_REASON,
      p_idempotency_key: ownerImpactIdempotencyKey(owner.runId),
    })
    if (error) {
      if (error.code === '22023')
        return { state: 'not_captured', reason: 'the evidence changed while it was captured; retry' }
      if (error.code === '42501') return { state: 'not_captured', reason: 'project ownership is required' }
      console.error('[scenario-impact] owner record failed', { code: error.code })
      return { state: 'not_captured', reason: 'the evidence could not be recorded' }
    }
    const row = recordedRow(data)
    if (row === 'missing' || row === 'malformed')
      return { state: 'not_captured', reason: 'the evidence could not be recorded' }
    return { state: 'captured', ...row }
  } catch (error) {
    console.error('[scenario-impact] owner capture failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return { state: 'not_captured', reason: 'the capture failed unexpectedly' }
  }
}

export async function getScenarioImpactEvidence(
  keyHash: string
): Promise<StoredScenarioImpactEvidence[] | null> {
  const { data, error } = await getSupabaseServiceClient().rpc('get_scenario_impact_evidence', {
    p_key_hash: keyHash,
  })
  if (error) {
    console.error('[scenario-impact] list failed', { code: error.code })
    throw new Error('Could not load scenario impact evidence')
  }
  if (!Array.isArray(data)) return null
  const result: StoredScenarioImpactEvidence[] = []
  for (const item of data) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      typeof item.run_id !== 'string' ||
      typeof item.scenario_key !== 'string' ||
      !Number.isSafeInteger(item.scenario_version) ||
      !record(item.evidence) ||
      typeof item.reason !== 'string' ||
      (item.external_actor_id !== null && typeof item.external_actor_id !== 'string') ||
      typeof item.created_at !== 'string'
    )
      throw new Error('Malformed scenario impact evidence')
    result.push({
      id: item.id,
      runId: item.run_id,
      scenarioKey: item.scenario_key,
      scenarioVersion: Number(item.scenario_version),
      evidence: item.evidence as ScenarioImpactEvidence,
      reason: item.reason,
      externalActorId: item.external_actor_id as string | null,
      createdAt: item.created_at,
    })
  }
  return result
}
