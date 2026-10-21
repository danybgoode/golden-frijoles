// frijoles version / update and the once-a-day notice (update-check.ts) — against a fake registry and a fake npm.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
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
      return nextResolve(
        specifier.endsWith('/commands') ? `${specifier}/index.ts` : `${specifier}.ts`,
        context
      )
    }
    return nextResolve(specifier, context)
  },
})

const { run } = await import('./run.ts')
const { EXIT } = await import('./exit-codes.ts')
const U = await import('./update-check.ts')
const { VERSION } = await import('./version.ts')

function capture() {
  const out: string[] = []
  const err: string[] = []
  return { writer: { out: (t: string) => out.push(t), err: (t: string) => err.push(t) }, out, err }
}
function sandbox(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const home = mkdtempSync(join(tmpdir(), 'gf-update-'))
  return { HOME: home, XDG_CONFIG_HOME: join(home, '.config'), ...extra }
}
function registry(version: string | null, calls: string[] = []): typeof fetch {
  return (async (input: string | URL) => {
    calls.push(String(input))
    if (version === null) throw new Error('offline')
    return new Response(JSON.stringify({ version }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as unknown as typeof fetch
}
const bump = (v: string) => v.replace(/^(\d+)\.(\d+)\.\d+.*/, (_m, a, b) => `${a}.${Number(b) + 1}.0`)

test('versions compare numerically; a pre-release is older than its release', () => {
  assert.equal(U.compareVersions('1.11.0', '1.10.9'), 1)
  assert.equal(U.compareVersions('1.9.0', '1.10.0'), -1)
  assert.equal(U.compareVersions('1.11.0', '1.11.0'), 0)
  assert.equal(U.compareVersions('1.12.0-beta.1', '1.12.0'), -1)
  assert.equal(U.compareVersions('v2.0.0', '1.99.99'), 1)
})

test('how this copy was installed, from the script path', () => {
  assert.equal(
    U.installMethodFor('/Users/a/.npm/_npx/abc/node_modules/@golden-frijoles/cli/dist/bin.js'),
    'npx'
  )
  assert.equal(U.installMethodFor('/usr/local/lib/node_modules/@golden-frijoles/cli/dist/bin.js'), 'global')
  assert.equal(
    U.installMethodFor('/opt/npm/node_modules/@golden-frijoles/cli/dist/bin.js', '/opt/npm/node_modules'),
    'global'
  )
  assert.equal(
    U.installMethodFor(
      'C:\\Users\\a\\AppData\\Roaming\\npm\\node_modules\\@golden-frijoles\\cli\\dist\\bin.js',
      'C:\\Users\\a\\AppData\\Roaming\\npm\\node_modules'
    ),
    'global'
  )
  assert.equal(U.installMethodFor('/work/app/node_modules/@golden-frijoles/cli/dist/bin.js'), 'local')
  assert.equal(U.installMethodFor('/work/golden-frijoles/packages/cli/dist/bin.js'), 'source')
  assert.equal(U.installMethodFor(undefined), 'source')
  assert.match(U.updateAdvice('global', '9.0.0').command, /^npm i -g @golden-frijoles\/cli@9\.0\.0$/)
  assert.match(U.updateAdvice('npx', '9.0.0').command, /npx -y @golden-frijoles\/cli@9\.0\.0/)
  assert.match(U.updateAdvice('local', '9.0.0').command, /npm i -D/)
})

test('the notice never runs under --json, in CI, or when switched off', () => {
  assert.equal(U.updateCheckAllowed({}, false), true)
  assert.equal(U.updateCheckAllowed({}, true), false)
  assert.equal(U.updateCheckAllowed({ CI: 'true' }, false), false)
  assert.equal(U.updateCheckAllowed({ CI: 'false' }, false), true)
  assert.equal(U.updateCheckAllowed({ GOLDEN_FRIJOLES_NO_UPDATE_CHECK: '1' }, false), false)
  assert.equal(U.updateCheckAllowed({ NO_UPDATE_NOTIFIER: '1' }, false), false)
})

test('the notice asks the registry at most once a day, remembers a failure, and says nothing when current', async () => {
  const env = sandbox()
  const calls: string[] = []
  const now = Date.UTC(2026, 9, 21)
  const newer = bump(VERSION)
  const first = await U.updateNotice({ current: VERSION, env, fetchImpl: registry(newer, calls), now })
  assert.match(first ?? '', new RegExp(`frijoles ${newer.replace(/\./g, '\\.')} is out .*frijoles update`))
  // Within the day: the cache answers, no second call.
  assert.ok(
    await U.updateNotice({ current: VERSION, env, fetchImpl: registry(newer, calls), now: now + 3600_000 })
  )
  assert.equal(calls.length, 1)
  // A day later: asks again.
  await U.updateNotice({
    current: VERSION,
    env,
    fetchImpl: registry(VERSION, calls),
    now: now + 25 * 3600_000,
  })
  assert.equal(calls.length, 2)
  // Offline is remembered too (no call per command on a plane), and is silent.
  const off = sandbox()
  const offCalls: string[] = []
  assert.equal(
    await U.updateNotice({ current: VERSION, env: off, fetchImpl: registry(null, offCalls), now }),
    null
  )
  assert.equal(
    await U.updateNotice({
      current: VERSION,
      env: off,
      fetchImpl: registry(null, offCalls),
      now: now + 60_000,
    }),
    null
  )
  assert.equal(offCalls.length, 1)
  // Current, or a build newer than the registry: nothing to say.
  assert.equal(
    await U.updateNotice({ current: VERSION, env: sandbox(), fetchImpl: registry(VERSION), now }),
    null
  )
  assert.equal(
    await U.updateNotice({ current: '99.0.0', env: sandbox(), fetchImpl: registry(VERSION), now }),
    null
  )
})

test('frijoles version: the version, the latest, how it is installed; --json carries them', async () => {
  const newer = bump(VERSION)
  const human = capture()
  assert.equal(
    await run({
      argv: ['version'],
      writer: human.writer,
      env: sandbox(),
      fetchImpl: registry(newer),
      scriptPath: '/usr/local/lib/node_modules/@golden-frijoles/cli/dist/bin.js',
    }),
    EXIT.OK
  )
  assert.match(
    human.out.join(''),
    new RegExp(`frijoles ${VERSION.replace(/\./g, '\\.')} \\(a global npm install\\)`)
  )
  assert.match(human.out.join(''), /is published\. Update: frijoles update/)
  const json = capture()
  await run({
    argv: ['version', '--json'],
    writer: json.writer,
    env: sandbox(),
    fetchImpl: registry(VERSION),
    scriptPath: '/x/_npx/1/node_modules/@golden-frijoles/cli/dist/bin.js',
  })
  const doc = JSON.parse(json.out.join(''))
  assert.deepEqual(
    {
      version: doc.version,
      latest: doc.latest,
      installedVia: doc.installedVia,
      updateAvailable: doc.updateAvailable,
    },
    { version: VERSION, latest: VERSION, installedVia: 'npx', updateAvailable: false }
  )
  // `--version` stays the bare string scripts parse.
  const bare = capture()
  await run({ argv: ['--version'], writer: bare.writer, env: sandbox(), fetchImpl: registry(newer) })
  assert.equal(bare.out.join('').trim(), VERSION)
})

test('frijoles update: a global install runs npm i -g <latest>; --check and every other kind only print', async () => {
  const newer = bump(VERSION)
  const GLOBAL = '/usr/local/lib/node_modules/@golden-frijoles/cli/dist/bin.js'
  const ran: string[][] = []
  const exec = (command: string, args: string[]) => {
    ran.push([command, ...args])
    return { status: args[0] === 'root' ? 1 : 0, stdout: '' }
  }
  const out = capture()
  assert.equal(
    await run({
      argv: ['update'],
      writer: out.writer,
      env: sandbox(),
      fetchImpl: registry(newer),
      scriptPath: GLOBAL,
      exec,
    }),
    EXIT.OK
  )
  assert.deepEqual(
    ran.filter((r) => r[1] === 'i'),
    [['npm', 'i', '-g', `@golden-frijoles/cli@${newer}`]]
  )
  assert.match(out.out.join(''), new RegExp(`Updated to frijoles ${newer.replace(/\./g, '\\.')}`))

  for (const [argv, path] of [
    [['update', '--check'], GLOBAL],
    [['update'], '/x/_npx/1/node_modules/@golden-frijoles/cli/dist/bin.js'],
    [['update'], '/work/app/node_modules/@golden-frijoles/cli/dist/bin.js'],
  ] as const) {
    const calls: string[][] = []
    const printed = capture()
    await run({
      argv: [...argv],
      writer: printed.writer,
      env: sandbox(),
      fetchImpl: registry(newer),
      scriptPath: path,
      exec: (c, a) => (calls.push([c, ...a]), { status: 1 }),
    })
    assert.equal(calls.filter((r) => r[1] === 'i').length, 0, `${argv.join(' ')} ${path}`)
    assert.match(printed.out.join(''), /is published/)
  }
})

test('frijoles update: already current says so; npm failing or the registry unreachable is not exit 0', async () => {
  const current = capture()
  assert.equal(
    await run({ argv: ['update'], writer: current.writer, env: sandbox(), fetchImpl: registry(VERSION) }),
    EXIT.OK
  )
  assert.match(current.out.join(''), /is the latest/)
  assert.notEqual(
    await run({ argv: ['update'], writer: capture().writer, env: sandbox(), fetchImpl: registry(null) }),
    EXIT.OK
  )
  const failing = await run({
    argv: ['update'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: registry(bump(VERSION)),
    scriptPath: '/usr/local/lib/node_modules/@golden-frijoles/cli/dist/bin.js',
    exec: (_c, a) => ({ status: a[0] === 'root' ? 1 : 243 }),
  })
  assert.equal(failing, EXIT.SERVER)
})

test('run(): the notice reaches stderr only when the executable asks for it, never under --json', async () => {
  const newer = bump(VERSION)
  const on = capture()
  await run({
    argv: ['--help'],
    writer: on.writer,
    env: sandbox(),
    fetchImpl: registry(newer),
    updateCheck: true,
  })
  // --help returns before a command runs: no notice there. A real command:
  const cmd = capture()
  await run({
    argv: ['doctor'],
    writer: cmd.writer,
    env: sandbox(),
    fetchImpl: registry(newer),
    updateCheck: true,
  })
  assert.match(cmd.err.join(''), /is out .*frijoles update/)
  const quiet = capture()
  await run({
    argv: ['doctor', '--json'],
    writer: quiet.writer,
    env: sandbox(),
    fetchImpl: registry(newer),
    updateCheck: true,
  })
  assert.doesNotMatch(quiet.err.join('') + quiet.out.join(''), /is out \(you have/)
  const off = capture()
  await run({ argv: ['doctor'], writer: off.writer, env: sandbox(), fetchImpl: registry(newer) })
  assert.doesNotMatch(off.err.join(''), /is out \(you have/)
})
