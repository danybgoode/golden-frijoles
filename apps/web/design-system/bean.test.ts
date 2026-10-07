import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// result-record · Story 2.3 (D11) — gold means "it paid off", so among the Bean's rules gold is spent on proven only,
// and red on disproven only. Read off the stylesheet itself: a colour moved onto the wrong kind turns this red.

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'system.css'), 'utf8')
const beanRules = [...css.matchAll(/([^{}]*\.ds-bean[^{}]*)\{([^}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  body: m[2],
}))

test('the Bean has a rule for each of its four kinds', () => {
  for (const kind of ['proven', 'growing', 'disproven', 'unclear'])
    assert.ok(
      beanRules.some((r) => r.selector.includes(`[data-kind='${kind}']`)),
      kind
    )
})

test('gold only on proven; red only on disproven', () => {
  for (const r of beanRules) {
    if (/var\(--gold/.test(r.body)) assert.match(r.selector, /\[data-kind='proven'\]/, r.selector)
    if (/var\(--red/.test(r.body)) assert.match(r.selector, /\[data-kind='disproven'\]/, r.selector)
  }
  assert.ok(
    beanRules.some((r) => /var\(--gold/.test(r.body)),
    'proven is gold'
  )
})
