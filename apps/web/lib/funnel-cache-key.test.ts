// satisfied-ask (verifier, #403) — the funnel cache key must cover every input computeFunnel reads from the measure. A
// field added to FunnelMeasure but not to the key serves another measure's cached funnel for FLAG_FUNNEL_CACHE_SECONDS
// (satisfiedMinScore shipped that way, caught at review). event-catalog-query.ts is server-only, so this reads both
// sources rather than importing them.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8')

test('funnelCacheKey names every FunnelMeasure field', () => {
  const type = read('./flag-funnel.ts').match(/export type FunnelMeasure = \{([\s\S]*?)\n\}/)
  assert.ok(type, 'FunnelMeasure is declared in flag-funnel.ts')
  const fields = [...type[1].matchAll(/^\s+(\w+)\??:/gm)].map((m) => m[1])
  assert.ok(fields.includes('satisfiedMinScore'), `parsed fields: ${fields.join(', ')}`)
  const key = read('./event-catalog-query.ts').match(/const funnelCacheKey = [\s\S]*?\n\]/)
  assert.ok(key, 'funnelCacheKey is declared in event-catalog-query.ts')
  for (const field of fields)
    assert.match(key[0], new RegExp(`measure\\.${field}\\b`), `the key omits ${field}`)
})
