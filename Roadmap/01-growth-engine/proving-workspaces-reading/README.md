---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: proving-workspaces-reading
title: "A reading for proving_workspaces"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 87   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 5    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=7, p25–p75"
hypothesis: "Our North Star's breadth input, proving workspaces, has no reading, so the strategy reads it by hand on 15 Dec. Counting a workspace when one of its bets is proven, without any tenant seeing another, makes it a number we can watch. We'll know when it reads itself."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: 2026-12-15       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "The product owner, reading Golden Frijoles' own North Star"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 97      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: A reading for proving_workspaces

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/proving-workspaces-reading.md`](../../00-ideas/seeds/proving-workspaces-reading.md)
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
Our North Star's breadth input, proving workspaces, has no reading, so the strategy reads it by hand on 15 Dec.
The platform records one event in its own project when a bet first reads proven, and inputs learn to count distinct
ids per month, so the number reads itself. Target: 0 → 2 by 2026-12-15 (Daniel, 2026-10-14).


## Platform-first note
Decided 2026-10-14 (Daniel): a self-tracking event, no new scheduler exemption. No tenant observes another: the push
route reads only its own project's previous artifact, and writes one event into the platform's own project (the
`scheduleFirstEventActivation` shape). Rule #2: Golden Frijoles' North Star is public, so the workspace id is an
HMAC and never shown.


## What already exists (reuse, don't rebuild)
- `apps/web/app/api/v1/roadmap/push/route.ts` (the previous artifact, D16), `apps/web/lib/roadmap-artifact-schema.ts`.
- `apps/web/lib/self-track.ts`, the `after()` pattern in `apps/web/app/api/v1/track/route.ts`.
- `apps/web/lib/north-star.ts` (`computeDailySeries`), `lib/north-star-schema.ts`, `lib/north-star-query.ts`,
  `20260716100000_north_star.sql`; `Roadmap/00-strategy/north-star.md`; `frijoles north-star set`.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Emit on proven · S1.2 Distinct per month · S1.3 The input switched | high |

## Deploy order
`SELF_SUBJECT_SECRET` is in Vercel production (added 2026-10-14) and reaches the functions with this epic's merge.
S1.2's migration is `supabase db push`ed before the merge. S1.3's sync runs after the deploy.


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
