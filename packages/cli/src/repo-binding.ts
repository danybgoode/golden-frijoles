// many-products · Sprint 1, Story 1.4 (Roadmap/02-commercial/many-products — lock D6).
//
// ── The repo, not the login, says which product it is ─────────────────────────────────────────
// `frijoles login` signs in an ACCOUNT (D4), which may own several products. A repo names the one it belongs to with
// `project.slug` in its `golden-frijoles.config.json` — the file the kit's config core already owns (D10), read and
// written through it here so the CLI and `frijoles-kit config` never disagree about which file or which root.
//
// Precedence, resolved once in `run.ts`: --project (per command) > GOLDEN_FRIJOLES_PROJECT > this binding > the
// credentials file's `activeProject`.
//
// A binding that cannot be read — no kit, a malformed file, a value that is not a slug — is "no binding", never a crash:
// every command still has --project, and `frijoles doctor` reports a malformed config file on its own.

import { loadConfigCore } from './config-core'

export const BINDING_KEY = 'project.slug'
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

export type RepoBinding = { slug: string; root: string }

/** The product this repo is bound to, or null. Never throws. */
export async function readRepoBinding(env: NodeJS.ProcessEnv, cwd: string): Promise<RepoBinding | null> {
  try {
    const core = await loadConfigCore()
    const root = core.projectRoot({ env, cwd })
    const { raw } = core.readSection('project', { root })
    const slug = raw && typeof raw === 'object' ? (raw as Record<string, unknown>).slug : undefined
    return typeof slug === 'string' && SLUG.test(slug) ? { slug, root } : null
  } catch {
    return null
  }
}

/** Bind this repo to `slug`. Returns the project root it wrote under. Throws when the file cannot be written. */
export async function writeRepoBinding(env: NodeJS.ProcessEnv, cwd: string, slug: string): Promise<string> {
  const core = await loadConfigCore()
  const root = core.projectRoot({ env, cwd })
  core.setKey(BINDING_KEY, slug, { root })
  return root
}
