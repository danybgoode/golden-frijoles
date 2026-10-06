// account-from-the-terminal · Sprint 2, Story 2.2 — the CLI half of browser sign-in (epic D9).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'
import type { CommandContext } from '../command.ts'

// The extensionless-import hook `cli.test.ts` uses: CLI source imports relatives without `.ts`.
type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/packages/cli/src/') &&
      specifier.startsWith('.') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { deviceLogin } = await import('./device-login.ts')

type Reply = { status: number; body: unknown }

/** A context carrying only what `deviceLogin` touches, with a scripted server. */
function harness(replies: Record<string, Reply[]>) {
  const calls: Array<{ path: string; body: unknown }> = []
  const notes: string[] = []
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname
    calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    const queue = replies[path] ?? []
    const reply = queue.length > 1 ? queue.shift()! : queue[0]
    if (!reply) throw new Error(`unexpected ${path}`)
    return new Response(JSON.stringify(reply.body), { status: reply.status })
  }) as typeof fetch
  const context = {
    env: { GOLDEN_FRIJOLES_NO_BROWSER: '1' },
    fetchImpl,
    emit: { note: (text: string) => notes.push(text), json: false },
  } as unknown as CommandContext
  return { context, calls, notes }
}

const START = {
  status: 200,
  body: {
    ok: true,
    deviceCode: 'gf_dev_x',
    userCode: 'KQ7M-3RTX',
    verificationUrl: 'https://site.example/cli/connect?code=KQ7M-3RTX',
    expiresIn: 600,
    interval: 0,
  },
}

test('start → pending → approved hands back the token, and shows the code and the link', async () => {
  const { context, calls, notes } = harness({
    '/api/v1/cli/device': [START],
    '/api/v1/cli/device/token': [
      { status: 200, body: { ok: true, status: 'pending' } },
      { status: 200, body: { ok: true, status: 'approved', token: 'gf_pat_minted' } },
    ],
  })
  const result = await deviceLogin(context, 'https://site.example')
  assert.deepEqual(result, { kind: 'token', token: 'gf_pat_minted' })
  assert.match(notes.join('\n'), /KQ7M-3RTX/)
  assert.match(notes.join('\n'), /https:\/\/site\.example\/cli\/connect\?code=KQ7M-3RTX/)
  // The secret device code travels in the body of every poll, never the URL.
  const polls = calls.filter((call) => call.path === '/api/v1/cli/device/token')
  assert.equal(polls.length, 2)
  for (const poll of polls) assert.deepEqual(poll.body, { deviceCode: 'gf_dev_x' })
})

test('a server without the routes (or with the flag killed) means fall back to the paste prompt', async () => {
  const { context } = harness({
    '/api/v1/cli/device': [
      { status: 404, body: { ok: false, code: 'disabled', error: 'Browser sign-in is not available here.' } },
    ],
  })
  const result = await deviceLogin(context, 'https://site.example')
  assert.equal(result.kind, 'fallback')
})

test('an expired or declined code is refused, with the server’s own sentence', async () => {
  const { context } = harness({
    '/api/v1/cli/device': [START],
    '/api/v1/cli/device/token': [
      {
        status: 404,
        body: {
          ok: false,
          code: 'not_found',
          reason: 'expired',
          error: 'That sign-in code expired. Run `gf login` again.',
        },
      },
    ],
  })
  const result = await deviceLogin(context, 'https://site.example')
  assert.deepEqual(result, {
    kind: 'refused',
    code: 'not_found',
    message: 'That sign-in code expired. Run `gf login` again.',
  })
})

test('slow_down backs the polling off instead of failing', async () => {
  const { context, calls } = harness({
    '/api/v1/cli/device': [{ ...START, body: { ...START.body, interval: 0 } }],
    '/api/v1/cli/device/token': [
      { status: 200, body: { ok: true, status: 'slow_down', interval: 0 } },
      { status: 200, body: { ok: true, status: 'approved', token: 'gf_pat_minted' } },
    ],
  })
  // The back-off adds 5 s, so this test waits once — the price of asserting the real delay.
  const result = await deviceLogin(context, 'https://site.example')
  assert.equal(result.kind, 'token')
  assert.equal(calls.filter((call) => call.path === '/api/v1/cli/device/token').length, 2)
})
