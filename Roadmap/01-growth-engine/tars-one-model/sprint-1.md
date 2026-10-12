---
epic: tars-one-model
sprint: 1
title: "One model"
risk: high
phase: Locking architecture
stories_total: 3
stories:
  - id: S1.1
    title: "One model, any exposure, any period"
    as_a: "a founder reading whether a feature worked"
    i_want: "every funnel counted the same way, for the people who got the feature in a period"
    so_that: "I can compare features and trust the numbers"
    risk: high
    status: planned
  - id: S1.2
    title: "One read for flags and features"
    as_a: "a founder reading whether a feature worked"
    i_want: "a feature's funnel read the same bounded way a flag's is"
    so_that: "the page stays fast and the numbers are complete"
    risk: high
    status: planned
  - id: S1.3
    title: "The API and connector return the funnel"
    as_a: "a founder asking my agent how a feature did"
    i_want: "the API and the connector to answer with the same stages"
    so_that: "my agent and my screens agree"
    risk: high
    status: planned
---
# TARS, one model: every funnel reads the same stages — Sprint 1: One model

**Status:** ⬜ not started

## Stories

### Story 1.1 — One model, any exposure, any period
**As** a founder reading whether a feature worked, **I want** every funnel counted the same way, for the people who got the feature in a period, **so that** I can compare features and trust the numbers.
**Acceptance:** computeFunnel with an exposure rule (flag or feature) and a cohort `since`; null adoption event gives null stages; unit tests incl. a year-old feature.
**Risk:** high · **Builder (planned):** Opus

### Story 1.2 — One read for flags and features
**As** a founder reading whether a feature worked, **I want** a feature's funnel read the same bounded way a flag's is, **so that** the page stays fast and the numbers are complete.
**Acceptance:** readFunnel with a source and a period; flag funnels lose the 90-day cap; one cached wrapper; the API spec drives it on a fresh project.
**Risk:** high · **Builder (planned):** Opus

### Story 1.3 — The API and connector return the funnel
**As** a founder asking my agent how a feature did, **I want** the API and the connector to answer with the same stages, **so that** my agent and my screens agree.
**Acceptance:** both funnel routes and get_tars_funnel return `funnel` with `?period=`; `tars` is gone; the public route stays demo-only.
**Risk:** high · **Builder (planned):** Opus

## Sprint QA
- **api spec(s):** e2e/flag-funnel.spec.ts (the read, both sources, the periods); the funnel routes' specs
- **browser smoke owed:** no
- **deterministic gate:** typecheck + build + Playwright api + authed green before merge

## Sprint 1 — Smoke walkthrough
1. GET https://goldenfrijoles.com/api/v1/public/funnel?period=all
   → a `funnel` with the stages and the period, no `tars`
