---
epic: grounded-bets
sprint: 1
title: "The cascade in refine"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S1.1
    title: "The reader names the persona and the job; the bet sentence at Stage 1.5"
    as_a: "a founder refining an idea"
    i_want: "refine to draft the bet sentence from my agreed strategy"
    so_that: "the Why says who it is for, which input it moves and why we think so"
    risk: low
    status: done
  - id: S1.2
    title: "The challenge, the override and Bug/Chore"
    as_a: "a founder whose ask moves no North Star input"
    i_want: "two or three reframes from my strategy, once, and the right to fund it anyway"
    so_that: "an ungrounded bet is a choice on the record, not an accident"
    risk: low
    status: done
  - id: S1.3
    title: "The Plan gate shows the bet and its grounding; no strategy offers the North Star once"
    as_a: "a founder at the Plan gate"
    i_want: "to approve the bet itself, grounded or not"
    so_that: "the gate reads as the decision it is"
    risk: low
    status: done
---
# Grounded bets: every Why is a hypothesis traced from the North Star — Sprint 1: The cascade in refine

**Status:** ✅ shipped 2026-10-09 (#334, merge `ff5d426`; plugin + kit 1.1.0)

## Stories

### Story 1.1 — The reader names the persona and the job; the bet sentence at Stage 1.5 ✅ `24192c1`
**As** a founder refining an idea, **I want** refine to draft the bet sentence from my agreed strategy, **so that** the Why says who it is for, which input it moves and why we think so.
**Acceptance:** `strategy.mjs` prints `persona:` and `job:` for both label shapes (template and our narrative); refine's Stage 1.5 drafts `We believe that … for … will … because … We'll know when …` and writes it as the seed's `hypothesis`, with `persona`.
**Risk:** low

### Story 1.2 — The challenge, the override and Bug/Chore ✅ `0d50e47`
**As** a founder whose ask moves no North Star input, **I want** two or three reframes from my strategy, once, and the right to fund it anyway, **so that** an ungrounded bet is a choice on the record, not an accident.
**Acceptance:** the cascade offers the reframes (another input · a smaller cut on the highest domino · a chore) once per seed; an override writes `grounded: false` and `grounded_reason`; a Bug or Chore writes `Why: keeps <X> working` and leaves `grounded` null.
**Risk:** low

### Story 1.3 — The Plan gate shows the bet and its grounding; no strategy offers the North Star once ✅ `ba1f887`
**As** a founder at the Plan gate, **I want** to approve the bet itself, grounded or not, **so that** the gate reads as the decision it is.
**Acceptance:** `gates.md` shows the sentence and `Grounded ..... yes | no — <reason>`; with no strategy, refine offers the North Star chapter once and a decline records `grounded: false — no strategy yet`; `check-gate-words` passes.
**Risk:** low

## Sprint QA
- **unit:** `strategy.test.mjs` (both label shapes, unfilled skipped) · `check-gate-words` · skills tests
- **browser smoke owed:** no (terminal behaviour; Daniel's interactive refine walkthrough, step 2 below)
- **deterministic gate:** the Skills CI replay + `npm run test:unit` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: this repo, a terminal.

1. Run `node skills/plugins/golden-frijoles/skills/refine/strategy.mjs`
   → it prints `persona:` (the founder, solo to mid-size) and `job:` (the Outcome sentence) beside the inputs.
2. (owed to Daniel — interactive) In Claude Code, "let's refine <a small idea that moves no input>"
   → at Stage 1.5 the agent drafts the sentence or offers two or three reframes once; overriding writes `grounded: false` with your reason, and the Plan gate shows `Grounded ..... no — <reason>`.

If any step fails, note the step number + what you saw — that's the bug report.
