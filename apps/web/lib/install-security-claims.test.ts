// account-from-the-terminal · Sprint 1, Story 1.2 (amended) — every security claim install.md makes is checked
// against the release it describes. One test per claim id; a claim with no test fails the first test.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// The extensionless-import hook `install-manifest.test.ts` uses.
type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { securityClaims } = await import('./install-security-claims.ts')
const { PLUGIN_VERSION } = await import('./plugin-release.generated.ts')
const { KIT_PACKAGE, PRODUCTION_SITE_URL } = await import('./install-prompt.ts')

const REPO = join(import.meta.dirname, '..', '..', '..')
const PLUGIN = join(REPO, 'skills', 'plugins', 'golden-frijoles')
const CLI_SRC = join(REPO, 'packages', 'cli', 'src')

const read = (path: string) => readFileSync(path, 'utf8')
const json = (path: string) => JSON.parse(read(path)) as Record<string, unknown>

function files(dir: string, keep: (path: string) => boolean): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__golden__' ? [] : files(path, keep)
    return keep(path) ? [path] : []
  })
}
const shipped = (path: string) => !/\.test\.(m?js|ts|tsx)$/.test(path)
const cliSources = files(CLI_SRC, (path) => path.endsWith('.ts') && shipped(path))
/** Code only: line comments dropped, so a URL named in an explanation is not a call. */
const code = (path: string) =>
  read(path)
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n')

const TESTED = new Set<string>()
function claimTest(id: string, body: () => void) {
  TESTED.add(id)
  test(`claim "${id}" holds for this release`, body)
}

test('every claim on the page has a test, and every test names a claim', () => {
  const ids = securityClaims('https://site.example').map((claim) => claim.id)
  assert.deepEqual([...ids].sort(), [...TESTED].sort())
})

claimTest('nothing-at-install', () => {
  const hooks = json(join(PLUGIN, 'hooks', 'hooks.json'))
  assert.deepEqual(hooks.hooks, {}, 'the plugin registers classic hooks')
  assert.deepEqual(hooks.modules, ['./index.tsx'], 'the plugin loads a module other than the status line')
  for (const pkg of ['skills/kit/package.json', 'packages/cli/package.json', 'packages/sdk/package.json']) {
    const scripts = (json(join(REPO, pkg)).scripts ?? {}) as Record<string, string>
    for (const hook of ['preinstall', 'install', 'postinstall', 'prepare'])
      assert.equal(scripts[hook], undefined, `${pkg} has an npm \`${hook}\` script`)
  }
})

