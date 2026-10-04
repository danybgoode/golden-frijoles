---
epic: plain-outcome-rename
sprint: 4
title: "Layout move with gf-kit migrate-layout"
risk: high
wave: 2
phase: Shaping
stories_total: 3
stories:
  - id: S4.1
    title: "One command moves a repo"
    as_a: "a maker with an existing repo"
    i_want: "`gf-kit migrate-layout` to move `Roadmap/` to the new layout (ideas/, audits/, strategy/, cycles/, bets/<slug>/ with slice-N.md, retro.md, verdict.md), rewriting statuses and internal links"
    so_that: "adopting the new layout costs one command"
    risk: high
    status: planned
  - id: S4.2
    title: "Every reader and the template use the new layout"
    as_a: "a stranger starting fresh"
    i_want: "scripts, CI and guards to read both layouts for one release, and the template to ship the new one with `strategy/` git-ignored by default"
    so_that: "new repos start flat and old ones keep working"
    risk: high
    status: planned
  - id: S4.3
    title: "This repo migrated"
    as_a: "the product owner"
    i_want: "this repo moved by the script, not by hand"
    so_that: "we dogfood the migration a stranger will run"
    risk: high
    status: planned
---
# Plain Outcome — Sprint 4: Layout move with gf-kit migrate-layout

**Status:** ⬜ not started · **Wave:** 2 (re-bet at the wave boundary)

## Stories

### Story 4.1 — One command moves a repo
**As a** a maker with an existing repo, **I want** `gf-kit migrate-layout` to move `Roadmap/` to the new layout (ideas/, audits/, strategy/, cycles/, bets/<slug>/ with slice-N.md, retro.md, verdict.md), rewriting statuses and internal links, **so that** adopting the new layout costs one command.
**Acceptance:** On a fixture repo the script is idempotent, uses `git mv`, rewrites front matter and relative links, and prints what it moved; a dry run changes nothing.
**Risk:** high

### Story 4.2 — Every reader and the template use the new layout
**As a** a stranger starting fresh, **I want** scripts, CI and guards to read both layouts for one release, and the template to ship the new one with `strategy/` git-ignored by default, **so that** new repos start flat and old ones keep working.
**Acceptance:** Every guard passes on both a migrated and an unmigrated fixture; `gf-kit init` creates the new layout; `strategy/` is ignored unless opted in (dogfood F2).
**Risk:** high

### Story 4.3 — This repo migrated
**As a** the product owner, **I want** this repo moved by the script, not by hand, **so that** we dogfood the migration a stranger will run.
**Acceptance:** One commit from the script; CI green; the Board and `ORDER.md` unchanged in content.
**Risk:** high

## Sprint QA
- **specs:** pure-logic specs on the extracted seam (fixtures per old value, per layout, per env name); no test edits an existing fixture to pass.
- **browser smoke owed:** no.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + unit and `api` suites green; `check-release` and `check-onboarding-parity` green for any `skills/` change (a plugin release under `skills/RELEASING.md`).

## Sprint 4 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. In a copy of a repo on the old layout, run `npx -y @golden-frijoles/kit migrate-layout --dry-run`
   → it lists the moves and changes nothing.
2. Run it without `--dry-run`
   → `Roadmap/ideas/`, `Roadmap/bets/<slug>/slice-1.md` exist and `git status` shows renames, not deletes.
3. Run it again
   → it reports nothing to move.

If any step fails, note the step number + what you saw — that's the bug report.
