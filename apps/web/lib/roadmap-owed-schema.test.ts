import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OWED_CATEGORIES,
  OWED_KINDS,
  OWED_MAX,
  OWED_MAX_PER_EPIC,
  parseRoadmapPush,
  ROADMAP_SCHEMA_VERSION,
} from './roadmap-artifact-schema.ts'

// owed-on-screen D4 — the push's owed block: optional, bounded, and refused with the field named.

const epic = { name: 'An epic', slug: 'an-epic', grain: 'Epic', status: 'Shipped', area: '02' }
const check = (over: Record<string, unknown> = {}) => ({
  epic: 'an-epic',
  text: 'The _Intent_ answer',
  kind: 'judgment',
  category: 'other',
  file: 'Roadmap/02-commercial/an-epic/RETROSPECTIVE.md',
  line: 4,
  ...over,
})
const push = (over: Record<string, unknown> = {}) => ({
  schemaVersion: ROADMAP_SCHEMA_VERSION,
  generatedAt: '2026-10-15T00:00:00.000Z',
  items: [epic],
  ...over,
})
const messages = (r: ReturnType<typeof parseRoadmapPush>) => {
  if (r.ok) return ''
  const issues = r.issues as { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | undefined
  return [...(issues?.formErrors ?? []), ...Object.values(issues?.fieldErrors ?? {}).flat()].join('\n')
}

test('a push with owed parses and keeps it; without owed (an older pusher) still parses', () => {
  const r = parseRoadmapPush(push({ owed: [check(), check({ epic: null, file: 'apps/web/e2e/x.spec.ts' })] }))
  assert.ok(r.ok)
  assert.equal(r.ok && r.value.owed?.length, 2)
  assert.ok(parseRoadmapPush(push()).ok)
  assert.ok(parseRoadmapPush(push({ owed: null })).ok)
  assert.ok(parseRoadmapPush(push({ owed: [] })).ok)
})

test('an unknown kind or category is a 400 naming the field', () => {
  assert.match(
    messages(parseRoadmapPush(push({ owed: [check({ kind: 'whenever' })] }))),
    /owed kind must be one of/
  )
  assert.match(
    messages(parseRoadmapPush(push({ owed: [check({ category: 'x' })] }))),
    /owed category must be one of/
  )
})

test('over the total cap, or over the per-epic cap, is a 400 naming owed', () => {
  const many = Array.from({ length: OWED_MAX + 1 }, () => check({ epic: null }))
  assert.match(messages(parseRoadmapPush(push({ owed: many }))), /owed carries at most/)
  const oneEpic = Array.from({ length: OWED_MAX_PER_EPIC + 1 }, () => check())
  assert.match(
    messages(parseRoadmapPush(push({ owed: oneEpic }))),
    /owed carries \d+ checks for epic "an-epic"/
  )
  assert.ok(parseRoadmapPush(push({ owed: oneEpic.slice(1) })).ok)
})

test('an owed check naming an epic the push does not carry is refused', () => {
  assert.match(
    messages(parseRoadmapPush(push({ owed: [check({ epic: 'elsewhere' })] }))),
    /owed names epic "elsewhere"/
  )
})

test('a file that climbs out of the repo, carries a scheme, or a bad line is refused', () => {
  for (const file of ['../etc/passwd', 'Roadmap/../../x.md', 'javascript:alert(1)', '/abs/path.md'])
    assert.equal(parseRoadmapPush(push({ owed: [check({ file })] })).ok, false, file)
  for (const line of [0, -1, 1.5]) assert.equal(parseRoadmapPush(push({ owed: [check({ line })] })).ok, false)
  assert.equal(parseRoadmapPush(push({ owed: [check({ text: 'x'.repeat(501) })] })).ok, false)
})

test('OWED_KINDS and OWED_CATEGORIES are the ledger’s own lists (scripts/owed-ledger.mjs)', () => {
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../../scripts/owed-ledger.mjs'),
    'utf8'
  )
  const list = (name: string) => {
    const m = new RegExp(`export const ${name} = \\[([^\\]]*)\\]`).exec(src)
    assert.ok(m, `${name} not found in scripts/owed-ledger.mjs`)
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  }
  assert.deepEqual([...OWED_KINDS], list('KINDS'))
  assert.deepEqual([...OWED_CATEGORIES], list('CATEGORIES'))
})

test('the producer\u2019s bounds are the schema\u2019s (scripts/owed-ledger.mjs conformOwedForPush)', () => {
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../../scripts/owed-ledger.mjs'),
    'utf8'
  )
  const num = (name: string) => Number(new RegExp(`export const ${name} = (\\d+);`).exec(src)?.[1])
  assert.equal(num('OWED_PUSH_MAX'), OWED_MAX)
  assert.equal(num('OWED_PUSH_MAX_PER_EPIC'), OWED_MAX_PER_EPIC)
  assert.equal(num('OWED_PUSH_TEXT_MAX'), 500)
  assert.ok(
    src.includes('export const OWED_PUSH_FILE_RE = /^[A-Za-z0-9_][A-Za-z0-9_./-]*$/;'),
    'file pattern drifted'
  )
  const schema = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'roadmap-artifact-schema.ts'),
    'utf8'
  )
  assert.ok(
    schema.includes(".regex(/^[A-Za-z0-9_][A-Za-z0-9_./-]*$/, 'owed file must be a repo-relative path')")
  )
})
