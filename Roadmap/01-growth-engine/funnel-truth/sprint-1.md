---
epic: funnel-truth
sprint: 1
title: "The trend"
risk: high
phase: Building
stories_total: 4
stories:
  - id: S1.1
    title: "The funnel by cohort period"
    as_a: "a founder who shipped a flagged, measured feature"
    i_want: "its funnel computed for each month (or week) people first got it, back to the first exposure"
    so_that: "I see whether adoption and return improve over time, not one number"
    risk: low
    status: in-review
  - id: S1.2
    title: "A year of events, read honestly"
    as_a: "a founder reading a busy feature's trend"
    i_want: "the whole life read within a bound, and any period the read couldn't finish said in words"
    so_that: "a cut-off read never looks like a drop"
    risk: high
    status: in-review
  - id: S1.3
    title: "The trend on the flag page and the epic page"
    as_a: "a founder reading a feature or a bet"
    i_want: "the trend drawn where I already read its funnel"
    so_that: "I judge it without exporting anything"
    risk: low
    status: in-review
  - id: S1.4
    title: "Agents read the trend"
    as_a: "a founder's agent"
    i_want: "frijoles funnel <key> --by month and the connector's get_tars_funnel by parameter"
    so_that: "I can answer how a feature performed over the last year without a screen"
    risk: low
    status: in-review
---
# Funnel truth — Sprint 1: The trend

**Status:** 🟦 In review

## Build contract (locked by the architect before the builder started)
Cite the epic README's D1–D8; never restate them. In short, per story: **S1.1** = D1 + D2 (pure, `lib/flag-funnel.ts`,
`until` changes nothing when absent). **S1.2** = D3 + D4 (`lib/flag-funnel-read.ts`, an api spec with a lowered
`rowCap`, cut by each of the three reads). **S1.3** = D5 + D6 + D7 (flag page Funnel tab, `/app/funnel/…`, Hub epic
page; the browser spec renders trend on/off and flag funnels on/off). **S1.4** = D8 (CLI route + command + connector
`by`). Deviation from the stories as written: the CLI and connector read the **registry** source by feature key (the
flag page's source), not the epic page's flag source — see the README's corrections.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The funnel by cohort period ✅ f2a17fd
**As** a founder who shipped a flagged, measured feature, **I want** its funnel computed for each month (or week)
people first got it, back to the first exposure, **so that** I see whether adoption and return improve over time, not
one number.
**Acceptance:** `computeFunnelTrend(events, rule, measure, { by: 'month' | 'week' })` in `lib/flag-funnel.ts` returns
one funnel per cohort period from `computeFunnel` (which gains an `until` beside `since`). A cohort younger than
`retention_days` is marked maturing, and its retained count isn't drawn as a drop. Pure specs: empty, one period, a
gap month, the maturing cohort, and `all` equal to the sum of cohorts' exposed.
**Risk:** low

### Story 1.2 — A year of events, read honestly ✅ 1840169, 0b1d1f5
**As** a founder reading a busy feature's trend, **I want** the whole life read within a bound, and any period the read
couldn't finish said in words, **so that** a cut-off read never looks like a drop.
**Acceptance:** `lib/flag-funnel-read.ts` reads the trend per period (or aggregates in SQL), still one project and
under `FLAG_FUNNEL_ROW_CAP` per read. A period the read couldn't complete comes back `unreadable` with a reason. An api
spec seeds past a lowered cap and asserts the period is unreadable, not short.
**Risk:** high (a read whose numbers people act on).

### Story 1.3 — The trend on the flag page and the epic page ✅ a0e81ed
**As** a founder reading a feature or a bet, **I want** the trend drawn where I already read its funnel, **so that** I
judge it without exporting anything.
**Acceptance:** the flag page (`app/app/flags/[projectSlug]/[flagKey]/feature-panes.tsx`) and the Hub epic page show
the trend with `SmallMultiple` (one per stage) and `ChartUnreadable` for unreadable periods, behind
`bets.funnel_trend_enabled` (a `GATES` row plus `frijoles flags create … --enablement --all-envs`; production
`off vN`). `funnel_trend_viewed` fires once per view through `trackSelfEvent`. A browser spec renders both pages with
the flag on and off, and the flag funnel with `bets.flag_funnels_enabled` on and off (the gap one-bet-wired's retro
left).
**Risk:** low

### Story 1.4 — Agents read the trend ✅ dd0adbf
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
2. Signed out, open https://goldenfrijoles.com/app/funnel/golden-frijoles/setup_guide.
   → the funnel as before, and no trend (the switch is off).
3. Run `frijoles flags set bets.funnel_trend_enabled --value true --env production --project golden-frijoles`, wait
   30 s, and reload step 2's page.
   → under the funnel, "By month · By week" and one small chart per stage; the table has a row for every month from
   2026-07 to 2026-10, July with 60 got it, the months between at 0, and the newest month marked still maturing.
4. Signed in, open https://goldenfrijoles.com/app/flags/golden-frijoles and a flag's page, Funnel tab.
   → the same trend when a registry feature shares the flag's key; otherwise the existing "no funnel" words, no trend.
5. Open a bet's page in the Hub whose card has a flag and an adoption event
   (https://goldenfrijoles.com/hub/golden-frijoles/epic/funnel-truth).
   → the flag's funnel says nobody has been counted with the flag on yet, and no trend (golden-frijoles reports no
   flag evaluations; README correction). A project that reports them shows the trend here.
6. Run `frijoles funnel setup_guide --by month --project golden-frijoles`.
   → a table with one row per month whose numbers match step 3.
7. Ask the golden-frijoles connector for `get_tars_funnel` of `setup_guide` with `by: month`.
   → the same rows, with no person's id.

Steps 4–5 are signed-in steps, owed to the product owner. Step 6 needs the CLI release on npm (the product owner's 2FA
publish).

If any step fails, note the step number + what you saw — that's the bug report.
