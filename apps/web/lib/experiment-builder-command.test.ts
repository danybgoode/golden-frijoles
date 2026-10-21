// landing-launch-experiment · Sprint 6, Story 6.6 — pause and delete against a fake io: the ORDER of the writes, and
// what is refused. The real RPCs are e2e/cli-experiments.spec.ts; this pins what e2e cannot provoke (a failed unserve).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { deleteExperimentCommand, pauseExperimentCommand } = await import('./experiment-builder-command.ts')
type Deps = import('./experiment-builder-command.ts').BuilderDependencies

type Version = { version: number; status: 'draft' | 'running' | 'stopped' | 'decided' | 'invalid' }
function fake(
  versions: Version[],
  opts: { activation?: 'serving' | 'moved' | 'failed'; served?: 'split' | 'paused' | 'other' } = {}
) {
  const calls: string[] = []
  const stored = (v: Version) => ({
    experimentId: 'e1',
    versionId: `v${v.version}`,
    version: v.version,
    status: v.status,
    definition: {} as never,
    answers: {} as never,
    flagKey: 'f',
    flagId: 'flag1',
    flagVersionId: `fv${v.version}`,
  })
  const io = {
    async loadDraft(_p: string, _k: string, version?: number) {
      const v =
        version === undefined ? versions[versions.length - 1] : versions.find((x) => x.version === version)
      return v ? stored(v) : null
    },
    async runningVersion() {
      return versions.find((v) => v.status === 'running')?.version ?? null
    },
    async servingState() {
      return opts.served ?? 'split'
    },
    async productionVersion() {
      const running = versions.find((v) => v.status === 'running' || v.status === 'stopped')
      return running
        ? {
            versionId: `fv${running.version}`,
            definition: {
              valueType: 'boolean',
              defaultVariantKey: 'off',
              variants: [],
              rules: [],
              metadata: {},
            } as never,
            flagKey: 'f',
          }
        : null
    },
    async createFlagVersion() {
      calls.push('create')
      return { versionId: 'base', flagId: 'flag1' }
    },
    async activateInProduction() {
      calls.push('activate')
      return opts.activation ?? 'serving'
    },
    async transitionVersion(_p: string, _e: string, versionId: string, target: string) {
      calls.push(`${target}:${versionId}`)
      return true
    },
  }
  const deps = {
    builderEnabled: async () => true,
    servingEnabled: async () => true,
    requireOwnership: async () => ({ projectId: 'p1', userId: 'u1' }),
    io: io as unknown as Deps['io'],
  } as Deps
  return { deps, calls }
}

test('delete takes the split off BEFORE retiring anything, and retires every live version', async () => {
  const { deps, calls } = fake([
    { version: 1, status: 'running' },
    { version: 2, status: 'draft' },
  ])
  const result = await deleteExperimentCommand('slug', 'k', deps)
  assert.ok(result.ok)
  assert.deepEqual(calls, ['create', 'activate', 'invalid:v1', 'invalid:v2'])
})

test('delete retires NOTHING when the split cannot be taken off', async () => {
  for (const activation of ['moved', 'failed'] as const) {
    const { deps, calls } = fake([{ version: 1, status: 'running' }], { activation })
    const result = await deleteExperimentCommand('slug', 'k', deps)
    assert.equal(result.ok, false, activation)
    assert.ok(!calls.some((c) => c.startsWith('invalid')), activation)
  }
})

test('delete refuses while ANY version is decided — a later draft never hides the record', async () => {
  const { deps, calls } = fake([
    { version: 1, status: 'decided' },
    { version: 2, status: 'draft' },
  ])
  const result = await deleteExperimentCommand('slug', 'k', deps)
  assert.ok(!result.ok && /decided/.test(result.error))
  assert.deepEqual(calls, [])
})

test('pause: ok only when it takes THIS test’s split off, or it is already paused; never over someone else’s change', async () => {
  const split = fake([{ version: 1, status: 'running' }])
  assert.ok((await pauseExperimentCommand('slug', 'k', split.deps)).ok)
  assert.deepEqual(split.calls, ['create', 'activate'])
  const already = fake([{ version: 1, status: 'running' }], { served: 'paused' })
  assert.ok((await pauseExperimentCommand('slug', 'k', already.deps)).ok)
  assert.deepEqual(already.calls, [])
  const other = fake([{ version: 1, status: 'running' }], { served: 'other' })
  const refused = await pauseExperimentCommand('slug', 'k', other.deps)
  assert.ok(!refused.ok && /nothing to pause/.test(refused.error))
  assert.deepEqual(other.calls, [])
  const raced = fake([{ version: 1, status: 'running' }], { activation: 'moved' })
  assert.equal((await pauseExperimentCommand('slug', 'k', raced.deps)).ok, false)
})
