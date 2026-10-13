import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { test } from 'node:test'
import { createScenarioOwnershipHandler, SCENARIO_OWNERSHIP_PATH } from './scenario-ownership.ts'

// The engine's side (apps/web/lib/scenario-target-proof.ts), restated with node:crypto so the two are pinned to one
// contract: key = sha256(token) as hex, message = `golden-frijoles-target-<kind>-v2\n<challenge>\n<key>\n<origin>`.
const TOKEN = `gf_target_${'ab'.repeat(32)}`
const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex')
const CHALLENGE = 'c'.repeat(64)
const TARGET = { targetKey: 'site.probe', origin: 'https://app.example.com' }
const sign = (kind: 'request' | 'response', challenge = CHALLENGE, key = TOKEN_HASH) =>
  createHmac('sha256', key)
    .update(`golden-frijoles-target-${kind}-v2\n${challenge}\n${TARGET.targetKey}\n${TARGET.origin}`)
    .digest('hex')

function check(overrides: { signature?: string; body?: unknown; method?: string; path?: string } = {}) {
  return new Request(`https://app.example.com${overrides.path ?? SCENARIO_OWNERSHIP_PATH}`, {
    method: overrides.method ?? 'POST',
    headers: { 'x-golden-beans-ownership-request': overrides.signature ?? sign('request') },
    body:
      (overrides.method ?? 'POST') === 'POST'
        ? JSON.stringify(overrides.body ?? { contractVersion: 2, challenge: CHALLENGE, ...TARGET })
        : undefined,
  })
}

test('answers a check signed by its token with the proof the engine expects', async () => {
  const answer = createScenarioOwnershipHandler({ token: TOKEN })
  const response = await answer(check())
  assert.equal(response?.status, 204)
  assert.equal(response?.headers.get('x-golden-beans-ownership-proof'), sign('response'))
})

test('pins the engine vector: the proof is the HMAC of the response line keyed by the token hash', async () => {
  // Same inputs as scenario-target-proof.test.ts's owner-token vector.
  assert.equal(TOKEN_HASH, createHash('sha256').update(TOKEN).digest('hex'))
  const response = await createScenarioOwnershipHandler({ token: TOKEN })(check())
  assert.match(response?.headers.get('x-golden-beans-ownership-proof') ?? '', /^[0-9a-f]{64}$/)
})

test('ignores every other path, so it can sit in front of other routes', async () => {
  const answer = createScenarioOwnershipHandler({ token: TOKEN })
  assert.equal(await answer(check({ path: '/api/other' })), null)
})

test('a check not signed by this token, or malformed, is a plain 404 with no proof', async () => {
  const answer = createScenarioOwnershipHandler({ token: TOKEN })
  const other = createHash('sha256').update(`gf_target_${'cd'.repeat(32)}`).digest('hex')
  for (const request of [
    check({ signature: sign('request', CHALLENGE, other) }),
    check({ signature: 'nope' }),
    check({ body: { contractVersion: 1, challenge: CHALLENGE, ...TARGET } }),
    check({ body: { contractVersion: 2, challenge: 'short', ...TARGET } }),
    check({ body: { contractVersion: 2, challenge: CHALLENGE, targetKey: 'site.probe', origin: 'http://app.example.com' } }),
    check({ method: 'GET' }),
  ]) {
    const response = await answer(request)
    assert.equal(response?.status, 404)
    assert.equal(response?.headers.get('x-golden-beans-ownership-proof'), null)
  }
})

test('refuses to start without a gf_target_ token', () => {
  assert.throws(() => createScenarioOwnershipHandler({ token: 'secret' }), /gf_target_/)
})
