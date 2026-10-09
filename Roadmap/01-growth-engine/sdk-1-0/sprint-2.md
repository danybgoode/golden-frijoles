---
epic: sdk-1-0
sprint: 2
title: "Ship it"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "import and require both work"
    as_a: "a founder instrumenting an app"
    i_want: "to `import` the SDK in an ESM project and `require` it in CommonJS"
    so_that: "it works in Vite, modern Node and older setups alike"
    risk: high
    status: planned
  - id: S2.2
    title: "The quickstarts start in one line"
    as_a: "a founder reading /install or Connect"
    i_want: "the snippet to be one import and one call, then identify and an input push"
    so_that: "what I copy works first time"
    risk: low
    status: planned
  - id: S2.3
    title: "SDK 1.0.0"
    as_a: "anyone already on 0.6.0"
    i_want: "every call I make today to keep working"
    so_that: "upgrading is safe"
    risk: high
    status: planned
---
# SDK 1.0 — Sprint 2: Ship it

**Status:** ⬜ not started

## Stories

### Story 2.1 — import and require both work
**As** a founder instrumenting an app, **I want** to `import` the SDK in an ESM project and `require` it in CommonJS, **so that** it works in Vite, modern Node and older setups alike.
**Acceptance:** Dual build (ESM `dist/esm/` + CJS `dist/cjs/`), `exports` with `import`/`require`/`types`; a packed-tarball test imports and requires it in a scratch project and calls the client. No module-level state, so two copies cannot disagree.
**Risk:** high

### Story 2.2 — The quickstarts start in one line
**As** a founder reading /install or Connect, **I want** the snippet to be one import and one call, then identify and an input push, **so that** what I copy works first time.
**Acceptance:** `/install`, Connect and the SDK README show the 1.0 shape; the scripts/sync-revenue-from-miyagi.mjs reference push moves to `pushInputValues`. e2e/text specs follow.
**Risk:** low

### Story 2.3 — SDK 1.0.0
**As** anyone already on 0.6.0, **I want** every call I make today to keep working, **so that** upgrading is safe.
**Acceptance:** Version 1.0.0, CHANGELOG (what's new, nothing removed), a test that pins every 0.6.0 call shape against the 1.0 types and runtime; npm publish is Daniel's 2FA step.
**Risk:** high

## Sprint QA
- **specs:** pure `node:test` specs in `packages/sdk/src` with an injected `fetchImpl`; the packed-tarball test for S2.1; e2e for the console snippets.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run test:unit` + typecheck + lint + build + Playwright `api`/`authed` in CI.
