---
epic: tars-one-model
sprint: 2
title: "Everywhere it shows"
risk: high
phase: In review
stories_total: 4
stories:
  - id: S2.1
    title: "The stages on every page, with a period"
    as_a: "a founder reading whether a feature worked"
    i_want: "the same table on the feature pane, the funnel page and the epic page, and a choice of whole life, 90 or 30 days"
    so_that: "I can see how it did across its life or lately"
    risk: medium
    status: done
  - id: S2.2
    title: "Reports read the same stages"
    as_a: "a founder reading my Pod Report"
    i_want: "the report, the portfolio and the friction alert on the new stages"
    so_that: "they agree with the funnel pages"
    risk: medium
    status: done
  - id: S2.3
    title: "Say the numbers moved"
    as_a: "a founder reading whether a feature worked"
    i_want: "a short note that funnels now count differently"
    so_that: "a lower adoption number does not look like a drop"
    risk: low
    status: done
  - id: S2.4
    title: "The switch tested in a browser"
    as_a: "a founder relying on the funnel switch"
    i_want: "the funnel to show when the switch is on and not when it is off"
    so_that: "switching it off really hides it"
    risk: medium
    status: done
---
# TARS, one model: every funnel reads the same stages — Sprint 2: Everywhere it shows

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 2.1 — The stages on every page, with a period
**As** a founder reading whether a feature worked, **I want** the same table on the feature pane, the funnel page and the epic page, and a choice of whole life, 90 or 30 days, **so that** I can see how it did across its life or lately.
**Acceptance:** FlagFunnel on all three; period links read server-side; a disabled feature says so.
**Risk:** medium · **Builder (planned):** Sonnet

### Story 2.2 — Reports read the same stages
**As** a founder reading my Pod Report, **I want** the report, the portfolio and the friction alert on the new stages, **so that** they agree with the funnel pages.
**Acceptance:** pod-report-query, portfolio-model and friction rules read exposed/adopted/retained; friction compares adopted to exposed; tests updated.
**Risk:** medium · **Builder (planned):** Sonnet

### Story 2.3 — Say the numbers moved
**As** a founder reading whether a feature worked, **I want** a short note that funnels now count differently, **so that** a lower adoption number does not look like a drop.
**Acceptance:** the D8 note where a feature funnel shows, gone 30 days after release by itself.
**Risk:** low · **Builder (planned):** Sonnet

### Story 2.4 — The switch tested in a browser
**As** a founder relying on the funnel switch, **I want** the funnel to show when the switch is on and not when it is off, **so that** switching it off really hides it.
**Acceptance:** flag-funnel-ui.spec.ts in the authed project, in the gates-on and gates-off passes.
**Risk:** medium · **Builder (planned):** Opus

## Sprint QA
- **api spec(s):** e2e/flag-funnel-ui.spec.ts (authed, gates on and off)
- **browser smoke owed:** yes, to the product owner: a signed-in look at a feature's funnel and its period choice
- **deterministic gate:** typecheck + build + Playwright api + authed green before merge

## Sprint 2 — Smoke walkthrough
1. Open https://goldenfrijoles.com/hub/golden-frijoles/epic/<a measured epic>
   → the funnel table with Whole life · Last 90 days · Last 30 days
