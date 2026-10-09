---
epic: sdk-1-0
sprint: 2
title: "Ship it"
risk: high
phase: In review
stories_total: 3
stories:
  - id: S2.1
    title: "import and require both work"
    as_a: "a founder instrumenting an app"
    i_want: "to `import` the SDK in an ESM project and `require` it in CommonJS"
    so_that: "it works in Vite, modern Node and older setups alike"
    risk: high
    status: done
  - id: S2.2
    title: "The quickstarts start in one line"
    as_a: "a founder reading /install or Connect"
    i_want: "the snippet to be one import and one call, then identify and an input push"
    so_that: "what I copy works first time"
    risk: low
    status: done
  - id: S2.3
    title: "SDK 1.0.0"
    as_a: "anyone already on 0.6.0"
    i_want: "every call I make today to keep working"
    so_that: "upgrading is safe"
    risk: high
    status: done
---
# SDK 1.0 — Sprint 2: Ship it

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 2.1 — import and require both work ✅ `7575abd`
**As** a founder instrumenting an app, **I want** to `import` the SDK in an ESM project and `require` it in CommonJS, **so that** it works in Vite, modern Node and older setups alike.
**Acceptance:** Dual build (ESM `dist/esm/` + CJS `dist/cjs/`), `exports` with `import`/`require`/`types`; a packed-tarball test imports and requires it in a scratch project and calls the client. No module-level state, so two copies cannot disagree.
**Risk:** high

### Story 2.2 — The quickstarts start in one line ✅ `d378a50`
**As** a founder reading /install or Connect, **I want** the snippet to be one import and one call, then identify and an input push, **so that** what I copy works first time.
**Acceptance:** `/install`, Connect and the SDK README show the 1.0 shape; the revenue sync keeps its own fetch (a root script must not depend on a built SDK; verifier, #331). e2e/text specs follow.
**Risk:** low

### Story 2.3 — SDK 1.0.0 ✅ `8ad8fdf`
**As** anyone already on 0.6.0, **I want** every call I make today to keep working, **so that** upgrading is safe.
**Acceptance:** Version 1.0.0, CHANGELOG (what's new, nothing removed), a test that pins every 0.6.0 call shape against the 1.0 types and runtime; npm publish is Daniel's 2FA step.
**Risk:** high

## Sprint QA
- **specs:** pure `node:test` specs in `packages/sdk/src` with an injected `fetchImpl`; the packed-tarball test for S2.1; e2e for the console snippets.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run test:unit` + typecheck + lint + build + Playwright `api`/`authed` in CI.

## Release order — Daniel
1. When the gate is green and every review finding is answered (npm versions are immutable): from `feat/sdk-1-0`,
   `cd packages/sdk && npm publish` (2FA); `npm view @golden-frijoles/sdk version` → 1.0.0.
2. Merge the PR (merge commit). The console's quickstarts deploy with it.

## Smoke walkthrough (do these in order)
Env: a scratch Node project; production https://goldenfrijoles.com.

1. `npm i @golden-frijoles/sdk` then `node -e "console.log(require('@golden-frijoles/sdk').DEFAULT_BASE_URL)"`
   → `https://goldenfrijoles.com`.
2. In an ESM file: `import { createGrowthEngineClient } from '@golden-frijoles/sdk'`, then
   `createGrowthEngineClient({ apiKey: process.env.GROWTH_ENGINE_API_KEY })` and `await engine.track('x')`
   → `{ ok: false, code: 'NO_USER' }` (no user yet, no request).
3. `engine.identify('smoke-user'); await engine.track('smoke_event')` with a real ingest key
   → `{ ok: true, id }`, and the event shows in the console's event catalog.
4. Open https://goldenfrijoles.com/install
   → the SDK snippet starts in one line (no `baseUrl`), calls `identify`, and its `bucket` passes `{ key }` objects.

If any step fails, note the step number + what you saw — that's the bug report.
