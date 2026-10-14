---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: drill-impact-for-agents
title: "Drill impact for agents"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "A drill's impact comparison is empty unless a Miyagi admin key captures it. Letting an owner's agent bind a drill to an experiment and capture its impact at stop puts the evidence on the CLI and the page. We'll know when a stopped drill has impact."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "stopped drills with impact evidence recorded (scenario_impact_evidence rows, golden-frijoles)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, rehearsing a failure before customers meet it"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "Drills prove resilience, not a bet's outcome; no North Star input counts them."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 93      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Drill impact for agents

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/drill-impact-for-agents.md`](../../00-ideas/seeds/drill-impact-for-agents.md)
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
A drill's impact comparison is empty unless a Miyagi admin key captures it, so the product owner's D11 judgment
(could the comparison be misread as a causal claim about customers?) was never made. An owner's agent binds a drill to
an experiment, impact is captured when it stops, and agents read it from the CLI and the connector. We'll know when
stopped drills have impact: 0 → 2 within 30 days of shipping.


## Platform-first note
Everything downstream exists: the canonical experiment analysis, the evidence table, the page's rendering. What's
missing is the binding and an owner door, the same gap target setup had before `scenarios-light-up` D2/D3, closed the
same way (`owner_*` functions behind `lib/scenario-owner-service.ts`). Tenancy holds: every function takes one
`project_id` and re-checks membership. The Miyagi key path stays.


## What already exists (reuse, don't rebuild)
- `apps/web/lib/scenario-impact-operations.ts`, `lib/scenario-impact.ts`, `lib/scenario-impact-link.ts`.
- `apps/web/lib/scenario-owner-service.ts`, `apps/web/app/api/v1/cli/scenarios/route.ts`, `packages/cli/src/commands/scenarios.ts`.
- Migrations: `20260809130000_scenario_impact_evidence.sql` (the key-hash pair to mirror),
  `20260813100000_scenario_owner_operations.sql` (the `owner_*` pattern).
- `packages/sdk/src/scenarios.ts` (`experiment?`), `lib/scenario-authoring-draft.ts`, `lib/mcp-scenario-tools.ts`,
  `apps/web/app/app/scenarios/[projectSlug]/drill-evidence.tsx`.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Bind to an experiment · S1.2 Owner impact functions · S1.3 Capture at stop | high |
| 2 | S2.1 CLI impact read · S2.2 Connector impact state · S2.3 D11 judged (product owner) | low |

## Deploy order
Sprint 1's migration is `supabase db push`ed before its merge. No new flag: scenario authoring's switch already
gates both doors. The CLI release (S2.1, S2.2's agents) is an npm publish owed to the product owner, and S2.3's
walkthrough needs it.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
