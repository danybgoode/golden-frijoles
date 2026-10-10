---
epic: one-bet-wired
sprint: 2
title: "Measure by default, and seen"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Refine's Measure and Safety questions, and sign-in where it adds value"
    as_a: "a founder refining a feature"
    i_want: "to be asked whether I want to know it worked, and to sign in only when that is the reason"
    so_that: "measuring is the default and an account is offered when it pays off"
    risk: high
    status: planned
  - id: S2.2
    title: "The funnel on the epic page and Journeys' From your flags"
    as_a: "a founder reading a bet or browsing journeys"
    i_want: "each measured flag's funnel where I already look"
    so_that: "I see whether the bet worked without assembling it"
    risk: high
    status: planned
  - id: S2.3
    title: "CLI 1.2.0, plugin + kit 1.4.0"
    as_a: "a founder updating"
    i_want: "the new command and refine in a release"
    so_that: "I get them with npx and /plugin update"
    risk: low
    status: planned
---
# One bet, wired: the flag knows its epic, its funnel and its read — Sprint 2: Measure by default, and seen

**Status:** ⬜ not started

## Stories

### Story 2.1 — Refine's Measure and Safety questions, and sign-in where it adds value
**As** a founder refining a feature, **I want** to be asked whether I want to know it worked, and to sign in only when that is the reason, **so that** measuring is the default and an account is offered when it pays off.
**Acceptance:** Stage 6b asks Measure first (suggested yes for every Feature epic; the adoption, retention and optional satisfaction events) and Safety second (by risk); a yes to Measure when not signed in shows the one-sentence value and Sign in now / Later, once per project; the Plan gate's Flag line says "measured once you sign in" while pending; check-gate-words passes.
**Risk:** high

### Story 2.2 — The funnel on the epic page and Journeys' From your flags
**As** a founder reading a bet or browsing journeys, **I want** each measured flag's funnel where I already look, **so that** I see whether the bet worked without assembling it.
**Acceptance:** with `bets.flag_funnels_enabled` on, the epic page shows the funnel under the flag's state (rates, adopted without exposure beside, satisfied or not measured) and Journeys lists From your flags, one read-only funnel per measured flag; off, neither; a failed read says so and never shows zeros.
**Risk:** high

### Story 2.3 — CLI 1.2.0, plugin + kit 1.4.0
**As** a founder updating, **I want** the new command and refine in a release, **so that** I get them with npx and /plugin update.
**Acceptance:** CLI 1.2.0 with `bet sync`, pinning the published kit; plugin + kit 1.4.0; CHANGELOG entries; check-release agrees.
**Risk:** low

## Sprint QA
- **unit:** check-gate-words, onboarding parity, the funnel's render decision; the authed epic page and Journeys
- **browser smoke owed:** the signed-in epic page and Journeys on production (Daniel)
- **deterministic gate:** as sprint 1

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production, signed in, a project with a measured flag that has been evaluated.

1. (owed to Daniel — interactive) Refine a small feature: at Stage 6b, answer yes to "Do you want to know if this worked?" while signed out
   → one sentence on why measuring needs an account, Sign in now / Later; Later keeps the bet, and the Plan gate says "measured once you sign in".
2. Open the epic's page at https://goldenfrijoles.com/hub/<project>/epic/<slug>
   → under the flag: base → targeted → exposed → adopted → retained → satisfied (or "not measured"), with "adopted without exposure" beside.
3. Open https://goldenfrijoles.com/app/journeys/<project>
   → From your flags: the same funnel, named by the epic.

If any step fails, note the step number + what you saw — that's the bug report.
