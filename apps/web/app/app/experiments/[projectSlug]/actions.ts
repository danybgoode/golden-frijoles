'use server'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { requireProjectOwnership } from '@/lib/dashboard-auth'
import { recordDecisionCommand } from '@/lib/experiment-owner-commands'
import { transitionExperimentVersion, type ExperimentTransitionTarget } from '@/lib/experiments'
import { validateExperimentKey } from '@/lib/experiment-definition'
import { isExperimentGovernanceEnabled } from '@/lib/flags'
import { getSupabaseServiceClient } from '@/lib/supabase'
import { createBuilderIo } from '@/lib/experiment-builder-io'

async function requireGate() {
  if (!(await isExperimentGovernanceEnabled())) notFound()
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid ${field}`)
  return value
}

export async function transitionExperimentVersionAction(
  slug: unknown,
  experimentId: unknown,
  versionId: unknown,
  targetStatus: unknown
) {
  await requireGate()
  const safeSlug = requireString(slug, 'project')
  // Resolve ownership before lifecycle-specific validation to avoid a management oracle.
  const { projectId, userId } = await requireProjectOwnership(safeSlug)
  const safeExperimentId = requireString(experimentId, 'experiment id')
  const safeVersionId = requireString(versionId, 'version id')
  if (targetStatus !== 'running' && targetStatus !== 'stopped' && targetStatus !== 'invalid') {
    return { ok: false as const, error: 'Invalid lifecycle target.' }
  }
  // A builder-made version starts ONLY through the builder's Start, which also serves its split (D7).
  // A bare lifecycle flip would leave it running and not serving (security lens, PR #172).
  if (targetStatus === 'running') {
    const answers = await createBuilderIo(getSupabaseServiceClient()).versionAnswers(projectId, safeVersionId)
    if (answers) return { ok: false as const, error: 'Start this experiment from its builder.' }
  }
  const result = await transitionExperimentVersion(
    projectId,
    safeExperimentId,
    safeVersionId,
    targetStatus as ExperimentTransitionTarget,
    userId
  )
  if (result.ok) revalidatePath(`/app/experiments/${safeSlug}`)
  return result
}

export async function recordExperimentDecisionAction(
  slug: unknown,
  experimentKey: unknown,
  definitionVersion: unknown,
  recordKind: unknown,
  supersedesRecordId: unknown,
  outcome: unknown,
  chosenVariantKey: unknown,
  rationale: unknown,
  idempotencyKey: unknown
) {
  await requireGate()
  const safeSlug = requireString(slug, 'project')
  // Resolve an owner before validating experiment identifiers so this mutation cannot become a
  // foreign-project or registry-discovery oracle.
  const { projectId, userId } = await requireProjectOwnership(safeSlug)
  if (!validateExperimentKey(experimentKey)) {
    return { ok: false as const, error: 'Invalid experiment key.' }
  }
  const version = typeof definitionVersion === 'number' ? definitionVersion : Number(definitionVersion)
  if (!Number.isSafeInteger(version) || version < 1 || version > 1_000_000) {
    return { ok: false as const, error: 'Invalid experiment definition version.' }
  }

  // One path for the console and the CLI (S6.4): the evidence is recomputed inside, never taken from the caller.
  const result = await recordDecisionCommand({ projectId, userId, slug: safeSlug }, experimentKey, version, {
    recordKind,
    supersedesRecordId,
    outcome,
    chosenVariantKey,
    rationale,
    idempotencyKey,
  })
  if (result.ok) {
    revalidatePath(`/app/experiments/${safeSlug}`)
    revalidatePath(`/app/experiments/${safeSlug}/${experimentKey}`)
  }
  return result
}
