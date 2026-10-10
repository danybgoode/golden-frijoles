---
epic: one-bet-wired
sprint: 1
title: "The funnel fills itself"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "The flag funnel on the agreed TARS model, and its bounded read"
    as_a: "a founder reading a shipped bet"
    i_want: "its flag's funnel computed the way TARS means it"
    so_that: "the read date has a number I can trust"
    risk: high
    status: planned
  - id: S1.2
    title: "The bet's measurement through seed, scaffold, contract and the push"
    as_a: "a founder whose epic carries a bet"
    i_want: "the measurement to travel with the epic"
    so_that: "the engine reads it without hand registration"
    risk: high
    status: planned
  - id: S1.3
    title: "frijoles bet sync"
    as_a: "an agent at the Build gate"
    i_want: "one command that creates the bet's flag from the epic"
    so_that: "the flag exists before the code reads it"
    risk: high
    status: planned
---
# One bet, wired: the flag knows its epic, its funnel and its read — Sprint 1: The funnel fills itself

**Status:** ⬜ not started

## Stories

### Story 1.1 — The flag funnel on the agreed TARS model, and its bounded read
**As** a founder reading a shipped bet, **I want** its flag's funnel computed the way TARS means it, **so that** the read date has a number I can trust.
**Acceptance:** `lib/flag-funnel.ts` returns base, targeted (everyone), exposed (variant `on`), adopted at or after exposure, retained within the window, satisfied or null, and adopted-without-exposure, from a synthetic event list in tests; the bounded read covers one project's period (first `on` to now, at most 90 days), capped and saying so.
**Risk:** high

### Story 1.2 — The bet's measurement through seed, scaffold, contract and the push
**As** a founder whose epic carries a bet, **I want** the measurement to travel with the epic, **so that** the engine reads it without hand registration.
**Acceptance:** seed and epic templates carry `target_segment`, `adopted_event`, `retained_event`, `retention_days`, `satisfied_event`; scaffold copies them; the contract refuses a segment other than `everyone`, a bad window, or measurement without a flag; the extract and push schema carry them nullish; the board card holds them.
**Risk:** high

### Story 1.3 — frijoles bet sync
**As** an agent at the Build gate, **I want** one command that creates the bet's flag from the epic, **so that** the flag exists before the code reads it.
**Acceptance:** `frijoles bet sync <README>` creates a missing flag as enablement in every environment with the hypothesis and epic as its description, or reports it exists and changes nothing; a README without `flag_key` or with a bad bet is a usage error naming the field; `--json` carries what happened.
**Risk:** high

## Sprint QA
- **unit:** `flag-funnel.test.ts` (each stage, exposure ordering, retention window, satisfied null, outside adopters, rates); the contract's bet check; scaffold's copy; the extract and push schema; CLI `bet sync` tests
- **api spec:** the funnel read on a fresh project (flag evaluated on, adoption, retention)
- **deterministic gate:** typecheck + build + Playwright api + authed + the Skills CI replay

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com, signed in.

1. Pick an epic with a `flag_key` and a bet, run `npx -y @golden-frijoles/cli@1.2.0 bet sync Roadmap/<area>/<slug>/README.md`
   → "created <flag> (Measure: off until you roll it out)" or "<flag> exists; left it".
2. Run `npx -y @golden-frijoles/cli@1.2.0 flags get <flag>`
   → the flag in every environment, its description the bet's hypothesis.

If any step fails, note the step number + what you saw — that's the bug report.
