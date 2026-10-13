// scenarios-light-up S1.4 — `frijoles scenarios …`: a whole drill from a terminal, no browser.
//
// ── A thin shell over ONE route ───────────────────────────────────────────────────────────────────────────────────
// Everything goes to `/api/v1/cli/scenarios` (S1.3), the same owner service the page's actions call. The SERVER decides
// what a valid origin, flag or bound is, and its `error` is printed verbatim (the rule `flags-write.ts` follows); the
// only checks here are on the SHAPE of what was typed (`<flagKey>@<version>`, a positive integer), so a typo costs no
// round-trip. Reads are member-gated, writes owner-gated, and a deployment with the authoring switch off answers
// `disabled` — said plainly below, because "not found" would send a caller hunting for a typo.
//
// ── The drill, in order ───────────────────────────────────────────────────────────────────────────────────────────
// targets add → targets verify → define → launch → runs → stop. Each command's help names the next one.
//
// ── The target token is printed ONCE ──────────────────────────────────────────────────────────────────────────────
// Only its hash is stored. `targets add` shows it with the steps that put it to work, and says it will not be shown again.

import { flagValue, boolFlag } from '../args'
import type { Command, CommandContext } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'
import { missingProject, resolveProject } from './flags-read'

const KINDS = ['resilience', 'security'] as const
const COHORTS = ['synthetic', 'internal'] as const
const ENVIRONMENTS = ['production', 'preview', 'development'] as const

const WATCH_INTERVAL_MS = 3_000
const WATCH_CAP_MS = 10 * 60 * 1_000

type Target = { id: string; key: string; kind: string; origin: string; status: string; verifiedAt: string | null }
type DefinitionBody = {
  kind?: string
  cohort?: string
  targetKey?: string
  environment?: string
  startAt?: string
  expiresAt?: string
  flag?: { key?: string; definitionVersion?: number }
}
type Definition = { id: string; scenarioKey: string; version: number; definition: DefinitionBody }
type Run = {
  id: string
  scenarioKey: string
  definitionVersion: number
  status: string
  successCount: number
  failureCount: number
  requestCount: number
  stopReason: string | null
}
type ListBody = { project: string; authoring: boolean; targets: Target[]; definitions: Definition[]; runs: Run[] }

/** `checkout.fault@3` → `{ flagKey: 'checkout.fault', flagVersion: 3 }`, or null for anything else. */
export function parseFlagRef(text: string): { flagKey: string; flagVersion: number } | null {
  const at = text.lastIndexOf('@')
  if (at < 1) return null
  const flagKey = text.slice(0, at).trim()
  const version = text.slice(at + 1).trim()
  if (!flagKey || !/^[1-9]\d*$/.test(version)) return null
  return { flagKey, flagVersion: Number(version) }
}

/** A positive integer flag. `undefined` when absent; `null` when present and not one. */
export function parsePositiveInt(text: string | undefined): number | undefined | null {
  if (text === undefined) return undefined
  return /^[1-9]\d*$/.test(text.trim()) ? Number(text.trim()) : null
}

/** The window a definition covers, as one cell: `2026-10-13T10:00 → 2026-10-13T10:05`. */
export function describeWindow(definition: DefinitionBody): string {
  if (!definition.startAt || !definition.expiresAt) return '—'
  const short = (iso: string) => iso.slice(0, 16)
  return `${short(definition.startAt)} → ${short(definition.expiresAt)}`
}

/** The fingerprint `--watch` compares, so only a CHANGE is printed. */
export function runFingerprint(run: Run): string {
  return `${run.id}|${run.status}|${run.successCount}|${run.failureCount}`
}

function describeRun(run: Run): string[] {
  return [
    run.id,
    `${run.scenarioKey}@${run.definitionVersion}`,
    run.status,
    `${run.successCount} ok / ${run.failureCount} failed`,
    run.stopReason ?? '—',
  ]
}

function runsTable(runs: Run[]): string {
  return table(['RUN', 'SCENARIO', 'STATUS', 'REQUESTS', 'STOP REASON'], runs.map(describeRun))
}

