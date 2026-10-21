// landing-launch-experiment · Sprint 6, Story 6.4 — A/B tests from a terminal, so an agent launches one in minutes.
//
//   frijoles experiments ls                                           every experiment and its state
//   frijoles experiments show <key>                                   the readout: counts, the chance, what to do next
//   frijoles experiments create --flag <key> --metric <event> …       a draft, from flags (or --from <answers.json>)
//   frijoles experiments start <key>                                  start it: the split serves, everyone is counted
//   frijoles experiments stop <key>                                   stop counting
//   frijoles experiments decide <key> --ship|--keep|… --reason "…"    record the call (and --rollout the shipped one)
//
// Every verb goes through `/api/v1/cli/experiments`, which runs the console's own commands — the same checks (low traffic
// never blocks Start), the same end dates (any day, or none), the same decisions (roll out or keep at any time). Reads
// need membership; writes need ownership, as in the console.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { boolFlag, flagValue, flagValues } from '../args'
import type { Command, CommandContext } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

const PATH = 'api/v1/cli/experiments'
const DAY = /^\d{4}-\d{2}-\d{2}$/

type Check = { id: string; status: 'ok' | 'warn' | 'fail'; title: string; detail: string }

async function call<T>(
  context: CommandContext,
  send: () => ReturnType<NonNullable<CommandContext['api']>['get']>
): Promise<{ body: T } | { exit: ExitCode }> {
  const result = await send()
  if (result.kind === 'network') {
    context.emit.fail('server_error', result.message)
    return { exit: EXIT.SERVER }
  }
  if (result.kind === 'error') {
    const checks = (result.body as { checks?: Check[] }).checks
    context.emit.fail(result.code, result.message, checks ? { checks } : undefined)
    if (checks && !context.emit.json)
      for (const check of checks.filter((c) => c.status === 'fail'))
        context.emit.note(`  ✗ ${check.title}: ${check.detail}`)
    return { exit: exitForServerCode(result.code) }
  }
  return { body: result.body as T }
}

function keyArg(context: CommandContext, verb: string): string | null {
  const key = context.args.positionals[0]
  if (!key) context.emit.fail('invalid', `Name the experiment: \`frijoles experiments ${verb} <key>\`.`)
  return key ?? null
}

const projectFlag = {
  name: 'project',
  value: '<slug>',
  describe: 'the project (default: the remembered one)',
}

export const experimentsLsCommand: Command = {
  path: ['experiments', 'ls'],
  summary: 'every experiment, its newest version and its state',
  usage: 'frijoles experiments ls [--project <slug>] [--json]',
  needsAuth: true,
  flags: [projectFlag],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    type Body = {
      project: string
      experiments: Array<{ key: string; version: number; status: string; startedAt: string | null }>
    }
    const out = await call<Body>(context, () => context.api!.get(PATH, { project }))
    if ('exit' in out) return out.exit
    const rows = out.body.experiments
    context.emit.ok(
      { project, experiments: rows },
      rows.length === 0
        ? `No experiments in ${project} yet. Make one: frijoles experiments create --flag <key> --metric <event>`
        : table(
            ['KEY', 'VERSION', 'STATE', 'STARTED'],
            rows.map((row) => [row.key, `v${row.version}`, row.status, row.startedAt?.slice(0, 10) ?? '—'])
          )
    )
    return EXIT.OK
  },
}

export const experimentsShowCommand: Command = {
  path: ['experiments', 'show'],
  summary: "an experiment's results, any day: the counts, the chance, what to do next",
  usage: 'frijoles experiments show <key> [--project <slug>] [--json]',
  needsAuth: true,
  detail: `The same reading the console's results page shows. \`readout.chance\` is how likely the leading version is
  really better (0–1), at any volume; \`readout.verdict.actions\` is what may be done now.`,
  flags: [projectFlag],
  async run(context): Promise<ExitCode> {
    const key = keyArg(context, 'show')
    if (!key) return EXIT.USAGE
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    type Body = {
      project: string
      key: string
      version: number
      status: string
      readout: null | {
        answer: string
        chance: number | null
        verdict: { title: string; body: string; actions: string[] }
      }
    }
    const out = await call<Body>(context, () => context.api!.get(PATH, { project, experiment: key }))
    if ('exit' in out) return out.exit
    const body = out.body
    context.emit.ok(
      body as unknown as Record<string, unknown>,
      body.readout
        ? `${body.key} v${body.version} (${body.status})\n${body.readout.answer}\n→ ${body.readout.verdict.title} ${body.readout.verdict.body}\n  can: ${body.readout.verdict.actions.join(', ')}`
        : `${body.key} v${body.version} (${body.status}) — nothing is counted until it starts: frijoles experiments start ${body.key}`
    )
    return EXIT.OK
  },
}

