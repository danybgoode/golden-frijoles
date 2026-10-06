// account-from-the-terminal · Sprint 3, Story 3.1 — the maker rule (epic D11).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { makerMayWrite, makerToStamp } from './connector-maker.ts'

const base = {
  createdBy: 'user-1',
  projectSlug: 'acme',
  demoProjectSlug: 'golden-beans-demo',
  connectorWritesEnabled: true,
  cliWritesEnabled: true,
}

test('a URL with a maker, outside the demo, with both write switches on, may write (pending the owner check)', () => {
  assert.equal(makerMayWrite(base), true)
})

test('each condition alone turns it read-only', () => {
  assert.equal(makerMayWrite({ ...base, createdBy: null }), false, 'a URL from before this sprint')
  assert.equal(makerMayWrite({ ...base, projectSlug: 'golden-beans-demo' }), false, 'the public demo URL')
  assert.equal(makerMayWrite({ ...base, connectorWritesEnabled: false }), false)
  assert.equal(makerMayWrite({ ...base, cliWritesEnabled: false }), false)
})

test('the mint never stamps a maker on the demo project', () => {
  assert.equal(makerToStamp('golden-beans-demo', 'golden-beans-demo', 'user-1'), null)
  assert.equal(makerToStamp('acme', 'golden-beans-demo', 'user-1'), 'user-1')
})

// The dark side, pinned STRUCTURALLY (fresh reviewer, PR #282): CI's lit server now matches production
// (CONNECTOR_WRITES_ENABLED=true) and its OFF server turns the whole connector off, so "connector on,
// writes off" exists on neither — the LEARNINGS rule for a gate the test server can't turn off.
test('the route feeds BOTH write gates into the maker rule, and task writes stay behind their own gate', () => {
  const route = readFileSync(new URL('../app/api/v1/public/mcp/c/[token]/route.ts', import.meta.url), 'utf8')
  assert.match(route, /connectorWritesEnabled: isConnectorWritesEnabled\(\)/)
  assert.match(route, /cliWritesEnabled: isCliWriteApiEnabled\(\)/)
  assert.match(route, /if \(!makerMayWrite\(facts\)\) return null/)
  assert.match(route, /if \(isConnectorWriteToolEnabled\(\) && writeKeyId\)/)
})
