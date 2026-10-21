// landing-launch-experiment · Sprint 6, Story 6.4 — `frijoles experiments`: what each verb SENDS, and what it refuses locally.
// golden-frijoles-cli · Sprint 2 — the write verbs' argument contract and the D2 exit code.
//
// What is asserted HERE is what a caller can express and what exit code they get. What each verb
// MEANS is asserted in `packages/sdk/src/flag-commands.test.ts`, against the planners, because that
// is where the meaning lives (D4). Neither file duplicates the other.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
const registerHooks = (Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void })
  .registerHooks
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/packages/cli/src/') &&
      specifier.startsWith('.') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(
        specifier.endsWith('/commands') ? `${specifier}/index.ts` : `${specifier}.ts`,
        context
      )
    }
    return nextResolve(specifier, context)
  },
})

const { run } = await import('./run.ts')
const { EXIT } = await import('./exit-codes.ts')

const TOKEN = `gf_pat_${'a'.repeat(32)}`

function capture() {
  const out: string[] = []
  const err: string[] = []
  return { writer: { out: (t: string) => out.push(t), err: (t: string) => err.push(t) }, out, err }
}

function sandbox(): NodeJS.ProcessEnv {
  const home = mkdtempSync(join(tmpdir(), 'gf-exp-'))
  return {
    HOME: home,
    XDG_CONFIG_HOME: join(home, '.config'),
    GOLDEN_FRIJOLES_TOKEN: TOKEN,
    GOLDEN_FRIJOLES_PROJECT: 'acme',
  }
}

type Sent = { method: string; url: string; body: Record<string, unknown> }
function stub(body: unknown, sent: Sent[] = [], status = 200): typeof fetch {
  return (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    sent.push({
      method: init?.method ?? 'GET',
      url: url.pathname + url.search,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : {},
    })
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  }) as unknown as typeof fetch
}
const never = (async () => {
  throw new Error('the network was reached')
}) as unknown as typeof fetch

test('create from flags: everyone, 50/50, counted per visitor, until stopped — the builder answers', async () => {
  const sent: Sent[] = []
  const { writer, out } = capture()
  const code = await run({
    argv: [
      'experiments',
      'create',
      '--flag',
      'landing.variant_b_enabled',
      '--metric',
      'start_prompt_copied',
      '--guardrail',
      'signup_started',
      '--guardrail',
      'account_confirmed',
    ],
    writer,
    env: sandbox(),
    fetchImpl: stub({ ok: true, experimentKey: 'landing_b', version: 1, failing: 0, checks: [] }, sent),
  })
  assert.equal(code, EXIT.OK)
  assert.equal(sent[0].url, '/api/v1/cli/experiments')
  assert.deepEqual(sent[0].body, {
    command: 'create',
    project: 'acme',
    answers: {
      template: 'copy',
      flagKey: 'landing.variant_b_enabled',
      why: 'funnel',
      direction: 'increase',
      metric: 'start_prompt_copied',
      guardrails: ['signup_started', 'account_confirmed'],
      breakdowns: [],
      mde: 10,
      who: { mode: 'everyone', conditions: [], allocation: 100 },
      entity: 'visitor',
      versions: ['Current', 'New version'],
      split: 50,
      weeks: 4,
      endsOn: 'open',
    },
  })
  assert.match(out.join(''), /frijoles experiments start landing_b/)
})

