import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LOADER_PHRASES, pickLoaderPhraseIndex } from './loader-phrases.ts'

test('the loader ships the complete approved phrase pack without duplicates', () => {
  assert.equal(LOADER_PHRASES.length, 20)
  assert.equal(new Set(LOADER_PHRASES).size, LOADER_PHRASES.length)
  for (const phrase of LOADER_PHRASES) assert.ok(phrase.endsWith('…'), phrase)
  assert.ok(LOADER_PHRASES.includes('Fee-fi-fo-fumbling…'))
  assert.ok(LOADER_PHRASES.includes('North-Star-gazing…'))
  assert.ok(LOADER_PHRASES.includes('Spilling the beans…'))
})

test('the first phrase is random, not always the first one', () => {
  assert.equal(pickLoaderPhraseIndex(null, () => 0), 0)
  assert.equal(pickLoaderPhraseIndex(null, () => 0.5), 10)
  assert.equal(pickLoaderPhraseIndex(null, () => 0.999999), LOADER_PHRASES.length - 1)
})

test('two navigations in a row never open on the same phrase, and every other phrase stays reachable', () => {
  for (let previous = 0; previous < LOADER_PHRASES.length; previous++) {
    const seen = new Set<number>()
    for (let step = 0; step < LOADER_PHRASES.length - 1; step++) {
      const index = pickLoaderPhraseIndex(previous, () => step / (LOADER_PHRASES.length - 1))
      assert.notEqual(index, previous)
      assert.ok(index >= 0 && index < LOADER_PHRASES.length)
      seen.add(index)
    }
    assert.equal(seen.size, LOADER_PHRASES.length - 1)
  }
})

test('an out-of-range previous index is treated as no previous phrase', () => {
  assert.equal(pickLoaderPhraseIndex(-1, () => 0), 0)
  assert.equal(pickLoaderPhraseIndex(LOADER_PHRASES.length, () => 0), 0)
})
