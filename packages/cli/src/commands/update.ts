// `frijoles version` — what you have, what is published, how this copy was installed.
// `frijoles update [--check]` — get the latest: run it for a global install, say the command for every other kind.
//
// Daniel, 2026-10-21: "do we have a frijoles update command? or how do users update?" and "fold in a way to check
// current version". `frijoles --version` stays a bare version string (scripts parse it); these two are for a person or an
// agent asking "am I current, and how do I become current".

import { boolFlag } from '../args'
import type { Command, CommandContext } from '../command'
import { EXIT, type ExitCode } from '../exit-codes'
import { VERSION } from '../version'
import {
  PACKAGE,
  compareVersions,
  fetchLatestVersion,
  installMethodFor,
  isPlainVersion,
  updateAdvice,
  type InstallMethod,
} from '../update-check'

/** The npm global root (`npm root -g`), to tell a global install from a project one; null when npm cannot say. */
function globalRoot(context: CommandContext): string | null {
  if (!context.exec) return null
  const result = context.exec('npm', ['root', '-g'], { capture: true })
  return result.status === 0 && result.stdout ? result.stdout.trim() : null
}

async function where(context: CommandContext): Promise<{
  latest: string | null
  method: InstallMethod
  behind: boolean
}> {
  const latest = await fetchLatestVersion(context.fetchImpl, 5_000)
  const method = installMethodFor(context.scriptPath, globalRoot(context))
  return { latest, method, behind: latest !== null && compareVersions(latest, VERSION) > 0 }
}

const METHOD_WORDS: Record<InstallMethod, string> = {
  global: 'a global npm install',
  npx: 'npx (its cache)',
  local: "a project's dependency",
  source: 'a source checkout',
}

export const versionCommand: Command = {
  path: ['version'],
  summary: 'the version you have, the latest published, and how to update',
  usage: 'frijoles version [--json]',
  needsAuth: false,
  detail: `\`frijoles --version\` prints only the version (for scripts). This also asks npm for the latest, says how this
  copy was installed, and gives the command that updates it.`,
  flags: [],
  async run(context): Promise<ExitCode> {
    const { latest, method, behind } = await where(context)
    const advice = latest ? updateAdvice(method, latest) : null
    context.emit.ok(
      {
        version: VERSION,
        latest,
        installedVia: method,
        updateAvailable: behind,
        ...(behind && advice ? { update: advice.command } : {}),
      },
      [
        `frijoles ${VERSION} (${METHOD_WORDS[method]})`,
        latest === null
          ? 'Could not reach the npm registry to compare.'
          : behind
            ? `${latest} is published. Update: frijoles update`
            : `That is the latest published (${latest}).`,
      ].join('\n')
    )
    return EXIT.OK
  },
}

export const updateCommand: Command = {
  path: ['update'],
  summary: 'update this CLI to the latest published version',
  usage: 'frijoles update [--check] [--json]',
  needsAuth: false,
  detail: `For a global install it runs \`npm i -g ${PACKAGE}@<latest>\`. For npx, a project dependency or a source
  checkout it prints the command instead — those are updated where they live. --check only reports.`,
  flags: [{ name: 'check', describe: 'only say whether an update is available; change nothing' }],
  async run(context): Promise<ExitCode> {
    const { latest, method, behind } = await where(context)
    if (latest === null) {
      context.emit.fail(
        'server_error',
        'Could not reach the npm registry to find the latest version. Try again.'
      )
      return EXIT.SERVER
    }
    if (!behind) {
      context.emit.ok(
        { version: VERSION, latest, updated: false, installedVia: method },
        `frijoles ${VERSION} is the latest.`
      )
      return EXIT.OK
    }
    const advice = updateAdvice(method, latest)
    if (boolFlag(context.args, 'check') || method !== 'global' || !context.exec) {
      context.emit.ok(
        { version: VERSION, latest, updated: false, installedVia: method, update: advice.command },
        `frijoles ${latest} is published (you have ${VERSION}, via ${METHOD_WORDS[method]}).\n${advice.note}\n  ${advice.command}`
      )
      return EXIT.OK
    }
    // Never on a command line unless it is a whole, plain version (fetchLatestVersion already checks; checked again here
    // because this is the line that runs it).
    if (!isPlainVersion(latest)) {
      context.emit.fail('server_error', 'The registry answered with a version this CLI will not install.')
      return EXIT.SERVER
    }
    context.emit.note(`Updating ${VERSION} → ${latest}: ${advice.command}`)
    const result = context.exec('npm', ['i', '-g', `${PACKAGE}@${latest}`], { capture: context.emit.json })
    if (result.status !== 0) {
      context.emit.fail(
        'server_error',
        `\`${advice.command}\` did not finish (exit ${result.status ?? 'signal'}). If it was a permissions error, run it yourself (with sudo, or fix the npm prefix).`
      )
      return EXIT.SERVER
    }
    context.emit.ok(
      { version: VERSION, latest, updated: true, installedVia: method },
      `Updated to frijoles ${latest}.`
    )
    return EXIT.OK
  },
}
