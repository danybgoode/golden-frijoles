---
epic: one-product-project
sprint: 1
title: "One project"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "The code says golden-frijoles"
    as_a: "the product owner"
    i_want: "the demo/self project to be one slug, golden-frijoles"
    so_that: "every surface, CI push and link names the one project"
    risk: high
    status: planned
  - id: S1.2
    title: "Prod data moves into golden-frijoles"
    as_a: "the product owner"
    i_want: "golden-beans' real funnels, North Star and self-tracking key in golden-frijoles"
    so_that: "there is one place to manage it all"
    risk: high
    status: planned
  - id: S1.3
    title: "The terminal sign-in flag lives in golden-frijoles"
    as_a: "the product owner"
    i_want: "auth.terminal_sign_in_enabled in the one project"
    so_that: "the epic page and gf flags see it"
    risk: high
    status: planned
---
# One product project, and every flag in it — Sprint 1: One project

**Status:** ⬜ not started

## Stories

### Story 1.1 — The code says `golden-frijoles`
**As** the product owner, **I want** `DEMO_PROJECT_SLUG` to default to `golden-frijoles` and `SELF_PROJECT_SLUG` to
default to the same project, **so that** the landing, Hub, connector, CI pushes and specs name one project.
**Acceptance:**
- `lib/public-demo.ts` defaults to `golden-frijoles`. `lib/self-track.ts` defaults to `DEMO_PROJECT_SLUG` (one project).
- `golden-beans` and `golden-beans-demo` are reserved, so nobody can sign up with them.
- `/hub/golden-beans-demo/*`, `/app/<section>/golden-beans-demo/*` and the `golden-beans` equivalents redirect (308)
  to `golden-frijoles`.
- `golden-frijoles.config.json → hubUrl`, the seed scripts, fixtures, surfaces and specs all use the new slug.
- Rule #2 specs: only `golden-frijoles` is public. `golden-beans` and `golden-beans-demo` no longer exist as projects
  in CI.
**Risk:** high

### Story 1.2 — Prod data moves into `golden-frijoles`; `golden-beans` archived
**As** the product owner, **I want** the real rows from `golden-beans` in `golden-frijoles`, **so that** there is one
place to manage everything.
**Acceptance (prod, right after S1's deploy is Ready; the map is in the epic README):**
- `projects.slug` `golden-beans-demo` → `golden-frijoles`.
- 3 features, the `proven_bets` North Star + 4 inputs, and ingest key `d2bf557b…` re-pointed. The synthetic
  `payable_sellers` North Star is backed up, then removed.
- `golden-beans`' connector token is revoked. It has no live key or token left.
- `/hub/golden-frijoles` renders, and `/app/north-star/golden-frijoles` shows Proven bets. A landing visit lands as an
  event in `golden-frijoles`.
**Risk:** high

### Story 1.3 — `auth.terminal_sign_in_enabled` lives in `golden-frijoles`
**As** the product owner, **I want** the one existing catalog flag recreated in `golden-frijoles` with the same
activations, **so that** the epic page's flag line and `gf flags` read it from the one project.
**Acceptance:** `gf flags get auth.terminal_sign_in_enabled` (project `golden-frijoles`) prints the same per-env values
that `golden-beans` printed. The Google buttons on `/login` still show. History stays on `golden-beans` (immutable).
**Risk:** high

## Sprint QA
- **api spec(s):** `public-demo.spec.ts`, `hub.spec.ts`, `self-track.spec.ts`, `signup.spec.ts` (reserved slugs), a
  new redirect case in `hub.spec.ts`
- **browser smoke owed:** yes, to Daniel: the signed-in console switcher shows `golden-frijoles`
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Go to https://goldenfrijoles.com/hub/golden-frijoles
   → the roadmap renders
2. Go to https://goldenfrijoles.com/hub/golden-beans-demo
   → you land on /hub/golden-frijoles
3. Go to https://goldenfrijoles.com/app/north-star/golden-frijoles
   → it shows "Proven bets"
4. (signed in, owed to Daniel) Open https://goldenfrijoles.com/app
   → the switcher lists golden-frijoles, and its flags list shows auth.terminal_sign_in_enabled

If any step fails, note the step number + what you saw — that's the bug report.