test('create: --ends a day, or --weeks, replace "until stopped"; bad values are refused before the network', async () => {
  const sent: Sent[] = []
  await run({
    argv: ['experiments', 'create', '--flag', 'f', '--metric', 'm', '--ends', '2027-01-31'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: stub({ ok: true, experimentKey: 'k', version: 1, failing: 0 }, sent),
  })
  assert.equal((sent[0].body.answers as Record<string, unknown>).endsOn, '2027-01-31')
  const weeks: Sent[] = []
  await run({
    argv: ['experiments', 'create', '--flag', 'f', '--metric', 'm', '--weeks', '3'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: stub({ ok: true, experimentKey: 'k', version: 1, failing: 0 }, weeks),
  })
  assert.equal((weeks[0].body.answers as Record<string, unknown>).weeks, 3)
  assert.equal('endsOn' in (weeks[0].body.answers as Record<string, unknown>), false)
  for (const bad of [
    ['--ends', 'someday'],
    ['--weeks', '12'],
    ['--split', '0'],
  ])
    assert.equal(
      await run({
        argv: ['experiments', 'create', '--flag', 'f', '--metric', 'm', ...bad],
        writer: capture().writer,
        env: sandbox(),
        fetchImpl: never,
      }),
      EXIT.USAGE,
      bad.join(' ')
    )
  assert.equal(
    await run({
      argv: ['experiments', 'create', '--metric', 'm'],
      writer: capture().writer,
      env: sandbox(),
      fetchImpl: never,
    }),
    EXIT.USAGE
  )
})

test('start and stop name the experiment; show reads it', async () => {
  for (const verb of ['start', 'stop'] as const) {
    const sent: Sent[] = []
    const code = await run({
      argv: ['experiments', verb, 'landing_b'],
      writer: capture().writer,
      env: sandbox(),
      fetchImpl: stub({ ok: true, experimentKey: 'landing_b', version: 1 }, sent),
    })
    assert.equal(code, EXIT.OK)
    assert.deepEqual(sent[0].body, { command: verb, project: 'acme', experiment: 'landing_b' })
  }
  const sent: Sent[] = []
  const { writer, out } = capture()
  await run({
    argv: ['experiments', 'show', 'landing_b'],
    writer,
    env: sandbox(),
    fetchImpl: stub(
      {
        ok: true,
        key: 'landing_b',
        version: 1,
        status: 'running',
        readout: {
          answer: 'So far: A 1 of 9, B 3 of 10 — about 84% likely B is really better.',
          chance: 0.84,
          verdict: { title: 'Let it run.', body: '', actions: ['rollout', 'keep', 'stop'] },
        },
      },
      sent
    ),
  })
  assert.equal(sent[0].method, 'GET')
  assert.match(sent[0].url, /experiment=landing_b/)
  assert.match(out.join(''), /about 84% likely B/)
})

test('decide: exactly one outcome and a reason, checked locally; --variant picks the version; --rollout is sent', async () => {
  const sent: Sent[] = []
  const code = await run({
    argv: ['experiments', 'decide', 'landing_b', '--ship', '--reason', 'launch', '--rollout'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: stub(
      {
        ok: true,
        experimentKey: 'landing_b',
        version: 1,
        outcome: 'ship_treatment',
        chosenVariantKey: 'on',
        rollout: { ok: true },
      },
      sent
    ),
  })
  assert.equal(code, EXIT.OK)
  assert.deepEqual(sent[0].body, {
    command: 'decide',
    project: 'acme',
    experiment: 'landing_b',
    outcome: 'ship',
    reason: 'launch',
    rollout: true,
  })
  const named: Sent[] = []
  await run({
    argv: ['experiments', 'decide', 'landing_b', '--ship', '--variant', 'on', '--reason', 'launch'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: stub(
      {
        ok: true,
        experimentKey: 'landing_b',
        version: 1,
        outcome: 'ship_treatment',
        chosenVariantKey: 'on',
        rollout: null,
      },
      named
    ),
  })
  assert.equal(named[0].body.variant, 'on')
  for (const argv of [
    ['experiments', 'decide', 'landing_b', '--keep'],
    ['experiments', 'decide', 'landing_b', '--keep', '--ship', '--reason', 'x'],
    ['experiments', 'decide', 'landing_b', '--reason', 'x'],
  ])
    assert.equal(
      await run({ argv, writer: capture().writer, env: sandbox(), fetchImpl: never }),
      EXIT.USAGE,
      argv.join(' ')
    )
})

test('a failed roll-out after a recorded decision is not exit 0, and --json says it failed', async () => {
  const json = capture()
  const jsonCode = await run({
    argv: ['experiments', 'decide', 'landing_b', '--ship', '--reason', 'launch', '--rollout', '--json'],
    writer: json.writer,
    env: sandbox(),
    fetchImpl: stub({
      ok: true,
      experimentKey: 'landing_b',
      version: 1,
      outcome: 'ship_treatment',
      chosenVariantKey: 'on',
      rollout: { ok: false, error: 'paused' },
    }),
  })
  assert.equal(jsonCode, EXIT.SERVER)
  const doc = JSON.parse(json.out.join('') || json.err.join(''))
  assert.equal(doc.ok, false)
  assert.equal(doc.code, 'rollout_failed')
  const code = await run({
    argv: ['experiments', 'decide', 'landing_b', '--ship', '--reason', 'launch', '--rollout'],
    writer: capture().writer,
    env: sandbox(),
    fetchImpl: stub({
      ok: true,
      experimentKey: 'landing_b',
      version: 1,
      outcome: 'ship_treatment',
      chosenVariantKey: 'on',
      rollout: { ok: false, error: 'paused' },
    }),
  })
  assert.equal(code, EXIT.SERVER)
})
