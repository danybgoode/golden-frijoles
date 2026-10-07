// result-record · Story 3.2 (D16) — the two reads an agent fetches an epic's result through.
//
//   gf north-star readings <input> [--to <day>]      an input's readings, and the latest on or before --to
//   gf experiments decision <key> [--version <n>]    an experiment's decision record (latest version by default)
//
// Both are `--json`-first: `epic-read` spawns them and reads the body, so the JSON is the contract and the table is for
// a person. Both go through `/api/v1/cli/*`, which checks membership exactly as the console does (404 elsewhere).

import { flagValue } from '../args'
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

export type InputReadingsBody = {
  project: string
  metric: string | null
  input: { key: string; name: string; valueSource: string }
  readings: Array<{ date: string; value: number }>
  latest: { date: string; value: number } | null
}

export type ExperimentDecisionBody = {
  project: string
  key: string
  version: number
  lifecycle: string
  decisions: {
    state: 'undecided' | 'decided'
    current: {
      outcome?: string
      chosenVariantKey?: string | null
      rationale?: string
      createdAt?: string
    } | null
    history: unknown[]
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

export const northStarReadingsCommand: Command = {
  path: ['north-star', 'readings'],
  summary: "one North Star input's readings, and the latest on or before a day",
  usage: 'gf north-star readings <input> [--to <YYYY-MM-DD>] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `An agent reading an epic's result calls this: \`latest\` is the number it reports, and
  \`north-star:<input>@<latest.date>\` is the evidence it writes. Nothing is invented: an input
  with no reading on or before --to says so, rather than reporting zero.`,
  flags: [
    { name: 'to', value: '<YYYY-MM-DD>', describe: 'cut the readings at this day (default: all of them)' },
    { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' },
  ],
  async run(context): Promise<ExitCode> {
    const input = context.args.positionals[0]
    if (!input) {
      context.emit.fail('invalid', 'Name the input: `gf north-star readings <input-key>`.')
      return EXIT.USAGE
    }
    const to = flagValue(context.args, 'to')
    if (to !== undefined && !DAY.test(to)) {
      context.emit.fail('invalid', '--to must be a day written YYYY-MM-DD.')
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)

    const result = await context.api!.get<InputReadingsBody>('api/v1/cli/north-star/readings', {
      project,
      input,
      ...(to ? { to } : {}),
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
    const human =
      body.readings.length === 0
        ? `${body.input.key}: no readings${to ? ` on or before ${to}` : ''} yet.`
        : [
            `${body.input.key} (${body.input.name}) — latest ${body.latest!.value} on ${body.latest!.date}`,
            table(
              ['DAY', 'VALUE'],
              body.readings.slice(-10).map((r) => [r.date, String(r.value)])
            ),
          ].join('\n')
    context.emit.ok(
      {
        project: body.project,
        metric: body.metric,
        input: body.input,
        readings: body.readings,
        latest: body.latest,
      },
      human
    )
    return EXIT.OK
  },
}

export const experimentsDecisionCommand: Command = {
  path: ['experiments', 'decision'],
  summary: "an experiment's decision record (the latest version unless --version)",
  usage: 'gf experiments decision <key> [--version <n>] [--project <slug>] [--json]',
  needsAuth: true,
  detail: `What was decided about an A/B test, from the experiment's append-only decision ledger.
  An agent reading an epic's result cites it as \`ab:<key>\`.`,
  flags: [
    { name: 'version', value: '<n>', describe: 'the definition version (default: the latest)' },
    { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' },
  ],
  async run(context): Promise<ExitCode> {
    const key = context.args.positionals[0]
    if (!key) {
      context.emit.fail('invalid', 'Name the experiment: `gf experiments decision <key>`.')
      return EXIT.USAGE
    }
    const version = flagValue(context.args, 'version')
    if (version !== undefined && !/^[1-9]\d{0,6}$/.test(version)) {
      context.emit.fail('invalid', '--version must be a whole number from 1.')
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)

    const result = await context.api!.get<ExperimentDecisionBody>('api/v1/cli/experiments/decision', {
      project,
      experiment: key,
      ...(version ? { version } : {}),
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
    const current = body.decisions.current
    context.emit.ok(
      {
        project: body.project,
        key: body.key,
        version: body.version,
        lifecycle: body.lifecycle,
        decisions: body.decisions,
      },
      current
        ? `${body.key} v${body.version} (${body.lifecycle}) — decided: ${current.outcome ?? 'recorded'}${
            current.chosenVariantKey ? ` (${current.chosenVariantKey})` : ''
          }${current.rationale ? `\n  ${current.rationale}` : ''}`
        : `${body.key} v${body.version} (${body.lifecycle}) — no decision recorded yet.`
    )
    return EXIT.OK
  },
}
