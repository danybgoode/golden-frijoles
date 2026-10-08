import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HIDDEN_ON_PUBLIC_CONNECTOR as H,
  scrubForPublicReader,
  scrubToolText,
} from './public-connector-scrub.ts'

const uid = '083dc850-a99d-49d1-a06c-0e7b1d3d4eb0'

test('every person field is hidden, at any depth, in any tool shape seen so far', () => {
  const reply = {
    ok: true,
    flag: {
      key: 'a.b',
      audit: [{ action: 'activate', actor: uid }],
      versions: [{ definition: { rules: [{ userId: uid }] } }],
    },
    decisions: [{ verdict: 'ship', actorUserId: uid }],
    tasks: [{ id: 't', claimedBy: uid, created_by: uid }],
  }
  const out = JSON.stringify(scrubForPublicReader(reply))
  assert.ok(!out.includes(uid), out)
  assert.deepEqual(scrubForPublicReader(reply), {
    ok: true,
    flag: { key: 'a.b', audit: [{ action: 'activate', actor: H }], versions: [{ definition: { rules: H } }] },
    decisions: [{ verdict: 'ship', actorUserId: H }],
    tasks: [{ id: 't', claimedBy: H, created_by: H }],
  })
})

test('a journey drilldown page keeps its shape but names nobody — ids and the cursor that encodes one (round 3)', () => {
  const page = {
    ok: true,
    drilldown: { subjectIds: [uid, 'visitor-1'], nextCursor: 'v1.abc.MDgzZGM4NTA' },
    count: 2,
  }
  assert.deepEqual(scrubForPublicReader(page), {
    ok: true,
    drilldown: { subjectIds: H, nextCursor: H },
    count: 2,
  })
})

test('an empty rules list names nobody, so it is left as a list', () => {
  assert.deepEqual(scrubForPublicReader({ definition: { rules: [] } }), { definition: { rules: [] } })
})

test('everything else, including a null person field, is left exactly as it was', () => {
  const reply = {
    ok: true,
    value: 3,
    flags: [{ key: 'x', serving: false }],
    claimedBy: null,
    nextCursor: null,
    id: uid,
  }
  assert.deepEqual(scrubForPublicReader(reply), reply)
})

test('text that is not JSON is returned untouched', () => {
  assert.equal(scrubToolText('not json'), 'not json')
  assert.equal(scrubToolText(JSON.stringify({ actor: uid })), JSON.stringify({ actor: H }))
})
