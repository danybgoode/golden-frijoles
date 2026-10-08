---
epic: north-star-multi-metric-read
sprint: 1
title: "S1 One rule for the current North Star, every reader uses it"
risk: low
phase: In review
stories_total: 1
stories:
  - id: S1.1
    title: "One rule for the current North Star, every reader uses it"
    as_a: "a project owner whose project holds two North Star metrics"
    i_want: "my North Star page and Pod Report to show the newest metric and its inputs"
    so_that: "a state gf north-star set creates on purpose never renders as an outage"
    risk: low
    status: done
---
# Several North Star metrics, one reading rule — Sprint 1: S1 One rule for the current North Star, every reader uses it

**Status:** 🟡 built 2026-10-08 — the bug went live on golden-frijoles after one-product-project's cutover

## Build contract (the architect locks this before the builder starts)
Cite, don't restate: the epic README's **D1–D5**. D5's live count is part of the lock: record the number in the README.

## Stories

### Story 1.1 — One rule for the current North Star, every reader uses it
**As a** project owner whose project holds two North Star metrics, **I want** my North Star page and Pod Report to show
the newest metric and its inputs, **so that** a state `gf north-star set` creates on purpose never renders as an outage.
**Acceptance:**
- A DB-backed spec seeds a project with two metrics (distinct `created_at`), each with its own inputs. Both readers
  return the newer metric, and only its inputs/count.
- With zero metrics, both readers still answer "none registered"; with one, the existing specs pass unchanged.
- A simulated query failure still throws on the page and still reads `unavailable` on the Pod Report (the error is never
  rendered as an absence).
- `grep -n "maybeSingle" apps/web/lib/north-star-query.ts apps/web/lib/pod-report-query.ts` shows no call on a
  `north_star_metrics` filter by `project_id`.
**Risk:** low

## Sprint QA
- **api spec(s):** `e2e/north-star-multi-metric.authed.spec.ts` (two-metric fixture on the page; the Pod Report reads
  through the same `getProjectNorthStarByProjectId`/`currentNorthStar`, so one fixture covers both readers' rule); the existing North Star
  and Pod Report specs stay green.
- **browser smoke owed:** yes, to Daniel: the signed-in page view (step 2 below).
- **deterministic gate:** `npm run typecheck` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com (after the merge deploys)

1. Run D5's count (or read it from the README's lock) to learn whether any prod project has more than one metric.
   → a number. If it's 0, steps 2–3 use a project you sync a second metric into with
   `npx @golden-frijoles/cli north-star set <file> --yes` (a new key).
2. **(signed in, owed to Daniel)** Open https://goldenfrijoles.com/app/north-star/<that-project-slug>
   → the newest metric's name and its inputs, with no "something went wrong" screen.
3. Open that project's Pod Report (https://goldenfrijoles.com/hub/<slug>/report, or a `/s/<token>` share link)
   → the North Star line shows the same metric and its input count, not "unavailable".

If any step fails, note the step number + what you saw — that's the bug report.