/** Answers for the builder from plain flags — the common case — with the builder's defaults for the rest. */
function answersFromFlags(context: CommandContext): Record<string, unknown> | { error: string } {
  const flagKey = flagValue(context.args, 'flag')
  const metric = flagValue(context.args, 'metric')
  if (!flagKey || !metric)
    return {
      error:
        'Name the feature and the metric: --flag <flag-key> --metric <event> (or pass --from <answers.json>).',
    }
  const ends = flagValue(context.args, 'ends')
  const weeks = flagValue(context.args, 'weeks')
  if (ends !== undefined && ends !== 'open' && !DAY.test(ends))
    return { error: '--ends is "open" (until you stop it) or a day, YYYY-MM-DD.' }
  if (weeks !== undefined && !/^[1-8]$/.test(weeks))
    return { error: '--weeks is 1–8; use --ends for any other day.' }
  const split = flagValue(context.args, 'split')
  if (split !== undefined && !/^([1-9]|[1-9]\d)$/.test(split))
    return { error: '--split is the new version’s share, 1–99.' }
  const names = flagValues(context.args, 'name')
  return {
    template: 'copy',
    flagKey,
    why: 'funnel',
    direction: boolFlag(context.args, 'decrease') ? 'decrease' : 'increase',
    metric,
    guardrails: flagValues(context.args, 'guardrail'),
    breakdowns: [],
    mde: 10,
    who: { mode: 'everyone', conditions: [], allocation: 100 },
    entity: flagValue(context.args, 'entity') ?? 'visitor',
    versions: names.length >= 2 ? names : ['Current', 'New version'],
    split: split === undefined ? 50 : Number(split),
    weeks: weeks === undefined ? 4 : Number(weeks),
    ...(ends === undefined ? (weeks === undefined ? { endsOn: 'open' } : {}) : { endsOn: ends }),
  }
}

export const experimentsCreateCommand: Command = {
  path: ['experiments', 'create'],
  summary: 'save an experiment as a draft (nothing serves until start)',
  usage:
    'frijoles experiments create --flag <key> --metric <event> [--guardrail <event>]… [--entity visitor] [--ends open|YYYY-MM-DD | --weeks <1-8>] [--split <pct>] [--decrease] [--name <version>]… [--from <answers.json>] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Tests the feature named by --flag: its values become the versions, split 50/50 by default, everyone in it,
  counted per --entity (default visitor). With no --ends or --weeks it runs until you stop it. --from takes the
  console builder's full answers instead. The checks come back with the draft; a warning never stops a start.`,
  flags: [
    { name: 'flag', value: '<key>', describe: 'the feature the test changes (an existing flag)' },
    { name: 'metric', value: '<event>', describe: 'the one number that decides it' },
    { name: 'guardrail', value: '<event>', describe: 'a number that must not get worse (repeatable)' },
    { name: 'entity', value: '<type>', describe: 'who is counted (default: visitor)' },
    {
      name: 'ends',
      value: 'open|<YYYY-MM-DD>',
      describe: 'run through this day (from tomorrow), or open — until you stop it (default)',
    },
    { name: 'weeks', value: '<1-8>', describe: 'run for this many weeks instead' },
    { name: 'split', value: '<pct>', describe: "the new version's share, 1–99 (default 50)" },
    { name: 'decrease', describe: 'the metric should go DOWN' },
    { name: 'name', value: '<version>', describe: 'version names, control first (repeatable)' },
    { name: 'from', value: '<file>', describe: "the builder's answers as JSON, instead of the flags above" },
    projectFlag,
  ],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    let answers: unknown
    const from = flagValue(context.args, 'from')
    if (from) {
      try {
        answers = JSON.parse(readFileSync(resolve(context.cwd, from), 'utf8'))
      } catch (error) {
        context.emit.fail('invalid', `Could not read ${from} as JSON: ${(error as Error).message}`)
        return EXIT.USAGE
      }
    } else {
      const built = answersFromFlags(context)
      if ('error' in built) {
        context.emit.fail('invalid', String(built.error))
        return EXIT.USAGE
      }
      answers = built
    }
    type Body = { project: string; experimentKey: string; version: number; failing: number }
    const out = await call<Body>(context, () =>
      context.api!.post(PATH, { command: 'create', project, answers })
    )
    if ('exit' in out) return out.exit
    const body = out.body
    context.emit.ok(
      body as unknown as Record<string, unknown>,
      `Saved ${body.experimentKey} v${body.version} as a draft${
        body.failing > 0 ? ` — ${body.failing} check(s) must be fixed before it can start` : ''
      }. Start it: frijoles experiments start ${body.experimentKey}`
    )
    return EXIT.OK
  },
}

