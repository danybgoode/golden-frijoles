---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: gates-in-plain-agile
title: "Gates in plain agile"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 68      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Gates in plain agile

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/gates-in-plain-agile.md`](../../00-ideas/seeds/gates-in-plain-agile.md)
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
The first run happens in the terminal, and its gates speak our bookkeeping: groom ends with "approve (fund +
scaffold) · approve, don't fund · change something" over a Bet block of cycle, position and displaced; the coaches
ask to mark files `agreed`; the build hand-off says kickoff and epic mode. Each gate has its own shape (F42). This
epic gives the Strategy, Plan and Build gates one shape (where to read it, what's decided for you, the two or three
things only you decide, then Approve · Park it · Change something) in decision 1's plain agile words, and keeps the
bookkeeping words off the screen. Files and their values don't change. Launch epic 7 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md); its own epic, so `coaches-v2` stays
after launch. Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** a founder who knows agile runs setup to the first `/build` without asking what a word means.

## Platform-first note
No runtime change. The gates are text the skills print; the records behind them (`fund.mjs`'s cycle row,
`underwritten_by`, `status: agreed`, the scaffold) stay exactly as they are. Only what a person reads changes.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/skills/groom/SKILL.md` (Stages 7 and 8), `groom/references/funding.md` (the Bet
  block), `groom/references/kill-switch.md`, `fund.mjs`, `session-line.mjs`.
- `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md` (setup, Stage 3 routing), the `pmf-narrative`,
  `north-star` and `risk-validation` skills.
- `skills/template/Roadmap/{WAYS-OF-WORKING,SESSION-KICKOFFS}.md`, `skills/kit/dist/skeleton/`,
  `Roadmap/WAYS-OF-WORKING.md`, `scripts/check-template-drift.mjs`, `scripts/semantic-lint.mjs`,
  `scripts/lib/prose-guard.mjs`.
- From launch epic 4: the target, the read date and the groom question.
- Design source: the private canvas: Gates, StrategyGate, PlanGate, Approved.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One shape for every gate | low |
| 1 | S1.2 The Plan gate, in plain words | low |
| 1 | S1.3 The Build gate | low |
| 2 | S2.1 The Strategy gate | low |
| 2 | S2.2 The bookkeeping words stay off the screen | low |

**No-gos:** file values, frontmatter keys, folder and script names (the folder move is `plain-outcome-rename` sprint
4) · the Set up gate (epic 2) and the Result gate (epic 4) · the `coaches-v2` improvements · anything in the console ·
new gates or steps.

**Rabbit holes** (detail in the seed): "Park it" is today's "approve, don't fund", no new state · the record still
says what it pushed back · many copies, drift and parity checks stay green · "bet" stays a concept, never a stage or
button · strategy approval writes `status: agreed` per file · "Measured by" never invents event names.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green; the plugin release follows `skills/RELEASING.md`, and the template
and kit copies ship in the same release.

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
