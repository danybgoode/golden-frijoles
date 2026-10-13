// golden-frijoles-cli · Sprint 1, Story 1.5 — the agent-facing projection, asserted directly.
//
// The claim worth pinning is the one the console learned the hard way: **"an activation row points
// at a version" is NOT "this flag is on."** 34 of one production project's 42 flags have a latest
// version that evaluates to `false`, so a CLI that derived "on" from the presence of an activation
// would print the wrong word for most flags in production — confidently, in a format an agent is
// meant to trust.
//
// These run against pure data. No session, no database, no browser (CODE-QUALITY #5).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'
import type { FlagDefinition } from '@golden-frijoles/sdk'
import type { FlagLifecycleAuditRow, FlagRegistryRow } from './flag-registry.ts'

// The extensionless-import hook, the same one `flag-rule-draft.test.ts` uses. App source imports
// relatives WITHOUT an extension (the repo's rule: allowing `.ts` in source would let app code ship
// `.ts` imports, trading a caught type error for an uncaught build break), and Node's native TS
// loader demands them. Only *.test.ts opts into the looser rule, so the module under test is
// reached through this.
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
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { toCliFlagDetailView, toCliFlagView } = await import('./cli-flag-view.ts')

function definition(overrides: Partial<FlagDefinition> = {}): FlagDefinition {
  return {
    valueType: 'boolean',
    description: 'Checkout demo.',
    defaultVariantKey: 'on',
    variants: [
      { key: 'off', value: false },
      { key: 'on', value: true },
    ],
    rules: [],
    ...overrides,
  }
}

