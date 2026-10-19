// landing-launch-experiment D18 (verifier, #409) — B's stylesheets ship on A's page too (Next bundles a route's CSS
// together), so `.lb` scoping is the ONLY thing standing between B and the control. This makes that a guard: every
// selector in components/landing-b/*.css starts with `.lb`, and no at-rule can escape the scope.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(import.meta.dirname, '..', 'components', 'landing-b')

/** Every selector in a stylesheet, comments stripped, `@media` bodies walked into; other at-rules reported as-is. */
export function selectorsOf(css: string): string[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: string[] = []
  let buf = ''
  for (const ch of src) {
    if (ch === '{') {
      const head = buf.trim()
      buf = ''
      if (head.startsWith('@media') || head.startsWith('@supports')) {
        continue
      }
      for (const sel of head.split(',')) out.push(sel.trim())
      out.push('\u0000open')
    } else if (ch === '}') {
      buf = ''
    } else {
      buf += ch
    }
  }
  return out.filter((s) => s !== '\u0000open' && s.length > 0)
}

test("every selector in B's stylesheets is scoped under .lb (D18)", () => {
  const files = readdirSync(DIR).filter((name) => name.endsWith('.css'))
  assert.ok(files.length >= 4, `expected B's stylesheets, found ${files.join(', ')}`)
  for (const name of files) {
    const css = readFileSync(join(DIR, name), 'utf8')
    for (const at of css.match(/@(?!media|supports)[a-z-]+/g) ?? [])
      assert.fail(`${name}: ${at} cannot be scoped to .lb`)
    for (const selector of selectorsOf(css))
      assert.match(selector, /^\.lb(\s|$|\.|:|\[)/, `${name}: "${selector}" is not under .lb`)
  }
})

test('the parser sees an unscoped selector, inside @media too (the guard can fail)', () => {
  assert.deepEqual(selectorsOf('.lb .a { x: 1 } .b, .lb .c { y: 2 }'), ['.lb .a', '.b', '.lb .c'])
  assert.deepEqual(selectorsOf('@media (max-width: 1px) { .lb .a { x: 1 } .d { y: 2 } }'), ['.lb .a', '.d'])
})
