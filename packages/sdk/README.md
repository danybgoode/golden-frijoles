# @golden-frijoles/sdk

The framework-agnostic client for Golden Frijoles telemetry, governed experiment assignment, and
typed local feature-flag evaluation.

## Install

```bash
npm install @golden-frijoles/sdk
```

## Quickstart (1.0)

```ts
import { createGrowthEngineClient } from '@golden-frijoles/sdk'

// One line: with no `baseUrl` key the client talks to https://goldenfrijoles.com.
const growth = createGrowthEngineClient({ apiKey: process.env.GROWTH_ENGINE_API_KEY! })

growth.identify(currentUser.id) // after sign-in; growth.reset() at sign-out
await growth.track('checkout_completed', { featureId: 'checkout' })

// A North Star input you push yourself (revenue, say): one value per day, append-only.
const today = new Date().toISOString().slice(0, 10) // the UTC day the value belongs to
await growth.pushInputValues('attributed_revenue', [{ occurredOn: today, value: 1240 }])
```

- **Your own deployment** (local dev, a preview, a self-host): pass `baseUrl`, spelled exactly so (a misspelled key such
  as `baseURL` is not a URL, so the client uses the default and sends your events to goldenfrijoles.com). A `baseUrl` key that is present but empty
  (an unset environment variable) is never defaulted: calls return `MISSING_BASE_URL`, so a test run cannot reach
  production by accident.
- **No user yet:** `track` and everything built on it return `NO_USER` without a request. `identify` affects what
  comes next only (nothing earlier is re-attributed), and `bucket` uses the current id, so bucket after `identify`
  when a test must follow the person.
- **ESM and CommonJS:** `import` and `require` both work, with types.
- **Every method returns an envelope** (`{ ok: true, … }` or `{ ok: false, error, code }`) and never throws.

## 1.3 — ask whether a feature satisfied people

