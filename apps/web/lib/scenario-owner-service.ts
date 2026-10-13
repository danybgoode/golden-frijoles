import 'server-only'
// scenarios-light-up D1 — ONE owner service behind the scenarios page and `frijoles scenarios`.
//
// Every owner write a founder makes on the page, an agent makes through `/api/v1/cli/scenarios`, and both arrive here
// with a project id and a user id their own surface resolved server-side (`requireProjectOwnership`, `requireCliOwner`).
// The rules live once: the authoring switch, each kind's switch, the launch blockers, and the owner RPCs (which repeat
// the ownership proof in the database). A surface only authenticates, calls one function and shapes the answer.
import {
  isResilienceScenariosEnabled,
  isScenarioAuthoringEnabled,
  isSecuritySimulationsEnabled,
} from './flags'
import { guardedHttpOwnershipProofPost } from './guarded-http'
import { parseScenarioAdminOperation } from './scenario-admin-operation'
import {
  isOwnerDirectScenarioOperation,
  isScenarioKindEnabled,
  scenarioLaunchBlocker,
  type ScenarioCapabilityGates,
} from './scenario-authoring-policy'
import { checkOwnerTargetAnswer } from './scenario-owner-target-check'
import { checkRateLimit } from './rate-limit'
import {
  executeScenarioOwnerOperation,
  getScenarioOwnerDefinitionContext,
  getScenarioOwnerRunContext,
  getScenarioOwnerStopContext,
  type ScenarioOwnerOperationResult,
} from './scenario-owner-operations'
import { createScenarioOwnerToken, hashScenarioOwnerToken } from './scenario-target-proof'
import { getSupabaseServiceClient } from './supabase'

export type ScenarioOwner = { projectId: string; userId: string }
type Environment = 'development' | 'preview' | 'production'

/** `unavailable` = a switch is off (a surface answers 404); `notFound` = nothing of that name in this project. */
export type ScenarioServiceFailure = {
  ok: false
  error: string
  conflict?: boolean
  unavailable?: boolean
  notFound?: boolean
}
export type ScenarioServiceResult<T extends Record<string, unknown> = Record<string, unknown>> =
  ({ ok: true } & T) | ScenarioServiceFailure

const AUTHORING_OFF: ScenarioServiceFailure = {
  ok: false,
  unavailable: true,
  error: 'Scenario authoring is unavailable in this deployment.',
}

function environment(value: unknown): Environment | null {
  return value === 'development' || value === 'preview' || value === 'production' ? value : null
}

async function capabilities(): Promise<ScenarioCapabilityGates> {
  return {
    resilience: await isResilienceScenariosEnabled(),
    security: await isSecuritySimulationsEnabled(),
  }
}

function unavailable(kind: 'resilience' | 'security'): ScenarioServiceFailure {
  return {
    ok: false,
    unavailable: true,
    error: `${kind === 'resilience' ? 'Resilience scenarios' : 'Security simulations'} are unavailable in this deployment.`,
  }
}

function fromOperation(result: ScenarioOwnerOperationResult): ScenarioServiceResult {
  if (result.ok) return result
  return {
    ok: false,
    error: result.error,
    ...(result.conflict ? { conflict: true } : {}),
    ...(result.error === 'The scenario was not found in this project.' ? { notFound: true } : {}),
  }
}

/** Is the authoring switch on? Every write checks it FIRST, before anything about the project is read. */
export async function scenarioAuthoringOn(): Promise<boolean> {
  return await isScenarioAuthoringEnabled()
}

// ── Targets ────────────────────────────────────────────────────────────────────────────────────────────────────────

type TargetRow = {
  id: string
  key: string
  target_kind: string
  origin: string
  status: string
  ownership_challenge_hash: string
}

async function findTarget(
  projectId: string,
  ref: { targetKey?: string; targetId?: string }
): Promise<TargetRow | null> {
  let query = getSupabaseServiceClient()
    .from('scenario_targets')
    .select('id, key, target_kind, origin, status, ownership_challenge_hash')
    .eq('project_id', projectId)
  if (ref.targetId) query = query.eq('id', ref.targetId)
  else if (ref.targetKey) query = query.eq('key', ref.targetKey)
  else return null
  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('[scenario-owner] target read failed', { code: error.code ?? 'unknown' })
    return null
  }
  return (data as TargetRow | null) ?? null
}

