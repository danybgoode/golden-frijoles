---
epic: plain-outcome-rename
sprint: 3
title: "Legacy names out and the retired-words guard"
risk: high
wave: 1
phase: Shaping
stories_total: 3
stories:
  - id: S3.1
    title: "Env vars under the product's name"
    as_a: "a developer wiring the SDK"
    i_want: "the SDK and CLI to read `GOLDEN_FRIJOLES_FLAG_READ_KEY` / `…_SYNC_KEY` and fall back to `GOLDEN_BEANS_*` with one warning"
    so_that: "existing integrations keep working while new ones use the right name"
    risk: high
    status: planned
  - id: S3.2
    title: "One config file and the demo slug"
    as_a: "a maker configuring a project"
    i_want: "`jev.config.json`, `live-smoke.config.json` and `reporting.config.json` folded into `golden-frijoles.config.json` through the config registry, and the demo slug renamed with a redirect"
    so_that: "there is one place to configure and no legacy name in a public URL"
    risk: high
    status: planned
  - id: S3.3
    title: "Retired words gone, and kept gone"
    as_a: "a stranger on any surface"
    i_want: "`dobby`, `ways-of-work`, `golden-beans`, `Golden Beans` and customer names out of the plugin, template, READMEs and console copy, with a `retired-words` CI guard"
    so_that: "they never come back"
    risk: low
    status: planned
---
# Plain Outcome — Sprint 3: Legacy names out and the retired-words guard

**Status:** ⬜ not started · **Wave:** 1

## Stories

### Story 3.1 — Env vars under the product's name
**As a** a developer wiring the SDK, **I want** the SDK and CLI to read `GOLDEN_FRIJOLES_FLAG_READ_KEY` / `…_SYNC_KEY` and fall back to `GOLDEN_BEANS_*` with one warning, **so that** existing integrations keep working while new ones use the right name.
**Acceptance:** Both names work; the old one warns once per process; SDK minor version bumped; README shows only the new name.
**Risk:** high

### Story 3.2 — One config file and the demo slug
**As a** a maker configuring a project, **I want** `jev.config.json`, `live-smoke.config.json` and `reporting.config.json` folded into `golden-frijoles.config.json` through the config registry, and the demo slug renamed with a redirect, **so that** there is one place to configure and no legacy name in a public URL.
**Acceptance:** A project with only the old files behaves identically; `gf-kit config list` shows where each section came from; `/…/golden-beans-demo` redirects.
**Risk:** high

### Story 3.3 — Retired words gone, and kept gone
**As a** a stranger on any surface, **I want** `dobby`, `ways-of-work`, `golden-beans`, `Golden Beans` and customer names out of the plugin, template, READMEs and console copy, with a `retired-words` CI guard, **so that** they never come back.
**Acceptance:** The guard fails on a planted retired word in each surface and passes on main; history paths are allowlisted.
**Risk:** low

## Sprint QA
- **specs:** pure-logic specs on the extracted seam (fixtures per old value, per layout, per env name); no test edits an existing fixture to pass.
- **browser smoke owed:** no.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + unit and `api` suites green; `check-release` and `check-onboarding-parity` green for any `skills/` change (a plugin release under `skills/RELEASING.md`).

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. In a test app, set only `GOLDEN_BEANS_FLAG_READ_KEY`
   → flags resolve, and one warning names the new variable.
2. Open https://goldenfrijoles.com/s/golden-beans-demo
   → it redirects to the golden-frijoles-demo page.
3. Run `gf-kit config list` in a project with the old config files
   → every section shows where it came from.

If any step fails, note the step number + what you saw — that's the bug report.