function lifecycleCommand(verb: 'start' | 'stop', summary: string): Command {
  return {
    path: ['experiments', verb],
    summary,
    usage: `frijoles experiments ${verb} <key> [--project <slug>] [--json]`,
    needsAuth: true,
    flags: [projectFlag],
    async run(context): Promise<ExitCode> {
      const key = keyArg(context, verb)
      if (!key) return EXIT.USAGE
      const project = resolveProject(context)
      if (!project) return missingProject(context)
      type Body = {
        experimentKey: string
        version: number
        serving?: boolean
        notice?: string
        weights?: number[]
      }
      const out = await call<Body>(context, () =>
        context.api!.post(PATH, { command: verb, project, experiment: key })
      )
      if ('exit' in out) return out.exit
      const body = out.body
      context.emit.ok(
        { project, ...body },
        verb === 'start'
          ? `Started ${body.experimentKey} v${body.version}${body.weights ? `, split ${body.weights.join(' / ')}` : ''}${
              body.serving === false ? ` — not serving yet${body.notice ? `: ${body.notice}` : ''}` : ''
            }. Read it any day: frijoles experiments show ${body.experimentKey}`
          : `Stopped ${body.experimentKey} v${body.version}: nobody new is counted. Decide: frijoles experiments decide ${body.experimentKey} --ship|--keep --reason "…"`
      )
      return EXIT.OK
    },
  }
}

// The paths are written out, not only built: lib/agents-md.test.ts finds every command by its literal `path`.
export const experimentsStartCommand: Command = {
  ...lifecycleCommand('start', 'start an experiment: the split serves and everyone in it is counted'),
  path: ['experiments', 'start'],
}
export const experimentsStopCommand: Command = {
  ...lifecycleCommand('stop', 'stop an experiment: nobody new is counted'),
  path: ['experiments', 'stop'],
}

const OUTCOME_FLAGS = ['ship', 'keep', 'inconclusive', 'iterate', 'invalid'] as const

export const experimentsDecideCommand: Command = {
  path: ['experiments', 'decide'],
  summary: 'record the call — ship a version, keep the current one, or not — at any time',
  usage:
    'frijoles experiments decide <key> (--ship [--variant <key>] | --keep | --inconclusive | --iterate | --invalid) --reason "<why>" [--rollout] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Stops a live test first, then records the decision with the evidence of the moment. Any volume, any time:
  how sure it was is kept in the record. --rollout then serves the shipped version to everyone in production.`,
  flags: [
    { name: 'ship', describe: 'ship a version: the one leading, or --variant' },
    { name: 'variant', value: '<key>', describe: 'with --ship: the version to ship (its flag variant key)' },
    { name: 'keep', describe: 'keep the current version' },
    { name: 'inconclusive', describe: 'no clear answer' },
    { name: 'iterate', describe: 'change it and run again' },
    { name: 'invalid', describe: 'the numbers cannot be trusted' },
    { name: 'reason', value: '<why>', describe: 'why — kept in the decision record (required)' },
    { name: 'rollout', describe: 'serve the shipped version to everyone in production' },
    projectFlag,
  ],
  async run(context): Promise<ExitCode> {
    const key = keyArg(context, 'decide')
    if (!key) return EXIT.USAGE
    const chosen = OUTCOME_FLAGS.filter((name) => boolFlag(context.args, name))
    if (chosen.length !== 1) {
      context.emit.fail(
        'invalid',
        'Pass exactly one of --ship, --keep, --inconclusive, --iterate or --invalid.'
      )
      return EXIT.USAGE
    }
    const reason = flagValue(context.args, 'reason')?.trim()
    if (!reason) {
      context.emit.fail('invalid', 'Say why, with --reason "<why>".')
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const shipValue = flagValue(context.args, 'variant')
    type Body = {
      experimentKey: string
      version: number
      outcome: string
      chosenVariantKey: string | null
      rollout: { ok: boolean; error?: string } | null
    }
    const out = await call<Body>(context, () =>
      context.api!.post(PATH, {
        command: 'decide',
        project,
        experiment: key,
        outcome: chosen[0],
        ...(chosen[0] === 'ship' && shipValue ? { variant: shipValue } : {}),
        reason,
        rollout: boolFlag(context.args, 'rollout'),
      })
    )
    if ('exit' in out) return out.exit
    const body = out.body
    context.emit.ok(
      { project, ...body },
      `Decided ${body.experimentKey} v${body.version}: ${body.outcome.replace(/_/g, ' ')}${
        body.chosenVariantKey ? ` (${body.chosenVariantKey})` : ''
      }.${
        body.rollout
          ? body.rollout.ok
            ? ' Rolled out to everyone in production.'
            : ` Roll-out not done: ${body.rollout.error}`
          : ''
      }`
    )
    return body.rollout && !body.rollout.ok ? EXIT.SERVER : EXIT.OK
  },
}
