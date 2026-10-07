---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: first-run-setup
title: "First run: setup starts"
area: 02-commercial
risk: low
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at groom Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 69      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: First run: setup starts

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/first-run-setup.md`](../../00-ideas/seeds/first-run-setup.md)
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
Setup asks its first questions cold, and an existing product with years of history starts with an empty `Roadmap/`:
nothing it shipped shows on the board and the Outcome report has nothing to read. This epic builds the last part of
the canvas First run flow (frames 7, 8a, 8b): after sign-in, setup says what happened and what it found before asking
anything; an existing project is read into the roadmap (shipped work, open pull requests, issues as ideas) with a dry
run first and nothing moved; a new idea starts with one sentence and a choice between strategy first and a first epic
now. Closes gap 4 of the First run review; gaps 1–3 are handled outside this epic. Re-landed 2026-10-07 (the
first groom commit missed its merge).
Moves: proving_workspaces · Tests: Value proposition.

**Signal:** setup on a real repo with history and issues; the board shows what shipped, what's building and the
backlog, and nothing in the repo moved.

## Platform-first note
Local only. The read writes plain Markdown into `Roadmap/` through the generators that already exist
(`scaffold-epic.mjs`, the seed template), so everything passes the roadmap contract and reaches the Hub only when the
founder pushes. Pull requests and issues come from `gh` when installed; otherwise git alone.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md` (Stage 1 detect, Stage 2 Q1/Q2/Q4, Stage 3 routing).
- `skills/plugins/golden-frijoles/skills/groom/scaffold-epic.mjs`, `templates/scope-seed.md`, `scripts/roadmap-backfill.mjs`,
  `scripts/lib/roadmap-contract.mjs`, `scripts/build-order.mjs`.
- The coaches: `pmf-narrative`, `north-star`, `risk-validation`.
- From launch epics 2, 4, 7: the sign-in result, "not grounded", the gate shape.
- Design source: the private canvas, page 2 · First run: frames 7, 8a, 8b.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Setup says what happened and what it found | low |
| 1 | S1.2 An existing project, read into the roadmap | low |
| 1 | S1.3 A new idea, in a sentence | low |

**No-gos:** persona, business model canvas or value proposition drafts · targets or verdicts for backfilled work ·
moving, renaming or deleting anything, and the folder layout move · issue trackers other than GitHub · console work.

**Rabbit holes** (detail in the seed): what counts as shipped work (merged PRs, else tags, else docs; capped, each
saying where it came from) · issues grouped into ideas, never touched on GitHub · no `gh` means git only, said out loud ·
dry run first · everything through the generators and the contract · nothing leaves the machine unless pushed.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Deploy order
One PR, merge on green; ships in the plugin release after launch epic 7, whose gate shape it uses.

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