/** D2: registers an `owner_token_v1` target and returns its token ONCE; only the token's hash is kept. */
export async function registerScenarioTarget(
  owner: ScenarioOwner,
  input: { targetKey: unknown; origin: unknown; reason: unknown }
): Promise<
  ScenarioServiceResult<{
    targetId: string
    targetKey: string
    origin: string
    status: string
    token: string
  }>
> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  // The credential parser owns the shape of a key, an exact HTTPS origin and a reason; reuse it, never restate it.
  const parsed = parseScenarioAdminOperation({
    operation: 'register_target',
    targetKey: input.targetKey,
    targetKind: 'miyagi_resilience_probe_v1',
    origin: input.origin,
    reason: input.reason,
  })
  if (!parsed || parsed.operation !== 'register_target')
    return {
      ok: false,
      error:
        'A target needs a key (lowercase, e.g. site.probe), an exact https:// origin with no path, and a reason.',
    }
  const token = createScenarioOwnerToken()
  const { data, error } = await getSupabaseServiceClient().rpc('owner_register_scenario_target', {
    p_project_id: owner.projectId,
    p_actor_user_id: owner.userId,
    p_target_key: parsed.targetKey,
    p_origin: parsed.origin,
    p_token_hash: hashScenarioOwnerToken(token),
    p_reason: parsed.reason,
  })
  if (error) {
    if (error.code === '55000')
      return {
        ok: false,
        conflict: true,
        error: `A target named ${parsed.targetKey} already exists in this project. Its token was shown once; revoke it and add the app under a new key.`,
      }
    if (error.code === '54000') return { ok: false, error: 'This project has reached its 100-target limit.' }
    if (error.code === '42501') return { ok: false, notFound: true, error: 'Project ownership is required.' }
    console.error('[scenario-owner] register failed', { code: error.code ?? 'unknown' })
    return { ok: false, error: 'Could not register the target.' }
  }
  const row = Array.isArray(data) ? data[0] : null
  if (!row || typeof row.target_id !== 'string') return { ok: false, error: 'Could not register the target.' }
  return {
    ok: true,
    targetId: row.target_id,
    targetKey: parsed.targetKey,
    origin: parsed.origin,
    status: 'pending',
    token,
  }
}

/** D2: asks the app for its answer, then marks the target verified only if it holds this target's token. */
export async function verifyScenarioTarget(
  owner: ScenarioOwner,
  input: { targetKey?: unknown; targetId?: unknown; reason: unknown }
): Promise<ScenarioServiceResult<{ targetId: string; targetKey: string; status: string; changed: boolean }>> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (reason.length < 1 || reason.length > 500)
    return { ok: false, error: 'A reason (1–500 characters) is required.' }
  const target = await findTarget(owner.projectId, {
    targetKey: typeof input.targetKey === 'string' ? input.targetKey : undefined,
    targetId: typeof input.targetId === 'string' ? input.targetId : undefined,
  })
  if (!target) return { ok: false, notFound: true, error: 'No target of that name in this project.' }
  if (target.target_kind !== 'owner_token_v1')
    return {
      ok: false,
      conflict: true,
      error: 'This target is verified through its own credential route, not here.',
    }
  if (target.status === 'revoked') return { ok: false, conflict: true, error: 'This target is revoked.' }
  if (target.status === 'verified')
    return { ok: true, targetId: target.id, targetKey: target.key, status: 'verified', changed: false }

  // Each verify makes the engine send one request to an origin the owner chose, so it is bounded per owner and project
  // (verifier, #348): plenty for a person fixing a deploy, never a way to aim the engine at someone.
  const limited = await checkRateLimit(`scenario-verify:${owner.projectId}:${owner.userId}`, {
    windowMs: 10 * 60_000,
    max: 10,
  })
  // `conflict` (retry later), never `invalid`: the command was right, it was just too soon (verifier round 2, #348).
  if (!limited.ok)
    return {
      ok: false,
      conflict: true,
      error: 'Too many verify attempts for this project. Wait a few minutes and try again.',
    }

  const check = await checkOwnerTargetAnswer(guardedHttpOwnershipProofPost, {
    targetKey: target.key,
    origin: target.origin,
    tokenHash: target.ownership_challenge_hash,
  })
  if (!check.ok) return { ok: false, error: check.detail }

  const { data, error } = await getSupabaseServiceClient().rpc('owner_verify_scenario_target', {
    p_project_id: owner.projectId,
    p_actor_user_id: owner.userId,
    p_target_id: target.id,
    p_checked_hash: target.ownership_challenge_hash,
    p_reason: reason,
  })
  if (error) {
    if (error.code === '42501') return { ok: false, notFound: true, error: 'Project ownership is required.' }
    if (error.code === '55000') return { ok: false, conflict: true, error: 'This target is revoked.' }
    console.error('[scenario-owner] verify failed', { code: error.code ?? 'unknown' })
    return { ok: false, error: 'Could not verify the target.' }
  }
  const row = Array.isArray(data) ? data[0] : null
  if (!row)
    return { ok: false, conflict: true, error: 'The target changed while it was being verified. Try again.' }
  return {
    ok: true,
    targetId: target.id,
    targetKey: target.key,
    status: String(row.status),
    changed: Boolean(row.changed),
  }
}

