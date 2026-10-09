---
title: "SDK 1.0: one line to start, who the user is, and North Star inputs"
slug: sdk-1-0
status: scaffolded
area: "01"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: high
epic: "01-growth-engine/sdk-1-0"
build_order: 74
updated: 2026-10-09
intent_ask: verbatim
hypothesis: "We believe that an SDK that starts with one line, learns who the user is after sign-in and pushes a North Star input in one call, for founders instrumenting their app, will let more of them see a first event and a first input value on day one, because today every setup needs a URL variable, a client per request and a hand-written fetch for inputs."
target_metric: null    # no target: proving_workspaces has no recorded value yet; read by the quickstart walkthrough
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: 88
---

# Pitch — SDK 1.0: one line to start, who the user is, and North Star inputs

Moves: proving_workspaces · Tests: Value proposition

## The ask, as given

> Finally, help me review the state and scope of the sdk as its been a while since we have updated it.
> — Daniel, 2026-10-08. Then, 2026-10-09: "Yes go ahead with SDK 1.0" (scope: the launch-sweep audit §11, with
> scenarios kept: Daniel reversed D6, so the scenario API stays).

### Claims
1. An SDK that is current with the engine and fit for launch.
2. It is simple to start with and covers what founders need on day one.

**Teach-back:** yes — "You want the SDK to reach 1.0: easy to start, current with the engine, and nothing that works
today breaks. Right?" (from the audit thread)

## Problem
`@golden-frijoles/sdk` 0.6.0 (2026-09-26) is the only app→engine path (AGENTS rule 1), but starting with it costs
more than it should:
- **`baseUrl` is required** with no default, so every quickstart needs a `GOLDEN_FRIJOLES_URL` variable.
- **`userId` is fixed when the client is built.** A browser app knows the user only after sign-in and has no
  `identify()`, so it has to build a second client.
- **North Star inputs have no method.** `POST /api/v1/inputs/<key>/values` exists (append-only, idempotent per day)
  and takes the same project key, but the SDK cannot call it, so the Miyagi revenue sync hand-writes the fetch.
- **CommonJS only** (`exports` points both `require` and `default` at CJS). ESM-only projects (Vite, modern Node
  ESM) go through interop.

## Appetite
M. Additive changes to a published package, plus the console's quickstarts.
quote: $16–32 (M, n=16, p25–p75)

## Outcome & signal
The `/install` and Connect quickstarts start with `createGrowthEngineClient({ apiKey })`, a browser app calls
`identify()` after sign-in, and a revenue sync is `growth.pushInputValues('revenue', [{ occurredOn, value }])`.
Existing callers (the template's example app, the console's snippets, anyone on npm) keep working unchanged.
**Target:** none recorded (the input has no value yet); the read is a fresh-project quickstart walkthrough.

## Stage-2.5 bucket
**Light enhancement**: additive methods and defaults on an existing client, plus a dual build. No engine change.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `baseUrl` defaults to `https://goldenfrijoles.com` | one line to start; self-hosters and tests still pass it |
| `userId` optional at construction + `identify(userId)` / `reset()` | a browser knows the user after sign-in; one client per app |
| `pushInputValues(key, values)` → `/api/v1/inputs/<key>/values` | the North Star input push, as data, through the one SDK path |
| Dual build: ESM (`import`) + CJS (`require`), types for both | ESM-only projects import it natively |
| Quickstarts and README in the 1.0 shape | the first thing a founder copies |
| SDK 1.0.0, CHANGELOG, the 0.6.0 call shapes pinned by a test | the contract we promise to keep |

## Scope
**Sprint 1 · Start in one line** (S1.1 default `baseUrl` · S1.2 `identify`/`reset` · S1.3 `pushInputValues`) ·
**Sprint 2 · Ship it** (S2.1 dual ESM/CJS build · S2.2 quickstarts and README · S2.3 release 1.0.0).

