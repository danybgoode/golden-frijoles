import 'server-only'
import {
  MAX_DECISION_HISTORY_RECORDS,
  ExperimentDecisionResourceLimitError,
  mapExperimentDecisionRows,
  type ExperimentDecisionHistory,
  type ExperimentDecisionRow,
  type ParsedExperimentDecisionCommand,
} from './experiment-decision-contract'
import { getSupabaseServiceClient } from './supabase'

export type ExperimentDecisionHistoryResult =
  | { ok: true; decisions: ExperimentDecisionHistory }
  | { ok: false; reason: 'query_failed' | 'resource_limit' }

/**
 * The only decision-ledger read resolver. Callers must resolve `projectId` server-side from an API
 * key, membership, or connector token. The experiment/version identifiers are always combined
 * with that tenant predicate, so a foreign stable id cannot widen this read.
 */
export async function getExperimentDecisionHistoryByProjectId(
  projectId: string,
  experimentId: string,
  versionId: string,
): Promise<ExperimentDecisionHistoryResult> {
  const supabase = getSupabaseServiceClient()
  const { data, error } = await supabase
    .from('experiment_decision_records')
    .select(`
      id,
      ordinal,
      definition_version,
      record_kind,
      outcome,
      chosen_variant_key,
      rationale,
      analysis_snapshot,
      integrity_snapshot,
      actor_user_id,
      created_at,
      supersedes_record_id
    `)
    .eq('project_id', projectId)
    .eq('experiment_id', experimentId)
    .eq('version_id', versionId)
    .order('ordinal', { ascending: true })
    .limit(MAX_DECISION_HISTORY_RECORDS + 1)
  if (error || !Array.isArray(data)) {
    console.error('[experiment-decision-query] history lookup failed:', error)
    return { ok: false, reason: 'query_failed' }
  }
  if (data.length > MAX_DECISION_HISTORY_RECORDS) {
    return { ok: false, reason: 'resource_limit' }
  }
  try {
    return {
      ok: true,
      decisions: mapExperimentDecisionRows(data as unknown as ExperimentDecisionRow[]),
    }
  } catch (error) {
    console.error('[experiment-decision-query] malformed decision history:', error)
    return {
      ok: false,
      reason: error instanceof ExperimentDecisionResourceLimitError
        ? 'resource_limit'
        : 'query_failed',
    }
  }
}

export async function recordExperimentDecision(
  projectId: string,
  experimentId: string,
  versionId: string,
  actorUserId: string,
  command: ParsedExperimentDecisionCommand,
  analysisSnapshot: Record<string, unknown>,
): Promise<
  | { ok: true; decisions: ExperimentDecisionHistory }
  | { ok: false; error: string }
> {
  const supabase = getSupabaseServiceClient()
  const { error } = await supabase.rpc('record_experiment_decision', {
    p_project_id: projectId,
    p_experiment_id: experimentId,
    p_version_id: versionId,
    p_record_kind: command.recordKind,
    p_outcome: command.outcome,
    p_chosen_variant_key: command.chosenVariantKey,
    p_rationale: command.rationale,
    p_analysis_snapshot: analysisSnapshot,
    p_actor_user_id: actorUserId,
    p_idempotency_key: command.idempotencyKey,
    p_supersedes_record_id: command.supersedesRecordId,
  })
  if (error) {
    console.error('[experiment-decision-query] record failed:', error)
    return { ok: false, error: 'This experiment decision could not be recorded.' }
  }
  const refreshed = await getExperimentDecisionHistoryByProjectId(
    projectId,
    experimentId,
    versionId,
  )
  if (!refreshed.ok || refreshed.decisions.current === null) {
    return { ok: false, error: 'The decision was recorded but could not be reloaded.' }
  }
  return { ok: true, decisions: refreshed.decisions }
}

export type ExperimentDecisionByKeyResult =
  | {
      ok: true
      experiment: { key: string; version: number; lifecycle: string }
      decisions: ExperimentDecisionHistory
    }
  | { ok: false; reason: 'experiment_not_found' | 'version_not_found' | 'query_failed' | 'resource_limit' }

/**
 * result-record D15 — an experiment's decision record by its KEY, for an agent that knows the key, not the ids.
 *
 * The registry row is read by (project, key), the version is the one asked for or the highest one, and the ledger is
 * read through `getExperimentDecisionHistoryByProjectId` — the only ledger reader — with the ids this function just
 * resolved under the same `projectId`. Callers must resolve `projectId` server-side (membership or connector token).
 */
export async function getExperimentDecisionByKey(
  projectId: string,
  experimentKey: string,
  version?: number,
): Promise<ExperimentDecisionByKeyResult> {
  const supabase = getSupabaseServiceClient()
  const { data: registry, error: registryError } = await supabase
    .from('experiment_registries')
    .select('id, key')
    .eq('project_id', projectId)
    .eq('key', experimentKey)
    .maybeSingle()
  if (registryError) {
    console.error('[experiment-decision-query] registry lookup failed:', registryError)
    return { ok: false, reason: 'query_failed' }
  }
  if (!registry || typeof registry.id !== 'string') return { ok: false, reason: 'experiment_not_found' }

  let query = supabase
    .from('experiment_definition_versions')
    .select('id, version, status')
    .eq('project_id', projectId)
    .eq('experiment_id', registry.id)
  query = version === undefined ? query.order('version', { ascending: false }).limit(1) : query.eq('version', version)
  const { data: rows, error: versionError } = await query
  if (versionError) {
    console.error('[experiment-decision-query] version lookup failed:', versionError)
    return { ok: false, reason: 'query_failed' }
  }
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row || typeof row.id !== 'string' || typeof row.version !== 'number')
    return { ok: false, reason: 'version_not_found' }

  const history = await getExperimentDecisionHistoryByProjectId(projectId, registry.id, row.id)
  if (!history.ok) return { ok: false, reason: history.reason }
  return {
    ok: true,
    experiment: { key: String(registry.key), version: row.version, lifecycle: String(row.status) },
    decisions: history.decisions,
  }
}
