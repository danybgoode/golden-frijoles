// many-products · Sprint 1, Stories 1.3 + 1.4 (lock D5–D7) — login signs in an ACCOUNT, and the repo names its product.
//
// Every test runs the REAL dispatcher and the REAL kit config core in a throwaway project (GF_PROJECT_ROOT) with a
// throwaway HOME. The network is a stub, or a fetch that fails the test when reached.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
const registerHooks = (Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void })
  .registerHooks
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/packages/cli/src/') &&
      specifier.startsWith('.') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(specifier.endsWith('/commands') ? `${specifier}/index.ts` : `${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { run } = await import('./run.ts')
const { EXIT } = await import('./exit-codes.ts')
const { readCredentials, writeCredentials } = await import('./credentials.ts')

const TOKEN = `gf_pat_${'a'.repeat(32)}`
const CONFIG = 'golden-frijoles.config.json'

const noNetwork = (() => {
  throw new Error('the network must not be touched')
}) as unknown as typeof fetch

function capture() {
  const out: string[] = []
  const err: string[] = []
  return { writer: { out: (t: string) => out.push(t), err: (t: string) => err.push(t) }, out, err }
}

/** A throwaway HOME and a throwaway repo, the repo named as the project root. */
function sandbox(extra: NodeJS.ProcessEnv = {}) {
  const home = mkdtempSync(join(tmpdir(), 'gf-bind-home-'))
  const repo = mkdtempSync(join(tmpdir(), 'gf-bind-repo-'))
  const env: NodeJS.ProcessEnv = { HOME: home, XDG_CONFIG_HOME: join(home, '.config'), GF_PROJECT_ROOT: repo, ...extra }
  return { env, repo }
}

type Seen = Array<{ method: string; path: string; body: unknown }>

function stub(routes: Record<string, { status?: number; body: unknown }>, seen: Seen = []): typeof fetch {
  return (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const method = init?.method ?? 'GET'
    seen.push({ method, path: url.pathname, body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined })
    const match = routes[`${method} ${url.pathname}`] ?? routes[url.pathname]
    if (!match) throw new Error(`no stub for ${method} ${url.pathname}`)
    return new Response(JSON.stringify(match.body), {
      status: match.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch
}

const PROJECTS = { ok: true, projects: [{ slug: 'acme', role: 'owner' }, { slug: 'beta', role: 'owner' }] }
const MINTED = { body: { ok: true, id: 'key-1', key: 'gb_key_secret', type: 'flag_read', expiresAt: null } }
const binding = (repo: string) =>
  existsSync(join(repo, CONFIG)) ? (JSON.parse(readFileSync(join(repo, CONFIG), 'utf8')).project?.slug ?? null) : null

// ── init: which product (D7) ──────────────────────────────────────────────────────────────────

test('⚠️ init --json with no product named and no binding stops, naming BOTH flags, without touching the network', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  const { writer, out } = capture()
  const code = await run({ argv: ['init', '--json'], writer, env, cwd: repo, fetchImpl: noNetwork })
  assert.equal(code, EXIT.USAGE)
  const body = JSON.parse(out.join('\n')) as { ok: boolean; code: string; error: string }
  assert.equal(body.code, 'invalid')
  assert.match(body.error, /--project/)
  assert.match(body.error, /--create/)
  assert.equal(binding(repo), null)
  assert.equal(existsSync(join(repo, '.env.local')), false)
})

test("⚠️ the machine-wide remembered product is NOT a repo's answer — a new repo still has to name one", async () => {
  const { env, repo } = sandbox()
  writeCredentials({ token: TOKEN, apiUrl: 'https://goldenfrijoles.com', activeProject: 'acme' }, env)
  const { writer } = capture()
  const code = await run({ argv: ['init', '--json'], writer, env, cwd: repo, fetchImpl: noNetwork })
  assert.equal(code, EXIT.USAGE)
})

test('init --create makes the product, binds the repo to it, then mints into .env.local', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  const seen: Seen = []
  const { writer, out } = capture()
  const code = await run({
    argv: ['init', '--create', 'fresh-one', '--json'],
    writer,
    env,
    cwd: repo,
    fetchImpl: stub(
      { 'POST /api/v1/cli/projects': { body: { ok: true, created: true, slug: 'fresh-one' } }, '/api/v1/cli/keys': MINTED },
      seen
    ),
  })
  assert.equal(code, EXIT.OK)
  assert.deepEqual(seen[0], { method: 'POST', path: '/api/v1/cli/projects', body: { slug: 'fresh-one' } })
  assert.equal((seen[1].body as { project: string }).project, 'fresh-one')
  assert.equal(binding(repo), 'fresh-one')
  const report = JSON.parse(out.join('\n')) as { project: string; created: boolean; bound: boolean }
  assert.deepEqual([report.project, report.created, report.bound], ['fresh-one', true, true])
})

test('init --project binds a product the account has; one it does not have is not_found and nothing is written', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  const routes = { 'GET /api/v1/cli/projects': { body: PROJECTS }, '/api/v1/cli/keys': MINTED }

  const missing = await run({
    argv: ['init', '--project', 'nope', '--json'],
    writer: capture().writer,
    env,
    cwd: repo,
    fetchImpl: stub(routes),
  })
  assert.equal(missing, EXIT.NOT_FOUND)
  assert.equal(binding(repo), null)

  const found = await run({
    argv: ['init', '--project', 'beta', '--json'],
    writer: capture().writer,
    env,
    cwd: repo,
    fetchImpl: stub(routes),
  })
  assert.equal(found, EXIT.OK)
  assert.equal(binding(repo), 'beta')
})

test('init --project and --create together are refused locally', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  const code = await run({
    argv: ['init', '--project', 'a-one', '--create', 'b-two', '--json'],
    writer: capture().writer,
    env,
    cwd: repo,
    fetchImpl: noNetwork,
  })
  assert.equal(code, EXIT.USAGE)
})

test('a bound repo re-runs init with no flags, on its own product', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  writeFileSync(join(repo, CONFIG), JSON.stringify({ project: { slug: 'beta' } }))
  const seen: Seen = []
  const code = await run({
    argv: ['init', '--json'],
    writer: capture().writer,
    env,
    cwd: repo,
    fetchImpl: stub({ '/api/v1/cli/keys': MINTED }, seen),
  })
  assert.equal(code, EXIT.OK)
  assert.equal((seen[0].body as { project: string }).project, 'beta')
})

// ── which product every other command uses (D6) ───────────────────────────────────────────────

test('precedence: GOLDEN_FRIJOLES_PROJECT > the repo binding > the remembered product', async () => {
  const { env, repo } = sandbox()
  writeCredentials({ token: TOKEN, apiUrl: 'https://goldenfrijoles.com', activeProject: 'acme' }, env)
  const active = async (extra: NodeJS.ProcessEnv = {}) => {
    const { writer, out } = capture()
    await run({
      argv: ['projects', 'ls', '--json'],
      writer,
      env: { ...env, ...extra },
      cwd: repo,
      fetchImpl: stub({ '/api/v1/cli/projects': { body: PROJECTS } }),
    })
    return (JSON.parse(out.join('\n')) as { activeProject: string | null }).activeProject
  }
  assert.equal(await active(), 'acme')
  writeFileSync(join(repo, CONFIG), JSON.stringify({ project: { slug: 'beta' } }))
  assert.equal(await active(), 'beta')
  assert.equal(await active({ GOLDEN_FRIJOLES_PROJECT: 'gamma' }), 'gamma')
  // A value that is not a slug is no binding at all, never a crash.
  writeFileSync(join(repo, CONFIG), JSON.stringify({ project: { slug: '../../etc' } }))
  assert.equal(await active(), 'acme')
})

// ── login (D5) ────────────────────────────────────────────────────────────────────────────────

const whoami = (slugs: string[]) => ({
  '/api/v1/cli/whoami': {
    body: {
      ok: true,
      account: { userId: 'u-1', email: 'founder@example.com' },
      credential: { id: 't-1', label: 'laptop' },
      projects: slugs.map((slug) => ({ slug, role: 'owner' })),
      workspaces: [],
    },
  },
})

test('⚠️ login with SEVERAL products picks none — taking the first is how a new repo got the wrong one', async () => {
  const { env, repo } = sandbox()
  const code = await run({
    argv: ['login', '--token', TOKEN, '--json'],
    writer: capture().writer,
    env,
    cwd: repo,
    fetchImpl: stub(whoami(['acme', 'beta'])),
  })
  assert.equal(code, EXIT.OK)
  assert.equal(readCredentials(env)?.activeProject, undefined)
})

test('login with exactly ONE product remembers it; a still-reachable earlier choice is kept', async () => {
  const one = sandbox()
  await run({ argv: ['login', '--token', TOKEN, '--json'], writer: capture().writer, env: one.env, cwd: one.repo, fetchImpl: stub(whoami(['acme'])) })
  assert.equal(readCredentials(one.env)?.activeProject, 'acme')

  const kept = sandbox()
  writeCredentials({ token: TOKEN, apiUrl: 'https://goldenfrijoles.com', activeProject: 'beta' }, kept.env)
  await run({ argv: ['login', '--token', TOKEN, '--json'], writer: capture().writer, env: kept.env, cwd: kept.repo, fetchImpl: stub(whoami(['acme', 'beta'])) })
  assert.equal(readCredentials(kept.env)?.activeProject, 'beta')
})

test('projects create <slug> sends the slug and says created or already yours', async () => {
  const { env, repo } = sandbox({ GOLDEN_FRIJOLES_TOKEN: TOKEN })
  const seen: Seen = []
  const { writer, out } = capture()
  const code = await run({
    argv: ['projects', 'create', 'acme', '--json'],
    writer,
    env,
    cwd: repo,
    fetchImpl: stub({ 'POST /api/v1/cli/projects': { body: { ok: true, created: false, slug: 'acme' } } }, seen),
  })
  assert.equal(code, EXIT.OK)
  assert.deepEqual(seen[0].body, { slug: 'acme' })
  assert.deepEqual(JSON.parse(out.join('\n')), { ok: true, created: false, slug: 'acme' })

  const none = await run({ argv: ['projects', 'create', '--json'], writer: capture().writer, env, cwd: repo, fetchImpl: noNetwork })
  assert.equal(none, EXIT.USAGE)
})
