import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliMember, requireCliOwner } from '@/lib/cli-auth'
import { buildScenarioDefinition, SCENARIO_AUTHORING_DEFAULTS } from '@/lib/scenario-authoring-draft'
import { getScenarioDashboardView } from '@/lib/scenario-dashboard'
import { getScenarioOwnerStopContext } from '@/lib/scenario-owner-operations'
import {
  launchScenarioRun,
  ownerDirectOperation,
  registerScenarioTarget,
  revokeScenarioTarget,
  scenarioAuthoringOn,
  verifyScenarioTarget,
  type ScenarioServiceResult,
} from '@/lib/scenario-owner-service'

// scenarios-light-up S1.3 (D1, D4) — `frijoles scenarios`: everything the scenarios page does, for an agent.
//
// A second door onto the SAME owner service the page's actions call (`lib/scenario-owner-service.ts`); this route only
// authenticates and shapes answers. MEMBER reads (the page shows scenarios to any member), OWNER writes, and the
// project id comes from the membership `lib/cli-auth.ts` resolves, never from the body. Every write needs the
// authoring switch, and answers `disabled` (404) BEFORE the credential is looked at, as the page's actions do; a
// launch also needs its kind's switch, which the service checks.

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context
  const view = await getScenarioDashboardView(context.projectId)
  return cliOk({
    project: context.projectSlug,
    authoring: await scenarioAuthoringOn(),
    targets: view.targets,
    definitions: view.definitions,
    faultFlags: view.faultFlags,
    runs: view.runs,
    impacts: view.impacts,
  })
}

function answer(result: ScenarioServiceResult, project: string): NextResponse {
  if (result.ok) {
    const { ok: _ok, ...rest } = result
    return cliOk({ project, ...rest })
  }
  if (result.unavailable) return cliError('disabled', result.error)
  if (result.notFound) return cliError('not_found', result.error)
  if (result.conflict) return cliError('conflict', result.error)
  return cliError('invalid', result.error)
}

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)
const int = (value: unknown, fallback: number) => (value === undefined ? fallback : Number(value))

export async function POST(req: NextRequest) {
  if (!(await scenarioAuthoringOn())) return cliError('disabled', 'Scenario authoring is unavailable in this deployment.')
  const input = await readCliBody(req)
  if (input instanceof NextResponse) return input
  const context = await requireCliOwner(req, text(input.project) ?? null)
  if (context instanceof NextResponse) return context
  const owner = { projectId: context.projectId, userId: context.userId }
  const project = context.projectSlug
  const reason = input.reason

  switch (input.command) {
    case 'register_target':
      return answer(await registerScenarioTarget(owner, { targetKey: input.targetKey, origin: input.origin, reason }), project)
    case 'verify_target':
      return answer(await verifyScenarioTarget(owner, { targetKey: input.targetKey, reason }), project)
    case 'revoke_target':
      return answer(await revokeScenarioTarget(owner, { targetKey: input.targetKey, reason }), project)

    case 'define': {
      // The agent names the drill; the bounds default to the page's, and the same builder and parser check them. A
      // resilience drill only: a security drill needs a template and the founder's approval, on the page (verifier, #348).
      if (input.kind !== undefined && input.kind !== 'resilience')
        return cliError('invalid', 'Only resilience drills are defined here; define a security drill on the scenarios page.')
      const environment = text(input.environment) ?? 'production'
      const built = buildScenarioDefinition({
        kind: 'resilience',
        cohort: input.cohort === 'internal' ? 'internal' : 'synthetic',
        targetKey: text(input.targetKey) ?? '',
        environment: environment as 'development' | 'preview' | 'production',
        startAt: text(input.startAt) ?? new Date().toISOString(),
        durationSeconds: int(input.durationSeconds, SCENARIO_AUTHORING_DEFAULTS.durationSeconds),
        requestCap: int(input.requestCap, SCENARIO_AUTHORING_DEFAULTS.requestCap),
        concurrencyCap: int(input.concurrencyCap, SCENARIO_AUTHORING_DEFAULTS.concurrencyCap),
        leaseTtlSeconds: int(input.leaseTtlSeconds, SCENARIO_AUTHORING_DEFAULTS.leaseTtlSeconds),
        abortAfterFailures: int(input.abortAfterFailures, SCENARIO_AUTHORING_DEFAULTS.abortAfterFailures),
        maxErrorRatePercent: int(input.maxErrorRatePercent, SCENARIO_AUTHORING_DEFAULTS.maxErrorRatePercent),
        flagKey: text(input.flagKey) ?? '',
        flagVersion: int(input.flagVersion, 0),
      })
      if (!built.ok) return cliError('invalid', built.error, { field: built.field })
      return answer(
        await ownerDirectOperation(owner, environment, {
          operation: 'create_definition',
          scenarioKey: input.scenarioKey,
          definition: built.definition,
          reason,
        }),
        project
      )
    }

    case 'launch': {
      // By scenario key (its newest version) or an exact version id, so an agent never has to look up a uuid.
      let versionId = text(input.scenarioVersionId)
      if (!versionId && text(input.scenarioKey)) {
        const view = await getScenarioDashboardView(context.projectId)
        const versions = view.definitions.filter((definition) => definition.scenarioKey === input.scenarioKey)
        versionId = versions.sort((a, b) => b.version - a.version)[0]?.id
        if (!versionId) return cliError('not_found', `No scenario \`${String(input.scenarioKey)}\` in this project.`)
      }
      return answer(await launchScenarioRun(owner, { scenarioVersionId: versionId, reason }), project)
    }

    case 'stop': {
      // A stop is the emergency control: it acts on the run as it is now, so the agent need not know its revision.
      const runId = text(input.runId)
      const run = runId ? await getScenarioOwnerStopContext(context.projectId, runId) : null
      if (!run) return cliError('not_found', 'No such run in this project.')
      return answer(
        await ownerDirectOperation(owner, run.environment, {
          operation: 'transition_run',
          runId,
          expectedRevision: run.revision,
          transition: 'stop',
          reason,
        }),
        project
      )
    }

    default:
      return cliError(
        'invalid',
        'Unknown command. Use register_target, verify_target, revoke_target, define, launch or stop.'
      )
  }
}
