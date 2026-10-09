---
epic: sdk-1-0
sprint: 1
title: "Start in one line"
risk: high
phase: In review
stories_total: 3
stories:
  - id: S1.1
    title: "One line to start"
    as_a: "a founder instrumenting an app"
    i_want: "`createGrowthEngineClient({ apiKey })` to just work"
    so_that: "I don't need a URL variable to send my first event"
    risk: high
    status: done
  - id: S1.2
    title: "Who the user is"
    as_a: "a founder instrumenting an app"
    i_want: "`identify(userId)` after sign-in and `reset()` at sign-out, on one client"
    so_that: "events are about the right person without building a second client"
    risk: high
    status: done
  - id: S1.3
    title: "A North Star input in one call"
    as_a: "a founder instrumenting an app"
    i_want: "`pushInputValues(key, [{ occurredOn, value }])`"
    so_that: "my revenue or other pushed input reaches the North Star without a hand-written fetch"
    risk: high
    status: done
---
# SDK 1.0 — Sprint 1: Start in one line

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 1.1 — One line to start ✅ `798dfcc`
**As** a founder instrumenting an app, **I want** `createGrowthEngineClient({ apiKey })` to just work, **so that** I don't need a URL variable to send my first event.
**Acceptance:** `baseUrl` optional, default `https://goldenfrijoles.com` (one exported constant); a passed `baseUrl` still wins, trailing slashes tolerated. Unit specs with an injected `fetchImpl`: the default URL, the override, and every existing method building the same path.
**Risk:** high

### Story 1.2 — Who the user is ✅ `5f8b382`
**As** a founder instrumenting an app, **I want** `identify(userId)` after sign-in and `reset()` at sign-out, on one client, **so that** events are about the right person without building a second client.
**Acceptance:** `userId` optional at construction; `identify` / `reset` change who future calls are about (`track`, `trackAdoption`, `trackExposure`, `trackFlagEvaluation`, `bucket`, `captureError`). With no user, those that need one return `{ ok: false, code: 'no_user' }` (never throw); `bucket` returns its existing error envelope. Specs pin each.
**Risk:** high

### Story 1.3 — A North Star input in one call ✅ `fc17323`
**As** a founder instrumenting an app, **I want** `pushInputValues(key, [{ occurredOn, value }])`, **so that** my revenue or other pushed input reaches the North Star without a hand-written fetch.
**Acceptance:** POST `/api/v1/inputs/<key>/values` with the project key; returns the envelope with the inserted and skipped dates the route reports; validates `occurredOn` is YYYY-MM-DD and `value` a finite number before sending. Specs against a stubbed fetch, plus the route's own e2e.
**Risk:** high

## Sprint QA
- **specs:** pure `node:test` specs in `packages/sdk/src` with an injected `fetchImpl`; the packed-tarball test for S2.1; e2e for the console snippets.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run test:unit` + typecheck + lint + build + Playwright `api`/`authed` in CI.
