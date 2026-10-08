import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deprecatedNameNotice, REMOVE_GF_BY } from './invoked-as.ts'

test('started as gf: one notice naming frijoles and the removal date', () => {
  for (const path of ['/usr/local/bin/gf', 'gf', '/x/node_modules/.bin/gf']) {
    const notice = deprecatedNameNotice(path)
    assert.ok(notice, path)
    assert.match(notice, /gf is now frijoles/)
    assert.ok(notice.includes(REMOVE_GF_BY))
    assert.ok(notice.endsWith('\n'))
  }
})

// Windows is a stated gap, not a case: npm's shims start the entry file, so argv[1] never ends in `gf` there.
test('started as frijoles, through the built entry (also how every Windows shim starts it), or with no path: no notice', () => {
  for (const path of [
    '/usr/local/bin/frijoles',
    '/x/dist/bin.js',
    'C:\\npm\\node_modules\\@golden-frijoles\\cli\\dist\\bin.js',
    undefined,
    '',
    '/x/gfx',
    '/x/gf-kit',
  ]) {
    assert.equal(deprecatedNameNotice(path), null, String(path))
  }
})
