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
- **unit:** `bets-grounded.test.mjs` (month, exclusions, derived grounding, the push and its skips, input keys from the engine) · `scaffold-epic.test.mjs` · `roadmap-contract.test.mjs` · `roadmap-artifact-schema.test.ts` (grounded nullish, a non-boolean refused) · `hub-board.test.ts` (`toCard`). The epic page's one conditional line has no render test; it is checked on production (step 3).
- **browser smoke owed:** no (the epic page line is checked on production after merge, step 3)
- **deterministic gate:** `npm run typecheck` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `node scripts/bets-grounded.mjs` (with the local `Roadmap/00-strategy/north-star.md`, or with
   `SELF_PROJECT_API_KEY` set so it reads the inputs from the engine; with neither, nothing can be grounded and it reads 0%)
   → October: 1 of 15 grounded (6.7%), the one being this epic; August 0 of 7, September 0 of 5.
2. After the merge, ask the connector `get_input_readings grounded_bets_share`
   → one reading dated the merge day: 0.0667 (October's share).
3. Open an epic page whose bet is `grounded: false` at https://goldenfrijoles.com/hub/golden-frijoles/epic/<slug>
   → "Grounded: no — <reason>" under the Why.

If any step fails, note the step number + what you saw — that's the bug report.
