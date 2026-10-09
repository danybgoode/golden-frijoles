// sdk-1-0 S2.1 / D5 — both halves of the build load, through the package's own `exports` map.
//
// A file inside a package may import that package by name ("self-reference"), which resolves through `exports` exactly
// as a consumer would: `import` picks dist/esm, `require` picks dist/cjs. The unit gate builds the SDK first
// (`npm run test:unit` runs the workspace build), so dist/ exists here.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

function fakeFetch(seen: string[]) {
  return (async (url: string) => {
    seen.push(url)
    return new Response(JSON.stringify({ ok: true, id: 'evt' }), { status: 200 })
  }) as unknown as typeof fetch
}

test('every path the manifest points at exists after the build', () => {
  const targets = [
    manifest.main,
    manifest.types,
    manifest.exports['.'].import.default,
    manifest.exports['.'].import.types,
    manifest.exports['.'].require.default,
    manifest.exports['.'].require.types,
  ]
  for (const target of targets) assert.ok(existsSync(join(ROOT, target)), target)
  assert.equal(JSON.parse(readFileSync(join(ROOT, 'dist/esm/package.json'), 'utf8')).type, 'module')
  assert.equal(JSON.parse(readFileSync(join(ROOT, 'dist/cjs/package.json'), 'utf8')).type, 'commonjs')
})

test('import resolves to the ESM build and works', async () => {
  const sdk = await import('@golden-frijoles/sdk')
  const seen: string[] = []
  const growth = sdk.createGrowthEngineClient({ apiKey: 'k', fetchImpl: fakeFetch(seen) })
  growth.identify('u1')
  assert.equal((await growth.track('e')).ok, true)
  assert.equal(seen[0], `${sdk.DEFAULT_BASE_URL}/api/v1/track`)
  assert.match(String(import.meta.resolve?.('@golden-frijoles/sdk') ?? ''), /dist\/esm\/index\.js$/)
})

test('require resolves to the CommonJS build and works', async () => {
  const require = createRequire(join(ROOT, 'package.json'))
  assert.match(require.resolve('@golden-frijoles/sdk'), /dist\/cjs\/index\.js$/)
  const sdk = require('@golden-frijoles/sdk')
  const seen: string[] = []
  const growth = sdk.createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl: fakeFetch(seen) })
  assert.equal((await growth.track('e')).ok, true)
  assert.equal(typeof sdk.createFlagProvider, 'function')
})
