// agent-legible-horizon D2 — what `frijoles horizon` says, for each shape the route returns.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown

// The same extensionless-import hook golden.test.ts uses: source ships extensionless relative imports.
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

const { horizonLines, DECLARE_HORIZON } = await import('./horizon.ts')

const base = { project: 'acme', generatedAt: '2026-10-14T00:00:00Z', sourceCommit: 'abcdef1234' }

test('nothing pushed, or pushed without a horizon: say so, and say how to declare one', () => {
  assert.equal(
    horizonLines({ ...base, pushed: false, destinations: [] }),
    `acme: no roadmap pushed yet. ${DECLARE_HORIZON}`
  )
  assert.equal(
    horizonLines({ ...base, pushed: true, destinations: [] }),
    `acme: no destinations yet. ${DECLARE_HORIZON}`
  )
  assert.match(DECLARE_HORIZON, /Roadmap\/horizon\.md/)
  assert.match(DECLARE_HORIZON, /destination: <id>/)
  assert.match(DECLARE_HORIZON, /roadmap-push --dry-run/)
})

test('one line per destination, with its status word and the epics under it', () => {
  const text = horizonLines({
    ...base,
    pushed: true,
    destinations: [
      {
        id: 'front-door',
        title: 'The front door',
        description: 'x',
        status: 'lit',
        litBy: [{ slug: 'a', name: 'A', shipped: true }],
      },
      {
        id: 'loop',
        title: 'The loop',
        description: 'y',
        status: 'partial',
        litBy: [
          { slug: 'b', name: 'B', shipped: true },
          { slug: 'c', name: 'C', shipped: false },
        ],
      },
      { id: 'later', title: 'Later', description: 'z', status: 'coming', litBy: [] },
    ],
  })
  assert.equal(
    text,
    [
      'acme: 1 of 3 destinations lit (push abcdef1).',
      '  lit        The front door [front-door] — a ✓',
      '  partly lit The loop [loop] — b ✓, c',
      '  on the way Later [later] — no epic names it yet',
    ].join('\n')
  )
})
