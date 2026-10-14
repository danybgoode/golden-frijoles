// golden-frijoles-cli · Sprint 1, Story 1.3 — `frijoles projects ls | create | use`.

import type { Command, CommandContext } from '../command'
import { readCredentials, writeCredentials } from '../credentials'
import { EXIT, exitForServerCode, type ExitCode } from '../exit-codes'
import { table } from '../output'

type ProjectsBody = { projects: Array<{ slug: string; role: string }> }

export const projectsLsCommand: Command = {
  path: ['projects', 'ls'],
  summary: 'the projects this credential reaches',
  usage: 'frijoles projects ls [--json]',
  needsAuth: true,
  flags: [],
  async run(context): Promise<ExitCode> {
    const result = await context.api!.get<ProjectsBody>('api/v1/cli/projects')
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    const { projects } = result.body
    context.emit.ok(
      { projects, activeProject: context.auth.activeProject },
      projects.length === 0
        ? 'This account belongs to no product yet. Run `frijoles projects create <slug>`.'
        : table(
            ['PROJECT', 'ROLE', ''],
            projects.map((project) => [
              project.slug,
              project.role,
              project.slug === context.auth.activeProject ? 'active' : '',
            ])
          )
    )
    return EXIT.OK
  },
}

export const projectsCreateCommand: Command = {
  path: ['projects', 'create'],
  summary: 'make a new product (idempotent: one you already own is left alone)',
  usage: 'frijoles projects create <slug> [--json]',
  needsAuth: true,
  detail: `Makes a product called <slug> in your own workspace, with you as its owner.
  A name you already own answers created: false and changes nothing, so a script can
  run it twice. A name anyone else holds is a conflict.

  It does not bind a repo to the product — \`frijoles init --create <slug>\` does both —
  and it never returns an ingest key: \`frijoles keys create --type ingest\` makes one, with
  its own confirmation and its own audit row.`,
  flags: [],
  async run(context): Promise<ExitCode> {
    const slug = context.args.positionals[0]?.trim()
    if (!slug) {
      context.emit.fail('invalid', 'Name the product: `frijoles projects create <slug>`.')
      return EXIT.USAGE
    }
    const result = await createProduct(context, slug)
    if (result.kind !== 'ok') return result.exit
    const { created, slug: made } = result
    context.emit.ok(
      { created, slug: made },
      created ? `Created ${made}.` : `You already have ${made}. Nothing changed.`
    )
    return EXIT.OK
  },
}

/** POST cli/projects { slug } — shared by `projects create` and `init --create`. Reports its own failure. */
export async function createProduct(
  context: CommandContext,
  slug: string
): Promise<{ kind: 'ok'; created: boolean; slug: string } | { kind: 'failed'; exit: ExitCode }> {
  const result = await context.api!.post<{ created: boolean; slug: string }>('api/v1/cli/projects', { slug })
  if (result.kind === 'network') {
    context.emit.fail('server_error', result.message)
    return { kind: 'failed', exit: EXIT.SERVER }
  }
  if (result.kind === 'error') {
    context.emit.fail(result.code, result.message)
    return { kind: 'failed', exit: exitForServerCode(result.code) }
  }
  // The server's name for it, never the one typed: those are the same today (it refuses anything else), and binding or
  // printing the typed one is how a product gets made under one name and used under another (verifier, #356).
  return { kind: 'ok', created: result.body.created, slug: result.body.slug }
}

/** GET cli/projects — the products this credential reaches. Reports its own failure. */
export async function listProducts(
  context: CommandContext
): Promise<{ kind: 'ok'; projects: ProjectsBody['projects'] } | { kind: 'failed'; exit: ExitCode }> {
  const result = await context.api!.get<ProjectsBody>('api/v1/cli/projects')
  if (result.kind === 'network') {
    context.emit.fail('server_error', result.message)
    return { kind: 'failed', exit: EXIT.SERVER }
  }
  if (result.kind === 'error') {
    context.emit.fail(result.code, result.message)
    return { kind: 'failed', exit: exitForServerCode(result.code) }
  }
  return { kind: 'ok', projects: result.body.projects }
}

export const projectsUseCommand: Command = {
  path: ['projects', 'use'],
  summary: 'remember which project the other commands act on',
  usage: 'frijoles projects use <slug>',
  needsAuth: true,
  detail: `Writes the choice into the saved credentials file. --project on any command
  overrides it for that one run, and GOLDEN_FRIJOLES_PROJECT overrides both — which is
  what CI should set, since CI has no credentials file to write.`,
  flags: [],
  async run(context): Promise<ExitCode> {
    const slug = context.args.positionals[0]
    if (!slug) {
      context.emit.fail('invalid', 'Name a project: `frijoles projects use <slug>`.')
      return EXIT.USAGE
    }

    // ⚠️ VERIFIED against the server before it is saved. Writing an unchecked slug produces a file
    // that makes every later command fail with that command's error — "no flag `x` in `y`" when the
    // real answer is "`y` is not a project you can see" — which is the class of misdirection
    // `frijoles doctor` exists to end, so it must not be created here in the first place.
    const result = await context.api!.get<ProjectsBody>('api/v1/cli/projects')
    if (result.kind === 'network') {
      context.emit.fail('server_error', result.message)
      return EXIT.SERVER
    }
    if (result.kind === 'error') {
      context.emit.fail(result.code, result.message)
      return exitForServerCode(result.code)
    }
    if (!result.body.projects.some((project) => project.slug === slug)) {
      // Not-a-member and does-not-exist are ONE answer, here as at the server (AGENTS #10).
      context.emit.fail('not_found', `No project \`${slug}\` is available to this account.`)
      return EXIT.NOT_FOUND
    }

    const existing = readCredentials(context.env)
    if (!existing) {
      // Reachable with GOLDEN_FRIJOLES_TOKEN and no saved file — CI. There is nothing to remember
      // into, and inventing a credentials file to hold a preference would write a token to a CI
      // runner's home directory, which is precisely what the env-var path exists to avoid.
      context.emit.fail(
        'invalid',
        'There is no saved credential to record this in. Set GOLDEN_FRIJOLES_PROJECT, or run `frijoles login` first.'
      )
      return EXIT.USAGE
    }
    writeCredentials({ ...existing, activeProject: slug }, context.env)
    context.emit.ok({ activeProject: slug }, `Now using ${slug}.`)
    return EXIT.OK
  },
}
