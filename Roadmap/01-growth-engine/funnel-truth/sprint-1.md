---
epic: funnel-truth
sprint: 1
title: "The trend"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S1.1
    title: "The funnel by cohort period"
    as_a: "a founder who shipped a flagged, measured feature"
    i_want: "its funnel computed for each month (or week) people first got it, back to the first exposure"
    so_that: "I see whether adoption and return improve over time, not one number"
    risk: low
    status: planned
  - id: S1.2
    title: "A year of events, read honestly"
    as_a: "a founder reading a busy feature's trend"
    i_want: "the whole life read within a bound, and any period the read couldn't finish said in words"
    so_that: "a cut-off read never looks like a drop"
    risk: high
    status: planned
  - id: S1.3
    title: "The trend on the flag page and the epic page"
    as_a: "a founder reading a feature or a bet"
    i_want: "the trend drawn where I already read its funnel"
    so_that: "I judge it without exporting anything"
    risk: low
    status: planned
  - id: S1.4
    title: "Agents read the trend"
    as_a: "a founder's agent"
    i_want: "frijoles funnel <key> --by month and the connector's get_tars_funnel by parameter"
    so_that: "I can answer how a feature performed over the last year without a screen"
    risk: low
    status: planned
---
# Funnel truth — Sprint 1: The trend

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The funnel by cohort period
**As** a founder who shipped a flagged, measured feature, **I want** its funnel computed for each month (or week)
people first got it, back to the first exposure, **so that** I see whether adoption and return improve over time, not
one number.
**Acceptance:** `computeFunnelTrend(events, rule, measure, { by: 'month' | 'week' })` in `lib/flag-funnel.ts` returns
one funnel per cohort period from `computeFunnel` (which gains an `until` beside `since`). A cohort younger than
`retention_days` is marked maturing, and its retained count isn't drawn as a drop. Pure specs: empty, one period, a
gap month, the maturing cohort, and `all` equal to the sum of cohorts' exposed.
**Risk:** low

### Story 1.2 — A year of events, read honestly
**As** a founder reading a busy feature's trend, **I want** the whole life read within a bound, and any period the read
couldn't finish said in words, **so that** a cut-off read never looks like a drop.
**Acceptance:** `lib/flag-funnel-read.ts` reads the trend per period (or aggregates in SQL), still one project and
under `FLAG_FUNNEL_ROW_CAP` per read. A period the read couldn't complete comes back `unreadable` with a reason. An api
spec seeds past a lowered cap and asserts the period is unreadable, not short.
**Risk:** high (a read whose numbers people act on).

### Story 1.3 — The trend on the flag page and the epic page
**As** a founder reading a feature or a bet, **I want** the trend drawn where I already read its funnel, **so that** I
judge it without exporting anything.
**Acceptance:** the flag page (`app/app/flags/[projectSlug]/[flagKey]/feature-panes.tsx`) and the Hub epic page show
the trend with `SmallMultiple` (one per stage) and `ChartUnreadable` for unreadable periods, behind
`bets.funnel_trend_enabled` (a `GATES` row plus `frijoles flags create … --enablement --all-envs`; production
`off vN`). `funnel_trend_viewed` fires once per view through `trackSelfEvent`. A browser spec renders both pages with
the flag on and off, and the flag funnel with `bets.flag_funnels_enabled` on and off (the gap one-bet-wired's retro
left).
**Risk:** low

### Story 1.4 — Agents read the trend
**As** a founder's agent, **I want** `frijoles funnel <key> --by month` and the connector's `get_tars_funnel` `by`
parameter, **so that** I can answer how a feature performed over the last year without a screen.
**Acceptance:** a new member-gated CLI read (PAT, `lib/membership.ts`) prints the trend table, or JSON with `--json`.
The connector tool takes `by: 'month' | 'week'` and returns the same rows; on the public project it returns what the
public funnel already shows, scrubbed of people. Not flag-gated. A CLI release (npm publish owed to the product
owner).
**Risk:** low

## Sprint QA
- **api spec(s):** S1.2 → the funnel read spec; S1.4 → CLI route + connector spec. Pure specs for S1.1.
- **browser smoke owed:** yes, S1.3 signed in, to the product owner.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `frijoles flags get bets.funnel_trend_enabled --project golden-frijoles`.
   → production says `off v1` (or later).
2. Run `frijoles flags set bets.funnel_trend_enabled --value true --env production --project golden-frijoles`, wait
   30 s, then sign in and open a measured flag's page under https://goldenfrijoles.com/app/flags/golden-frijoles.
   → a trend shows below the funnel, one small chart per stage, by month; the newest month says it is still maturing.
3. Open the same bet's epic page in the Hub.
   → the same trend, with the same numbers.
4. Run `frijoles funnel <that flag key> --by month --project golden-frijoles`.
   → a table with one row per month whose numbers match step 2.
5. Ask the golden-frijoles connector for that funnel by month.
   → the same rows, with no person's id.

Steps 2–3 are signed-in steps, owed to the product owner. Step 4 needs the CLI release on npm (the product owner's
2FA publish).

If any step fails, note the step number + what you saw — that's the bug report.
