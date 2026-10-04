---
epic: plain-outcome-rename
sprint: 1
title: "One lifecycle, read-both"
risk: high
wave: 1
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "Engine accepts old and new statuses (deploys first)"
    as_a: "a maker whose sibling repos still run an older plugin"
    i_want: "the engine to accept both old and new status values on `/api/v1/roadmap/push`, with `live` counted as shipped"
    so_that: "no repo's board breaks during the rollout"
    risk: high
    status: planned
  - id: S1.2
    title: "One lifecycle in the stage resolver"
    as_a: "a maker reading the board"
    i_want: "`scripts/lib/stage.mjs` to resolve every old value (seed, epic, phase, board) to one of idea · shaping · ready · building · review · live · proven · disproven · unclear · archived"
    so_that: "every client shows the same words"
    risk: high
    status: planned
  - id: S1.3
    title: "Writers emit the new values"
    as_a: "a maker shaping a new idea"
    i_want: "the seed template, the scaffolder and the generators to write the new values"
    so_that: "new files never carry an old status"
    risk: high
    status: planned
---
# Plain Outcome — Sprint 1: One lifecycle, read-both

**Status:** ⬜ not started · **Wave:** 1

## Stories

### Story 1.1 — Engine accepts old and new statuses (deploys first)
**As a** a maker whose sibling repos still run an older plugin, **I want** the engine to accept both old and new status values on `/api/v1/roadmap/push`, with `live` counted as shipped, **so that** no repo's board breaks during the rollout.
**Acceptance:** A push with `status: shipped` and a push with `status: live` show the same stage on the Board; `isRoadmapStatusShipped()` is pinned for both; deployed and verified before any client emits a new value.
**Risk:** high

### Story 1.2 — One lifecycle in the stage resolver
**As a** a maker reading the board, **I want** `scripts/lib/stage.mjs` to resolve every old value (seed, epic, phase, board) to one of idea · shaping · ready · building · review · live · proven · disproven · unclear · archived, **so that** every client shows the same words.
**Acceptance:** A fixture per old value maps to exactly one new state; `BUILD-ORDER.md`, the build view and Notion sync show the new labels; Building and Review still come from git facts, never fields (D3).
**Risk:** high

### Story 1.3 — Writers emit the new values
**As a** a maker shaping a new idea, **I want** the seed template, the scaffolder and the generators to write the new values, **so that** new files never carry an old status.
**Acceptance:** A freshly scaffolded bet and idea carry only new values; the status guards accept both old and new; no test edits an old fixture to pass.
**Risk:** high

## Sprint QA
- **specs:** pure-logic specs on the extracted seam (fixtures per old value, per layout, per env name); no test edits an existing fixture to pass.
- **browser smoke owed:** yes, to the product owner: the Board and report labels on production.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + unit and `api` suites green; `check-release` and `check-onboarding-parity` green for any `skills/` change (a plugin release under `skills/RELEASING.md`).

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Open https://goldenfrijoles.com/hub/<your-project> (the Board)
   → columns read Idea · Shaping · Ready · Building · Review · Live.
2. From a repo still on the previous plugin, run `node scripts/roadmap-push.mjs`
   → the Board shows the same bets in the same columns.
3. In Claude Code, `/shape` a throwaway idea
   → the new file's front matter says `status: idea`, and the build view shows *Idea*.

If any step fails, note the step number + what you saw — that's the bug report.