type Failure =
  | { kind: 'error'; code: string; message: string; body: Record<string, unknown> }
  | { kind: 'network'; message: string }

function failWith(context: CommandContext, result: Failure): ExitCode {
  if (result.kind === 'network') {
    context.emit.fail('server_error', result.message)
    return EXIT.SERVER
  }
  if (result.code === 'disabled') {
    context.emit.fail(
      'disabled',
      `${result.message} The scenario authoring switch is off for this deployment, so nothing can be changed from here.`
    )
    return exitForServerCode('disabled')
  }
  const field = typeof result.body.field === 'string' ? { field: result.body.field } : undefined
  context.emit.fail(result.code, result.message, field)
  return exitForServerCode(result.code)
}

const PROJECT_FLAG = { name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' }
const REASON_FLAG = {
  name: 'reason',
  value: '<text>',
  describe: 'why — kept in the audit trail (default: names the command)',
}

/** One owner write: project resolved, `command` + fields posted, the server body returned on success. */
async function ownerWrite<T extends Record<string, unknown>>(
  context: CommandContext,
  command: string,
  label: string,
  fields: Record<string, unknown>
): Promise<{ ok: true; project: string; body: T } | { ok: false; code: ExitCode }> {
  const project = resolveProject(context)
  if (!project) return { ok: false, code: missingProject(context) }
  const result = await context.api!.post<T>('api/v1/cli/scenarios', {
    project,
    command,
    reason: flagValue(context.args, 'reason')?.trim() || `frijoles scenarios ${label}`,
    ...fields,
  })
  if (result.kind !== 'ok') return { ok: false, code: failWith(context, result) }
  return { ok: true, project, body: result.body }
}

export const scenariosLsCommand: Command = {
  path: ['scenarios', 'ls'],
  summary: 'targets, scenario definitions and runs',
  usage: 'frijoles scenarios ls [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Any member can read this. Start a drill with \`frijoles scenarios targets add <key> --origin <url>\`.

  --json prints the server's body as is: targets, definitions, fault flags, runs and impacts.`,
  flags: [PROJECT_FLAG],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const result = await context.api!.get<ListBody>('api/v1/cli/scenarios', { project })
    if (result.kind !== 'ok') return failWith(context, result)

    const { ok: _ok, ...body } = result.body as ListBody & { ok?: boolean }
    const { targets, definitions, runs, authoring } = result.body
    const lines = [
      ...(authoring ? [] : ['Scenario authoring is off for this deployment: you can read, not change.', '']),
      'TARGETS',
      targets.length === 0
        ? '  none yet — `frijoles scenarios targets add <key> --origin <https-origin>`'
        : table(['KEY', 'ORIGIN', 'STATUS'], targets.map((target) => [target.key, target.origin, target.status])),
      '',
      'DEFINITIONS',
      definitions.length === 0
        ? '  none yet — `frijoles scenarios define <scenario-key> --target <key> --flag <flagKey>@<version>`'
        : table(
            ['SCENARIO', 'KIND', 'COHORT', 'TARGET', 'FLAG', 'WINDOW'],
            definitions.map((row) => [
              `${row.scenarioKey}@${row.version}`,
              row.definition.kind ?? '—',
              row.definition.cohort ?? '—',
              row.definition.targetKey ?? '—',
              row.definition.flag?.key ? `${row.definition.flag.key}@${row.definition.flag.definitionVersion}` : '—',
              describeWindow(row.definition),
            ])
          ),
      '',
      'RUNS',
      runs.length === 0 ? '  none yet — `frijoles scenarios launch <scenario-key>`' : runsTable(runs),
    ]
    context.emit.ok(body, lines.join('\n'))
    return EXIT.OK
  },
}

