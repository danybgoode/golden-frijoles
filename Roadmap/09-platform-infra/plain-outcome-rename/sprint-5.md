---
epic: plain-outcome-rename
sprint: 5
title: "Console and report labels"
risk: low
wave: 2
phase: Shaping
stories_total: 2
stories:
  - id: S5.1
    title: "Console and report labels"
    as_a: "a signed-in maker"
    i_want: "the console to say Board, Outcome report, Adoption funnel (Reached · Adopted · Retained) and semantic check, rendering stored statuses with the new labels"
    so_that: "the console matches the plugin and the repo"
    risk: low
    status: planned
  - id: S5.2
    title: "Walkthrough and the roadmap overview"
    as_a: "the product owner"
    i_want: "the smoke walkthrough run on production and the roadmap overview (`Roadmap/README.md`) rewritten in the new words"
    so_that: "the launch surfaces are verified, not assumed"
    risk: low
    status: planned
---
# Plain Outcome — Sprint 5: Console and report labels

**Status:** ⬜ not started · **Wave:** 2 (re-bet at the wave boundary)

## Stories

### Story 5.1 — Console and report labels
**As a** a signed-in maker, **I want** the console to say Board, Outcome report, Adoption funnel (Reached · Adopted · Retained) and semantic check, rendering stored statuses with the new labels, **so that** the console matches the plugin and the repo.
**Acceptance:** No stored value is migrated; the label map is one module with a test; screenshots of Board, Outcome report and the funnel attached to the PR.
**Risk:** low

### Story 5.2 — Walkthrough and the roadmap overview
**As a** the product owner, **I want** the smoke walkthrough run on production and the roadmap overview (`Roadmap/README.md`) rewritten in the new words, **so that** the launch surfaces are verified, not assumed.
**Acceptance:** The walkthrough passes blind; the overview has no retired word and no Golden Beans title.
**Risk:** low

## Sprint QA
- **specs:** pure-logic specs on the extracted seam (fixtures per old value, per layout, per env name); no test edits an existing fixture to pass.
- **browser smoke owed:** yes, to the product owner: the Board and report labels on production.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + unit and `api` suites green; `check-release` and `check-onboarding-parity` green for any `skills/` change (a plugin release under `skills/RELEASING.md`).

## Sprint 5 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Open https://goldenfrijoles.com/hub/<your-project>
   → the page is titled Board.
2. Open the shared report link from a bet
   → it is titled Outcome report.
3. Open https://goldenfrijoles.com/app/funnel/<your-project>
   → stages read Reached · Adopted · Retained.

If any step fails, note the step number + what you saw — that's the bug report.
