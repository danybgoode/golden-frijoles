---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: build-view-one-story
title: "The build view tells one story"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 1
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 87   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "The build view says the same status on several lines, each from a different source. One headline, one track and one line per fact, with the board as other work, lets a founder read where the build is at a glance. We'll know when the product owner reads it without asking."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, watching an agent build"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "A terminal surface for the founder watching a build; no North Star input counts it."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 95      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: The build view tells one story

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/build-view-one-story.md`](../../00-ideas/seeds/build-view-one-story.md)
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
The build view says the same status on several lines, each from a different source. This redraws it as one story: a
header with the repo, the epic, its size, risk and stories done, the track under it, then Why, Target, Now, Spend and
Around, each fact once, in every state from refining to shipped. The design, with every state drawn, was approved by
Daniel on 2026-10-14 (the seed's *The design*).


## Platform-first note
No new fact: everything comes from `build-state.mjs --json`. The band only decorates (D3): glyphs, layout and tone.
Rules #1–#6 untouched. A plugin release (`skills/RELEASING.md`).


## What already exists (reuse, don't rebuild)
- `skills/template/scripts/build-state.mjs`, `scripts/build-state.mjs`, `skills/plugins/golden-frijoles/hooks/vendor/build-state.mjs`.
- `skills/plugins/golden-frijoles/hooks/build-view.mjs` (`LABEL_GLYPHS`, `toneOf`, `spendOf`, `barsOf`) and
  `hooks/index.tsx` (`TONE_COLORS`, `RISK_COLORS`, the track, the bars, the session line).
- `build-view.test.mjs`, `build-view.mod.test.ts`, `scripts/check-script-parity.mjs`.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Header · S1.2 Sources only on disagreement · S1.3 Why + Target · S1.4 Now · S1.5 Spend, Around, Next · S1.6 5-hour meter · S1.7 No regression | low |

## Deploy order
One plugin release, sharing its window with `template-scripts-consumer-gates` (#95). No migration, no flag; rollback
is the previous plugin version.


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
