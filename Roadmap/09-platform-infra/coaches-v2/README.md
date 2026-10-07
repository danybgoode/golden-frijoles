---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: coaches-v2
title: "Coaches v2: a cold read first, then coaches that read each other, save as they go and leave one-pagers"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 3
stories_total: 9   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 72    # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Coaches v2: a cold read first, then coaches that read each other, save as they go and leave one-pagers

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/coaches-v2.md`](../../00-ideas/seeds/coaches-v2.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
The three coaches got this product to an agreed narrative, North Star and riskiest assumption, and surfaced 15 problems a
stranger would hit (dogfood-launch-2026-10). This bet makes the sequence cohesive (a cold read first, coaches that read
each other, save as they go, check the product and offer options), shows progress, and leaves three one-pagers a maker
can consult in seconds. It builds on bet A's names. Pitch: `00-ideas/seeds/coaches-v2.md`. Moves: grounded_bets_share ·
Tests: Value proposition.

## Platform-first note
Strategy lives in files the maker owns (`strategy/`), read by `groom/strategy.mjs`; the engine's North Star sync is
unchanged. The other-family runner exists (`scripts/lib/cross-agent-cli.mjs`). No engine change.

## What already exists (reuse, don't rebuild)
- The three coach skills, their templates and `strategy-templates.test`; `groom/strategy.mjs`
- `scripts/lib/cross-agent-cli.mjs` (Codex, Gemini, Mistral)
- Reference implementations from this run: `00-strategy/blind/2026-10-04-compare.md`, `north-star/nsm.py`,
  `business-model-scenarios.md`, the dogfood log's findings F2–F5, F7–F9, F11, F13–F15, F17, F19, F22

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The cold-read skill | low |
| 1 | S1.2 The compare | low |
| 2 | S2.1 One shared coach reference | low |
| 2 | S2.2 Options, research and current use cases | low |
| 2 | S2.3 Delegation, the product check and private strategy | low |
| 2 | S2.4 Ladder up: an example becomes a need, with evidence | low |
| 3 | S3.1 Per-coach fixes | low |
| 3 | S3.2 Standalone one-pagers | low |
| 3 | S3.3 Voice, sources and one copy | low |

## Deploy order
After bet A's wave 1 (plugin 0.28.0), as the next plugin minor. No engine deploy. The value proposition sheet ships
without the VPC; the VPC only with Strategyzer's permission (owed to the PO).

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
