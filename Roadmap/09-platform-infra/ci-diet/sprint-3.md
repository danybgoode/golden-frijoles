---
epic: ci-diet
sprint: 3
title: "S3 Evidence and hygiene"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S3.1
    title: "Every red run leaves a trace"
    as_a: "whoever is debugging a red CI run"
    i_want: "a trace, screenshot and server log attached to the run"
    so_that: "a flake gets diagnosed from evidence, not guessed at"
    risk: low
    status: planned
  - id: S3.2
    title: "Quarantine with expiry; the portfolio loop test is its first tenant"
    as_a: "the product owner"
    i_want: "a known flake to keep running and reporting without blocking unrelated PRs"
    so_that: "nobody merges red out of habit, and nobody deletes the test either"
    risk: high
    status: planned
  - id: S3.3
    title: "browser runs nightly; the Pod Report push leaves PR events"
    as_a: "the product owner"
    i_want: "the dead browser suite run somewhere, and PR check lists free of unrelated skipped jobs"
    so_that: "a suite no pipeline runs stops decaying, and a PR's checks are only about the PR"
    risk: low
    status: planned
---
# CI diet — Sprint 3: S3 Evidence and hygiene

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started — README § Architecture lock)
Cite, don't restate: the epic README's **D3, D7, D8**. The lock decides the quarantine mechanism's shape: a Playwright
tag (`@quarantine`) plus a small expiry checker modelled on `jev-eval.mjs`'s shadow expiry.

## Stories

### Story 3.1 — Every red run leaves a trace
**As** whoever is debugging a red CI run, **I want** a trace, screenshot and server log attached to the run, **so that**
a flake gets diagnosed from evidence, not guessed at.
**Acceptance:**
- `playwright.config.ts`: `trace: 'retain-on-first-failure'`, `screenshot: 'only-on-failure'` on CI.
- Each e2e job uploads `test-results/` and its server log as an artifact on failure (`if: failure()`), with a retention
  of a few days.
- Proof: S2's mutation PR (a), re-run on this branch, has an artifact with a `trace.zip` that opens in
  `npx playwright show-trace`.
**Risk:** low

### Story 3.2 — Quarantine with expiry; the portfolio loop test is its first tenant
**As the** product owner, **I want** a known flake to keep running and reporting without blocking unrelated PRs, **so
that** nobody merges red out of habit, and nobody deletes the test either.
**Acceptance:**
- A test tagged `@quarantine` carries an owner and an expiry date (D7). The blocking jobs run `--grep-invert @quarantine`;
  a non-blocking job runs `--grep @quarantine` and writes its result to the job summary.
- An expiry checker fails `gate` when any quarantine is past its date, and a pure spec pins it both ways (past → fail,
  future → pass).
- `portfolio.authed.spec.ts` "the loop: an owner places a product…" is quarantined (owner Daniel, expiry ≤ 30 days),
  and a seed `portfolio-loop-flake` is written in `Roadmap/00-ideas/seeds/` that points at S3.1's trace.
**Risk:** high

### Story 3.3 — `browser` runs nightly; the Pod Report push leaves PR events
**As the** product owner, **I want** the dead browser suite run somewhere, and PR check lists free of unrelated skipped
jobs, **so that** a suite no pipeline runs stops decaying, and a PR's checks are only about the PR.
**Acceptance:**
- A scheduled workflow runs `--project=browser` nightly (plus `workflow_dispatch`) and sends a Telegram ping through
  `scripts/telegram-notify.mjs` on red (D8). It's not on `pull_request`.
- A seed `landing-browser-spec-red` is written for the spec that's red on `main` today.
- `push-pod-report` moves to its own workflow triggered only by `deployment_status` (+ `workflow_dispatch`);
  `roadmap-push.yml` keeps only the board push. A PR's checks list no longer shows "Push golden-beans' own Pod Report —
  skipping".
**Risk:** low

## Sprint QA
- **gate:** this PR's own CI green; the expiry checker's spec; a `workflow_dispatch` run of the nightly workflow linked in
  the PR body.
- **browser smoke owed:** no.
- **security lens:** yes on 3.2 (it changes what blocks a merge).

## Sprint 3 — Smoke walkthrough (do these in order)
Env: GitHub.

1. Open the S3 PR's checks
   → no Pod Report row, and a non-blocking `quarantine` job whose summary names the portfolio loop test, its owner and
   expiry.
2. Open the nightly workflow's `workflow_dispatch` run linked in the PR body
   → it ran the `browser` project; if it was red, Telegram got a ping (check the channel).
3. Open the artifact on the deliberately failing re-run linked in the PR body, download it, and run
   `npx playwright show-trace trace.zip`
   → the trace opens on the failing step.
4. Open `Roadmap/00-ideas/seeds/`
   → `portfolio-loop-flake.md` and `landing-browser-spec-red.md` exist.

If any step fails, note the step number + what you saw — that's the bug report.
