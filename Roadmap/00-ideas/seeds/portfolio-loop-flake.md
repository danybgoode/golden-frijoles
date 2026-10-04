---
title: 'The portfolio loop test fails intermittently in CI and has been quarantined'
slug: portfolio-loop-flake
status: raw
area: '02'
type: bug
priority: unranked
appetite: S
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-04
---

# Seed: `portfolio.authed.spec.ts` "the loop" is flaky, and quarantined until 2026-10-18

**Found by** ci-diet; it is the flake that started that epic. Quarantined in ci-diet S3.2 with `@quarantine` and
`owner=Daniel expires=2026-10-18`. It still runs in ci.yml's non-blocking `quarantine` job. Past the expiry,
`scripts/check-quarantine.mjs` turns `gate` red until this is fixed or the test is deleted.

## Problem

"the loop: an owner places a product from its row; a member sees the stage read-only"
(`apps/web/e2e/portfolio.authed.spec.ts`) failed both attempts in 3 of 5 CI runs on 2026-10-04, with no related code
change: run 37171756616 (#246), run 37172992679 (#247) and run 37173077330 (#248), after #243 (docs only) hit it
too. The failing assertion moves between `expect(locator).toHaveCount(expected)` and `expect(page).toHaveURL(expected)`.
#239 added hydration waits and a 90 s budget, and marked the fix "⚠️ Not proven" because a red run left nothing to read.

## What the quarantine leaves unguarded (accepted by Daniel, 2026-10-04, for 14 days)

The flaky steps are in the test's forged-form section (`toHaveURL(/loop=forbidden/)` and the not-found
`toHaveCount(0)`). That section is the only end-to-end proof that the loop-stage Server Action
(`app/app/portfolio/actions.ts`) refuses a forged write: membership → workspace re-check → decision → redirect. The
pure decision stays blocking (`lib/loop-stage.test.ts`, `portfolio-loop-stage.spec.ts`); the wiring does not, until
this is fixed. That is why the expiry is 14 days, not 30.

## Start here

Every red e2e run now uploads `apps/web/test-results/` (ci-diet S3.1: `trace: 'retain-on-first-failure'`, a
screenshot, the server log). Open the `quarantine-evidence` artifact of the next red `quarantine` job with
`npx playwright show-trace <trace.zip>`, and read the step it stops at before changing any wait.

## Done when

The test runs green in the `quarantine` job across ~10 consecutive runs, its `@quarantine` tag and annotation are
removed, and it is back in the blocking `e2e-authed` job.
