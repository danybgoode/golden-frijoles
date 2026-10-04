---
epic: plain-outcome-rename
sprint: 2
title: "Skill and coach renames with stubs"
risk: high
wave: 1
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Skills, agent and coaches answer to their new names"
    as_a: "a stranger who just installed the plugin"
    i_want: "the 14 skills, the review agent and the three coaches to carry the Plain · Outcome names, with a stub under each old name for one release"
    so_that: "nobody's muscle memory breaks while the names change"
    risk: high
    status: planned
  - id: S2.2
    title: "Skill bodies and templates speak Plain · Outcome"
    as_a: "a stranger reading a skill or a generated file"
    i_want: "skill text, references, templates and generators to say idea, bet, slice, task, cycle, plan check and verdict"
    so_that: "the first hour uses one vocabulary"
    risk: low
    status: planned
  - id: S2.3
    title: "Names checked and the release notes written"
    as_a: "a maker updating the plugin"
    i_want: "every new bare name checked against Claude Code built-ins and the existing `/build` mod command, and a migration section in the CHANGELOG"
    so_that: "an update never shadows or surprises"
    risk: low
    status: planned
---
# Plain Outcome — Sprint 2: Skill and coach renames with stubs

**Status:** ⬜ not started · **Wave:** 1

## Stories

### Story 2.1 — Skills, agent and coaches answer to their new names
**As a** a stranger who just installed the plugin, **I want** the 14 skills, the review agent and the three coaches to carry the Plain · Outcome names, with a stub under each old name for one release, **so that** nobody's muscle memory breaks while the names change.
**Acceptance:** Each new name runs its skill; each old name opens a stub that names the new one and runs nothing else; `plugin.json`, the generated adverts, the kit's `requires_scripts` and `check-onboarding-parity` all pass.
**Risk:** high

### Story 2.2 — Skill bodies and templates speak Plain · Outcome
**As a** a stranger reading a skill or a generated file, **I want** skill text, references, templates and generators to say idea, bet, slice, task, cycle, plan check and verdict, **so that** the first hour uses one vocabulary.
**Acceptance:** The retired-words list returns nothing in skill bodies and templates; `strategy.mjs` reads both the old and new coach file names; history files are untouched.
**Risk:** low

### Story 2.3 — Names checked and the release notes written
**As a** a maker updating the plugin, **I want** every new bare name checked against Claude Code built-ins and the existing `/build` mod command, and a migration section in the CHANGELOG, **so that** an update never shadows or surprises.
**Acceptance:** A table of the 18 names with their check result lives in the sprint doc; the CHANGELOG lists old → new and the stub-removal release.
**Risk:** low

## Sprint QA
- **specs:** pure-logic specs on the extracted seam (fixtures per old value, per layout, per env name); no test edits an existing fixture to pass.
- **browser smoke owed:** no.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + unit and `api` suites green; `check-release` and `check-onboarding-parity` green for any `skills/` change (a plugin release under `skills/RELEASING.md`).

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. In Claude Code, type `/`
   → the menu lists start, shape, build, watch-pr, verify, tidy-docs, portfolio-report, draft, daily, weekly, prune-previews, sync-roadmap, narrative, north-star, riskiest-assumption.
2. Type `/groom`
   → a stub says it is now `/shape` and does nothing else.
3. Open any skill's SKILL.md
   → no seed, epic, sprint, wave or kickoff in its text.

If any step fails, note the step number + what you saw — that's the bug report.
