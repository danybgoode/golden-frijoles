---
epic: fund-at-approval
sprint: 1
title: "Fund at approval"
risk: low
phase: In review
stories_total: 6
stories:
  - id: S1.1
    title: "fund.mjs: cycle row, underwritten_by, queue placement"
    as_a: "a product owner approving a pitch"
    i_want: "the bet recorded and placed in the queue by one command"
    so_that: "nobody renumbers build_order by hand and shipped history keeps its numbers"
    risk: low
    status: done
  - id: S1.2
    title: "The cycle file opens itself (one per month)"
    as_a: "a product owner"
    i_want: "the month's cycle file created on first use"
    so_that: "starting a cycle needs no wave-boundary meeting"
    risk: low
    status: done
  - id: S1.3
    title: "The gate: approve funds, approve-don't-fund stays ready"
    as_a: "a product owner at groom's approval gate"
    i_want: "one answer that funds and scaffolds the bet in the same commit"
    so_that: "nothing leaves grooming scaffolded but unfunded, with no follow-up step"
    risk: low
    status: done
  - id: S1.4
    title: "The guard, the backfill, and priority retired"
    as_a: "a product owner reading the board"
    i_want: "the board to fail on an unfunded live bet, after an honest backfill"
    so_that: "scaffolded means funded, enforced rather than hoped for"
    risk: low
    status: done
  - id: S1.5
    title: "A fixed-scope seed scaffolds and kicks off without a detour (F33)"
    as_a: "a builder handed a funded fixed-scope seed"
    i_want: "scaffold-epic to take the seed alone and the kickoff generators to point at it"
    so_that: "no hand-written prompt is ever needed for a seed"
    risk: low
    status: done
  - id: S1.6
    title: "Docs: the flow, betting rules and the wave-boundary re-bet"
    as_a: "anyone reading how seeds flow"
    i_want: "the docs to describe funding at approval"
    so_that: "the written process matches the one the tools run"
    risk: low
    status: done
---
# Fund at approval: the approval gate is the betting table — Sprint 1: Fund at approval

**Status:** 🟦 In review — all six stories built; PR open

## Stories

### Story 1.1 — `fund.mjs`: cycle row, `underwritten_by`, queue placement ✅ `60cebf0`
**As a** product owner approving a pitch, **I want** the bet recorded and placed in the queue by one command, **so that**
nobody renumbers `build_order` by hand and shipped history keeps its numbers.
**Acceptance:** `fund.mjs --after <slug>` and `--next` place a bet in the queue; shipped `build_order` values never
change (seed AC 3). The seed gets `underwritten_by`, `build_order`, `appetite` and `status: queued`; the cycle file gets
one row (bet · appetite · displaced). Placement follows README D4.
**Risk:** low

### Story 1.2 — The cycle file opens itself (one per month) ✅ `60cebf0`
**As a** product owner, **I want** the month's cycle file created on first use, **so that** starting a cycle needs no
wave-boundary meeting.
**Acceptance:** the cycle file for the month is created on first use (seed AC 5), with the bets README's table shape;
a second bet that month appends to it (README D2).
**Risk:** low

### Story 1.3 — The gate: approve funds, "approve, don't fund" stays ready ✅ `9abdcf3`
**As a** product owner at `groom`'s approval gate, **I want** one answer that funds and scaffolds the bet in the same
commit, **so that** nothing leaves grooming scaffolded but unfunded, with no follow-up step.
**Acceptance:** approving a pitch in `groom` writes the cycle row, `underwritten_by` and the build position in the same
commit as the scaffold, with no further step (seed AC 1). "Approve, don't fund" leaves the seed at `ready` and
scaffolds nothing (seed AC 2). `scaffold-epic` refuses a seed with no `underwritten_by` (README D5).
**Risk:** low

### Story 1.4 — The guard, the backfill, and `priority:` retired ✅ `0f604a6`
**As a** product owner reading the board, **I want** the board to fail on an unfunded live bet, after an honest
backfill, **so that** scaffolded means funded, enforced rather than hoped for.
**Acceptance:** `build-order.mjs` fails on a scaffolded bet with no `underwritten_by`; passes after the backfill (seed
AC 4). `priority:` is gone from the seeds, the template and the extractor (README D9, D10).
**Risk:** low

### Story 1.5 — A fixed-scope seed scaffolds and kicks off without a detour (F33) ✅ `b46688e`
**As a** builder handed a funded fixed-scope seed, **I want** `scaffold-epic` to take the seed alone and the kickoff
generators to point at it, **so that** no hand-written prompt is ever needed for a seed.
**Acceptance:** `scaffold-epic.mjs --slug <seed>` with no other flags scaffolds a one-sprint epic whose stories are the
seed's acceptance criteria; `emit-epic-kickoff --epic <seed-slug>` on an unscaffolded seed names the scaffold command
(README D11).
**Risk:** low

### Story 1.6 — Docs: the flow, betting rules and the wave-boundary re-bet ✅ `6e0eea6`
**As** anyone reading how seeds flow, **I want** the docs to describe funding at approval, **so that** the written
process matches the one the tools run.
**Acceptance:** `00-ideas/README.md` (*How seeds flow*, the frontmatter block, *Ordering*), WAYS-OF-WORKING → *Betting &
appetite* and `bets/README.md` describe fund-at-approval, monthly cycles and the one-line re-bet for an L bet at the
wave boundary (README D7), in this repo and in the template skeleton.
**Risk:** low

## Sprint QA
- **specs:** `fund.test.mjs` (placement, shipped numbers fixed, cycle file created, re-bet), `scaffold-epic.test.mjs`
  (seed defaults, AC → stories, refuses unfunded, build_order copied), the kickoff spec (seed slug hint), the
  build-order guard (fails unfunded, passes funded). Each observed failing once by a mutation.
- **browser smoke owed:** no — tooling only.
- **deterministic gate:** skills-ci (node tests, check-release, render-hook-vendor `--check`, skeleton parity),
  `node scripts/check-script-parity.mjs`, `node scripts/build-order.mjs --check`, `doc-format`.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: a local checkout of this repo on `main` after the merge (no URL: planning tooling).

1. Run `node skills/plugins/golden-frijoles/skills/groom/fund.mjs --slug analytics-visualization-layer --appetite M --displaced "smoke only" --next --dry-run`
   → it prints the cycle row it would append to `Roadmap/bets/wave-<this month>.md`, the new numbers for the queue
   only (60 onwards), and no shipped epic in the list.
2. Groom a throwaway idea with `groom` and answer **approve & fund** at the gate.
   → one commit holds the seed (`underwritten_by`, `build_order`, `status: scaffolded`), the epic folder, the cycle
   row and `BUILD-ORDER.md`. Nothing was asked after "approve".
3. Groom another and answer **approve, don't fund**.
   → the seed stays `ready`; no epic folder; no cycle row.
4. Delete `underwritten_by:` from any scaffolded epic's seed and run `node scripts/build-order.mjs --check`.
   → it fails naming that epic. Restore the line → it passes.
5. Run `node skills/plugins/golden-frijoles/skills/groom/vendor/emit-epic-kickoff.mjs --epic <a ready seed's slug>`.
   → it says the seed has no epic yet and prints the `scaffold-epic.mjs --slug <slug>` command.

If any step fails, note the step number + what you saw — that's the bug report.
