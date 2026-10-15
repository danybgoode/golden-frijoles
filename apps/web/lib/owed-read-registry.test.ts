import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// owed-on-screen D6 — the raw roadmap read (the one that returns owed checks) has a CLOSED set of callers. Every other
// read is stripped at the seam; a new caller of the raw one is a new way for a member-only field to reach a public page,
// so it fails here and is routed through `getOwedForViewer` (lib/owed-read.ts) instead.

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = 'getLatestRoadmapWithOwed'
const REGISTRY = ['app/api/v1/roadmap/push/route.ts', 'lib/owed-read.ts', 'lib/report-artifacts.ts']

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (['node_modules', '.next', 'e2e'].includes(name)) return []
    if (statSync(p).isDirectory()) return sources(p)
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : []
  })
}

test('only the registered files name the raw owed read', () => {
  const callers = ['app', 'lib', 'components']
    .flatMap((d) => sources(join(WEB, d)))
    // Code, not prose: a comment may name the read (lib/report-artifact-row.ts explains why it exists); a line of code may not.
    .filter((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .some((l) => l.includes(RAW) && !/^\s*(\/\/|\*|\/\*)/.test(l))
    )
    .map((f) => relative(WEB, f).split('\\').join('/'))
    .sort()
  assert.deepEqual(callers, [...REGISTRY].sort())
})

test('report-artifacts.ts keeps owed checks in exactly one read: the registered raw one', () => {
  const src = readFileSync(join(WEB, 'lib/report-artifacts.ts'), 'utf8')
  // Two places say keepOwed: the raw read passes true; the shared reader forwards it. Every other read passes false.
  assert.equal(src.match(/keepOwed: true/g)?.length, 1, 'exactly one read may keep owed checks')
  const raw = src.slice(src.indexOf(`export async function ${RAW}`))
  assert.match(raw.slice(0, raw.indexOf('\n}\n')), /keepOwed: true/, `the one that keeps them is ${RAW}`)
})

test('only lib/report-artifacts.ts queries report_artifacts, so every read passes through its strip', () => {
  const direct = ['app', 'lib', 'components']
    .flatMap((d) => sources(join(WEB, d)))
    .filter((f) => /from\(\s*['"]report_artifacts['"]\s*\)/.test(readFileSync(f, 'utf8')))
    .map((f) => relative(WEB, f).split('\\').join('/'))
  assert.deepEqual(direct, ['lib/report-artifacts.ts'])
})
