import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, requireCliMember } from '@/lib/cli-auth'
import { getExperimentDecisionByKey } from '@/lib/experiment-decision-query'
import { isExperimentGovernanceEnabled } from '@/lib/flags'

// result-record · Story 3.1 (D15) — an experiment's decision record by key, for an agent:
// `frijoles experiments decision <key> [--version <n>]`. Member-gated like every CLI read (one project, server-side); the
// ledger is read only through `lib/experiment-decision-query.ts`.

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // The governed ledger's kill switch, checked BEFORE authentication like every other governed read (the console page,
  // the versioned compare route, `get_experiment_analysis`): with the gate off this seam does not exist (fresh review,
  // #293 — D19 says nothing is returned that the console would not show).
  if (!(await isExperimentGovernanceEnabled()))
    return cliError('disabled', 'Experiment decisions are not switched on here.')
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context

  const key = url.searchParams.get('experiment')?.trim()
  if (!key || !/^[a-z][a-z0-9_-]{0,63}$/.test(key))
    return cliError('invalid', 'Name the experiment by its key: frijoles experiments decision <key>.')
  const versionParam = url.searchParams.get('version')
  const version = versionParam === null ? undefined : Number(versionParam)
  if (version !== undefined && (!Number.isInteger(version) || version < 1 || version > 1_000_000))
    return cliError('invalid', '--version must be a whole number from 1.')

  const result = await getExperimentDecisionByKey(context.projectId, key, version)
  if (!result.ok) {
    if (result.reason === 'experiment_not_found')
      return cliError('not_found', `No experiment "${key}" in ${context.projectSlug}.`)
    if (result.reason === 'version_not_found')
      return cliError('not_found', `Experiment "${key}" has no version ${version ?? '(none yet)'}.`)
    return cliError('server_error', 'Could not read this experiment’s decisions right now.')
  }
  return cliOk({ project: context.projectSlug, ...result.experiment, decisions: result.decisions })
}
