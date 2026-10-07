---
epic: outcome-report-v2
sprint: 2
title: "How it got there"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S2.1
    title: "How fast, with a subtitle and deltas"
    as_a: "a founder"
    i_want: "How fast to say what it measures and how it moved against the last two months"
    so_that: "I know if we're speeding up"
    risk: low
    status: done
  - id: S2.2
    title: "The Steps of AI Adoption, with a prompt for your agent"
    as_a: "a founder"
    i_want: "to see where we are on the Steps of AI Adoption and what the next step needs, with a prompt for my agent"
    so_that: "I know what to change"
    risk: low
    status: done
  - id: S2.3
    title: "A line and a link for every section"
    as_a: "anyone reading the report"
    i_want: "each section to say what it is and link to its own page"
    so_that: "I can dig in"
    risk: low
    status: done
---
# Outcome report v2 — Sprint 2: How it got there

**Status:** ✅ shipped and live 2026-10-07 (#300, merge `075ff8e`)

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — How fast, with a subtitle and deltas ✅ `025cdf8`
**As** a founder, **I want** How fast to say what it measures and how it moved against the last two months, **so that**
I know if we're speeding up.
A subtitle ("From groomed to shipped, and how that compares with the last two months"), a one-line why, and each
metric's delta against the latest artifact version of each of the previous two windows (`report_artifacts`
versions). Fewer than two earlier versions: show what exists and say how many.
**Acceptance:**
- Deltas show with an arrow and the month they compare to; with none, the page says so.
**Risk:** low

### Story 2.2 — The Steps of AI Adoption, with a prompt for your agent ✅ `66af43b`
**As** a founder, **I want** to see where we are on the Steps of AI Adoption and what the next step needs, with a
prompt for my agent, **so that** I know what to change.
A short line on what the guide is (`references/Steps-of-AI-Adoption.md`); the five steps from `maturity-lens.mjs`'s
`STEP_LABELS` with "you are here" and "next"; the next step's criteria, met or not ("4 of 6 met"); the guardrails git
can't show; and a Copy button for "Read the <product> outcome report and the Steps of AI Adoption, then suggest what
we change to reach <next step>". Criterion rows keep their current lens rule.
**Acceptance:**
- Step names and criteria match `maturity-lens.mjs` (a test reads them from there, not from the page).
- The prompt names the product and the next step.
**Risk:** low

### Story 2.3 — A line and a link for every section ✅ `2444459`
**As** anyone reading the report, **I want** each section to say what it is and link to its own page, **so that** I can
dig in.
One line per section on what it is and why to care, and a link: the chart to North Star, the figures to FinOps and the
Board, the table rows to epic pages. "Who did the work" becomes one bar with one line; benchmarks become "Read
against" links. Links that need a sign-in are left off share links.
**Acceptance:**
- Every section has its line; every link opens for the team; a share link shows no link a visitor can't open.
**Risk:** low

## Built (against the README's lock)
- `lib/outcome-history.ts` + `getLatestArtifactBefore` (D8) — the latest version before this month and before last
  month; a gap month is not invented (same version kept once); a failed read says so. `MetricRow.raw` carries the number.
- `lib/adoption-steps.ts` (D9) — `STEP_LABELS` pinned to `scripts/lib/maturity-lens.mjs` by reading its source; the
  next step's count is taken before the lens (an aggregate every lens shows, like the verdict); Copy prompt team-only.
- Section lines and `SectionLinks` (D10) — North Star, FinOps, Board, epic pages, team-only; "Who did the work" is one
  bar carrying the computation's own reading verbatim; benchmarks are "Read against".
- **Found at the lock:** `references/` is gitignored, so the guide file cannot be opened in CI — the spec pins the
  scorer's citation (`source:`) instead of the file. Prod How fast: v263 (Oct) against v191 (Sep) and v99 (Aug).
- Mutation check: renaming a step in the copy fails `adoption-steps.test.ts` (2 tests).

## Sprint QA
- **api spec(s):** S2.1 → a spec on deltas with 0, 1 and 2 earlier versions; S2.2 → the ladder's spec against
  `maturity-lens.mjs` and the prompt's text; S2.3 → link checks for team and share; the visual gate for both.
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, go to https://goldenfrijoles.com/hub/golden-beans-demo/report and scroll to How fast
   → A subtitle and arrows against the last two months (or a line saying how many months it has).
2. Scroll to the Steps of AI Adoption
   → Five steps, you are here, the next step's criteria; Copy prompt.
3. Paste the prompt into Claude Code in the repo
   → The agent reads the report and the guide and suggests changes for the next step.
4. Click each section's link
   → Each opens its own page.
5. Open the client share link signed out
   → Each section has its line; no link asks for a sign-in.

If any step fails, note the step number + what you saw — that's the bug report.

### Verified live (signed out, 2026-10-07, after `075ff8e` deployed)
How fast: the subtitle, and deltas from prod's own versions — throughput "▲ 1.47 vs Sep · ▲ 1.66 vs Aug" (v263 against
v191 and v99), lead time and deploy frequency "±0", review latency "no comparison" (null since the monorepo move).
Steps: "1 Assisted you are here", "2 Parallel next", "To reach Parallel: 1 of 6 of its criteria met, 5 not
instrumented." Signed out: no `/app/` link and no Copy prompt. **Owed to Daniel:** steps 1–4 signed in (incl. pasting
the prompt into Claude Code) and step 5 through a client share link.
