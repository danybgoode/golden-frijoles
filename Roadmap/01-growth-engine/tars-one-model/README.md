---
status: shipped   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shipped             # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-12T20:41:52Z"
slug: tars-one-model
title: "TARS, one model: every funnel reads the same stages"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=20, p25–p75"
hypothesis: "Today one project reads the same funnel two ways: older features count anyone who saw them as targeted, and newer ones count everyone. Founders cannot compare their features or trust the numbers. Read every funnel one way and say so on screen. We will know when every funnel a founder opens uses the same stages."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, reading whether their features worked"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "a launch fix: one project must read TARS one way; no input measures that"   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 78      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
actual_usd: 12.98
actual_mtok: 45
actual_models: "claude-opus-5-5 ≈$12.82 · claude-sonnet-5-5 ≈$0.16"
actual_basis: "this machine · 2026-10-13 · 1 session · prices 2026-10-02"
---

# Epic: TARS, one model: every funnel reads the same stages

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/tars-one-model.md`](../../00-ideas/seeds/tars-one-model.md)
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
Today one project reads the same funnel two ways: older features count anyone who saw them as targeted, and newer ones
count everyone. Founders cannot compare their features or trust the numbers. Every funnel now reads the same stages,
across the feature's whole life by default, and the change is said on screen.

## Architecture lock (D1–D9)
- **D1 · One model** (`lib/flag-funnel.ts`, pure). `computeFlagFunnel` becomes `computeFunnel(events, measure, options)`
  with an **exposure rule**: `{ kind: 'flag', flagKey }` (a `flag_evaluated` event for that flag with variant `on`) or
  `{ kind: 'feature', featureKey, targetEvent }` (an event of that feature named `targetEvent`, or any event of it when
  null). Stages unchanged: base → targeted (everyone) → exposed → adopted → retained → satisfied, adopters without
  exposure beside. A null `adoptedEvent` (a registry feature that names none) gives adopted, retained and satisfied
  **null** ("name an adoption event"), never "everyone exposed adopted".
- **D2 · The period is a cohort** (Daniel, b). `options.since`: exposed = people whose FIRST exposure (all time) is at or
  after `since`; adopted, retained and satisfied are counted for them only; adopted-without-exposure = adopters in the
  period with no exposure at or before their adoption. Periods: `all` (since = first exposure, the default), `90d`,
  `30d`. The 90-day cap goes.
- **D3 · One read** (`lib/flag-funnel-read.ts` → `readFunnel(client, projectId, source, measure, period, now)`): the same
  three bounded, paged reads. Exposures all-time (to find each first exposure); the measure's own events from `since`
  to now (complete for the cohort, whose adoption is never before its exposure); the base active in the period. A
  feature source scopes exposures AND its events to `feature_id = featureKey` (as `tars-query` does today); a flag
  source reads its events project-wide (as now). One project per read.
- **D4 · Cached** (`event-catalog-query.ts`): `getFlagFunnel` and a new `getFeatureFunnel` both go through one cached
  wrapper keyed by project, source, measure and period (5 minutes).
- **D5 · The API and the connector** (Daniel, a): `/api/v1/features/[key]/funnel`, `/api/v1/public/funnel` and the
  connector's `get_tars_funnel` return `funnel` (the read: state, stages, rates, from, to, period, truncated) **in place
  of** `tars`; `?period=all|90d|30d` (default `all`). The public route stays demo-only (rule 2). The tool keeps its name;
  its description says the stages.
- **D6 · Every screen**: the flag's feature pane, the funnel page and the epic page render `FlagFunnel` (the shared
  table); a period choice (Whole life · Last 90 days · Last 30 days) is a link with `?period=`, read server-side. A
  disabled feature shows its funnel and says it is switched off.
- **D7 · Reports**: the Pod Report table, the portfolio's funnel-stage cell and the friction rule read `exposed`,
  `adopted`, `retained` (whole life). The friction rule compares adopted to **exposed**; threshold unchanged.
- **D8 · The note**: where a feature funnel shows, "Funnels now count adoption among the people who got the feature,
  across its whole life. Numbers before 12 Oct 2026 counted it differently." Shown until 30 days after this ships
  (`FUNNEL_MODEL_NOTE_UNTIL`), then gone by itself.
- *(D9 amended at build: CI's signed-in suite runs only with the gates on, so the switch cannot be flipped there. Both
  halves read the public demo epic page's server-rendered HTML instead: ON in `hub.spec.ts` (the one file allowed to
  push the demo roadmap, serially), OFF in `flag-funnel-dark.spec.ts` in the gates-off pass. The page is a server
  component, so its HTML is what a browser receives.)*
- **D9 · The browser spec** (`e2e/flag-funnel-ui.spec.ts`, authed): an epic in the fixture project with a flag and an
  `adopted_event`, pushed with the roadmap; with `bets.flag_funnels_enabled` on, the epic page shows its funnel and the
  period choice; off, no funnel. Runs in the gates-on and gates-off passes. No plugin or CLI release (web only).

## Platform-first note
<!-- Does the platform's own system of record already model this? Which primitive backs it?
     (This project's AGENTS.md data-ownership rule.) -->

## What already exists (reuse, don't rebuild)
<!-- Concrete files / routes / primitives the platform-first reframe surfaced. -->
-

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 · One model | S1.1 the model takes an exposure rule and a period (Opus) · S1.2 one bounded, cached read for flags and features (Opus) · S1.3 the API and connector return `funnel` (Opus) | high |
| 2 · Everywhere it shows | S2.1 the feature pane, funnel page and epic page, with the period choice (Sonnet) · S2.2 the Pod Report, portfolio and friction rule (Sonnet) · S2.3 the "numbers moved" note (Sonnet) · S2.4 the browser spec, on and off (Opus) | high |

## Deploy order
<!-- Backend-first? Frontend degrade gracefully? Preview vs prod. -->

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
