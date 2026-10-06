---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: build-view-upgrade
title: "Build view upgrade"
area: 02-commercial
risk: low
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 19
quote_basis: "S, n=5, p25–p75"
build_order: 68      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Build view upgrade

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/build-view-upgrade.md`](../../00-ideas/seeds/build-view-upgrade.md)
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
The build view works, in Daniel's words, but it doesn't say why the epic exists, shows progress as one count, shows the
stage as a sentence, and links to the board's card view in the demo project (F41). This epic adds a Why line
(hypothesis, metric from → to, read date), the story's "As a…, I want…, so that…", one progress bar per sprint, a stage
track in plain words, and a link to the epic's own page. Spend and Board stay as they are. Launch epic 8 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md). Moves: grounded_bets_share · Tests:
Value proposition.

**Signal:** start building an epic; the view says why and how far, and its link opens the epic page.

## Platform-first note
No new data. `scripts/build-state.mjs` already resolves every fact and renders the `lines` the mod shows as-is; the
target and read date come from launch epic 4, the epic page from launch epic 5, the stage words from launch epic 3.

## What already exists (reuse, don't rebuild)
- `scripts/build-state.mjs` (`lines`, `--json`, the board line and `board.hubUrl`), `scripts/build-state.test.mjs`.
- `skills/plugins/golden-frijoles/hooks/{build-view.mjs,index.tsx,vendor/}`, `skills/scripts/render-hook-vendor.mjs`,
  `skills/template/scripts/build-state.mjs`, `scripts/check-script-parity.mjs`.
- `golden-frijoles.config.json` (`board.hubUrl`), `scripts/lib/config-registry.mjs`.
- Design source: the private canvas, page 4: Band (proposed) and BandNow (today).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Why we're building it, while it builds | low |
| 1 | S1.2 Progress by sprint, and the stage as a track | low |
| 1 | S1.3 The link opens the epic's page | low |

**No-gos:** removing Spend or Board (the canvas drops Board; Daniel's call, not this epic's) · new data or a
"questions waiting" marker · the mod's refresh, cache and key · styling beyond what the terminal renders.

**Rabbit holes** (detail in the seed): the mod renders `lines` as-is, so every change lives in `build-state.mjs` ·
narrow terminals: truncate, never wrap the track · no target means "no target set" · three identical copies · the
link only with an https `board.hubUrl` · which project this repo pushes to is checked at the lock (Daniel thinks
`golden-beans-demo`), never guessed.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Deploy order
One PR, merge on green; the hook vendor is re-rendered in the same PR, and the plugin release follows
`skills/RELEASING.md`.

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
