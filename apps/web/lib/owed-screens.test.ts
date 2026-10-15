import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// owed-on-screen D9 — every screen that draws an owed check asks the FLAG first, then the member-gated read, and nothing
// else reads owed checks for a screen. Source-level because the screens are server components behind auth and `server-only`
// imports (CODE-QUALITY §5: a guard the harness cannot reach by running goes in a spec that reads it). The lit and dark
// behaviour is the authed pair `owed-on-screen(-dark).authed.spec.ts`; this one fails without a server and names the line.

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel: string) => readFileSync(join(WEB, rel), 'utf8')
const code = (src: string) =>
  src
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l))
    .join('\n')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (['node_modules', '.next', 'e2e'].includes(name)) return []
    if (statSync(p).isDirectory()) return sources(p)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : []
  })
}

const callersOf = (symbol: string) =>
  ['app', 'lib', 'components']
    .flatMap((d) => sources(join(WEB, d)))
    .filter((f) => code(readFileSync(f, 'utf8')).includes(symbol))
    .map((f) => relative(WEB, f).split('\\').join('/'))
    .sort()

test('only the screen helper and the portfolio read owed checks for a viewer', () => {
  assert.deepEqual(callersOf('getOwedForViewer'), [
    'lib/owed-read.ts',
    'lib/owed-screen.ts',
    'lib/portfolio.ts',
  ])
})

test('the flag is awaited before the member read, in both places that read for a screen', () => {
  for (const file of ['lib/owed-screen.ts', 'lib/portfolio.ts']) {
    const src = code(read(file))
    // The gate's RESULT must decide: an early return when it is off, before any read. Awaiting it and ignoring the answer
    // (`const on = await …; void on`) would satisfy a weaker "awaited first" check (verifier, #376) — and the signed-in
    // dark spec runs nowhere in CI, so this is the CI defence of "flag off, a member sees nothing".
    const gate = src.search(/if \(!\(await isOwedOnScreenEnabled\(\)\)\) return\b/)
    const readAt = src.indexOf('getOwedForViewer(')
    assert.ok(
      gate !== -1,
      `${file} returns early when the gate is off (awaited: a bare call is a truthy Promise)`
    )
    assert.ok(readAt !== -1 && gate < readAt, `${file} checks the flag before it reads`)
  }
})

test('the epic page and the board read owed checks only through the screen helper', () => {
  for (const file of [
    'app/hub/[projectSlug]/epic/[epicSlug]/page.tsx',
    'app/hub/[projectSlug]/board/page.tsx',
  ]) {
    const src = code(read(file))
    assert.match(
      src,
      /await readOwedOnScreen\(result\.projectId\)/,
      `${file} reads by the id its own read resolved`
    )
    assert.ok(!src.includes('getOwedForViewer'), `${file} does not bypass the flag`)
  }
})

test('the workspace board does not draw owed checks (project board only)', () => {
  const callers = callersOf('readOwedOnScreen').filter((f) => f.startsWith('app/hub/w/'))
  assert.deepEqual(callers, [])
})
