---
epic: plugin-1-0
sprint: 2
title: "Refine and Refining"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "The skill is refine"
    as_a: "a founder installing Golden Frijoles"
    i_want: "to call the planning skill `refine`"
    so_that: "its name says what it does to my idea"
    risk: high
    status: planned
  - id: S2.2
    title: "The screens say Refining and Backlog"
    as_a: "a founder reading the board"
    i_want: "to see Backlog \u2192 Refining \u2192 Ready"
    so_that: "the stages read as plain agile"
    risk: low
    status: planned
  - id: S2.3
    title: "The retired words stay retired"
    as_a: "a founder reading any gate or screen"
    i_want: "never to meet groom, grooming, fund or displace"
    so_that: "the vocabulary holds"
    risk: low
    status: planned
---
# Plugin 1.0 — Sprint 2: Refine and Refining

**Status:** ⬜ not started

## Stories

### Story 2.1 — The skill is refine
**As** a founder installing Golden Frijoles, **I want** to call the planning skill `refine`, **so that** its name says what it does to my idea.
**Acceptance:** `skills/plugins/golden-frijoles/skills/groom/` → `refine/`; every generator locator (`GROOM=` blocks → `REFINE=`), reference, hook (`build-view`), vendored copy and script path follows; `pack-skills`, `check-plugin-leaks`, `check-onboarding-parity`, `render-hook-vendor` pass.
**Risk:** high

### Story 2.2 — The screens say Refining and Backlog
**As** a founder reading the board, **I want** to see Backlog → Refining → Ready, **so that** the stages read as plain agile.
**Acceptance:** Labels only, through `stageLabel()`: "To groom" → "Backlog", "Grooming" → "Refining" on the board, epic page, Hub roadmap, build view and generated BUILD-ORDER headings; keys in `stage.mjs` / `hub-areas.ts` unchanged. Console visual baselines re-approved.
**Risk:** low

### Story 2.3 — The retired words stay retired
**As** a founder reading any gate or screen, **I want** never to meet groom, grooming, fund or displace, **so that** the vocabulary holds.
**Acceptance:** `check-gate-words` bans groom/grooming on screen; the L-bet re-bet question (WAYS-OF-WORKING + epic kickoff) and the root SESSION-KICKOFFS shaped-bet row are reworded in plain agile.
**Risk:** low

## Sprint QA
- **specs:** named per story above; pure-logic `node:test` specs on the scripts, the existing e2e suites for console labels.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `npm run test:unit` + Playwright `api` green; skills CI green on the split.
