import assert from 'node:assert/strict'
import { test } from '@playwright/test'
import { createScenarioOwnershipHandler } from '../../../packages/sdk/src/scenario-ownership'
import { guardedHttpOwnershipProofPostForTest } from '@/lib/guarded-http'
import { checkOwnerTargetAnswer } from '@/lib/scenario-owner-target-check'
import { createScenarioOwnerToken, hashScenarioOwnerToken } from '@/lib/scenario-target-proof'

// The whole owner-token exchange through the real guarded sender: the engine's signed check reaches an app running the
// SDK handler, and the answer is judged the way verify judges it. Only DNS and the socket are injected.
const PUBLIC_HOST = async () => ['93.184.216.34']
const app = (handler: (request: Request) => Promise<Response | null>): typeof fetch =>
  (async (url: string | URL | Request, init?: RequestInit) =>
    (await handler(new Request(String(url), init))) ?? new Response(null, { status: 404 })) as typeof fetch

function sendTo(fetchImpl: typeof fetch) {
  return (input: Parameters<typeof guardedHttpOwnershipProofPostForTest>[0]) =>
    guardedHttpOwnershipProofPostForTest(input, { resolveHost: PUBLIC_HOST, fetchImpl })
}

const target = (token: string) => ({
  targetKey: 'site.probe',
  origin: 'https://app.example.com',
  tokenHash: hashScenarioOwnerToken(token),
})

test('an app serving the SDK handler with this token passes', async () => {
  const token = createScenarioOwnerToken()
  const result = await checkOwnerTargetAnswer(sendTo(app(createScenarioOwnershipHandler({ token }))), target(token))
  assert.deepEqual(result, { ok: true })
})

test('an app holding another token is a wrong answer, with a reason that says what to fix', async () => {
  const handler = createScenarioOwnershipHandler({ token: createScenarioOwnerToken() })
  const result = await checkOwnerTargetAnswer(sendTo(app(handler)), target(createScenarioOwnerToken()))
  assert.equal(result.ok, false)
  // The stranger's handler 404s an unsigned-by-its-token check, so this is "not answered", never a pass.
  assert.equal(!result.ok && result.reason, 'not_answered')
})

test('a 204 without the right proof is a wrong answer', async () => {
  const liar = (async () => new Response(null, { status: 204, headers: { 'x-golden-beans-ownership-proof': 'a'.repeat(64) } })) as typeof fetch
  const result = await checkOwnerTargetAnswer(sendTo(liar), target(createScenarioOwnerToken()))
  assert.equal(!result.ok && result.reason, 'wrong_answer')
})

test('an app with no handler answers 404: not answered, naming the SDK handler', async () => {
  const none = (async () => new Response(null, { status: 404 })) as typeof fetch
  const result = await checkOwnerTargetAnswer(sendTo(none), target(createScenarioOwnerToken()))
  assert.equal(!result.ok && result.reason, 'not_answered')
  assert.match(!result.ok ? result.detail : '', /createScenarioOwnershipHandler/)
})

test('a private address is never contacted: unreachable', async () => {
  let called = false
  const result = await checkOwnerTargetAnswer(
    (input) =>
      guardedHttpOwnershipProofPostForTest(input, {
        resolveHost: async () => ['10.0.0.5'],
        fetchImpl: (async () => {
          called = true
          return new Response(null, { status: 204 })
        }) as typeof fetch,
      }),
    target(createScenarioOwnerToken())
  )
  assert.equal(!result.ok && result.reason, 'unreachable')
  assert.equal(called, false)
})
