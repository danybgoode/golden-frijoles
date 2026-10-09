import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_BASE_URL, resolveBaseUrl } from './defaults.ts'

test('no baseUrl key: the default', () => {
  assert.equal(resolveBaseUrl({ apiKey: 'k' }), DEFAULT_BASE_URL)
  assert.equal(DEFAULT_BASE_URL, 'https://goldenfrijoles.com')
})

test('a given baseUrl wins, trimmed and without trailing slashes', () => {
  assert.equal(resolveBaseUrl({ baseUrl: 'http://localhost:3000/' }), 'http://localhost:3000')
  assert.equal(resolveBaseUrl({ baseUrl: ' https://x.example// ' }), 'https://x.example')
})

test('a baseUrl key that is present but unusable is NOT defaulted (an unset env var must not reach production)', () => {
  for (const baseUrl of [undefined, '', '   ', null, 42]) {
    assert.equal(resolveBaseUrl({ baseUrl }), undefined, String(baseUrl))
  }
})
