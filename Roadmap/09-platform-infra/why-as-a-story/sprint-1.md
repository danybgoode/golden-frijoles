---
epic: why-as-a-story
sprint: 1
title: "The Why"
risk: low
phase: In review
stories_total: 3
stories:
  - id: S1.1
    title: "The Why is a short story"
    as_a: "a founder approving a bet"
    i_want: "the Why written as a short plain story from my strategy"
    so_that: "I can explain and defend the bet"
    risk: low
    status: done
  - id: S1.2
    title: "The Why guard and the story question"
    as_a: "a founder approving a bet"
    i_want: "a Why that is too long or full of internal words caught before I see it"
    so_that: "what I approve reads plainly"
    risk: medium
    status: done
  - id: S1.3
    title: "The Why shows in full"
    as_a: "a founder following a build"
    i_want: "the whole Why in the build view"
    so_that: "I never read half a sentence"
    risk: low
    status: done
---
# The Why reads as a story, in full, and the plan names its crew — Sprint 1: The Why

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 1.1 — The Why is a short story
**As** a founder approving a bet, **I want** the Why written as a short plain story from my strategy, **so that** I can explain and defend the bet.
**Acceptance:** result-record.md has the D1 rule and the one-bet-wired before/after; refine's bet step reads the strategy files first.
**Risk:** low · **Builder (planned):** Sonnet

### Story 1.2 — The Why guard and the story question
**As** a founder approving a bet, **I want** a Why that is too long or full of internal words caught before I see it, **so that** what I approve reads plainly.
**Acceptance:** `whyProblems` + tests; `why-check` in the kit; scaffold refuses a failing Feature hypothesis; intent-match reports the story question outside its total.
**Risk:** medium · **Builder (planned):** Opus

### Story 1.3 — The Why shows in full
**As** a founder following a build, **I want** the whole Why in the build view, **so that** I never read half a sentence.
**Acceptance:** `whyLines` wraps to four lines, tested at 80 columns with this epic's Why and a long one.
**Risk:** low · **Builder (planned):** Opus

## Sprint QA
- **unit:** the touched scripts' tests (`node --test`), Skills CI locally (the gate script)
- **browser smoke owed:** no (terminal and docs only)
- **deterministic gate:** typecheck + unit + Skills CI green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
1. Run refine on a new idea and read the bet step's Why
   → two or three plain sentences, no file names, and the build view shows all of it
