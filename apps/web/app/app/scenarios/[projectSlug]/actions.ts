'use server'
import { revalidatePath } from 'next/cache'
import { requireProjectOwnership } from '@/lib/dashboard-auth'
import {
  launchScenarioRun,
  ownerDirectOperation,
  registerScenarioTarget,
  scenarioAuthoringOn,
  startScenarioDraftRun,
  verifyScenarioTarget,
  type ScenarioServiceResult,
} from '@/lib/scenario-owner-service'

// scenarios-light-up D1 — these actions only authenticate the owner and refresh the page; every rule lives in
// `lib/scenario-owner-service.ts`, which `frijoles scenarios` (`/api/v1/cli/scenarios`) calls too.

// Gate first: an OFF deployment cannot reveal project membership or mutate through this seam.
type OwnerAuth =
  | { failure: { ok: false; error: string }; slug: null; owner: null }
  | { failure: null; slug: string; owner: { projectId: string; userId: string } }

async function owner(slug: unknown): Promise<OwnerAuth> {
  if (!(await scenarioAuthoringOn()))
    return { failure: { ok: false, error: 'Scenario authoring is unavailable in this deployment.' }, slug: null, owner: null }
  if (typeof slug !== 'string') return { failure: { ok: false, error: 'Invalid project.' }, slug: null, owner: null }
  const { projectId, userId } = await requireProjectOwnership(slug)
  return { failure: null, slug, owner: { projectId, userId } }
}

type PageResult = ({ ok: true } & Record<string, unknown>) | { ok: false; error: string; conflict?: true }

// The service's routing hints (unavailable, notFound) are for the CLI route's status codes; the page shows the words.
function surface(result: ScenarioServiceResult): PageResult {
  if (result.ok) return result
  return { ok: false, error: result.error, ...(result.conflict ? { conflict: true as const } : {}) }
}

export async function scenarioOwnerOperationAction(
  slug: unknown,
  selectedEnvironment: unknown,
  rawOperation: unknown
) {
  const auth = await owner(slug)
  if (auth.failure) return auth.failure
  const result = await ownerDirectOperation(auth.owner, selectedEnvironment, rawOperation)
  if (result.ok) revalidatePath(`/app/scenarios/${auth.slug}`)
  return surface(result)
}

export async function launchScenarioRunAction(slug: unknown, scenarioVersionId: unknown, reason: unknown) {
  const auth = await owner(slug)
  if (auth.failure) return auth.failure
  // Starting can still fail after the draft transaction commits. Revalidate then so the honest partial state is
  // visible and the owner can retry instead of seeing a stale page.
  const result = await launchScenarioRun(auth.owner, { scenarioVersionId, reason }, () =>
    revalidatePath(`/app/scenarios/${auth.slug}`)
  )
  if (result.ok) revalidatePath(`/app/scenarios/${auth.slug}`)
  return surface(result)
}

export async function startScenarioRunAction(
  slug: unknown,
  runId: unknown,
  expectedRevision: unknown,
  reason: unknown
) {
  const auth = await owner(slug)
  if (auth.failure) return auth.failure
  const result = await startScenarioDraftRun(auth.owner, { runId, expectedRevision, reason })
  if (result.ok) revalidatePath(`/app/scenarios/${auth.slug}`)
  return surface(result)
}

/** scenarios-light-up S1.5 — register an app as a target; the token comes back once, for the owner to copy. */
export async function registerScenarioTargetAction(slug: unknown, targetKey: unknown, origin: unknown, reason: unknown) {
  const auth = await owner(slug)
  if (auth.failure) return auth.failure
  const result = await registerScenarioTarget(auth.owner, { targetKey, origin, reason })
  if (result.ok) revalidatePath(`/app/scenarios/${auth.slug}`)
  return surface(result)
}

export async function verifyScenarioTargetAction(slug: unknown, targetId: unknown, reason: unknown) {
  const auth = await owner(slug)
  if (auth.failure) return auth.failure
  const result = await verifyScenarioTarget(auth.owner, { targetId, reason })
  if (result.ok) revalidatePath(`/app/scenarios/${auth.slug}`)
  return surface(result)
}