**Added only.** `rateSatisfaction(flagKey, score)` and `dismissSatisfaction(flagKey)` send the standard rating a bet's
Satisfied stage reads ([Ask whether it satisfied them](#ask-whether-it-satisfied-them)). Nothing else changes.

## 1.2 — one flag switch

**Added only.** `flagSwitchState(definition)` says whether a served flag is **on** or **off** — the rule the Golden
Frijoles flags page, `frijoles flags ls/get` and the MCP tools all use — and `flagReach(definition)` says who an On flag
reaches (`everyone`, `25% of people`, `a segment (not named yet)`). Both are pure.

## 1.1 — make your app a drill target

**Added only.** `createScenarioOwnershipHandler({ token })` answers the ownership check that makes an app a drill
target ([Make your app a drill target](#make-your-app-a-drill-target)). Nothing else changes.

## 1.0 — a stable surface

**Nothing from 0.6.0 is removed or renamed.** 1.0 adds a default URL, `identify`/`reset`, `pushInputValues` and an
ESM build, and freezes the rest as the contract. `userId` and `baseUrl` became optional; code that passes them keeps
working unchanged.

## 0.6.0 — experiments report their own exposures

**Additive only; nothing existing changes.** An experiment started from the Golden Frijoles
experiment builder names itself in the flag version it serves, so your app no longer hard-codes an
experiment key or version. Wire this ONCE, beside the flag check you already have:

```ts
import { experimentForResolution } from '@golden-frijoles/sdk'

const context = { targetingKey: merchant.id, region: merchant.country, channel: 'web' }
const details = flags.resolveBooleanEvaluation('growth.founding_merchants_enabled', false, context)

await growth.trackFlagEvaluation({
  flagKey: 'growth.founding_merchants_enabled',
  flagVersion: details.flagVersion!,
  variant: details.variant!,
  reason: details.reason,
  snapshotVersion,
  environment: 'production',
  subject: { type: 'merchant', id: merchant.id },          // the SAME id as targetingKey
  segments: { region: merchant.country, channel: 'web' },  // the SAME values as the context
  experiment: experimentForResolution(details),            // undefined unless it is an exposure
})
```

- `details.rulePriority` is new: the rule that served this value (only on `TARGETING_MATCH`).
- `experimentForResolution(details)` returns `{ key, definitionVersion }` only when the person was
  served by one of the experiment's own rules. People held out of the test fall through and get
  `undefined`, so they are recorded as an ordinary `flag_evaluated` and never counted in the test.
- `segments` copies the evaluation context's `source · channel · campaign · plan · region` into the
  event's tags. An experiment's eligibility conditions and its breakdowns are read from the
  exposure's tags; without them every exposure of an experiment with a condition is rejected.
  Entries that are not one of those five fields, or not a scalar an experiment predicate could hold
  (at most 64 characters, no NUL), are dropped from the tags — the event itself is still sent.
- `subject.id` and `targetingKey` must be the same identifier, or one person can be bucketed as two.

Also exported for the Golden Frijoles experiment planner: `MAX_FLAG_METADATA_ENTRIES` and the
`FlagScalar` type.

A caller that keeps passing `experiment` by hand, with no `segments`, sends exactly the bytes 0.5.0
sent. A pre-1.0 caret does not pick this up automatically; move to `^0.6.0`.

## 0.5.0 — the command core, for the CLI and the MCP tools

**Additive only; nothing existing changes.** 0.5.0 exports the shared, pure command core that
`@golden-frijoles/cli` and the connector's flag write tools both call — `planFlagCreate`,
`planFlagSet`, `planFlagRollout`, `planFlagRules`, `planFlagKill`, `ON_VARIANT_KEY` /
`OFF_VARIANT_KEY` — plus `diffFlagDefinitions` and the percent ↔ basis-points helpers the console
already used. One implementation, so the CLI verb and the MCP tool cannot disagree about what a
flag change means.

A pre-1.0 caret (`^0.4.0`) does not pick this up automatically; move to `^0.5.0` to use them.

## 0.4.0 identity change

The package rename and the OpenFeature provider rename ship together as a breaking pre-1.0 minor
release. `createFlagProvider().metadata.name` is now `golden-frijoles`, and
`createScenarioProvider().metadata.name` is now `golden-frijoles-scenarios`. Consumers that assert
provider identity must update those expectations when moving to `@golden-frijoles/sdk@0.4.0`.

Older integrations read `GROWTH_ENGINE_URL`, `GOLDEN_BEANS_FLAG_READ_KEY` and `GOLDEN_BEANS_FLAG_SYNC_KEY`; those
names stay valid for existing consumers. They are caller-owned environment
variable names, not SDK lookups or provider identities; renaming them is not required to adopt 0.4.0.

## Environment variable names for a NEW project

This SDK reads **no** environment variable — `createFlagProvider` takes `flagReadKey` as an
argument, and every name in this document is one the *caller* chose. That is why the older names
stay valid: nothing in shipped code resolves either of them.

For a new project, `@golden-frijoles/cli` writes **`GOLDEN_FRIJOLES_URL`**,
**`GOLDEN_FRIJOLES_FLAG_READ_KEY`** and **`GOLDEN_FRIJOLES_ENVIRONMENT`** into `.env.local` and
prints the snippet that reads exactly those names, so the file and its reader are generated
together:

```bash
npx @golden-frijoles/cli init
```

Either set of names works. Pick one per project.

## Telemetry

```ts
import { createGrowthEngineClient } from '@golden-frijoles/sdk'

const growth = createGrowthEngineClient({
  apiKey: process.env.GROWTH_ENGINE_API_KEY!,
  userId: 'opaque-user-id', // or growth.identify(id) later
})

await growth.track('checkout_completed', { featureId: 'checkout' })
```

## Ask whether it satisfied them

A bet's funnel ends at **Satisfied**: the people who kept using the feature and liked it. You draw the question; the SDK
sends the answer in the one shape the funnel reads.

1. **Ask after the person retained** (they used the feature again), and once: the funnel only counts answers from retained
   people, so an earlier ask is not wrong, just wasted.
2. **Draw your own prompt**, for example:

   ```html
   <p>Did the new checkout make paying easier?</p>
   <button data-score="1">1</button> … <button data-score="5">5</button>
   <button data-dismiss>Not now</button>
   ```

3. **Send the answer**:

   ```ts
   await growth.rateSatisfaction('checkout.one_step_enabled', 4) // a whole number 1–5
   await growth.dismissSatisfaction('checkout.one_step_enabled') // "Not now": never counts as satisfied
   ```

   The event names are exported too (`SATISFACTION_RATED_EVENT`, `SATISFACTION_DISMISSED_EVENT`), with the score
   range (`SATISFACTION_MIN`, `SATISFACTION_MAX`). A score that is not a whole number from 1 to 5, or a key that cannot
   be a flag key, returns
   `{ ok: false, code: 'INVALID_SATISFACTION' }` and sends nothing.

4. **Point the bet at it**, in the epic README's frontmatter:

   ```yaml
   satisfied_event: satisfaction_rated
   satisfied_min_score: 4   # optional, 1–5; the score that counts as satisfied (default 4)
   ```

A person counts by their **latest** answer since adopting, and only for the flag the rating names. A bet that names its
own event instead (`satisfied_event: my_rating`) keeps counting every answer, and ignores `satisfied_min_score`.

## Server-side flag provider

Keep a project/environment-scoped `flag_read` key in server-only configuration. The provider
fetches a versioned snapshot in the background; request-path resolution stays synchronous and
uses a safe caller-supplied default if no fresh snapshot is available.

```ts
import { createFlagProvider } from '@golden-frijoles/sdk'

const flags = createFlagProvider({
  baseUrl: process.env.GOLDEN_FRIJOLES_URL!,
  flagReadKey: process.env.GOLDEN_FRIJOLES_FLAG_READ_KEY!,
  environment: 'production',
})

await flags.initialize()
const checkoutEnabled = flags.resolveBooleanEvaluation('checkout.enabled', false, {
  targetingKey: 'opaque-subject-id',
}).value
```

Do not expose `flagReadKey` or telemetry API keys to browser bundles. Golden Frijoles derives tenant
and environment from the credential; callers never send either in a snapshot request.

## Server-side flag-definition catalog sync

Applications declare their typed catalog in source control, then an explicit operator/deployment
command registers new definitions with Golden. This is not a build side effect and does not affect
runtime flag evaluation. Use a dedicated, revocable `flag_sync` credential — never an ingest or
`flag_read` key — and keep it server-side.

```ts
import { createFlagDefinitionSyncClient, type FlagDefinitionSyncEntry } from '@golden-frijoles/sdk'

const catalog: FlagDefinitionSyncEntry[] = [
  {
    key: 'checkout.enabled',
    definition: {
      valueType: 'boolean',
      description: 'Enables the checkout fixture.',
      defaultVariantKey: 'off',
      variants: [{ key: 'off', value: false }, { key: 'on', value: true }],
      rules: [],
    },
  },
]

const sync = createFlagDefinitionSyncClient({
  baseUrl: process.env.GOLDEN_FRIJOLES_URL!,
  flagSyncKey: process.env.GOLDEN_FRIJOLES_FLAG_SYNC_KEY!,
})
const result = await sync.syncFlagDefinitions(catalog)

if (!result.ok) throw new Error(`${result.kind}: ${result.error}`)
```

The v1 request is bounded to 100 definitions and a 4 MiB JSON body. A new key creates immutable
version 1; an identical definition returns `created: false`; semantic drift is an HTTP `409` for an
owner to resolve through the normal version lifecycle. A **new** flag goes live as
written in the catalog (default and rules) in every environment; sync never switches an existing flag and never
deletes one.

## Make your app a drill target

A drill (a bounded, synthetic fault: a capped delay or a synthetic error) runs only against an app that has proved it
is yours. An agent does it in three commands:

```sh
frijoles scenarios targets add site.probe --origin https://your.app   # prints a gf_target_… token, once
# put the token in the app's server env (GOLDEN_FRIJOLES_TARGET_TOKEN), add the route below, deploy
frijoles scenarios targets verify site.probe
```

The route the engine calls is `/api/internal/resilience/ownership` (`SCENARIO_OWNERSHIP_PATH`):

```ts
// app/api/internal/resilience/ownership/route.ts (Next.js; any Fetch-API runtime works the same)
import { createScenarioOwnershipHandler } from '@golden-frijoles/sdk'

const answer = createScenarioOwnershipHandler({ token: process.env.GOLDEN_FRIJOLES_TARGET_TOKEN! })

export async function POST(request: Request) {
  return (await answer(request)) ?? new Response(null, { status: 404 })
}
```

The engine keeps only the token's SHA-256, and both sides sign with that hash, so the token never travels again after
`targets add`. A check not signed by your token gets a plain 404. Lost the token? Revoke the target and add it again
under a new key. The founder can do the same from the scenarios page; then define and launch drills with
`frijoles scenarios define` / `launch` / `stop`, and run them through the provider below.

## Bounded scenario provider

Scenario evaluation is also synchronous and local. It returns only the closed `none`, capped
`delay`, or allow-listed synthetic-error payload. Evaluation does not execute the payload: the
application must apply it at an explicitly instrumented server seam.

```ts
import { createScenarioProvider } from '@golden-frijoles/sdk'

const scenarios = createScenarioProvider({
  baseUrl: process.env.GOLDEN_FRIJOLES_URL!,
  flagReadKey: process.env.GOLDEN_FRIJOLES_FLAG_READ_KEY!,
  environment: 'production',
})

await scenarios.initialize()
const resolution = scenarios.resolveScenario('miyagi.internal.probe', {
  targetingKey: 'synthetic:readiness-check',
})

if (resolution.runId && resolution.runRevision) {
  const reservation = await scenarios.reserveExecution(resolution.runId, resolution.runRevision)
  if (reservation.ok && reservation.admitted) {
    let succeeded = false
    try {
      // Apply the closed resolution.value at this one instrumented target seam.
      succeeded = true
    } finally {
      await scenarios.settleExecution(resolution.runId, reservation.leaseId, succeeded)
    }
  }
}
```

After the target reserves and settles a server-issued execution lease, record the canonical
assignment/exposure and execution fact together:

```ts
const entry = scenarios.getSnapshot()?.scenarios.find(
  (candidate) => candidate.runId === resolution.runId,
)
if (!entry || !resolution.runId || !resolution.scenarioKey || !resolution.variant) {
  throw new Error('No active scenario execution')
}

await growth.trackScenarioExecution({
  scenarioKey: resolution.scenarioKey,
  scenarioVersion: resolution.scenarioVersion!,
  runId: resolution.runId,
  runRevision: resolution.runRevision!,
  leaseId: reservedLeaseId,
  targetKey: 'miyagi.internal.probe',
  cohort: resolution.cohort!,
  environment: 'production',
  arm: resolution.value.kind === 'none' ? 'control' : 'fault',
  faultKind: resolution.value.kind,
  failed: false,
  latencyMs: 125,
  subject: { type: 'synthetic_probe', id: 'readiness-check' },
  flag: {
    key: entry.flag.key,
    definitionVersion: entry.flag.definitionVersion,
    variant: resolution.variant,
    reason: resolution.reason,
    snapshotVersion: scenarios.getSnapshot()!.revision,
  },
  experiment: entry.experiment
    ? { key: entry.experiment.key, definitionVersion: entry.experiment.definitionVersion }
    : undefined,
})
```

Never expose scenario credentials to a browser, and never interpret scenario data as arbitrary
code, URLs, headers, queries, or resource-exhaustion instructions.
