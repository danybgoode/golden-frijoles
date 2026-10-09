---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-09T13:19:02Z"
slug: sdk-1-0
title: "SDK 1.0: one line to start, who the user is, and North Star inputs"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 16    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=16, p25–p75"
hypothesis: "We believe that an SDK that starts with one line, learns who the user is after sign-in and pushes a North Star input in one call, for founders instrumenting their app, will let more of them see a first event and a first input value on day one, because today every setup needs a URL variable, a client per request and a hand-written fetch for inputs."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null    # no target: proving_workspaces has no recorded value yet
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 74      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: SDK 1.0: one line to start, who the user is, and North Star inputs

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/sdk-1-0.md`](../../00-ideas/seeds/sdk-1-0.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
We believe that an SDK that starts with one line, learns who the user is after sign-in and pushes a North Star input in one call, for founders instrumenting their app, will let more of them see a first event and a first input value on day one, because today every setup needs a URL variable, a client per request and a hand-written fetch for inputs. Pitch and gate decisions: `00-ideas/seeds/sdk-1-0.md`.
Moves: proving_workspaces · Tests: Value proposition.

## Platform-first note
No engine change: the inputs route, the track route and the flag snapshot already exist; 1.0 is the client catching up, additively (gate decision a).

## What already exists (reuse, don't rebuild)
- `packages/sdk/src/index.ts` (the never-throws envelope), `apps/web/app/api/v1/inputs/[key]/values/route.ts`, `scripts/sync-revenue-from-miyagi.mjs`, `apps/web/app/install/page.tsx`, the Connect page

## Architecture lock (2026-10-09, verified against `packages/sdk/src`)

- **D1 — One default URL for every config.** `DEFAULT_BASE_URL = 'https://goldenfrijoles.com'` in `src/defaults.ts`,
  used by `createGrowthEngineClient`, `createFlagProvider`, the flag sync and `createScenarioProvider` when `baseUrl`
  is omitted; a trailing slash is stripped everywhere (only the providers stripped it before). `baseUrl` becomes
  optional in all four config types: widening a required field is additive. **Corrected at build:** the default
  applies only when the `baseUrl` KEY is absent. Today's snippets pass `baseUrl: process.env.GOLDEN_FRIJOLES_URL!`; if
  that variable is unset the key is present and `undefined`, and a naive default would send a developer's local or
  test events to production instead of failing. Present-but-empty keeps failing, as in 0.6.0 (the client returns
  `MISSING_BASE_URL` instead of a `NETWORK_ERROR` to a malformed URL; the providers stay unconfigured, as before).
- **D2 — Identity is per client instance.** A closure `let userId = config.userId ?? null`; `identify(id)` sets it
  (a non-empty string, else it returns `{ ok: false, code: 'INVALID_USER_ID' }`), `reset()` clears it. Nothing
  module-level, so the ESM and CJS copies (D5) cannot share or disagree on state. Every reader of `config.userId`
  (`track`, the ungoverned `bucket`) reads the closure instead.
- **D3 — No user, no invention.** With no id, `track` (and so `trackAdoption`, `trackExposure`, `trackFlagEvaluation`,
  `captureError`) returns `{ ok: false, error, code: 'NO_USER' }` without a network call; an ungoverned `bucket`
  returns `{ ok: false, code: 'NO_USER' }`. Codes are UPPER_SNAKE like the existing ones (the pitch's `no_user` is
  corrected here). A governed `bucket` uses its own assignment entity and is unaffected.
- **D4 — `pushInputValues(key, values)`** posts `{ values }` to `/api/v1/inputs/<encoded key>/values` with the
  client's `apiKey`; validates each `occurredOn` (YYYY-MM-DD) and `value` (finite) before sending and returns
  `{ ok: false, code: 'INVALID_INPUT_VALUES' }` locally; on success returns the route's own fields, `{ ok: true,
  inputKey, inserted, skippedDuplicates, mismatchedDuplicates }` (corrected at build: the route reports which re-pushed
  days carried a different value, which a caller needs to see); never throws (`NETWORK_ERROR` like `track`). It needs
  no user. The client checks a real calendar date and duplicate days, the same rules the route enforces.
- **D5 — Dual build.** `tsconfig.build.json` (CJS → `dist/cjs/`) plus `tsconfig.esm.json` (ESNext → `dist/esm/`, with a
  `{"type":"module"}` marker), `exports` with `import`, `require` and `types`; `main` keeps pointing at CJS for old
  resolvers. A packed-tarball test imports and requires it from a scratch project.
- **D6 — The 0.6.0 surface is frozen** (gate decision a): a test calls every 0.6.0 export and client method with its
  0.6.0 argument shapes and asserts the result shapes; nothing is removed or renamed, the scenario API included.

- **Corrections from the verifier on #331 (2026-10-09):**
  - **D1/D2: the config is read on every call, as 0.6.0 did**, and "absent" means `!('baseUrl' in config)`. Reading it
    once at construction with `hasOwnProperty` sent a class-getter, inherited or filled-in-later `baseUrl` (and the flag
    read key, through the provider) to production; `surface-freeze.test` now pins those three shapes.
  - **Identity:** `identify`/`reset` set an explicit choice; until either is called the client follows `config.userId`
    live (0.6.0 behaviour). A whitespace-only id counts as none, in the constructor as in `identify`.
  - **D5's test** proves both halves through the package's own `exports` (self-reference), not a packed tarball; the
    verifier packed and installed it by hand (ESM, CJS, types under nodenext/bundler/node10, and the CLI with 1.0).
  - **S2.2 deviations:** the snippets keep `GROWTH_ENGINE_API_KEY`, the name the plugin's roadmap push and FinOps
    hooks read (a new name would have silently disabled them); the revenue sync stays on its own fetch, because a
    root script must not depend on a built SDK (the seed scripts avoid it for the same reason).
  - **Release order:** publish only after the gate is green and every finding is answered (npm versions are
    immutable), then merge.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 · Start in one line | S1.1 One line to start · S1.2 Who the user is · S1.3 A North Star input in one call | high |
| 2 · Ship it | S2.1 import and require both work · S2.2 The quickstarts start in one line · S2.3 SDK 1.0.0 | high |

## Deploy order
ONE PR for both sprints (no stack: plugin-1-0's stacked PRs merged into their bases, not main). Console snippets deploy on merge; SDK 1.0.0 publishes BEFORE the merge (Daniel's 2FA step, from the branch): the console's snippets show `identify()` and `pushInputValues()`, so `npm i @golden-frijoles/sdk` must already give a version that has them.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `frijoles flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
