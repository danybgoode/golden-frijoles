// sdk-1-0 — the client's 1.0 additions, against an injected fetch (no network).
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

const { createGrowthEngineClient, DEFAULT_BASE_URL } = await import('./index.ts')

type Call = { url: string; init: RequestInit }
function recorder(body: unknown = { ok: true, id: 'evt_1' }, status = 200) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

test('S1.1: with no baseUrl key the client talks to goldenfrijoles.com', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  assert.deepEqual(await growth.track('signup'), { ok: true, id: 'evt_1' })
  assert.equal(calls[0].url, `${DEFAULT_BASE_URL}/api/v1/track`)
  await growth.syncFeatures([{ key: 'f', enabled: true }])
  assert.equal(calls[1].url, `${DEFAULT_BASE_URL}/api/v1/features/sync`)
})

test('S1.1: a given baseUrl wins, without a trailing slash', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ baseUrl: 'http://localhost:3000/', apiKey: 'k', userId: 'u1', fetchImpl })
  await growth.track('signup')
  assert.equal(calls[0].url, 'http://localhost:3000/api/v1/track')
})

test('S1.1: a baseUrl key present but empty (an unset env var) fails without a request, never defaults', async () => {
  for (const baseUrl of [undefined, '']) {
    const { calls, fetchImpl } = recorder()
    const growth = createGrowthEngineClient({ baseUrl, apiKey: 'k', userId: 'u1', fetchImpl })
    const result = await growth.track('signup')
    assert.equal(result.ok, false)
    assert.equal(!result.ok && result.code, 'MISSING_BASE_URL')
    assert.equal((await growth.syncFeatures([{ key: 'f', enabled: true }])).ok, false)
    assert.equal(calls.length, 0, 'nothing reached any URL, production least of all')
  }
})

test('S1.2: identify sets who future events are about; reset forgets; no user means NO_USER and no request', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', fetchImpl })

  const anon = await growth.track('page_view')
  assert.equal(!anon.ok && anon.code, 'NO_USER')
  assert.equal((await growth.trackAdoption('f')).ok, false)
  assert.equal((await growth.captureError(new Error('x'))).ok, false)
  assert.equal(calls.length, 0, 'no event without a person')

  assert.deepEqual(growth.identify('user_42'), { ok: true })
  await growth.track('signup')
  assert.equal(JSON.parse(String(calls[0].init.body)).userId, 'user_42')

  growth.reset()
  const after = await growth.track('page_view')
  assert.equal(!after.ok && after.code, 'NO_USER')
  assert.equal(calls.length, 1)
})

test('S1.2: identify refuses an empty id and keeps the current one', async () => {
  const { calls, fetchImpl } = recorder()
  const growth = createGrowthEngineClient({ apiKey: 'k', userId: 'u1', fetchImpl })
  for (const bad of ['', '   ', undefined as unknown as string]) {
    const r = growth.identify(bad)
    assert.equal(!r.ok && r.code, 'INVALID_USER_ID')
  }
  await growth.track('x')
  assert.equal(JSON.parse(String(calls[0].init.body)).userId, 'u1')
})

test('S1.2: bucket follows the current id; with no user an ungoverned bucket returns NO_USER', () => {
  const growth = createGrowthEngineClient({ apiKey: 'k', fetchImpl: recorder().fetchImpl })
  const variants = [{ key: 'a', weight: 50 }, { key: 'b', weight: 50 }]
  const none = growth.bucket('exp', variants)
  assert.equal(!none.ok && none.code, 'NO_USER')
  growth.identify('user_1')
  const first = growth.bucket('exp', variants)
  const again = growth.bucket('exp', variants)
  assert.ok(first.ok)
  assert.deepEqual(first, again, 'deterministic for the same person')
})

test('S1.2: two clients never share identity (state is per instance)', async () => {
  const a = recorder()
  const b = recorder()
  const one = createGrowthEngineClient({ apiKey: 'k', fetchImpl: a.fetchImpl })
  const two = createGrowthEngineClient({ apiKey: 'k', userId: 'u2', fetchImpl: b.fetchImpl })
  one.identify('u1')
  await one.track('e')
  await two.track('e')
  assert.equal(JSON.parse(String(a.calls[0].init.body)).userId, 'u1')
  assert.equal(JSON.parse(String(b.calls[0].init.body)).userId, 'u2')
})