**No-gos:** no breaking change to any existing method or option (1.0 freezes today's surface plus these additions) ·
the scenario API stays as it is (D6 reversed) · no anonymous→known identity merge on the server (the engine has no
alias table; `identify` sets who future events are about) · no React/Next helpers (after launch) · the flag ↔ TARS
link (the "one bet, wired" epic) · no engine or migration changes.

## Rabbit holes
- **`identify` and experiments.** `bucket()` resolves the variant from the user id, so a person bucketed while
  anonymous can land in a different variant after `identify`. The rule: `bucket()` uses the current id; the docs say
  to bucket after `identify` when a test must follow the person.
- **No id at all.** With no `userId` and no `identify` yet, `track` has nothing to send. It returns a typed
  `{ ok: false, code: 'no_user' }` envelope (the SDK never throws, per its own rule) rather than inventing an id.
- **Dual packages.** Two module instances (ESM + CJS) of a stateful client are the classic hazard. The client holds
  state per instance, nothing global, so two copies cannot disagree.
- **Default URL vs tests.** Specs and the template pass `baseUrl` explicitly today; the default must not reach a test.

## What already exists (reuse, don't rebuild)
- `packages/sdk/src/index.ts` (`createGrowthEngineClient`, the never-throws envelope), `capture.ts`, `flags.ts`,
  `flag-provider.ts`
- `apps/web/app/api/v1/inputs/[key]/values/route.ts` (append-only, idempotent per day, project key)
- `scripts/sync-revenue-from-miyagi.mjs` (the hand-written push this replaces, as the reference caller)
- `apps/web/app/install/page.tsx`, `apps/web/app/app/setup/connect/[projectSlug]/page.tsx` (the quickstarts)
- `apps/web/lib/cli-install.ts` and `golden-onboarding.mjs` (the welded install strings)

## Visuals

```
 founder's app ──createGrowthEngineClient({ apiKey })──▶ goldenfrijoles.com (default) or baseUrl
      │ identify(userId) after sign-in
      ├── track / trackAdoption / captureError ───────────▶ /api/v1/track
      ├── flags (snapshot provider, local evaluation) ─────▶ /api/v1/flags/snapshot
      └── pushInputValues(key, [{ occurredOn, value }]) ───▶ /api/v1/inputs/<key>/values  (new in the SDK)
```

## UX heuristics & rails check
The quickstart is the product's first impression: one import, one call, one event. The never-throws envelope stays
the SDK's contract; every new method returns it.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
**No flag.** A versioned package: rollback is pinning `@golden-frijoles/sdk@0.6.0`, and every change is additive.

## Acceptance criteria
- S1.1 A client built with only `apiKey` talks to https://goldenfrijoles.com; `baseUrl` still overrides (high)
- S1.2 `identify(userId)` and `reset()` change who future events are about; `track` with no user returns `no_user` (high)
- S1.3 `pushInputValues(key, values)` appends a North Star input's daily values and returns the envelope (high)
- S2.1 `import` and `require` both work, with types, from the packed tarball (high)
- S2.2 `/install`, Connect and the README start in one line and show `identify` and an input push (low)
- S2.3 SDK 1.0.0 with a CHANGELOG; every 0.6.0 call shape compiles and runs unchanged, pinned by a test (high)

## Open risks / research
- Consumers: no local Miyagi checkout depends on the SDK package (its revenue push and delivery webhooks call the HTTP API
  directly; checked 2026-10-09), and npm lists no dependents. Additive-only keeps any unknown caller safe; S2.3 pins
  the 0.6.0 call shapes in a test.
- npm publish of the SDK is Daniel's 2FA step (like the CLI).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/sdk-1-0.md
  coverage in   0.91  (2 claims)
  coverage out  0.79  (6 criteria)
  clarity       0.82  (6 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 88 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.91,"coverage_out":0.793,"clarity":0.821,"teach_back":1,"total":88} -->

## Decisions at the Plan gate (Daniel, 2026-10-09)
- **Approved.**
- **a.** 1.0 freezes today's whole surface: everything 0.6.0 does keeps working; 1.0 only adds.
- **b.** React/Next helpers wait for after launch.
