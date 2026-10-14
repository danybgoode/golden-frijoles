// many-products · Sprint 2, Story 2.1 (lock D9) — a deleted product is "not found" on every read path.
//
// The credential views filter `deleted_at` in the database (20261015100000), and lib/membership.ts filters it in its
// three reads. What remains is every OTHER `.from('projects')` read in app code: one written later without the filter
// would serve a deleted product's page, funnel or roadmap. So each read either names `deleted_at` in its chain, is a
// write, or sits on the list below with its reason — adding a row is a decision made in review (fix the class, not the
// instance).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB = join(fileURLToPath(new URL('.', import.meta.url)), '..')

function files(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (['node_modules', '.next'].includes(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
    }
  }
  for (const dir of ['app', 'lib', 'components']) walk(join(WEB, dir))
  return out
}

const rel = (file: string) => file.slice(WEB.length + 1)

/** Reads that may see a deleted product, each with why. Keyed by file; the count is how many reads it may hold. */
const MAY_SEE_DELETED: Record<string, { reads: number; why: string }> = {
  'lib/provisioning.ts': {
    reads: 3,
    why: 'the signup race and the create path must see a deleted row: it still holds its slug and creator (D2, D9)',
  },
  'lib/gates-catalog.ts': { reads: 1, why: 'the gate catalog is golden-frijoles, which refuses delete' },
  'lib/tasks.ts': {
    reads: 1,
    why: 'names the project in a notification, by an id the caller already authorized',
  },
  'lib/loop-stage-store.ts': { reads: 1, why: 'by an id resolved through membership, which filters deleted' },
  'app/api/v1/features/[key]/funnel/route.ts': {
    reads: 1,
    why: 'by the id an ingest key resolved through active_ingest_keys, which filters deleted',
  },
  'app/api/v1/features/[key]/impact/route.ts': {
    reads: 1,
    why: 'by the id an ingest key resolved through active_ingest_keys, which filters deleted',
  },
  'app/api/v1/experiments/[key]/compare/route.ts': {
    reads: 1,
    why: 'by the id an ingest key resolved through active_ingest_keys, which filters deleted',
  },
}

const FROM_PROJECTS = /\.from\(\s*['"`]projects['"`]\s*\)/g
const WRITE = /\.(insert|update|upsert|delete)\(/

/** The method chain that starts at `index`: the call itself plus every following line that continues it with `.`. */
function chainAt(source: string, index: number): string {
  const lines = source.slice(index).split('\n')
  const chain = [lines[0]]
  for (const line of lines.slice(1)) {
    if (!/^\s*\./.test(line)) break
    chain.push(line)
  }
  return chain.join('\n')
}

test('every projects read filters deleted_at, or is listed with its reason', () => {
  const unfiltered = new Map<string, number>()
  for (const file of files()) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(FROM_PROJECTS)) {
      const chain = chainAt(source, match.index ?? 0)
      if (WRITE.test(chain) || chain.includes('deleted_at')) continue
      unfiltered.set(rel(file), (unfiltered.get(rel(file)) ?? 0) + 1)
    }
  }
  for (const [file, count] of unfiltered) {
    const allowed = MAY_SEE_DELETED[file]
    assert.ok(
      allowed,
      `${file} reads \`projects\` without filtering deleted_at. Add \`.is('deleted_at', null)\` (a deleted product is not found), or list it in MAY_SEE_DELETED with why.`
    )
    assert.ok(
      count <= allowed.reads,
      `${file} has ${count} unfiltered projects reads; ${allowed.reads} are listed.`
    )
  }
})

test('the allow-list holds no stale rows', () => {
  for (const file of Object.keys(MAY_SEE_DELETED)) {
    const source = readFileSync(join(WEB, file), 'utf8')
    const reads = [...source.matchAll(FROM_PROJECTS)].filter((m) => {
      const chain = chainAt(source, m.index ?? 0)
      return !WRITE.test(chain) && !chain.includes('deleted_at')
    })
    assert.ok(reads.length > 0, `${file} no longer reads projects unfiltered — drop its MAY_SEE_DELETED row.`)
  }
})
