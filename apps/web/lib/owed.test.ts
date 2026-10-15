import { test } from 'node:test'
import assert from 'node:assert/strict'
import { owedForViewer } from './owed.ts'
import { withoutOwed, OWED_PAYLOAD_KEYS } from './report-artifact-row.ts'

// owed-on-screen D5/D7 — the authorization boundary, asserted directly (lib/owed.ts has no imports so this can).

const owed = [
  {
    epic: 'an-epic',
    text: 'The _Intent_ answer',
    kind: 'judgment',
    category: 'other',
    file: 'Roadmap/x/an-epic/RETROSPECTIVE.md',
    line: 4,
  },
  {
    epic: null,
    text: 'A smoke',
    kind: 'signed-in',
    category: 'auth-path',
    file: 'apps/web/e2e/x.spec.ts',
    line: 1,
  },
]
const payload = () => ({
  items: [{ slug: 'an-epic', grain: 'Epic', owed: ['a row-level copy a hand-written push sent'] }],
  horizon: [{ id: 'h', title: 'H', description: 'D' }],
  owed,
  owed_unattached: ['the seed name'],
})

test('withoutOwed: drops every owed key, top level and on rows, and keeps everything else', () => {
  const out = withoutOwed(payload()) as Record<string, unknown>
  for (const k of OWED_PAYLOAD_KEYS) assert.equal(k in out, false, `${k} survived`)
  const rows = out.items as Array<Record<string, unknown>>
  assert.equal('owed' in rows[0], false)
  assert.equal(rows[0].slug, 'an-epic')
  assert.deepEqual(out.horizon, payload().horizon)
  // Nothing owed-shaped anywhere in what a public page could serialize.
  assert.doesNotMatch(JSON.stringify(out), /owed|Intent/)
})

test('withoutOwed: never mutates its input, and passes non-objects through', () => {
  const p = payload()
  withoutOwed(p)
  assert.equal(p.owed, owed)
  assert.equal(withoutOwed(null), null)
  assert.equal(withoutOwed('x'), 'x')
  assert.deepEqual(withoutOwed([1]), [1])
})

test('owedForViewer: a member gets the rows', () => {
  assert.deepEqual(owedForViewer(payload(), true), owed)
})

test('owedForViewer: anyone else gets [] — and the same [] whatever the project holds', () => {
  assert.deepEqual(owedForViewer(payload(), false), [])
  assert.deepEqual(owedForViewer({ items: [] }, false), [])
  assert.deepEqual(owedForViewer(null, false), [])
})

test('owedForViewer: a member of a project that keeps no ledger gets null, not a zero', () => {
  assert.equal(owedForViewer({ items: [] }, true), null)
  assert.equal(owedForViewer(null, true), null)
  assert.deepEqual(owedForViewer({ items: [], owed: [] }, true), [])
})

test('owedForViewer: a malformed row is dropped, never rendered', () => {
  const rows = owedForViewer({ owed: [owed[0], { text: 1 }, null, 'x'] }, true)
  assert.deepEqual(rows, [owed[0]])
})
