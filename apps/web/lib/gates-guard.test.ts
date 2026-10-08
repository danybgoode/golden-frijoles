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

const GATE_CALL = /\b(is[A-Z]\w*Enabled|isExperimentBuilderWritable)\(\)/g

test('every gate call is awaited', () => {
  const gates = new Set(
    [...readFileSync(join(WEB, 'lib/flags.ts'), 'utf8').matchAll(/export (?:async )?function (\w+)\(/g)]
      .map((match) => match[1])
      .concat('isTerminalSignInEnabled')
  )
  assert.ok(gates.size >= 23, `found only ${gates.size} gate functions — the scan is wrong`)
  const unawaited = files().flatMap((file) => {
    const source = code(readFileSync(file, 'utf8'))
    return [...source.matchAll(GATE_CALL)]
      .filter((match) => gates.has(match[1]))
      .filter((match) => !/await\s+$/.test(source.slice(Math.max(0, match.index - 12), match.index)))
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