export async function revokeScenarioTarget(
  owner: ScenarioOwner,
  input: { targetKey?: unknown; targetId?: unknown; reason: unknown }
): Promise<ScenarioServiceResult> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  const target = await findTarget(owner.projectId, {
    targetKey: typeof input.targetKey === 'string' ? input.targetKey : undefined,
    targetId: typeof input.targetId === 'string' ? input.targetId : undefined,
  })
  if (!target) return { ok: false, notFound: true, error: 'No target of that name in this project.' }
  // A revoke is not environment-scoped (`owner_revoke_scenario_target` takes none); the direct path only needs one.
  return ownerDirectOperation(owner, 'production', {
    operation: 'revoke_target',
    targetId: target.id,
    reason: input.reason,
  })
}

// ── Definitions and runs (moved verbatim in behaviour from the page's actions) ─────────────────────────────────────

/** Define a scenario, revoke a target, or stop a run: the three operations an owner makes directly. */
export async function ownerDirectOperation(
  owner: ScenarioOwner,
  selectedEnvironment: unknown,
  rawOperation: unknown
): Promise<ScenarioServiceResult> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  const safeEnvironment = environment(selectedEnvironment)
  const operation = parseScenarioAdminOperation(rawOperation)
  if (!safeEnvironment || !operation) return { ok: false, error: 'Invalid scenario command.' }
  if (
    (operation.operation !== 'revoke_target' &&
      operation.operation !== 'create_definition' &&
      operation.operation !== 'transition_run') ||
    !isOwnerDirectScenarioOperation(
      operation.operation,
      operation.operation === 'transition_run' ? operation.transition : undefined
    )
  )
    return { ok: false, error: 'Invalid scenario command.' }
  const gates = await capabilities()
  if (operation.operation === 'create_definition') {
    if (operation.definition.environment !== safeEnvironment)
      return { ok: false, error: 'The definition environment does not match the command.' }
    if (operation.definition.cohort === 'external')
      return { ok: false, error: 'External cohorts are unavailable in owner authoring.' }
    if (!isScenarioKindEnabled(operation.definition.kind, gates))
      return unavailable(operation.definition.kind)
  }
  if (operation.operation === 'revoke_target' && !gates.resilience && !gates.security)
    return {
      ok: false,
      unavailable: true,
      error: 'Scenario capabilities are unavailable in this deployment.',
    }
  if (operation.operation === 'transition_run') {
    const context = await getScenarioOwnerStopContext(owner.projectId, operation.runId)
    if (!context || context.environment !== safeEnvironment)
      return { ok: false, notFound: true, error: 'The scenario run is unavailable.' }
    if (!isScenarioKindEnabled(context.kind, gates)) return unavailable(context.kind)
  }
  return fromOperation(
    await executeScenarioOwnerOperation({
      projectId: owner.projectId,
      environment: safeEnvironment,
      actorUserId: owner.userId,
      operation,
    })
  )
}