function flag(overrides: Partial<FlagRegistryRow> = {}): FlagRegistryRow {
  return {
    id: 'flag-1',
    key: 'checkout.demo_enabled',
    createdBy: 'user-1',
    createdAt: '2026-09-01T00:00:00.000Z',
    versions: [
      {
        id: 'v1',
        version: 1,
        definition: definition(),
        createdBy: 'user-1',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    activations: [
      {
        environment: 'production',
        versionId: 'v1',
        updatedBy: 'user-1',
        updatedAt: '2026-09-02T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

test('an environment serving a version reports state on AND what it actually serves', () => {
  const view = toCliFlagView(flag())
  const production = view.environments.find((row) => row.environment === 'production')
  assert.equal(production?.state, 'on')
  assert.equal(production?.version, 1)
  assert.equal(production?.serving, true)
})

test('one-flag-switch: a SERVED version whose default is false is `off`, the same as the flags page says', () => {
  // `state` and `serving` agree: what the app gets is false, so the switch reads off, here and on the page.
  const view = toCliFlagView(
    flag({
      versions: [
        {
          id: 'v1',
          version: 1,
          definition: definition({ defaultVariantKey: 'off' }),
          createdBy: 'user-1',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
      ],
    })
  )
  const production = view.environments.find((row) => row.environment === 'production')
  assert.equal(production?.state, 'off')
  assert.equal(production?.serving, false)
})

test('an environment with an activation row and no version is `off`', () => {
  const view = toCliFlagView(
    flag({
      activations: [
        {
          environment: 'production',
          versionId: null,
          updatedBy: 'user-1',
          updatedAt: '2026-09-02T00:00:00.000Z',
        },
      ],
    })
  )
  const production = view.environments.find((row) => row.environment === 'production')
  assert.equal(production?.state, 'off')
  assert.equal(production?.version, null)
  assert.equal(production?.serving, null)
  // Serving nothing is a fully READABLE fact, not a corrupt row. Reporting `readable: false` here
  // would make "this environment is off" indistinguishable from "this row is broken".
  assert.equal(production?.readable, true)
})

test('one-flag-switch: an environment nobody has ever touched is `off` — two states, no third', () => {
  const view = toCliFlagView(flag())
  assert.equal(view.environments.find((row) => row.environment === 'development')?.state, 'off')
})

test('all three environments are always reported, in canonical order', () => {
  assert.deepEqual(
    toCliFlagView(flag()).environments.map((row) => row.environment),
    ['development', 'preview', 'production']
  )
})

test('the flag is DESCRIBED by what production serves, not by the newest draft', () => {
  // Describing production with a draft production has never seen is a confident false statement —
  // the rule `projectFlagRows` applies, kept here so the CLI and the console say the same thing.
  const view = toCliFlagView(
    flag({
      versions: [
        {
          id: 'v1',
          version: 1,
          definition: definition({ description: 'what production serves' }),
          createdBy: 'user-1',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'v2',
          version: 2,
          definition: definition({ description: 'an unactivated draft' }),
          createdBy: 'user-1',
          createdAt: '2026-09-03T00:00:00.000Z',
        },
      ],
    })
  )
  assert.equal(view.description, 'what production serves')
  // ...while `latestVersion` still reports the draft exists. Both facts, neither hidden.
  assert.equal(view.latestVersion, 2)
})

test('with nothing serving in production, the newest version describes the flag', () => {
  const view = toCliFlagView(
    flag({
      activations: [],
      versions: [
        {
          id: 'v1',
          version: 1,
          definition: definition({ description: 'old' }),
          createdBy: 'user-1',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'v2',
          version: 2,
          definition: definition({ description: 'newest' }),
          createdBy: 'user-1',
          createdAt: '2026-09-03T00:00:00.000Z',
        },
      ],
    })
  )
  assert.equal(view.description, 'newest')
})

test('a flag with no versions at all reports nulls rather than throwing', () => {
  const view = toCliFlagView(flag({ versions: [], activations: [] }))
  assert.equal(view.valueType, null)
  assert.equal(view.description, null)
  assert.equal(view.latestVersion, null)
  assert.equal(view.environments.length, 3)
})

test('the detail view lists versions newest first and names which environments serve each', () => {
  const detail = toCliFlagDetailView(
    flag({
      versions: [
        {
          id: 'v1',
          version: 1,
          definition: definition(),
          createdBy: 'u',
          createdAt: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'v2',
          version: 2,
          definition: definition(),
          createdBy: 'u',
          createdAt: '2026-09-03T00:00:00.000Z',
        },
      ],
      activations: [
        {
          environment: 'development',
          versionId: 'v2',
          updatedBy: 'u',
          updatedAt: '2026-09-04T00:00:00.000Z',
        },
        { environment: 'production', versionId: 'v1', updatedBy: 'u', updatedAt: '2026-09-02T00:00:00.000Z' },
      ],
    }),
    []
  )
  assert.deepEqual(
    detail.versions.map((version) => version.version),
    [2, 1]
  )
  assert.deepEqual(detail.versions[0].servedBy, ['development'])
  assert.deepEqual(detail.versions[1].servedBy, ['production'])
})

test('the detail view carries only THIS flag’s audit rows', () => {
  const rows: FlagLifecycleAuditRow[] = [
    {
      id: 'a1',
      environment: 'production',
      flagId: 'flag-1',
      oldVersionId: null,
      newVersionId: 'v1',
      action: 'activated',
      actorUserId: 'user-1',
      externalActorId: null,
      reason: 'ship it',
      createdAt: '2026-09-02T00:00:00.000Z',
    },
    {
      id: 'a2',
      environment: 'production',
      flagId: 'some-other-flag',
      oldVersionId: null,
      newVersionId: 'v9',
      action: 'activated',
      actorUserId: 'user-2',
      externalActorId: null,
      reason: 'not this one',
      createdAt: '2026-09-02T00:00:00.000Z',
    },
  ]
  const detail = toCliFlagDetailView(flag(), rows)
  assert.deepEqual(
    detail.audit.map((row) => row.reason),
    ['ship it']
  )
})

test('an external actor is reported as the actor, ahead of the internal user id', () => {
  const detail = toCliFlagDetailView(flag(), [
    {
      id: 'a1',
      environment: 'production',
      flagId: 'flag-1',
      oldVersionId: null,
      newVersionId: 'v1',
      action: 'activated',
      actorUserId: 'service-account',
      externalActorId: 'miyagi:clerk-42',
      reason: 'admin console',
      createdAt: '2026-09-02T00:00:00.000Z',
    },
  ])
  assert.equal(detail.audit[0].actor, 'miyagi:clerk-42')
})

// ── one-flag-switch S1.3 — the page and the CLI can never disagree ─────────────────────────────
// The flags page reads `projectFlagRows`, `frijoles flags ls/get` and the MCP tools read `toCliFlagView`. For every kind
// of flag, in every environment, both must say the same On / Off: that is the whole of the product owner's ask.
test('one-flag-switch: the flags page and the CLI say the same On / Off for every kind of flag', async () => {
  const { projectFlagRows } = await import('./flag-list-view.ts')
  const version = (id: string, n: number, def: Partial<FlagDefinition>) => ({
    id,
    version: n,
    definition: definition(def),
    createdBy: 'user-1',
    createdAt: '2026-09-01T00:00:00.000Z',
  })
  const served = (environment: string, versionId: string | null) => ({
    environment,
    versionId,
    updatedBy: 'user-1',
    updatedAt: '2026-09-02T00:00:00.000Z',
  })
  const cases: Array<{ name: string; row: FlagRegistryRow }> = [
    { name: 'on', row: flag() },
    {
      name: 'killed (served, default false, no rules) — what `frijoles flags kill` writes',
      row: flag({ versions: [version('v1', 1, { defaultVariantKey: 'off' })] }),
    },
    {
      name: 'a rollout to true',
      row: flag({
        versions: [
          version('v1', 1, {
            defaultVariantKey: 'off',
            rules: [{ priority: 1, clauses: [], rollout: { basisPoints: 2500 }, variantKey: 'on' }],
          }),
        ],
      }),
    },
    { name: 'never set anywhere', row: flag({ activations: [] }) },
    {
      name: 'taken out in production (the old page off)',
      row: flag({ activations: [served('production', null), served('preview', 'v1')] as never }),
    },
    {
      name: 'a JSON flag',
      row: flag({
        versions: [
          version('v1', 1, {
            valueType: 'json',
            defaultVariantKey: 'a',
            variants: [{ key: 'a', value: { kind: 'none' } }],
          } as Partial<FlagDefinition>),
        ],
      }),
    },
  ]
  for (const { name, row } of cases) {
    const cli = toCliFlagView(row)
    for (const environment of ['development', 'preview', 'production']) {
      const page = projectFlagRows([row as never], environment)[0].state
      const cliState = cli.environments.find((candidate) => candidate.environment === environment)?.state
      assert.equal(cliState, page, `${name} in ${environment}: CLI says ${cliState}, the page says ${page}`)
    }
  }
  // And the two that motivated it, pinned by value.
  assert.equal(
    toCliFlagView(cases[1].row).environments.find((e) => e.environment === 'production')?.state,
    'off'
  )
  assert.equal(projectFlagRows([cases[1].row as never], 'production')[0].state, 'off')
})

// one-flag-switch D4 (verifier, #351) — the gate seam reads REAL rows, built the way `gates-catalog.ts` builds them, and
// its behaviour is unchanged: never set → the coded fallback; taken out → off; killed → off; on → on.
test('one-flag-switch: product gates keep their fallback for a flag never set, through the real row builder', async () => {
  const { toGateRows } = await import('./cli-flag-view.ts')
  const { servedValue } = await import('./gates-decision.ts')
  const bornOn = { key: 'checkout.demo_enabled', envVar: null, fallback: true }
  const gate = (row: FlagRegistryRow, environment = 'production') =>
    servedValue(bornOn, new Map([[row.key, toGateRows(row)]]), environment as 'production')
  const killed = flag({
    versions: [
      {
        id: 'v1',
        version: 1,
        definition: definition({ defaultVariantKey: 'off' }),
        createdBy: 'user-1',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ],
  })
  const takenOut = flag({
    activations: [
      {
        environment: 'production',
        versionId: null,
        updatedBy: 'user-1',
        updatedAt: '2026-09-02T00:00:00.000Z',
      },
    ],
  })
  assert.equal(gate(flag()), true, 'on')
  assert.equal(gate(killed), false, 'killed')
  assert.equal(gate(takenOut), false, 'taken out')
  assert.equal(
    gate(flag({ activations: [] })),
    true,
    'never set: the fallback, unchanged by the one-switch rule'
  )
  // …while every screen says Off for that never-set flag.
  assert.equal(toCliFlagView(flag({ activations: [] })).environments[2].state, 'off')
})
