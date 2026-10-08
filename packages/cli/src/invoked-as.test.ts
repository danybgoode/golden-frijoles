import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deprecatedNameNotice, REMOVE_GF_BY } from './invoked-as.ts'

test('started as gf: one notice naming frijoles and the removal date', () => {
  for (const path of ['/usr/local/bin/gf', 'gf', 'C:\\npm\\gf.cmd', '/x/node_modules/.bin/gf']) {
    const notice = deprecatedNameNotice(path)
    assert.ok(notice, path)
    assert.match(notice, /gf is now frijoles/)
    assert.ok(notice.includes(REMOVE_GF_BY))
    assert.ok(notice.endsWith('\n'))
  }
})

test('started as frijoles, through the built entry, or with no path: no notice', () => {
  for (const path of [
    '/usr/local/bin/frijoles',
    '/x/dist/bin.js',
    'frijoles.cmd',
    undefined,
    '',
    '/x/gfx',
    '/x/frijoles-kit',
  ]) {
    assert.equal(deprecatedNameNotice(path), null, String(path))
  }
})
