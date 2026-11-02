// off-vercel-hosting D4 — production is decided in ONE place, lib/deploy-env.ts. A new `process.env.VERCEL_ENV`
// read is how the app went quietly non-production the day it left Vercel (every reader took the dev branch), so CI
// refuses one. `lib/site-url.ts` only FORWARDS the narrowed env to `resolveSiteUrl`, which decides through the seam.

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
  for (const file of ['middleware.ts', 'proxy.ts']) {
    try {
      if (statSync(join(WEB, file)).isFile()) out.push(join(WEB, file))
    } catch {
      // absent: nothing to scan
    }
  }
  return out
}

const rel = (file: string) => file.slice(WEB.length + 1)
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const ALLOWED = new Set(['lib/deploy-env.ts', 'lib/site-url.ts'])
const READ = /\.(VERCEL_ENV|VERCEL)\b(?!_)|\[['"](VERCEL_ENV|VERCEL)['"]\]/g

test('no deployment decision reads VERCEL_ENV / VERCEL outside lib/deploy-env.ts', () => {
  const found = files()
    .filter((file) => !ALLOWED.has(rel(file)))
    .flatMap((file) =>
      [...code(readFileSync(file, 'utf8')).matchAll(READ)].map((m) => `${rel(file)}: ${m[0]}`)
    )
  assert.deepEqual(
    found,
    [],
    'decide through deployEnv() / isDeployed() in lib/deploy-env.ts (off-vercel-hosting D4)'
  )
})

test('the guard sees what it guards (mutation check)', () => {
  const sample = code(
    "const a = process.env.VERCEL_ENV\nconst b = env['VERCEL']\n// env.VERCEL_ENV in a comment\nenv.VERCEL_URL"
  )
  assert.deepEqual(
    [...sample.matchAll(READ)].map((m) => m[0]),
    ['.VERCEL_ENV', "['VERCEL']"]
  )
})
