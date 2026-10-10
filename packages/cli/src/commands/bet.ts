// one-bet-wired D4 — `frijoles bet sync <epic README>`: the bet's flag, from the epic. The agent runs it at the Build
// gate once the founder is signed in. It creates the flag when it does not exist (a Measure flag: enablement, off until
// you roll it out, in every environment, the bet's hypothesis and epic as its description) and otherwise leaves it: it
// never changes a flag's rules or rollout. The funnel needs nothing more: the bet's measurement reaches Golden Frijoles
// with the roadmap push.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Command } from '../command'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { missingProject, resolveProject } from './flags-read'

export type BetFrontmatter = Record<string, string | null>

/** The README's flat frontmatter: `key: value`, a trailing ` # comment` dropped, quotes stripped, `null` → null. */
export function readBetFrontmatter(text: string): BetFrontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  const out: BetFrontmatter = {}
  if (!match) return out
  for (const line of match[1].split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line)
    if (!m) continue
    let value = m[2].trim()
    const quoted = /^"((?:[^"\\]|\\.)*)"|^'((?:[^']|'')*)'/.exec(value)
    if (quoted)
      value = quoted[1] !== undefined ? quoted[1].replace(/\\"/g, '"') : quoted[2].replace(/''/g, "'")
    else value = value.replace(/\s+#.*$/, '').trim()
    out[m[1]] = value === '' || value === 'null' || value === '~' ? null : value
  }
  return out
}

const EVENT = /^[A-Za-z0-9_.:$-]{1,200}$/
const FLAG_KEY = /^[a-z][a-z0-9_.-]{0,127}$/

/** What is wrong with the bet, or [] when it can be synced. Names the field each time. */
export function betProblems(fm: BetFrontmatter): string[] {
  const problems: string[] = []
  if (!fm.flag_key) problems.push('flag_key is missing: the bet has no flag to create')
  else if (!FLAG_KEY.test(fm.flag_key)) problems.push(`flag_key "${fm.flag_key}" is not a flag key`)
  if (!fm.adopted_event)
    problems.push('adopted_event is missing: the bet does not say what counts as adopting')
  for (const key of ['adopted_event', 'retained_event', 'satisfied_event'])
    if (fm[key] && !EVENT.test(fm[key]!)) problems.push(`${key} "${fm[key]}" is not an event name`)
  if (fm.target_segment && fm.target_segment !== 'everyone')
    problems.push(`target_segment "${fm.target_segment}" is not supported yet (only everyone)`)
  if (
    fm.retention_days &&
    !(/^\d+$/.test(fm.retention_days) && +fm.retention_days >= 1 && +fm.retention_days <= 90)
  )
    problems.push(`retention_days "${fm.retention_days}" is not 1–90 days`)
  return problems
}

/** The flag's description: the bet and its epic, within the provider's 500 characters. */
export function betDescription(fm: BetFrontmatter): string {
  const slug = fm.slug && fm.slug.length > 80 ? `${fm.slug.slice(0, 79)}…` : fm.slug
  const epic = slug ? ` (epic ${slug})` : ''
  const hypothesis = fm.hypothesis ?? fm.title ?? 'A measured bet'
  const room = 480 - epic.length
  const clipped =
    hypothesis.length > room ? `${hypothesis.slice(0, room - 1).replace(/\s+\S*$/, '')}…` : hypothesis
  return `${clipped}${epic}`
}

type FlagWriteBody = { flagKey: string; version: number; outcome: string }

export const betSyncCommand: Command = {
  path: ['bet', 'sync'],
  summary: "create the bet's flag from its epic (a Measure flag, off until you roll it out)",
  usage: 'frijoles bet sync <epic README> [--project <slug>] [--json]',
  needsAuth: true,
  detail: `Reads the epic's frontmatter: flag_key, the hypothesis, and the measurement (adopted_event, retained_event,
  retention_days, satisfied_event). A missing flag is created as an enablement flag in every environment, off until
  you roll it out, with the hypothesis as its description; an existing flag is left as it is. The funnel itself
  arrives with the roadmap push.`,
  flags: [{ name: 'project', value: '<slug>', describe: 'the project (default: the remembered one)' }],
  async run(context): Promise<ExitCode> {
    const path = context.args.positionals[0]
    if (!path) {
      context.emit.fail('invalid', 'Name the epic: `frijoles bet sync Roadmap/<area>/<slug>/README.md`.')
      return EXIT.USAGE
    }
    let fm: BetFrontmatter
    try {
      fm = readBetFrontmatter(readFileSync(resolve(context.cwd, path), 'utf8'))
    } catch (err) {
      context.emit.fail(
        'invalid',
        `Could not read ${path}: ${err instanceof Error ? err.message : String(err)}`
      )
      return EXIT.USAGE
    }
    const problems = betProblems(fm)
    if (problems.length > 0) {
      context.emit.fail('invalid', `${path}: ${problems.join('; ')}.`, { issues: problems })
      return EXIT.USAGE
    }
    const project = resolveProject(context)
    if (!project) return missingProject(context)
    const flagKey = fm.flag_key!
    const measure = {
      targetSegment: 'everyone',
      adoptedEvent: fm.adopted_event,
      retainedEvent: fm.retained_event,
      retentionDays: fm.retention_days ? Number(fm.retention_days) : 7,
      satisfiedEvent: fm.satisfied_event,
    }

    const existing = await context.api!.get<unknown>('api/v1/cli/flags', { project, key: flagKey })
    if (existing.kind === 'network') {
      context.emit.fail('server_error', existing.message)
      return EXIT.SERVER
    }
    if (existing.kind === 'ok') {
      context.emit.ok(
        { project, flagKey, action: 'exists', measure },
        `${flagKey} exists in ${project}; left it as it is. Its funnel arrives with the roadmap push.`
      )
      return EXIT.OK
    }
    if (existing.code !== 'not_found') {
      context.emit.fail(existing.code, existing.message)
      return exitForServerCode(existing.code)
    }

    const created = await context.api!.post<FlagWriteBody>('api/v1/cli/flags/write', {
      project,
      key: flagKey,
      reason: `frijoles bet sync${fm.slug ? ` (${fm.slug})` : ''}`,
      allEnvs: true,
      command: 'create',
      polarity: 'enablement',
      description: betDescription(fm),
    })
    if (created.kind === 'network') {
      context.emit.fail('server_error', created.message)
      return EXIT.SERVER
    }
    if (created.kind === 'error') {
      context.emit.fail(created.code, created.message)
      return exitForServerCode(created.code)
    }
    context.emit.ok(
      {
        project,
        flagKey,
        action: 'created',
        version: created.body.version,
        outcome: created.body.outcome,
        measure,
      },
      `Created ${flagKey} in ${project}: a Measure flag, off until you roll it out (every environment). Its funnel arrives with the roadmap push.`
    )
    return created.body.outcome === 'partial' ? EXIT.PARTIAL : EXIT.OK
  },
}
