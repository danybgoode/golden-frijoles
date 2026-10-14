// agent-legible-horizon D2 — `frijoles horizon`: a product's destinations and what lights each, from its latest roadmap
// push, without a browser. The data is the push's `horizon` (declared in Roadmap/horizon.md, named by each epic's
// `destination:`); the server derives lit / partly lit / on the way exactly as the /horizon page does.
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { missingProject, resolveProject } from './flags-read'

type Destination = {
  id: string
  title: string
  description: string
  status: 'lit' | 'partial' | 'coming'
  litBy: Array<{ slug: string; name: string; shipped: boolean }>
}
type HorizonBody = {
  project: string
  pushed: boolean
  destinations: Destination[]
  generatedAt: string | null
  sourceCommit: string | null
}

const STATUS_WORD: Record<Destination['status'], string> = {
  lit: 'lit',
  partial: 'partly lit',
  coming: 'on the way',
}

/** How to declare a horizon — said wherever there is none, so the next step is in the answer. */
export const DECLARE_HORIZON =
  "Declare destinations in Roadmap/horizon.md (`## <id> — <title>` + one line each), name one in an epic README's " +
  '`destination: <id>`, check with `npx -y @golden-frijoles/kit roadmap-push --dry-run`, then run roadmap-push.'

export function horizonLines(body: HorizonBody): string {
  if (!body.pushed) return `${body.project}: no roadmap pushed yet. ${DECLARE_HORIZON}`
  if (body.destinations.length === 0) return `${body.project}: no destinations yet. ${DECLARE_HORIZON}`
  const lit = body.destinations.filter((destination) => destination.status === 'lit').length
  return [
    `${body.project}: ${lit} of ${body.destinations.length} destinations lit${body.sourceCommit ? ` (push ${body.sourceCommit.slice(0, 7)})` : ''}.`,
    ...body.destinations.map((destination) => {
      const epics = destination.litBy.map((epic) => `${epic.slug}${epic.shipped ? ' ✓' : ''}`).join(', ')
      return `  ${STATUS_WORD[destination.status].padEnd(10)} ${destination.title} [${destination.id}]${epics ? ` — ${epics}` : ' — no epic names it yet'}`
    }),
  ].join('\n')
}

export const horizonCommand: Command = {
  path: ['horizon'],
  summary: "the product's destinations and the epics that light each",
  usage: 'frijoles horizon [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Reads the horizon of the product's latest roadmap push: lit (every epic under it shipped), partly lit,
  or on the way. The destinations come from Roadmap/horizon.md and each epic's \`destination:\` — to change them,
  edit those files and push again (\`npx -y @golden-frijoles/kit roadmap-push --dry-run\` shows what would be sent).`,
  flags: [{ name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' }],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const result = await context.api!.get<HorizonBody>('api/v1/cli/horizon', { project })
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    context.emit.ok(result.body, horizonLines(result.body))
    return EXIT.OK
  },
}
