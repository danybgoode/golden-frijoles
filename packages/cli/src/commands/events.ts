// traffic-relaunch S1.4 (D7) — how many times one event fired, per day, from a terminal.
//
//   frijoles events count <event> [--days N] [--by <tag>] [--project <slug>] [--json]
//
// One row per UTC day, oldest first; with --by, one row per day and tag value (e.g. `--by utm_source` credits each
// video or search with the visits it sent), biggest first within a day. Past the server's row cap the answer says it
// was cut, never a short total that looks whole. Member-gated through `/api/v1/cli/events` (404 for a project you are
// not in); the JSON is the server's answer, unchanged.

import { flagValue } from '../args'
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

export type EventCountBody = {
  project: string
  event: string
  days: number
  from: string
  to: string
  byTag: string | null
  total: number
  truncated: boolean
  rows: Array<{ day: string; value?: string; count: number }>
}

export function renderEventCount(body: EventCountBody): string {
  const head = `${body.event} in ${body.project}, last ${body.days} ${body.days === 1 ? 'day' : 'days'}: ${body.total}${
    body.truncated ? ' (cut at the row cap: the real total is higher)' : ''
  }`
  if (body.rows.length === 0) return `${head}. Nothing was counted in this window.`
  const rows = body.byTag
    ? body.rows.map((r) => [r.day, r.value ?? '(none)', String(r.count)])
    : body.rows.map((r) => [r.day, String(r.count)])
  const headers = body.byTag ? ['DAY', body.byTag.toUpperCase(), 'COUNT'] : ['DAY', 'COUNT']
  return [head, table(headers, rows)].join('\n')
}

export const eventsCountCommand: Command = {
  path: ['events', 'count'],
  summary: 'how many times an event fired, per day, optionally per tag',
  usage: 'frijoles events count <event> [--days N] [--by <tag>] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Counts one event in one project, per UTC day, over the last N days (default 30, at most 90).
  \`--by <tag>\` splits each day by that tag's value; a row without the tag shows \`(none)\`. A count cut at
  the server's row cap says so. \`--json\` prints the rows an agent parses.`,
  flags: [
    { name: 'days', value: 'N', describe: 'the window in days, 1 to 90 (default: 30)' },
    { name: 'by', value: '<tag>', describe: 'split each day by this tag (e.g. utm_source)' },
    { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' },
  ],
  async run(context): Promise<ExitCode> {
    const event = context.args.positionals[0]
    if (!event) {
      context.emit.fail('invalid', 'Name the event: `frijoles events count <event>`.')
      return EXIT.USAGE
    }
    const days = flagValue(context.args, 'days')
    if (days !== undefined && !(/^\d{1,2}$/.test(days) && Number(days) >= 1 && Number(days) <= 90)) {
      context.emit.fail('invalid', '--days must be a whole number from 1 to 90.')
      return EXIT.USAGE
    }
    const by = flagValue(context.args, 'by')
    if (by !== undefined && !/^[a-z0-9_]{1,40}$/.test(by)) {
      context.emit.fail(
        'invalid',
        '--by must be a tag name: lowercase letters, digits and _ (e.g. utm_source).'
      )
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)

    const result = await context.api!.get<EventCountBody>('api/v1/cli/events', {
      project,
      event,
      ...(days ? { days } : {}),
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
    context.emit.ok(result.body, renderEventCount(result.body))
    return EXIT.OK
  },
}
