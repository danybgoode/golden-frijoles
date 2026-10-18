// satisfied-ask S1.1 — the rating call, against an injected fetch (no network).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

// Production source keeps extensionless imports; map every local one to its .ts for Node's native runner (the
// same seam the other SDK specs use, widened because the client imports most of the package).
type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
const registerHooks = (Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void })
  .registerHooks
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\/[a-z-]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
})

const { createGrowthEngineClient, SATISFACTION_RATED_EVENT, SATISFACTION_DISMISSED_EVENT } =
  await import('./index.ts')
const { satisfactionProblem } = await import('./satisfaction.ts')

type Call = { url: string; init: RequestInit }
function recorder(body: unknown = { ok: true, id: 'evt_1' }, status = 200) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

const sent = (c: Call) => JSON.parse(String(c.init.body))

test('S1.1: a rating sends satisfaction_rated with the flag as the feature and the score in tags', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  assert.deepEqual(await growth.rateSatisfaction('bets.funnel_trend_enabled', 4), { ok: true, id: 'evt_1' })
  assert.deepEqual(sent(calls[0]), {
    userId: 'u1',
    event: 'satisfaction_rated',
    featureId: 'bets.funnel_trend_enabled',
    tags: { score: 4 },
  })
  assert.equal(SATISFACTION_RATED_EVENT, 'satisfaction_rated')
})

test("S1.1: the caller's own tags ride along, but never replace the score", async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  await growth.rateSatisfaction('checkout.v2', 5, { tags: { score: 1, surface: 'modal' } })
  assert.deepEqual(sent(calls[0]).tags, { score: 5, surface: 'modal' })
})

test('S1.1: a score or key the funnel cannot read is refused and nothing is sent', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  for (const [key, score] of [
    ['checkout.v2', 0],
    ['checkout.v2', 6],
    ['checkout.v2', 4.5],
    ['checkout.v2', Number.NaN],
    ['checkout.v2', '4'],
    ['Checkout', 4],
    ['', 4],
  ] as const) {
    const result = await growth.rateSatisfaction(key, score as number)
    assert.equal(result.ok, false, `${key} ${String(score)}`)
    assert.equal(!result.ok && result.code, 'INVALID_SATISFACTION')
  }
  assert.equal(calls.length, 0)
  for (const score of [1, 2, 3, 4, 5]) assert.equal(satisfactionProblem('a', score), null)
})

test('S1.1: a dismissal sends satisfaction_dismissed for the flag, and a bad key is refused', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  await growth.dismissSatisfaction('checkout.v2')
  assert.deepEqual(sent(calls[0]), {
    userId: 'u1',
    event: SATISFACTION_DISMISSED_EVENT,
    featureId: 'checkout.v2',
  })
  const bad = await growth.dismissSatisfaction('NOT A KEY')
  assert.equal(!bad.ok && bad.code, 'INVALID_SATISFACTION')
  assert.equal(calls.length, 1)
})

test('S1.1: with no user yet, a rating returns NO_USER like every other send', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', fetchImpl })
  const result = await growth.rateSatisfaction('checkout.v2', 4)
  assert.equal(!result.ok && result.code, 'NO_USER')
  assert.equal(calls.length, 0)
})
