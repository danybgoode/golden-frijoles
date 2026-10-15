// funnel-truth S1.4 (D8) — a feature's funnel by cohort period, for an agent.
//
//   frijoles funnel <feature-key> [--by month|week] [--project <slug>] [--json]
//
// One row per cohort period (the people first exposed in it), oldest first. A period that is still maturing has not had
// its retention days yet, so its RETAINED reads `maturing` rather than a number that looks like a drop; a period the
// server could not read says so under the table. Member-gated through `/api/v1/cli/funnel` (404 for a project you are
// not in); the JSON is the server's rows, unchanged.

import { flagValue } from '../args'
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

type TrendRow =
  | {
      label: string
      maturing: boolean
      state: 'read'
      exposed: number
      adopted: number | null
      retained: number | null
      adoptedWithoutExposure: number
    }
  | { label: string; maturing: boolean; state: 'unreadable'; reason: string }

export type FunnelBody = {
  project: string
  feature: string
  by: 'month' | 'week'
  trend: { state: 'not_exposed' } | { state: 'measured'; from: string; to: string; periods: TrendRow[] }
}

const BYS = ['month', 'week']
const count = (n: number | null) => (n === null ? 'not measured' : String(n))

export function renderFunnel(body: FunnelBody): string {
  if (body.trend.state === 'not_exposed')
    return `${body.feature}: nobody has been counted yet, so there is no trend to read.`
  const rows = body.trend.periods
  const notes = rows.flatMap((r) => (r.state === 'unreadable' ? [`  ${r.label}: ${r.reason}`] : []))
  return [
    `${body.feature} by ${body.by}, ${rows.length} ${body.by === 'month' ? 'months' : 'weeks'} (${body.trend.from.slice(0, 10)} to ${body.trend.to.slice(0, 10)})`,
    table(
      ['PERIOD', 'GOT IT', 'ADOPTED', 'RETAINED'],
      rows.map((r) =>
        r.state === 'unreadable'
          ? [r.label, 'unreadable', 'unreadable', 'unreadable']
          : [r.label, String(r.exposed), count(r.adopted), r.maturing ? 'maturing' : count(r.retained)]
      )
    ),
    ...(notes.length ? ['Could not be read:', ...notes] : []),
  ].join('\n')
}

export const funnelCommand: Command = {
  path: ['funnel'],
  summary: "a feature's funnel by month or week: got it, adopted, retained",
  usage: 'frijoles funnel <feature-key> [--by month|week] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Each row is the people who first got the feature in that period, followed to now. A period younger
  than the feature's retention window shows RETAINED as \`maturing\`; a period the server could not read says so
  and why, never a short number. \`--json\` prints the rows an agent parses.`,
  flags: [
    { name: 'by', value: 'month|week', describe: 'the period to group by (default: month)' },
    { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' },
  ],
  async run(context): Promise<ExitCode> {
    const feature = context.args.positionals[0]
    if (!feature) {
      context.emit.fail('invalid', 'Name the feature: `frijoles funnel <feature-key>`.')
      return EXIT.USAGE
    }
    const by = flagValue(context.args, 'by')
    if (by !== undefined && !BYS.includes(by)) {
      context.emit.fail('invalid', '--by must be month or week.')
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)

    const result = await context.api!.get<FunnelBody>('api/v1/cli/funnel', {
      project,
      feature,
      ...(by ? { by } : {}),
    })
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    const body = result.body
    context.emit.ok(
      { project: body.project, feature: body.feature, by: body.by, trend: body.trend },
      renderFunnel(body)
    )
    return EXIT.OK
  },
}
