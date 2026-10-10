---
epic: why-as-a-story
sprint: 2
title: "The crew"
risk: low
phase: Locking architecture
stories_total: 4
stories:
  - id: S2.1
    title: "The crew, planned and actual"
    as_a: "a founder approving a plan"
    i_want: "to see who plans, builds, reviews and writes, and later who really did"
    so_that: "I know where the work and the money went"
    risk: low
    status: planned
  - id: S2.2
    title: "Cheaper builders, really used"
    as_a: "a founder paying for agent time"
    i_want: "well-specified stories built by a cheaper model, taken back when it fails"
    so_that: "the strongest model is spent where judgment matters"
    risk: low
    status: planned
  - id: S2.3
    title: "The checkpoint shape"
    as_a: "a founder checking where things stand"
    i_want: "the same clear checkpoint every time"
    so_that: "I always know what is done, what is next and what you recommend"
    risk: low
    status: planned
  - id: S2.4
    title: "Release"
    as_a: "a founder using the plugin"
    i_want: "these changes in plugin + kit 1.6.0"
    so_that: "my next refine uses them"
    risk: low
    status: planned
---
# The Why reads as a story, in full, and the plan names its crew — Sprint 2: The crew

**Status:** ⬜ not started

## Stories

### Story 2.1 — The crew, planned and actual
**As** a founder approving a plan, **I want** to see who plans, builds, reviews and writes, and later who really did, **so that** I know where the work and the money went.
**Acceptance:** the Plan gate shows the Crew block; `epic-actuals --write` stamps `actual_models`; the retro template has Crew (actual).
**Risk:** low · **Builder (planned):** Sonnet

### Story 2.2 — Cheaper builders, really used
**As** a founder paying for agent time, **I want** well-specified stories built by a cheaper model, taken back when it fails, **so that** the strongest model is spent where judgment matters.
**Acceptance:** the kickoff carries D7's rule and the escalation; WAYS-OF-WORKING points to it.
**Risk:** low · **Builder (planned):** Sonnet

### Story 2.3 — The checkpoint shape
**As** a founder checking where things stand, **I want** the same clear checkpoint every time, **so that** I always know what is done, what is next and what you recommend.
**Acceptance:** `references/checkpoint.md`; refine and the kickoff point to it.
**Risk:** low · **Builder (planned):** Sonnet

### Story 2.4 — Release
**As** a founder using the plugin, **I want** these changes in plugin + kit 1.6.0, **so that** my next refine uses them.
**Acceptance:** versions, CHANGELOG, regenerated files, check-release.
**Risk:** low · **Builder (planned):** Opus

## Sprint QA
- **unit:** the touched scripts' tests (`node --test`), Skills CI locally (the gate script)
- **browser smoke owed:** no (terminal and docs only)
- **deterministic gate:** typecheck + unit + Skills CI green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
1. Run refine to the Plan gate
   → a Crew block naming who plans, builds (which stories), reviews and writes
