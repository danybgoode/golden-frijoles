---
epic: grounded-bets
sprint: 2
title: "Recorded and counted"
risk: low
phase: In review
stories_total: 3
stories:
  - id: S2.1
    title: "grounded through scaffold, push, schema and the epic page"
    as_a: "a founder reading the board"
    i_want: "to see when a bet was funded ungrounded and why"
    so_that: "the record survives past the seed"
    risk: low
    status: done
  - id: S2.2
    title: "bets-grounded.mjs computes the share and pushes it from main"
    as_a: "the product owner"
    i_want: "grounded_bets_share computed from the bets ledger and pushed on every merge"
    so_that: "our own North Star input moves without a hand push"
    risk: low
    status: done
  - id: S2.3
    title: "The flag description carries the hypothesis; plugin + kit 1.1.0"
    as_a: "a founder opening a flag in the console"
    i_want: "the flag to say why it exists"
    so_that: "a flag is never an orphan switch"
    risk: low
    status: done
---
# Grounded bets: every Why is a hypothesis traced from the North Star — Sprint 2: Recorded and counted

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 2.1 — grounded through scaffold, push, schema and the epic page ✅ `63e64bb`
**As** a founder reading the board, **I want** to see when a bet was funded ungrounded and why, **so that** the record survives past the seed.
**Acceptance:** `scaffold-epic` copies `grounded`, `grounded_reason`, `persona`; the extract and push carry `grounded`/`grounded_reason`; the schema accepts them nullish (an older push stays valid); the epic page shows "Grounded: no — <reason>" only when false.
**Risk:** low

### Story 2.2 — bets-grounded.mjs computes the share and pushes it from main ✅ `5bb5e44`
**As** the product owner, **I want** grounded_bets_share computed from the bets ledger and pushed on every merge, **so that** our own North Star input moves without a hand push.
**Acceptance:** `node scripts/bets-grounded.mjs` prints each month's counted bets, grounded ones and the share (Bugs, Chores, backfill excluded; true-without-target reported); `--push` posts today's value to `grounded_bets_share` only when the project's North Star has that input; `roadmap-push.yml` runs it on pushes to `main`.
**Risk:** low

### Story 2.3 — The flag description carries the hypothesis; plugin + kit 1.1.0 ✅ `e710fa0`
**As** a founder opening a flag in the console, **I want** the flag to say why it exists, **so that** a flag is never an orphan switch.
**Acceptance:** Stage 6b's `frijoles flags create` line passes `--description "<hypothesis> (epic <slug>)"`; plugin and kit at 1.1.0 with a CHANGELOG entry; `check-release` agrees.
**Risk:** low

## Sprint QA
- **unit:** `bets-grounded.test.mjs` (month split, dedupe, exclusions, derived grounding, push skip rules) · `scaffold-epic.test.mjs` · `roadmap-artifact-schema` test · epic page render test
- **browser smoke owed:** no (the epic page line is pinned by a render test; checked on production after merge)
- **deterministic gate:** `npm run typecheck` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `node scripts/bets-grounded.mjs`
   → October's counted bets, the grounded ones, and the share (about 0%).
2. After the merge, ask the connector `get_input_readings grounded_bets_share`
   → one reading dated the merge day, with October's share.
3. Open an epic page whose bet is `grounded: false` at https://goldenfrijoles.com/hub/golden-frijoles/epic/<slug>
   → "Grounded: no — <reason>" under the Why.

If any step fails, note the step number + what you saw — that's the bug report.
