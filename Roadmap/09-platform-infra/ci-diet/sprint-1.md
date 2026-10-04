---
epic: ci-diet
sprint: 1
title: "S1 Less, same behaviour"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "Three duplicate workflows and the advisory audit go; their unique checks join the static job"
    as_a: "the product owner"
    i_want: "each check to run once, in one place"
    so_that: "the checks list says what ran, not the same thing three times"
    risk: high
    status: planned
  - id: S1.2
    title: "One env file per gate state replaces the four copied flag lists"
    as_a: "a builder adding or flipping a gate"
    i_want: "one line to change"
    so_that: "the server and the tests can't disagree about a flag"
    risk: high
    status: planned
  - id: S1.3
    title: "ci.yml reads in one sitting; the stale minutes premise is rewritten; actions v5"
    as_a: "the next agent that edits CI"
    i_want: "a file that states its rules, not its incident history"
    so_that: "I change it correctly instead of re-deriving it"
    risk: low
    status: planned
---
# CI diet — Sprint 1: S1 Less, same behaviour

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started — README § Architecture lock)
Cite, don't restate: the epic README's **D1, D4, D9**. Before any edit, record the baseline in the README: the static
job's step list, the three deleted workflows' steps, and `playwright test --list --project=<p> | tail -1` for `api` and
`authed` (plus the OFF-server spec list).

## Stories

### Story 1.1 — Three duplicate workflows and the advisory audit go; their unique checks join the static job
**As the** product owner, **I want** each check to run once, in one place, **so that** the checks list says what ran,
not the same thing three times.
**Acceptance:**
- `design-drift-guard.yml`, `scripts-guard.yml` and `build-order-guard.yml` are deleted.
- The static job runs, as named steps: `build-order.mjs --check`, `jev-eval.mjs`, `permissions-smoke.mjs`,
  `check-script-parity.mjs` (and still `check-design-drift.mjs`). The `scripts/` node tests already run inside
  `npm run test:unit` (`'scripts/**/*.test.mjs'`); the PR body shows the glob match for both deleted globs.
- `Dependency audit (advisory)` is gone.
- Push-to-main coverage: the deleted workflows also ran on `push` to `main`. The PR body says why that's no longer needed
  (every change reaches `main` through a PR that ran them), or keeps a push trigger on the static job, whichever the
  lock decides.
**Risk:** high

### Story 1.2 — One env file per gate state replaces the four copied flag lists
**As a** builder adding or flipping a gate, **I want** one line to change, **so that** the server and the tests can't
disagree about a flag.
**Acceptance:**
- `ci/gates.on.env` and `ci/gates.off.env` hold every gate; the authed-only overrides
  (`SCENARIO_AUTHORING_ENABLED`, `FLAG_DEFINITION_SYNC_ENABLED`: OFF) are in the ON file with their one-line reason.
- Each is written to `$GITHUB_ENV` once, before its server boots. No step in `ci.yml` sets a gate flag inline
  (`grep -cE "_ENABLED: '(true|false)'" .github/workflows/ci.yml` → 0).
- `scripts/run-local-e2e.mjs` reads the same files (one source for CI and local).
- The api, OFF-server and authed test counts equal the baseline.
**Risk:** high

### Story 1.3 — ci.yml reads in one sitting; the stale minutes premise is rewritten; actions v5
**As the** next agent that edits CI, **I want** a file that states its rules, not its incident history, **so that** I
change it correctly instead of re-deriving it.
**Acceptance:**
- `ci.yml` keeps one-to-three-line reasons per non-obvious step. The incident narratives move to LEARNINGS (deduped,
  sharpened) or stay in git history. Target: ≤ 250 lines after S1.
- The "Actions minutes are scarce" premise is rewritten in `ci.yml`, `.github/dependabot.yml` and LEARNINGS → *Working
  efficiently*, citing the repo's public visibility (and the one-line "if it goes private again" note).
- `actions/checkout`, `setup-node`, `upload-artifact` are on v5 here and at `render-skills-ci.mjs`'s source
  (re-rendered); the Node 20 deprecation warning is gone from a run's annotations.
**Risk:** low

## Sprint QA
- **gate:** this PR's own CI is green, and the PR body holds the before/after table (steps and test counts).
- **browser smoke owed:** no.
- **security lens:** yes (`risk: high`: shared infra).

## Sprint 1 — Smoke walkthrough (do these in order)
Env: GitHub, the S1 PR.

1. Open the PR's **Checks** tab
   → no `design-system-fresh`, `cli-tests` or `build-order-fresh` check, and `Static gate + build` is green.
2. Expand `Static gate + build`
   → steps named for build-order, jev-eval, permissions-smoke and script-parity, each passed.
3. Expand the e2e job's `Run Playwright api suite` and the authed step; compare the "N passed" lines with the baseline
   table in the PR body
   → equal counts.
4. Open `.github/workflows/ci.yml` on the PR
   → ≤ 250 lines, and no gate flag set inline.

If any step fails, note the step number + what you saw — that's the bug report.