claimTest('cli-talks-to-site', () => {
  assert.match(
    read(join(CLI_SRC, 'credentials.ts')),
    new RegExp(`DEFAULT_API_URL = '${PRODUCTION_SITE_URL}'`)
  )
  const calls = cliSources.filter((path) => /\b(fetch|doFetch|fetchImpl)\(/.test(code(path)))
  assert.deepEqual(
    calls.map((path) => path.slice(CLI_SRC.length + 1)).sort(),
    ['api.ts', 'commands/doctor.ts'],
    'a CLI file other than the API client and doctor makes a network call'
  )
  const hosts = new Set(
    cliSources.flatMap((path) =>
      [...code(path).matchAll(/https?:\/\/([a-z0-9.-]+)/g)].map((match) => match[1])
    )
  )
  assert.deepEqual([...hosts].sort(), ['goldenfrijoles.com', 'registry.npmjs.org'])
})

claimTest('keys-in-env-local', () => {
  const writes = cliSources.flatMap((path) =>
    [...code(path).matchAll(/\b(?:writeFileSync|appendFileSync)\(\s*([A-Za-z]+)/g)].map(
      (match) => `${path.slice(CLI_SRC.length + 1)}:${match[1]}`
    )
  )
  assert.deepEqual(
    [...new Set(writes)].sort(),
    ['commands/init.ts:envPath', 'commands/init.ts:gitignorePath', 'credentials.ts:path'],
    'the CLI writes a file the claim does not name'
  )
  const init = code(join(CLI_SRC, 'commands', 'init.ts'))
  assert.match(init, /const ENV_FILE = '\.env\.local'/)
  assert.ok(
    init.indexOf('ensureIgnored(gitignorePath') < init.indexOf("'api/v1/cli/keys'"),
    '`frijoles init` mints a key before .gitignore covers .env.local'
  )
  assert.match(init, /writeFileSync\(envPath, next, \{ mode: 0o600 \}\)/)
  const credentials = code(join(CLI_SRC, 'credentials.ts'))
  assert.match(credentials, /'golden-frijoles', 'credentials\.json'/)
  assert.match(credentials, /mode: 0o600/)
})

claimTest('kit-pinned', () => {
  assert.equal(json(join(REPO, 'skills', 'kit', 'package.json')).version, PLUGIN_VERSION)
  const skills = files(join(PLUGIN, 'skills'), (path) => path.endsWith('SKILL.md'))
  const pins = skills.flatMap((path) =>
    [...read(path).matchAll(new RegExp(`npx -y ${KIT_PACKAGE}@(\\d+\\.\\d+\\.\\d+)`, 'g'))].map(
      (match) => match[1]
    )
  )
  assert.ok(pins.length > 0, 'no skill runs the kit pinned')
  assert.deepEqual([...new Set(pins)], [PLUGIN_VERSION], 'a skill pins a different kit version')
})

claimTest('status-line', () => {
  // The status line is hooks/ plus the scripts it runs: the vendored resolver beside it and groom's kickoff bundle.
  const reach = [join(PLUGIN, 'hooks'), join(PLUGIN, 'skills', 'groom', 'vendor')]
  const reachable = reach.flatMap((dir) => files(dir, (path) => /\.(m?js|tsx?)$/.test(path) && shipped(path)))
  const network = reachable
    .filter((path) => /\b(fetch|fetchImpl|fetchFn)\(/.test(code(path)))
    .map((path) => path.slice(PLUGIN.length + 1))
    .sort()
  assert.deepEqual(network, [
    'hooks/vendor/epic-actuals.mjs',
    'hooks/vendor/roadmap-push.mjs',
    'skills/groom/vendor/roadmap-push.mjs',
  ])
  // The usage push is behind spend.telemetry, and its target is the engine URL you set.
  const actuals = code(join(PLUGIN, 'hooks', 'vendor', 'epic-actuals.mjs'))
  const gate = actuals.indexOf("if (setting !== 'on')")
  assert.ok(
    gate > 0 && gate < actuals.indexOf('await fetchImpl('),
    'usage can be sent without spend.telemetry on'
  )
  assert.match(actuals, /const base = String\(env\.GROWTH_ENGINE_URL/)
  // The roadmap push is reached only from roadmap-extract's `--sink hub` (or roadmap-push run by hand), and the
  // status line never asks for that sink.
  for (const path of reachable.filter((path) => path.endsWith('roadmap-extract.mjs'))) {
    const line = code(path)
      .split('\n')
      .findIndex((text) => text.includes('pushRoadmap('))
    assert.match(code(path).split('\n')[line - 1], /sink === 'hub'/, `${path} pushes outside the hub sink`)
  }
  const view = code(join(PLUGIN, 'hooks', 'build-view.mjs')) + code(join(PLUGIN, 'hooks', 'index.tsx'))
  assert.doesNotMatch(view, /\bhub\b|--sink|--push/, 'the status line asks a script to push')
  // Every program it runs is git, gh or node.
  const spawned = reachable.flatMap((path) =>
    [...code(path).matchAll(/(?:execFileSync|spawnSync|execFile|spawn)\(\s*['"]([^'"]+)['"]/g)].map(
      (m) => m[1]
    )
  )
  for (const program of spawned)
    assert.ok(['git', 'gh', 'node'].includes(program), `the status line runs ${program}`)
})