export const scenariosTargetsAddCommand: Command = {
  path: ['scenarios', 'targets', 'add'],
  summary: 'register an app origin as a drill target',
  usage: 'frijoles scenarios targets add <key> --origin <https-origin> [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. Prints the target token ONCE — only its hash is stored. Then:

    1. put the token in the app's server env as GOLDEN_FRIJOLES_TARGET_TOKEN
    2. serve createScenarioOwnershipHandler from @golden-frijoles/sdk at /api/internal/resilience/ownership
    3. deploy the app
    4. run \`frijoles scenarios targets verify <key>\``,
  flags: [PROJECT_FLAG, { name: 'origin', value: '<https-origin>', describe: 'the app origin — required' }, REASON_FLAG],
  async run(context): Promise<ExitCode> {
    const targetKey = context.args.positionals[0]
    const origin = flagValue(context.args, 'origin')?.trim()
    if (!targetKey || !origin) {
      context.emit.fail('invalid', 'Usage: `frijoles scenarios targets add <key> --origin <https-origin>`.')
      return EXIT.USAGE
    }
    const done = await ownerWrite<{ targetKey: string; origin: string; status: string; token: string }>(
      context,
      'register_target',
      'targets add',
      { targetKey, origin }
    )
    if (!done.ok) return done.code
    const { body } = done
    context.emit.ok(
      body,
      [
        `Registered target ${body.targetKey} (${body.origin}) in ${done.project} — status: ${body.status}.`,
        '',
        body.token,
        '',
        'This is the only time the token is shown — only a hash was stored.',
        '',
        'Next:',
        "  1. Put the token in the app's server env as GOLDEN_FRIJOLES_TARGET_TOKEN.",
        '  2. Serve createScenarioOwnershipHandler from @golden-frijoles/sdk at /api/internal/resilience/ownership.',
        '  3. Deploy the app.',
        `  4. Run: frijoles scenarios targets verify ${body.targetKey}`,
      ].join('\n')
    )
    return EXIT.OK
  },
}

export const scenariosTargetsVerifyCommand: Command = {
  path: ['scenarios', 'targets', 'verify'],
  summary: 'check that the app answers with the target token',
  usage: 'frijoles scenarios targets verify <key> [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. The engine sends a signed check to <origin>/api/internal/resilience/ownership; an app holding
  this target's token answers it, and the right answer marks the target verified. The token itself never travels. No
  answer, a wrong one, or an unreachable origin changes nothing and says why.

  Next: \`frijoles scenarios define <scenario-key> --target <key> --flag <flagKey>@<version>\`.`,
  flags: [PROJECT_FLAG, REASON_FLAG],
  async run(context): Promise<ExitCode> {
    const targetKey = context.args.positionals[0]
    if (!targetKey) {
      context.emit.fail('invalid', 'Usage: `frijoles scenarios targets verify <key>`.')
      return EXIT.USAGE
    }
    const done = await ownerWrite<{ targetKey: string; status: string; changed: boolean }>(
      context,
      'verify_target',
      'targets verify',
      { targetKey }
    )
    if (!done.ok) return done.code
    const { body } = done
    context.emit.ok(
      body,
      `Target ${body.targetKey}: ${body.status}${body.changed ? '' : ' (no change)'}.` +
        (body.status === 'verified'
          ? `\nNext: frijoles scenarios define <scenario-key> --target ${body.targetKey} --flag <flagKey>@<version>`
          : '')
    )
    return EXIT.OK
  },
}

export const scenariosTargetsRevokeCommand: Command = {
  path: ['scenarios', 'targets', 'revoke'],
  summary: 'stop an app origin being a drill target',
  usage: 'frijoles scenarios targets revoke <key> [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. A revoked target cannot be launched against. Register it again with
  \`frijoles scenarios targets add\` to start over.`,
  flags: [PROJECT_FLAG, REASON_FLAG],
  async run(context): Promise<ExitCode> {
    const targetKey = context.args.positionals[0]
    if (!targetKey) {
      context.emit.fail('invalid', 'Usage: `frijoles scenarios targets revoke <key>`.')
      return EXIT.USAGE
    }
    const done = await ownerWrite<Record<string, unknown>>(context, 'revoke_target', 'targets revoke', { targetKey })
    if (!done.ok) return done.code
    context.emit.ok(done.body, `Target ${targetKey} revoked in ${done.project}.`)
    return EXIT.OK
  },
}

