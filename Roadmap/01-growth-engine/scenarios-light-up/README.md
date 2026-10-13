---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Verifying       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-13T18:44:18Z"
slug: scenarios-light-up
title: "Scenarios, switched on: an agent can set up a target, run a drill and stop it"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 9   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 80   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 56    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 79
quote_basis: "L, n=5, p25–p75"
hypothesis: "The landing offers drills, but nobody can run one: only Miyagi can make an app a target, and an agent has no commands for it. Let an agent run a whole drill from the CLI and the SDK, and a founder from the page. We'll know when an agent has run and stopped one drill on goldenfrijoles.com in production."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, whose agent rehearses a failure before a customer finds it"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "a launch fix: the landing promises drills that nobody can run; no input measures that"   # only with grounded: false
flag_key: ops.scenario_authoring_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 81      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Scenarios, switched on: an agent can set up a target, run a drill and stop it

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/scenarios-light-up.md`](../../00-ideas/seeds/scenarios-light-up.md)
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
The landing and the Measure menu offer drills, and nobody can run one. Making an app a target works only for Miyagi,
an agent has no commands for any of it, and all four switches are off in production. This epic lets an agent do the
whole drill (make the app a target, define, launch, watch, stop) from `frijoles` and the SDK, and a founder do the
same from the scenarios page, starting with goldenfrijoles.com. Then the switches go on.

## Platform-first note
The scenario engine already models targets, definitions, runs, stops and impact (`scenarios-pm-operable`, 10/10).
Nothing here adds a table or a telemetry path (rule #1): one new target kind on `scenario_targets`, owner RPCs beside
the existing `owner_*` ones, and the CLI and connector read through the same owner service the page uses.

## What already exists (reuse, don't rebuild)
- Owner page and actions: `apps/web/app/app/scenarios/[projectSlug]/` (define, launch, stop, revoke).
- Owner RPCs: `supabase/migrations/20260813100000_scenario_owner_operations.sql` (`private.assert_scenario_owner`,
  `owner_*`); credential register/verify in `20260809110000_scenario_operations.sql` (stay as they are).
- Proof and guarded fetch: `lib/scenario-target-proof.ts`, `lib/scenario-admin-operations.ts`.
- CLI auth: `lib/cli-auth.ts` (`requireCliOwner`, `requireCliMember`); commands in `packages/cli/src/commands/`;
  fault flags via `frijoles flags create --type json --variants`; `frijoles keys create --type flag_read`.
- Runtime: `createScenarioProvider`, `trackScenarioExecution` (`packages/sdk`).
- Connector read tools: `lib/mcp-flag-tools.ts` and its parity test.
- Gates: `lib/gates-decision.ts` (`resilienceScenarios`, `securitySimulations`, `scenarioAuthoring`).

## Architecture lock (D1–D10)
- **D1 — Agents first.** Every write a founder can make on the page, an agent can make with `frijoles scenarios`, and
  the reverse. One owner service in `lib/` backs both; neither surface has logic the other lacks.
- **D2 — A new target kind, `owner_token_v1`** (amended at the build, 2026-10-13: an HMAC challenge, not a token echo).
  Registering returns a one-time `gf_target_…` token, stored only as its SHA-256 in `ownership_challenge_hash`. Verify
  sends the app a fresh challenge signed with that hash; the app (the SDK's handler, holding the token) answers with an
  HMAC over it keyed by the same hash. Proof = holding the token, and the token never travels after registration; a
  fresh challenge each time means an answer cannot be replayed. The request goes through the existing guarded fetch.
  Miyagi's `miyagi_resilience_probe_v1` and its signed contract are untouched, and its snapshot reads both kinds.
- **D3 — Owner RPCs, additive.** `owner_register_scenario_target` and `owner_verify_scenario_target`, service-role
  only, project and actor scoped through `private.assert_scenario_owner`, sharing logic with the existing functions
  where it is the same rule. The kind CHECK widens to two values; nothing is dropped. Grant-denial and tenant specs.
- **D4 — The CLI route is owner for writes, member for reads** (`requireCliOwner` / `requireCliMember`), the project
  from the membership, never the body. Every write needs `ops.scenario_authoring_enabled`; a start also needs its
  kind's switch, exactly as the page.
- **D5 — The SDK ships the target side.** `createScenarioOwnershipHandler({ token })`: a Fetch-API handler that answers
  the ownership path and nothing else. No secret leaves the app except the one-time token.
- **D6 — The connector stays read-only.** One tool lists definitions, targets and runs with state and stop reason.
- **D7 — Our site is a target like any other.** It uses the SDK handler (token from env) and a probe seam that answers
  only a request signed with `SCENARIO_PROBE_SECRET` for a `synthetic:` subject; anything else is 404.
- **D8 — The drill turns the switches on first.** A gate has no per-person targeting, so authoring and resilience go
  on just before the drill; if the stop path fails, kill both (≈30 s) and the run's duration cap ends it. Security goes
  on after; no security drill runs in production. Breakers stay off.
- **D9 — Releases.** SDK 1.1.0 and CLI 1.4.0 (minor: added only). npm publish is the product owner's 2FA step; the
  agent drill uses the packed tarballs if publish has not happened yet.
- **D10 — Credentials.** The flag-read key (made headlessly with `frijoles keys create`), the ownership token and the
  probe secret live in Vercel env, never in chat or a file; a commit to `main` lands them (rule #4).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Owner target setup in the engine | high |
| 1 | S1.2 The SDK's ownership handler | high |
| 1 | S1.3 The CLI route over the owner service | high |
| 1 | S1.4 `frijoles scenarios` commands | low |
| 1 | S1.5 Target setup on the page | low |
| 2 | S2.1 The connector's scenarios tool and the agent docs | low |
| 2 | S2.2 goldenfrijoles.com as a target, the probe and the drill script | high |
| 2 | S2.3 The production drill, by an agent; the switches on | high |
| 2 | S2.4 Close `scenarios-pm-operable`; poster | low |

## Deploy order
1. The migration (additive) is applied to production BEFORE the merge, migration-first as every epic here (Supabase
   MCP, or the product owner's `supabase db push`).
2. Merge = deploy (owner setup, CLI route, connector tool, our ownership route and probe; all behind the switches).
3. Publish SDK 1.1.0 and CLI 1.4.0 (product owner, 2FA); plugin and kit 1.7.0 release from CI.
4. Credentials in Vercel env, then a commit to `main` so they land.
5. Switches: authoring + resilience on → the agent drill → the product owner's page stop and impact read → a kill of
   the authoring switch to see the controls go (and come back) → security on.

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
