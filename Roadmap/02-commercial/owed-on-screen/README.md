---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: owed-on-screen
title: "Owed on screen"
area: 02-commercial
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 81   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "We believe that showing every owed check on the epic page and in one band on the board, for founders who own the product, will cut the open owed checks, because today they live only in a generated file nobody opens (85 open on 2026-10-14, 24 of them answers only the owner can give). We'll know when the open count falls."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "open owed checks (OWED-LEDGER.json total)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 83   # from what, a number
target_to: 40       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, closing the loop on what their agents built"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "An operator surface: it clears what stalls epic close-outs, where verdicts are stamped, but no North Star input counts owed checks directly."   # only with grounded: false
flag_key: hub.owed_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: owed_viewed
retained_event: null
retention_days: null
satisfied_event: null
build_order: 92      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Owed on screen

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/owed-on-screen.md`](../../00-ideas/seeds/owed-on-screen.md)
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
Owed checks (the walkthroughs, credentials, publishes and answers an epic leaves for its owner) live only in a
generated file: 83 open on 2026-10-14, 24 of them answers only the owner can give. This puts them where a founder
already looks, on the epic page, in one band on the board and as a count on the portfolio, for members only. We'll
know when the open count falls from 83 to 40 within 30 days of shipping.


## Platform-first note
No new table: the ledger already exists (`scripts/owed-ledger.mjs`) and rides the roadmap push like `quote_*` and
`verdict`. The tenancy invariant holds: every read is one project's own push; the portfolio reads through
`getWorkspaceProjects()`. Rule #2: the public project's roadmap stays public, but owed checks are member-only (S1.2).


## What already exists (reuse, don't rebuild)
- `scripts/owed-ledger.mjs` → `OWED-LEDGER.json`; `scripts/roadmap-extract.mjs` → `scripts/roadmap-push.mjs` →
  `POST /api/v1/roadmap/push` → `apps/web/lib/roadmap-artifact-schema.ts`.
- `apps/web/app/hub/[projectSlug]/epic/[epicSlug]/`, `apps/web/app/hub/[projectSlug]/board/`, `apps/web/app/app/portfolio`
  (`lib/portfolio.ts`).
- `apps/web/design-system/bands`, `lib/hub-freshness.ts`, `lib/membership.ts`, `lib/public-connector-scrub.ts`,
  `lib/gates.ts`, `lib/self-track.ts` (`trackSelfEvent`).


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The roadmap push carries each epic's owed checks · S1.2 Only a member ever receives an owed check | high |
| 2 | S2.1 Epic page · S2.2 Board band · S2.3 Portfolio count · S2.4 Flag + measurement | low |

## Deploy order
Sprint 1 first: the push contract and the member-only seam, with no screen. Sprint 2 ships behind
`hub.owed_enabled`, off in production until the product owner sets it on. `roadmap-extract.mjs` is mirrored to
`skills/`, so S1.1 is also a plugin release (`skills/RELEASING.md`). No migration.


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
