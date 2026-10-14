---
epic: outcome-report-any-product
sprint: 1
title: "Report from any repo"
risk: high
phase: Shipped
stories_total: 4
stories:
  - id: S1.1
    title: "Shipped dates from each epic's real status history"
    as_a: "a founder sending an outcome report"
    i_want: "shipped dates read from each epic's parsed status history"
    so_that: "the report is safe to publish for any repo"
    risk: high
    status: done
  - id: S1.2
    title: "Rework is its own number"
    as_a: "a founder reading the outcome report"
    i_want: "re-opened epics counted on their own"
    so_that: "rework is visible without bending lead time"
    risk: low
    status: done
  - id: S1.3
    title: "pod-report in the kit, with a stranger's defaults"
    as_a: "a founder's agent in any product's repo"
    i_want: "npx -y @golden-frijoles/kit pod-report --push"
    so_that: "another product can push its outcome report"
    risk: high
    status: done
  - id: S1.4
    title: "Every screen names the command that works"
    as_a: "a founder told an outcome report is included"
    i_want: "setup, install, /agents.md and the empty page to name the kit command"
    so_that: "nothing promises a command I don't have"
    risk: low
    status: done
---
# The outcome report for any product — Sprint 1: Report from any repo

**Status:** ✅ shipped 2026-10-14 — https://github.com/danybgoode/golden-frijoles/pull/368 merged (`9781756`), deployed; `@golden-frijoles/kit@1.9.4` on npm.

## Build contract (locked by the architect before the builder started)
Cites the epic README's Architecture lock. 1.1 → D1 · 1.2 → D2, D3 · 1.3 → D4 · 1.4 → D5.

## Stories

### Story 1.1 — Shipped dates from each epic's real status history
**As a** founder sending an outcome report, **I want** shipped dates read from each epic's parsed status history, **so that** the report is safe to publish for any repo.
**Acceptance:** a quoted or re-spaced `status: "shipped"` counts; an edit to the status line's comment doesn't; the
lock's two baselines come out identical (or every differing epic is named with why).
**Risk:** high (moves a headline metric)

### Story 1.2 — Rework is its own number
**As a** founder reading the outcome report, **I want** re-opened epics counted on their own, **so that** rework is visible without bending lead time.
**Acceptance:** an epic shipped → in progress → shipped appears in `delivery.rework` with the re-opening commit's subject;
lead time still uses the first ship; the report shows "Re-opened after shipping: n of m".
**Risk:** low

### Story 1.3 — `pod-report` in the kit, with a stranger's defaults
**As a** founder's agent in any product's repo, **I want** `npx -y @golden-frijoles/kit pod-report --push`, **so that** another product can push its outcome report.
**Acceptance:** the built kit contains it and its libs; run in a scratch repo it reads the repo it is in, uses
`GROWTH_ENGINE_API_KEY` and https://goldenfrijoles.com by default.
**Risk:** high (a published package)

### Story 1.4 — Every screen names the command that works
**As a** founder told an outcome report is included, **I want** setup, install, /agents.md and the empty page to name the kit command, **so that** nothing promises a command I don't have.
**Acceptance:** none of them names `node scripts/pod-report.mjs`; each names the kit command and where it runs.
**Risk:** low

## Sprint QA
- **specs:** `scripts/pod-report.test.mjs` (synthetic git repos: quoted status, comment edit, re-open, retroactive); the baseline comparison on both real repos (in the PR); kit build + `check-skill-scripts`; `agents-md.test.ts`
- **browser smoke owed:** yes, to the product owner — the signed-in aomx report after its first push, and the `hub-report` re-approval
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. In the aomx repo (its `.env.local` holds `GROWTH_ENGINE_API_KEY`), run `npx -y @golden-frijoles/kit@<new version> pod-report --push`.
   → It says it pushed a pod_report for aomx.
2. (signed in) Go to https://goldenfrijoles.com/hub/aomx/report
   → The report renders with aomx's epics; no "run node scripts/pod-report.mjs" anywhere.
3. Go to https://goldenfrijoles.com/agents.md and https://goldenfrijoles.com/install.md
   → Both name `npx -y @golden-frijoles/kit pod-report --push`.

### Smoke results (2026-10-14, production, `9781756`)
- ✅ golden-frijoles' own push (CI `workflow_dispatch`) → `✓ pod_report pushed` (version 326); https://goldenfrijoles.com/hub/golden-frijoles/report
  shows "Re-opened after shipping: 1 of 80 (median 0 days to ship again)" and the caveat that the date source changed.
- ✅ The built kit in a scratch repo reads that repo, resolves the key from an untracked `.env.local`, and (verifier, with a
  listener) never pairs a file's URL with the shell's key; a tracked `.env.local` is not read.
- Owed to the product owner — step 1 (the first aomx push: `npx -y @golden-frijoles/kit@1.9.4 pod-report --push` in the
  aomx repo) and step 2 (the signed-in aomx report); re-pushing medusa-bonsai's report shows its corrected numbers.