export const scenariosDefineCommand: Command = {
  path: ['scenarios', 'define'],
  summary: 'define a drill: a target, a fault flag version and its bounds',
  usage:
    'frijoles scenarios define <scenario-key> --target <key> --flag <flagKey>@<version> [--kind resilience|security] [--cohort synthetic|internal] [--env production|preview|development] [--duration <seconds>] [--requests <n>] [--concurrency <n>] [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. Defining changes nothing in the app: it records the drill. Bounds you leave out take the
  page's defaults, and the server checks them all (its message is printed as is).

  The flag must be a fault flag at an exact version — \`frijoles scenarios ls --json\` lists the compatible ones.

  Next: \`frijoles scenarios launch <scenario-key>\`.`,
  flags: [
    PROJECT_FLAG,
    { name: 'target', value: '<key>', describe: 'a verified target — required' },
    { name: 'flag', value: '<flagKey>@<version>', describe: 'the fault flag and its exact version — required' },
    { name: 'kind', value: '<kind>', describe: `${KINDS.join(' | ')} (default: resilience)` },
    { name: 'cohort', value: '<cohort>', describe: `${COHORTS.join(' | ')} (default: synthetic)` },
    { name: 'env', value: '<environment>', describe: `${ENVIRONMENTS.join(' | ')} (default: production)` },
    { name: 'duration', value: '<seconds>', describe: 'how long the window lasts' },
    { name: 'requests', value: '<n>', describe: 'the request cap' },
    { name: 'concurrency', value: '<n>', describe: 'the concurrency cap' },
    REASON_FLAG,
  ],
  async run(context): Promise<ExitCode> {
    const scenarioKey = context.args.positionals[0]
    const targetKey = flagValue(context.args, 'target')?.trim()
    const flagRef = parseFlagRef(flagValue(context.args, 'flag') ?? '')
    if (!scenarioKey || !targetKey || !flagRef) {
      context.emit.fail(
        'invalid',
        'Usage: `frijoles scenarios define <scenario-key> --target <key> --flag <flagKey>@<version>` ' +
          '(the version is a whole number, e.g. checkout.fault@3).'
      )
      return EXIT.USAGE
    }
    const kind = flagValue(context.args, 'kind')
    const cohort = flagValue(context.args, 'cohort')
    const environment = flagValue(context.args, 'env')
    if (kind !== undefined && !(KINDS as readonly string[]).includes(kind)) {
      context.emit.fail('invalid', `--kind must be one of: ${KINDS.join(', ')}.`)
      return EXIT.USAGE
    }
    if (cohort !== undefined && !(COHORTS as readonly string[]).includes(cohort)) {
      context.emit.fail('invalid', `--cohort must be one of: ${COHORTS.join(', ')}.`)
      return EXIT.USAGE
    }
    if (environment !== undefined && !(ENVIRONMENTS as readonly string[]).includes(environment)) {
      context.emit.fail('invalid', `--env must be one of: ${ENVIRONMENTS.join(', ')}.`)
      return EXIT.USAGE
    }
    const numbers: Record<string, number | undefined> = {}
    for (const [flag, field] of [
      ['duration', 'durationSeconds'],
      ['requests', 'requestCap'],
      ['concurrency', 'concurrencyCap'],
    ] as const) {
      const parsed = parsePositiveInt(flagValue(context.args, flag))
      if (parsed === null) {
        context.emit.fail('invalid', `--${flag} must be a whole number above zero.`)
        return EXIT.USAGE
      }
      numbers[field] = parsed
    }

    const done = await ownerWrite<Record<string, unknown>>(context, 'define', 'define', {
      scenarioKey,
      targetKey,
      ...flagRef,
      kind,
      cohort,
      environment,
      ...numbers,
    })
    if (!done.ok) return done.code
    context.emit.ok(
      done.body,
      `Defined ${scenarioKey} in ${done.project} against ${targetKey} (${flagRef.flagKey}@${flagRef.flagVersion}).\n` +
        `Next: frijoles scenarios launch ${scenarioKey}`
    )
    return EXIT.OK
  },
}