/**
 * Create a run from a definition version and start it. `onDraft` runs after the draft commits and before the start,
 * so a surface can show the honest partial state if the start then fails (the page revalidates there).
 */
export async function launchScenarioRun(
  owner: ScenarioOwner,
  input: { scenarioVersionId: unknown; reason: unknown },
  onDraft?: () => void
): Promise<ScenarioServiceResult> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  const create = parseScenarioAdminOperation({
    operation: 'create_run',
    scenarioVersionId: input.scenarioVersionId,
    reason: input.reason,
  })
  if (!create || create.operation !== 'create_run') return { ok: false, error: 'Invalid launch command.' }
  const context = await getScenarioOwnerDefinitionContext(owner.projectId, create.scenarioVersionId)
  if (!context) return { ok: false, notFound: true, error: 'The scenario definition is unavailable.' }
  const gates = await capabilities()
  // A switched-off kind is `disabled` (404), the same answer `define` gives, not a 400 (verifier, #348).
  if (!isScenarioKindEnabled(context.definition.kind, gates)) return unavailable(context.definition.kind)
  const blocker = scenarioLaunchBlocker(
    {
      ...context.definition,
      targetVerified: context.targetVerified,
      productionSecurityApproved: context.productionSecurityApproved,
      faultSummaryAvailable: context.faultSummary !== null,
    },
    gates
  )
  if (blocker) return { ok: false, error: blocker }
  const safeEnvironment = context.definition.environment
  const draft = await executeScenarioOwnerOperation({
    projectId: owner.projectId,
    environment: safeEnvironment,
    actorUserId: owner.userId,
    operation: create,
  })
  if (!draft.ok) return fromOperation(draft)
  if (typeof draft.run_id !== 'string' || typeof draft.revision !== 'number')
    return { ok: false, error: 'The run draft response was incomplete.' }
  onDraft?.()
  const start = parseScenarioAdminOperation({
    operation: 'start_run',
    runId: draft.run_id,
    expectedRevision: draft.revision,
    reason: input.reason,
  })
  if (!start || start.operation !== 'start_run')
    return { ok: false, error: 'Could not prepare the run start.' }
  return fromOperation(
    await executeScenarioOwnerOperation({
      projectId: owner.projectId,
      environment: safeEnvironment,
      actorUserId: owner.userId,
      operation: start,
    })
  )
}

/** Start a draft run left behind by a launch whose start failed. */
export async function startScenarioDraftRun(
  owner: ScenarioOwner,
  input: { runId: unknown; expectedRevision: unknown; reason: unknown }
): Promise<ScenarioServiceResult> {
  if (!(await scenarioAuthoringOn())) return AUTHORING_OFF
  const start = parseScenarioAdminOperation({
    operation: 'start_run',
    runId: input.runId,
    expectedRevision: input.expectedRevision,
    reason: input.reason,
  })
  if (!start || start.operation !== 'start_run') return { ok: false, error: 'Invalid start command.' }
  const context = await getScenarioOwnerRunContext(owner.projectId, start.runId)
  if (!context || context.status !== 'draft' || context.revision !== start.expectedRevision)
    return { ok: false, conflict: true, error: 'This draft run changed. Refresh and try again.' }
  const gates = await capabilities()
  if (!isScenarioKindEnabled(context.definition.kind, gates)) return unavailable(context.definition.kind)
  const blocker = scenarioLaunchBlocker(
    {
      ...context.definition,
      environment: context.environment,
      targetVerified: context.targetVerified,
      productionSecurityApproved: context.productionSecurityApproved,
      faultSummaryAvailable: context.faultSummary !== null,
    },
    gates
  )
  if (blocker) return { ok: false, error: blocker }
  return fromOperation(
    await executeScenarioOwnerOperation({
      projectId: owner.projectId,
      environment: context.environment,
      actorUserId: owner.userId,
      operation: start,
    })
  )
}
