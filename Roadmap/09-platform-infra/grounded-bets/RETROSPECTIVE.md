# Grounded bets: every Why is a hypothesis traced from the North Star — Retrospective

_Closed: 2026-10-09_
_Intent: yes_
_Quote vs actual: $17–32 (M, n=17, p25–p75) → ≈$15.48 (under the quote; Claude only, reviewers not measured)_

## What shipped
- **One PR, both sprints** (#334, merge `ff5d426`; plugin + kit 1.1.0 on npm).
  - refine's Stage 1.5 writes the bet as one sentence traced from the strategy, challenges once when no input fits, and
    records an override as `grounded: false` with its reason.
  - The Plan gate shows the sentence and `Grounded`. With no strategy, refine offers the North Star chapter once.
  - `grounded`, `grounded_reason` and `persona` travel from seed to scaffold, contract, push, board card and epic page.
  - `bets-grounded.mjs` computes `grounded_bets_share` from the funded bets and pushes it from `main`.
  - A Stage 6b flag carries the hypothesis as its description. `gf-kit` retired, as plugin 1.0 promised.
- **Baseline:** August 0 of 7, September 0 of 5, October 1 of 15 (this epic). **First reading in production:**
  `grounded_bets_share` = 0.07 on 2026-10-09, pushed by the merge's own workflow with the inputs read from the engine
  (`north-star:grounded_bets_share@2026-10-09`). Target: 0.6 of features by 2026-11-30.

## What went well
- **The verifier caught what the plan could not see:** the strategy is private and untracked, so the CI push would have
  skipped forever while every test passed. The fix (ask the engine for the input keys) came from reading the checkout
  CI actually has.
- **Three review rounds converged:** round 1 had two blocking issues, round 2 had should-fixes born in the fix, and
  round 3 had one low item of a class already fixed elsewhere.

## What we learned
- **Check what CI's checkout contains, not what yours does.** A script that reads a private, untracked file works on
  the maker's machine and nowhere else. Run it once from a clean worktree.
- **A local CI replay must run every step, and must be proven to fail.** Mine missed `check-deprecations`, the
  workflow's inline line budget, and every `cmp` pair (BSD `sed` has no `\s`, so the loop compared nothing). Each
  showed up as a red CI run. A replay is only trustworthy after a deliberate break turns it red.
- **Fix the class, not the instance:** "a failed engine read looks like no input" was fixed for the push in round 2 and
  found again in the print-only path in round 3.
- **A promise in a guard holds:** `check-deprecations` turned the plugin 1.0 promise ("gf-kit until kit 1.1.0") into a
  red build the moment 1.1.0 was proposed, so the removal could not be forgotten.

## Gaps / follow-ups
- **Owed to Daniel:** Sprint 1's interactive refine walkthrough (step 2).
- **The security lens** ran on GPT-OSS over three files only; this machine is not signed into Antigravity
  (`agy login`).
- **The CLI's next release** should pin kit 1.1.x (it pins 0.43.0 today; plugin-1-0 D9).
- **Input values are stored to two decimals** (`NUMERIC(14,2)`): the share was sent as 0.0667 and read back as 0.07.
  Fixed in 1.1.1 by rounding before the push; fine for a share whose target is 0.60.
- `leadSentence` cuts at an abbreviation ("e.g."); an archived bet with a funding stamp would still count (none today).
