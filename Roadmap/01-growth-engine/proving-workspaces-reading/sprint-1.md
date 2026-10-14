---
epic: proving-workspaces-reading
sprint: 1
title: "A reading for proving_workspaces"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "A proven verdict is recorded in our own project"
    as_a: "the product owner reading Golden Frijoles' North Star"
    i_want: "one event in our own project when any workspace's bet first reads proven, with the workspace unrecognisable"
    so_that: "breadth can be counted without the platform reading any tenant's data"
    risk: high
    status: planned
  - id: S1.2
    title: "An input can count distinct subjects per month"
    as_a: "the product owner"
    i_want: "a telemetry input that counts distinct ids from the 1st of each month"
    so_that: "workspaces this month is a number, not a count of events"
    risk: high
    status: planned
  - id: S1.3
    title: "proving_workspaces reads itself"
    as_a: "the product owner"
    i_want: "the input switched to the new event and synced"
    so_that: "the 15 Dec read is a number already on screen, not a hand count"
    risk: low
    status: planned
---
# A reading for proving_workspaces — Sprint 1: A reading for proving_workspaces

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — A proven verdict is recorded in our own project
**As** the product owner reading Golden Frijoles' North Star, **I want** one event in our own project when any
workspace's bet first reads proven, with the workspace unrecognisable, **so that** breadth can be counted without the
platform reading any tenant's data.
**Acceptance:** `app/api/v1/roadmap/push/route.ts` compares each epic's `verdict` with the previous artifact it already
reads (D16). For each epic newly `proven`, inside `after()`, it sends `workspace_proved_bet` through `trackSelfEvent`
with `userId = HMAC-SHA256(workspace_id, SELF_SUBJECT_SECRET)`. No transition, no event; no secret, no event; the push's
answer never waits. Api spec on a seeded previous artifact: `unclear → proven` sends one, `proven → proven` none,
`proven → unclear` none.
**Risk:** high (a request path; a write into the platform's own project, as `scheduleFirstEventActivation` does).
Security lens on review.

### Story 1.2 — An input can count distinct subjects per month
**As** the product owner, **I want** a telemetry input that counts distinct ids from the 1st of each month, **so that**
workspaces this month is a number, not a count of events.
**Acceptance:** a migration adds `aggregate TEXT NOT NULL DEFAULT 'count' CHECK (aggregate IN ('count',
'distinct_monthly'))` to `north_star_inputs`; the sync schema (`lib/north-star-schema.ts`) accepts it for
`telemetry_event` inputs only. A pure function beside `computeDailySeries` gives each day the distinct `userId`s since
the 1st of its month. Specs: the month boundary, repeats by one id, two ids, and every existing input's series pinned
unchanged. `supabase db push` before the merge.
**Risk:** high (a migration; numbers people read).

### Story 1.3 — proving_workspaces reads itself
**As** the product owner, **I want** the input switched to the new event and synced, **so that** the 15 Dec read is a
number already on screen, not a hand count.
**Acceptance:** `Roadmap/00-strategy/north-star.md`'s sync payload sets `proving_workspaces` to `telemetry_event`,
`sourceEvent: workspace_proved_bet`, `aggregate: distinct_monthly`, and its table row drops "pushed from outside";
`frijoles north-star set` syncs it. The public connector's North Star read shows the count and never the hashed id
(spec).
**Risk:** low

## Sprint QA
- **api spec(s):** S1.1 → push transition spec; S1.3 → public connector spec. Pure specs for S1.2.
- **browser smoke owed:** no; the walkthrough reads the North Star from the CLI and the public page.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.
- **secret:** `SELF_SUBJECT_SECRET` was added to Vercel production on 2026-10-14; it reaches the functions with the
  merge that ships this code.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `supabase migration list` (linked to production).
   → the `aggregate` migration shows on both sides.
2. Signed in, open https://goldenfrijoles.com/app/north-star/golden-frijoles.
   → `proving_workspaces` is listed as read from events (distinct per month), not pushed.
3. Stamp a real proven verdict on a shipped epic (`node scripts/epic-read.mjs --epic <slug> --write`, verdict
   `proven`), merge it, and let the roadmap push run.
   → the push run is green.
4. Reload the North Star page, then open https://goldenfrijoles.com/api/v1/public/north-star signed out.
   → `proving_workspaces` reads 1 for this month on both, and no id appears in either.

Step 2 is signed in and step 3 is a judgment, both owed to the product owner.

If any step fails, note the step number + what you saw — that's the bug report.
