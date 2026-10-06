// account-from-the-terminal · Sprint 2, Story 2.1 — the kill switch's rule (epic D5).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flagEnvironmentFor, isTerminalSignInOn } from './terminal-sign-in-flag-decision.ts'

const row = (environment: string, serving: unknown, readable = true) => ({ environment, serving, readable })

test('killed ONLY when this environment serves false', () => {
  assert.equal(isTerminalSignInOn([row('production', false)], 'production'), false)
  assert.equal(isTerminalSignInOn([row('production', true)], 'production'), true)
})

test('every other state is the born-ON default', () => {
  assert.equal(isTerminalSignInOn(undefined, 'production'), true, 'no flag at all')
  assert.equal(isTerminalSignInOn([], 'production'), true, 'no environments')
  assert.equal(
    isTerminalSignInOn([row('production', null)], 'production'),
    true,
    'serves nothing: the literal'
  )
  assert.equal(isTerminalSignInOn([row('production', false, false)], 'production'), true, 'unreadable row')
  assert.equal(isTerminalSignInOn([row('production', 'false')], 'production'), true, 'not a boolean')
})

test('one environment killed does not kill another', () => {
  const envs = [row('preview', false), row('production', true)]
  assert.equal(isTerminalSignInOn(envs, 'preview'), false)
  assert.equal(isTerminalSignInOn(envs, 'production'), true)
})

test('VERCEL_ENV maps to the flag environment; anything else is development', () => {
  assert.equal(flagEnvironmentFor('production'), 'production')
  assert.equal(flagEnvironmentFor('preview'), 'preview')
  assert.equal(flagEnvironmentFor(undefined), 'development')
  assert.equal(flagEnvironmentFor('development'), 'development')
})

// The seam is ONE resolver. Every surface the flag gates must call it, and nothing else may read
// the key — a second reader is a second place for the rule to drift.
test('every gated surface calls isTerminalSignInEnabled, and only the seam names the key', () => {
  const webRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..')
  const gated = [
    'app/login/page.tsx',
    'app/signup/page.tsx',
    'app/cli/connect/page.tsx',
    'app/cli/connect/actions.ts',
    'app/api/v1/cli/device/route.ts',
    'app/api/v1/cli/device/token/route.ts',
  ]
  for (const file of gated) {
    assert.match(
      readFileSync(join(webRoot, file), 'utf8'),
      /isTerminalSignInEnabled\(\)/,
      `${file} must call the seam`
    )
  }
  const files: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (['node_modules', '.next', 'e2e'].includes(entry)) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.tsx?$/.test(entry) && !entry.endsWith('.test.ts')) files.push(full)
    }
  }
  for (const dir of ['app', 'lib', 'components']) walk(join(webRoot, dir))
  const readers = files.filter((file) =>
    readFileSync(file, 'utf8').includes("'auth.terminal_sign_in_enabled'")
  )
  assert.deepEqual(
    readers.map((file) => file.slice(webRoot.length + 1)),
    ['lib/terminal-sign-in-flag-decision.ts']
  )
})
