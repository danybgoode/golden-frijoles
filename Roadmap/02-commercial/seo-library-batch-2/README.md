---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: seo-library-batch-2
title: "SEO library, batch 2"
area: 02-commercial
risk: low
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 79   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 19
quote_basis: "S, n=13, p25–p75"
hypothesis: "Founders searching for spec-kit or PostHog alternatives, the Claude Code plugin marketplace, or spec-driven development in Spanish find nothing from us today. Ten pages that answer those exact searches bring them to the landing, and 3 of the workspaces they start will prove a bet by 3 February."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_landing_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 3       # to what, a number
read_date: 2027-02-03       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "Startup founder who owns the product, building with coding agents, comparing tools or learning the method (some in Spanish)"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: library_visited
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 103     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: SEO library, batch 2

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/seo-library-batch-2.md`](../../00-ideas/seeds/seo-library-batch-2.md)
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
Ten more library pages, each answering a search Google already autocompletes (Spec Kit / PostHog / GrowthBook
alternatives, the Claude Code plugin marketplace, spec-driven development in Spanish), so search brings founders to the
landing on its own. Built on traffic-relaunch S2's content module: entries, not new routes.

## Architecture lock (D1–D4) — verified against live code 2026-11-04
- **D1 · Entries only.** Everything is a `LIBRARY` entry in `lib/content-library.ts`. The routes, sitemap, llms.txt,
  JSON-LD and `library_visited` tags pick the entries up unchanged, so there are no new routes and the route-manifest,
  `coverage.json` and `REACHABLE` stay as they are.
- **D2 · Spanish is a per-entry `lang`.** It is an optional `lang?: 'es'` plus `twin?: { section, slug }`.
  `LibraryEntryPage` renders `<article lang={entry.lang ?? 'en'}>`. `entryMetadata` adds `alternates.languages` for
  both sides of a pair, through a pure `entryLanguages(entry)` helper beside `findEntry`. The root `<html lang="en">` is
  untouched, and a `/es/` tree is out of scope.
- **D3 · Comparisons make no unsourced claims.** Another tool is described in general, hedged terms ("check its site
  for current plans"). No pricing, no star counts, no feature matrices.
- **D4 · One PR on `feat/seo-library-batch-2`.** Built in this session (Opus). Copy approval is Daniel's (S1.3).

## Platform-first note
<!-- Does the platform's own system of record already model this? Which primitive backs it?
     (This project's AGENTS.md data-ownership rule.) -->

## What already exists (reuse, don't rebuild)
<!-- Concrete files / routes / primitives the platform-first reframe surfaced. -->
-

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 Eight English pages | low |
| 1 | 1.2 Two Spanish pages + hreflang | low |
| 1 | 1.3 Daniel approves the copy | low |

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
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
