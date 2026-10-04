---
title: 'The portfolio loop test fails intermittently in CI and has been quarantined'
slug: portfolio-loop-flake
status: shipped
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

## Resolution (2026-10-04): a Next.js/React bug, fixed by upgrading to Next 16

**Root cause, not in this repo.** The two red traces showed the server doing everything right: the forged submit got
its `303 → ?loop=forbidden` (and the sibling its `404`), with a complete body that was byte-identical between passing
and failing runs. The client then never moved: no `_rsc` GET, no `pushState`, no error. Reproduced locally with 6× CPU
throttling (fails most runs on a fresh server) and probed through Next's action queue and React itself. The router
resolved the action normally (nothing discarded), React suspended the transition on a Flight chunk in `resolved_model`,
the chunk fulfilled, and React was never pinged again, so the update never committed. That is
[vercel/next.js#98303](https://github.com/vercel/next.js/issues/98303), a lost ping in the React that Next ≤16.2
vendors. The 15.5 line was never patched; the same freeze hit **real people** on slow devices (the stage saved, the row
never updated until a reload).

**Fix.** Next 15.5.20 → 16.3.8 (React 19.3). The same throttled repro: 20/20 green. The test is un-quarantined and back in
the blocking `e2e-authed` job. The hydration waits stay: they guard a real, separate hazard (a forged hidden value set
before hydration is restored).

**What the upgrade also needed:** `eslint-config-next` 16 ships flat configs (the FlatCompat bridge throws), and its two
new rules start `off` as calibrated follow-ups; Lightning CSS (Turbopack's minifier) dropped our unprefixed
`backdrop-filter`, so the hand-written `-webkit-` duplicates are gone; one spec now accepts `0s` for `0ms`.

**Follow-ups, not done here:** `middleware.ts` → `proxy.ts` (deprecated in 16, still works); switch
`react-hooks/set-state-in-effect` (4 sites) and `@next/next/no-location-assign-relative-destination` (1) to `error`
with their cleanups.
