---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: In review     # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-10T01:49:39Z"
slug: one-bet-wired
title: "One bet, wired: the flag knows its epic, its funnel and its read"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 56    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 79
quote_basis: "L, n=5, p25–p75"
hypothesis: "We believe that wiring each bet's flag to its epic, its adoption event and its funnel with one command, and suggesting a Measure flag for every feature, for founders who build with agents, will make every shipped bet readable on its read date, because today a flag knows nothing about the bet behind it and its funnel stays empty unless someone registers a feature by hand. We'll know when a shipped feature's flag shows a non-empty funnel (targeted, adopted, retained) on its epic page by the read date."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, building with agents"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "no baseline yet: no bet has been proven, so cost per proven bet (the input this moves) is undefined until the first verdict"   # only with grounded: false
flag_key: bets.flag_funnels_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 79      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One bet, wired: the flag knows its epic, its funnel and its read

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/one-bet-wired.md`](../../00-ideas/seeds/one-bet-wired.md)
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
We believe that wiring each bet's flag to its epic, its adoption event and its funnel with one command, and suggesting a
Measure flag for every feature, for founders who build with agents, will make every shipped bet readable on its read
date, because today a flag knows nothing about the bet behind it and its funnel stays empty unless someone registers a
feature by hand. We'll know when a shipped feature's flag shows a non-empty funnel on its epic page by the read date.

Funded **not grounded** (Daniel, c): `cost_per_proven_bet` has no baseline until a bet is proven.

## The TARS model (agreed with Daniel, 2026-10-10)
Targeted is a strategy decision (the share of the base that has the problem), not exposure. A flag funnel reads:
**Base** (the project's active users in the period) → **Targeted** (the bet's segment; `everyone` for now, 100% of the
base) → **Exposed** (got the flag `on`) → **Adopted** (the adoption event, among targeted ∩ exposed) → **Retained** (a
repeat within the window) → **Satisfied** (an optional event, else "not measured"); **adopters without exposure** are
shown beside the funnel, never inside its rates. Named segments and moving existing TAR funnels to this model are the
follow-up `tars-segments`. Details in the seed.

## Platform-first note
Every number comes from events already recorded: the SDK's `flag_evaluated` (feature id = the flag key, `tags.variant`)
and the product's own events. The bet's measurement reaches the engine on the **roadmap push**, which already carries
each epic's flag, hypothesis and target, so nothing is registered by hand and nothing needs a migration. Reads are one
project's (the epic page's access gate, the console's membership).

## What already exists (reuse, don't rebuild)
- the roadmap push and its schema (`scripts/roadmap-extract.mjs`, `lib/roadmap-artifact-schema.ts`), the board card
  (`lib/hub-board.ts`), the epic page's flag (`lib/epic-flag.ts`)
- the canonical event reads (`lib/event-catalog-query.ts`, `RESERVED_EVENTS`), `lib/tars.ts` (pure TARS math)
- `frijoles flags create|get` (`--enablement`, `--description`), `lib/cli-auth.ts`
- refine's Stage 6b (`references/kill-switch.md`), the seed template, `scaffold-epic.mjs`, the roadmap contract
- Journeys (`app/app/journeys/[projectSlug]`), `lib/gates.ts`

## Architecture lock (D1–D9)
- **D1 · The bet's measurement** lives in the epic frontmatter: `target_segment` (`everyone`; anything else is refused
  until `tars-segments`), `adopted_event`, `retained_event` (null = the adoption event again), `retention_days`
  (default 7) and `satisfied_event` (optional). With `flag_key`, `hypothesis` and the read date it is the bet. Seed →
  scaffold → contract (`validateBet`) → extract → push schema (nullish, additive) → board card.
- **D2 · The funnel model**, pure, in `lib/flag-funnel.ts` (beside `lib/tars.ts`, which is unchanged): given the period's
  events it returns base, targeted, exposed, adopted, retained, satisfied (or null: not measured) and
  `adoptedWithoutExposure`. Adopted counts users whose adoption event comes at or after their first `on` exposure;
  retained a repeat of the retention event within `retention_days` of adopting; satisfied a satisfied event after
  adopting.
- **D3 · The read**, in the canonical event module: `getFlagFunnelEvents(projectId, flagKey, events, period)`. ONE
  project. The period runs from the flag's first `on` evaluation to now, at most 90 days. Rows are capped (as the event
  catalog caps), and a truncated read says so. Base is the distinct users of any event in the period (system users
  excluded). No `(project_id, created_at)` index exists, so like the event catalog's window it scans the period's rows:
  bounded by the 90 days and the cap, and run only when a measured flag's funnel is shown.
- **D4 · `frijoles bet sync <epic README>`**: reads the README's frontmatter and creates the flag when it does not exist
  (`--enablement --all-envs`: a Measure flag is off until you roll it out; the hypothesis and epic as its description),
  or says it exists and leaves it. It never changes a flag's rules or rollout. The funnel needs nothing more: the bet
  arrives with the roadmap push. Prints what it did; `--json` for agents.
- **D5 · Refine's Stage 6b** (`references/kill-switch.md` and SKILL.md's Stage 6b line) asks two questions in this order:
  **Measure**: "Do you want to know if this worked?" (suggested yes for every Feature epic: an enablement flag rolled
  out you → 10% → 50% → everyone; then the adoption event, the retention event and window, optionally a satisfaction
  event); **Safety**: "Do you need to be able to switch it off fast?" (by risk, a kill switch, as today).
- **D6 · Sign-in where it adds value** (Daniel, b): when the founder answers yes to Measure and is not signed in, one
  sentence and a choice: "Measuring needs a Golden Frijoles account: it serves the flag and counts who used it. Sign in
  now (opens your browser once), or later: the bet is saved here either way." Once per project. While pending, the Plan
  gate's Flag line reads "measured once you sign in". Signed in, the agent runs `bet sync` at the Build gate.
- **D7 · Where the funnel shows**: the epic page, under the flag's state (base → targeted → exposed → adopted → retained
  → satisfied, with rates and "adopted without exposure" beside); and Journeys' **From your flags**, one read-only funnel
  per measured flag, named by its epic. Creating a journey never creates a flag.
- **D8 · The gate**: `bets.flag_funnels_enabled`, a kill switch (GATES row, `FLAG_FUNNELS_ENABLED` off Vercel, fallback
  on; CI on/off lines; dark spec). It gates the funnel on the epic page and on Journeys.
- **D9 · Releases**: CLI **1.3.0** (`bet sync`), plugin + kit **1.5.0** *(amended at build: brand-reveal-error-pages,
  merged meanwhile, took CLI 1.2.0 and plugin 1.4.0)*; npm publishes are Daniel's, before the merge.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The flag funnel on the agreed TARS model (pure) and its bounded read | high |
| 1 | S1.2 The bet's measurement through seed, scaffold, contract and the roadmap push | high |
| 1 | S1.3 `frijoles bet sync` | high |
| 2 | S2.1 Refine's Measure and Safety questions, and sign-in where it adds value | high |
| 2 | S2.2 The funnel on the epic page and Journeys' From your flags, behind its kill switch | high |
| 2 | S2.3 CLI 1.3.0, plugin + kit 1.5.0 | low |

## Deploy order
One PR. The flag `bets.flag_funnels_enabled` is created and serving in every environment before the merge. Kit 1.5.0
and CLI 1.3.0 published by Daniel after the gate and reviews, then the merge.

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
