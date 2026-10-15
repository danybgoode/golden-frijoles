// funnel-truth S2.1 (D10) — a project's segments, for an agent.
//
//   frijoles segments define <key> --event <e> --min <n> --days <d> [--project <slug>] [--json]
//   frijoles segments ls [--project <slug>] [--json]
//
// A segment is a behaviour rule: the people who did <event> at least <n> times in the last <d> days. A bet names one in
// its `target_segment:`, and its funnel's Targeted becomes that segment's share of the active people. `everyone` is
// every project's built-in segment. Defining is an owner's act (as North Star writes are); listing is any member's.

import { flagValue } from '../args'
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

type ShareFields = { share: number | null; members?: number; base?: number; unreadable?: string }
export type SegmentRow = { key: string; event?: string; minCount?: number; days?: number } & ShareFields

const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/
const whole = (v: string | undefined, min: number, max: number): number | null => {
  if (v === undefined || !/^\d+$/.test(v)) return null
  const n = Number(v)
  return n >= min && n <= max ? n : null
}
/** "18% of active people", or why the share can't be told: never a zero for an unread share. */
export function shareText(row: ShareFields): string {
  if (row.unreadable) return `share unreadable: ${row.unreadable}`
  if (row.share === null) return 'no active people in the last 30 days'
  return `${Math.round(row.share * 100)}% of active people`
}
const rule = (r: SegmentRow) =>
  r.event === undefined ? 'built in: the whole base' : `${r.event} ×${r.minCount} in ${r.days} days`

export const segmentsDefineCommand: Command = {
  path: ['segments', 'define'],
  summary: 'define (or redefine) a segment: people who did an event at least N times in the last D days',
  usage: 'frijoles segments define <key> --event <e> --min <n> --days <d> [--project <slug>] [--json]',
  needsAuth: true,
  detail: `A bet aims at a segment by naming it in \`target_segment:\`; its funnel's Targeted is then the
  segment's share of the active people, and anyone exposed outside it shows beside the funnel.
  The key is lowercase words joined by hyphens (power-users). \`everyone\` is built in. Owners only.`,
  flags: [
    { name: 'event', value: '<event>', describe: 'the behaviour that puts someone in the segment' },
    { name: 'min', value: '<n>', describe: 'at least this many times (1–10000)' },
    { name: 'days', value: '<d>', describe: 'within the last this many days (1–365)' },
    { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' },
  ],
  async run(context): Promise<ExitCode> {
    const key = context.args.positionals[0]
    if (!key || !KEY.test(key) || key === 'everyone') {
      context.emit.fail(
        'invalid',
        key === 'everyone'
          ? '`everyone` is built in; name your segment something else.'
          : 'Name the segment in lowercase words joined by hyphens: `frijoles segments define power-users …`.'
      )
      return EXIT.USAGE
    }
    const event = flagValue(context.args, 'event')
    const minCount = whole(flagValue(context.args, 'min'), 1, 10_000)
    const days = whole(flagValue(context.args, 'days'), 1, 365)
    if (!event || minCount === null || days === null) {
      context.emit.fail('invalid', 'Give --event <e>, --min <1–10000> and --days <1–365>.')
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)

    const result = await context.api!.post<{ project: string; created: boolean; segment: SegmentRow }>(
      'api/v1/cli/segments',
      { project, segment: { key, event, minCount, days } }
    )
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    const { segment, created } = result.body
    context.emit.ok(
      { project: result.body.project, created, segment },
      `${created ? 'Defined' : 'Redefined'} ${segment.key} (${rule(segment)}): ${shareText(segment)}.`
    )
    return EXIT.OK
  },
}

export const segmentsLsCommand: Command = {
  path: ['segments', 'ls'],
  summary: "this project's segments and each one's share of the last 30 days' active people",
  usage: 'frijoles segments ls [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Lists \`everyone\` first, then each defined segment with its rule and its share of the
  people active in the last 30 days.`,
  flags: [{ name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' }],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const result = await context.api!.get<{ project: string; segments: SegmentRow[] }>(
      'api/v1/cli/segments',
      {
        project,
      }
    )
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    const { segments } = result.body
    context.emit.ok(
      { project: result.body.project, segments },
      table(
        ['SEGMENT', 'RULE', 'SHARE'],
        segments.map((s) => [s.key, rule(s), shareText(s)])
      )
    )
    return EXIT.OK
  },
}
