import { test } from 'node:test'
import assert from 'node:assert/strict'

// The build script is untyped .mjs; a variable specifier keeps tsc out of it, and the test reads one function.
const script = '../scripts/build-dual.mjs'
const { withExtension } = (await import(script)) as {
  withExtension: (specifier: string, exists: (path: string) => boolean) => string
}

test('relative specifiers get the .js Node ESM needs; packages and explicit extensions are left alone', () => {
  const has = (set: string[]) => (p: string) => set.includes(p)
  assert.equal(withExtension('./flags', has(['./flags.js'])), './flags.js')
  assert.equal(withExtension('./lib', has(['./lib/index.js'])), './lib/index.js')
  assert.equal(withExtension('node:fs', has([])), 'node:fs')
  assert.equal(withExtension('./already.js', has([])), './already.js')
  assert.equal(withExtension('./missing', has([])), './missing')
})
