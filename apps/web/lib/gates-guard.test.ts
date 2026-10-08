// one-product-project · Sprint 2, Story 2.3 — two ways back to an env-var gate, both closed in CI.
//
// 1. A new `process.env.<X>_ENABLED` read. Gates live in the `golden-frijoles` catalog and are read through ONE seam,
//    lib/gates.ts; a gate in an env var is invisible in the console, has no history and needs a redeploy to change.
// 2. A gate call that is not awaited. Every gate is async, so `if (!isXEnabled())` tests a Promise — always truthy,
//    so the gate is silently ALWAYS OPEN. TypeScript catches it in an `if`, but not in `&&`, a ternary, a prop or an
//    object field.

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
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

// Settings that are not product gates, each with its reason. Adding one is a decision, made here in review.
const NOT_A_GATE: Record<string, string> = {
  // The task-alert notification rail's setting, read by scripts' env, not a product surface.
  'lib/notify-policy.ts': 'TASK_ALERTS_ENABLED',
}

test('no *_ENABLED env read outside the seam', () => {
  const found = files().flatMap((file) =>
    [
      ...code(readFileSync(file, 'utf8')).matchAll(
        /\benv\.([A-Z0-9_]+_ENABLED)\b|\benv\[['"]([A-Z0-9_]+_ENABLED)['"]\]/g
      ),
    ]
      .map((match) => [rel(file), match[1] ?? match[2]] as const)
      .filter(([path, name]) => !path.startsWith('lib/gates') && NOT_A_GATE[path] !== name)
  )
  assert.deepEqual(found, [], 'a gate belongs in the catalog: add it to lib/gates-decision.ts → GATES')
})

// Any call that LOOKS like a gate, direct or through a field — `isXEnabled()`, `deps.builderEnabled()`,
// `isExperimentBuilderWritable()`. The first version matched only literal `isX()` calls and missed a gate passed as
// a dependency and called through `deps.` (fresh review of #319: the rollout command's kill switch never closed).
//
// What it cannot see (round 2), none of which exists today: an alias not ending in Enabled/Writable
// (`const on = deps.builderEnabled; on()`), bracket access, an optional call `x?.()`, an aliased import. Write a gate
// call plainly. The four async helpers whose names are not gate-shaped are matched by name in the pattern below.
const GATE_SHAPED_CALL =
  /((?:[A-Za-z_$][\w$]*\.)*)([A-Za-z_$][\w$]*(?:Enabled|Writable)|requireGate|closedGate|capabilities|readGates)\(\)/g

// Gate-shaped names that are genuinely synchronous, each with its reason.
const SYNC: Record<string, string> = {
  isTaskAlertEnabled:
    'lib/notify-policy.ts — a notification setting read from an env object passed in, not a gate',
}

test('every gate-shaped call is awaited, direct or through a dependency field', () => {
  const unawaited = files().flatMap((file) => {
    const source = code(readFileSync(file, 'utf8'))
    return [...source.matchAll(GATE_SHAPED_CALL)]
      .filter((match) => !(match[2] in SYNC))
      .filter((match) => !/await\s*\(?\s*$/.test(source.slice(Math.max(0, match.index - 12), match.index)))
      .filter((match) => !/function\s+$/.test(source.slice(Math.max(0, match.index - 20), match.index)))
      .map((match) => `${rel(file)}: ${match[0]}`)
  })
  assert.deepEqual(unawaited, [])
})

// Carried over from account-from-the-terminal's seam test, for every gate: a second reader of a key is a second place
// for the rule to drift. Only the table names a gate's catalog key.
test('only lib/gates-decision.ts names a gate key', async () => {
  const { GATES } = await import('./gates-decision.ts')
  const keys = Object.values(GATES).map((gate) => gate.key)
  const readers = files().flatMap((file) => {
    const source = code(readFileSync(file, 'utf8'))
    return keys.filter((key) => source.includes(`'${key}'`)).map((key) => `${rel(file)}: ${key}`)
  })
  assert.deepEqual(
    readers.filter((line) => !line.startsWith('lib/gates-decision.ts')),
    []
  )
})
