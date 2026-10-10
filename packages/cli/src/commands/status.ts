// setup-instruments-connects D3 — `frijoles status`: has this project received its first event yet? Setup runs it after
// connecting, so an agent can tell the founder the measuring works the moment an event lands, without opening the
// console. Reads one project through the member check; the SDK's own bookkeeping events do not count.
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { missingProject, resolveProject } from './flags-read'

type Mark = { event: string; at: string } | null
type StatusBody = { project: string; firstEvent: Mark; latestEvent: Mark }

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago": the human line only; --json carries the timestamps. */
export function ago(at: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const [n, unit] =
    seconds < 3600
      ? [Math.round(seconds / 60), 'minute']
      : seconds < 86400
        ? [Math.round(seconds / 3600), 'hour']
        : [Math.round(seconds / 86400), 'day']
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

export function statusLines(body: StatusBody, now: Date = new Date()): string {
  if (!body.firstEvent) return `${body.project}: waiting for the first event.`
  const latest = body.latestEvent ?? body.firstEvent
  return [
    `${body.project}: events are arriving.`,
    `  First event .... ${body.firstEvent.event}, ${ago(body.firstEvent.at, now)}`,
    `  Latest ......... ${latest.event}, ${ago(latest.at, now)}`,
  ].join('\n')
}

export const statusCommand: Command = {
  path: ['status'],
  summary: 'has the project received its first event yet, and which was the latest',
  usage: 'frijoles status [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Setup runs this after connecting. "Waiting for the first event" means nothing the product sent has
  arrived yet (the SDK's own bookkeeping events do not count); check that GROWTH_ENGINE_API_KEY is set where the
  app runs.`,
  flags: [{ name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' }],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const result = await context.api!.get<StatusBody>('api/v1/cli/status', { project })
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    context.emit.ok(result.body, statusLines(result.body))
    return EXIT.OK
  },
}