export const scenariosLaunchCommand: Command = {
  path: ['scenarios', 'launch'],
  summary: 'start a run of the newest version of a scenario',
  usage: 'frijoles scenarios launch <scenario-key> [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. Starts a run inside the scenario's bounded window. A launch answers "not found" while its
  kind's switch is off for the deployment.

  Next: \`frijoles scenarios runs --watch\`, and \`frijoles scenarios stop <run-id>\` to end one early.`,
  flags: [PROJECT_FLAG, REASON_FLAG],
  async run(context): Promise<ExitCode> {
    const scenarioKey = context.args.positionals[0]
    if (!scenarioKey) {
      context.emit.fail('invalid', 'Usage: `frijoles scenarios launch <scenario-key>`.')
      return EXIT.USAGE
    }
    const done = await ownerWrite<Record<string, unknown>>(context, 'launch', 'launch', { scenarioKey })
    if (!done.ok) return done.code
    context.emit.ok(done.body, `Launched ${scenarioKey} in ${done.project}.\nNext: frijoles scenarios runs --watch`)
    return EXIT.OK
  },
}

export const scenariosStopCommand: Command = {
  path: ['scenarios', 'stop'],
  summary: 'stop a run now',
  usage: 'frijoles scenarios stop <run-id> [--reason <text>]',
  needsAuth: true,
  detail: `Owner only. The emergency control: it acts on the run as it is now. Find the id with
  \`frijoles scenarios runs\`.`,
  flags: [PROJECT_FLAG, REASON_FLAG],
  async run(context): Promise<ExitCode> {
    const runId = context.args.positionals[0]
    if (!runId) {
      context.emit.fail('invalid', 'Usage: `frijoles scenarios stop <run-id>`.')
      return EXIT.USAGE
    }
    const done = await ownerWrite<Record<string, unknown>>(context, 'stop', 'stop', { runId })
    if (!done.ok) return done.code
    context.emit.ok(done.body, `Stop requested for run ${runId} in ${done.project}.`)
    return EXIT.OK
  },
}

export const scenariosRunsCommand: Command = {
  path: ['scenarios', 'runs'],
  summary: 'runs, and with --watch their progress until they end',
  usage: 'frijoles scenarios runs [--project <slug>] [--watch] [--json]',
  needsAuth: true,
  detail: `Any member can read this. --watch re-reads every 3 seconds, prints only what changed, and returns when no
  run is still running (or after 10 minutes). Under --json it prints one document: the final runs.

  Stop a run with \`frijoles scenarios stop <run-id>\`.`,
  flags: [PROJECT_FLAG, { name: 'watch', describe: 'keep reading until no run is running (10 minutes at most)' }],
  async run(context): Promise<ExitCode> {
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const watch = boolFlag(context.args, 'watch')
    const started = Date.now()
    const seen = new Map<string, string>()

    for (;;) {
      const result = await context.api!.get<{ runs: Run[] }>('api/v1/cli/scenarios', { project })
      if (result.kind !== 'ok') return failWith(context, result)
      const { runs } = result.body
      const running = runs.some((run) => run.status === 'running')
      const capped = Date.now() - started >= WATCH_CAP_MS

      if (!watch || !running || capped) {
        context.emit.ok(
          { project, runs },
          runs.length === 0
            ? `No runs in ${project} yet. Start one with \`frijoles scenarios launch <scenario-key>\`.`
            : runsTable(runs)
        )
        if (watch && running) context.emit.note('Stopped watching after 10 minutes; a run is still running.')
        return EXIT.OK
      }

      const changed = runs.filter((run) => seen.get(run.id) !== runFingerprint(run))
      for (const run of runs) seen.set(run.id, runFingerprint(run))
      if (changed.length > 0) context.emit.note(runsTable(changed))
      await new Promise((resolve) => setTimeout(resolve, WATCH_INTERVAL_MS))
    }
  },
}
