import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { newlyProvenEpics, workspaceSubject, type VerdictRow } from './proven-transition.ts'

// proving-workspaces-reading D1 + D3.

const epic = (slug: string, verdict: string | null = null): VerdictRow => ({ slug, grain: 'Epic', verdict })

test('unclear → proven is a transition; proven → proven and proven → unclear are not', () => {
  assert.deepEqual(newlyProvenEpics([epic('a', 'unclear')], [epic('a', 'proven')]), ['a'])
  assert.deepEqual(newlyProvenEpics([epic('a', 'proven')], [epic('a', 'proven')]), [])
  assert.deepEqual(newlyProvenEpics([epic('a', 'proven')], [epic('a', 'unclear')]), [])
})

test('a first push (no previous artifact) counts every proven epic; an epic new to the board counts', () => {
  assert.deepEqual(newlyProvenEpics(null, [epic('a', 'proven'), epic('b', 'unclear'), epic('c', 'proven')]), [
    'a',
    'c',
  ])
  assert.deepEqual(newlyProvenEpics([epic('a', 'proven')], [epic('a', 'proven'), epic('b', 'proven')]), ['b'])
})

test('only Epic rows count, matched by slug, once each', () => {
  const sprint: VerdictRow = { slug: 'a--s1', grain: 'Sprint', verdict: 'proven' }
  assert.deepEqual(newlyProvenEpics([], [sprint]), [])
  // A proven SPRINT row of the same slug does not make the epic "already proven".
  assert.deepEqual(
    newlyProvenEpics([{ slug: 'a', grain: 'Sprint', verdict: 'proven' }], [epic('a', 'proven')]),
    ['a']
  )
  assert.deepEqual(newlyProvenEpics([], [epic('a', 'proven'), epic('a', 'proven')]), ['a'])
  assert.deepEqual(newlyProvenEpics([], [epic('a', 'disproven')]), [])
})

test('the subject is HMAC-SHA256 of the workspace id under the secret, and nothing without one', () => {
  const ws = '9e58bc7d-a0a8-43c9-89a2-c544cab854f2'
  const expected = createHmac('sha256', 's3cret').update(ws).digest('hex')
  assert.equal(workspaceSubject(ws, 's3cret'), expected)
  assert.notEqual(workspaceSubject(ws, 'other'), expected)
  assert.ok(!expected.includes(ws.replace(/-/g, '')))
  assert.equal(workspaceSubject(ws, undefined), null)
  assert.equal(workspaceSubject(ws, '   '), null)
  assert.equal(workspaceSubject('', 's3cret'), null)
})
