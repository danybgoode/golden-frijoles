---
epic: setup-instruments-connects
sprint: 2
title: "Instrument"
risk: high
phase: In review
stories_total: 3
stories:
  - id: S2.1
    title: "instrument.md and setup's instrument step"
    as_a: "a founder who just approved the strategy"
    i_want: "the agent to add the measuring code as a pull request"
    so_that: "I review it like any change and nothing is merged for me"
    risk: high
    status: done
  - id: S2.2
    title: "Setup's connect step and its ending"
    as_a: "a founder at the end of setup"
    i_want: "to connect in one step and see where everything is"
    so_that: "I leave setup knowing what to do next"
    risk: high
    status: done
  - id: S2.3
    title: "CLI 1.1.0, plugin + kit 1.3.0"
    as_a: "a founder updating"
    i_want: "the new commands and setup in a release"
    so_that: "`npx @golden-frijoles/cli@latest` and `/plugin update` give me them"
    risk: low
    status: done
---
# Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen — Sprint 2: Instrument

**Status:** 🟡 built, in review (one PR for both sprints)

## Stories

### Story 2.1 — instrument.md and setup's instrument step ✅ `49e52ca`
**As** a founder who just approved the strategy, **I want** the agent to add the measuring code as a pull request, **so that** I review it like any change and nothing is merged for me.
**Acceptance:** after Approve, setup offers "Add the measuring code now?"; on yes, a branch with the SDK, one server-side client module, a `track` per input that needs an event at its cited code point (or a TODO with the reason) and error capture; a PR via `gh` (else the pushed branch and its link) listing every file and why; no key in code, `.env.local` never committed.
**Risk:** high

### Story 2.2 — Setup's connect step and its ending ✅ `dce004d`
**As** a founder at the end of setup, **I want** to connect in one step and see where everything is, **so that** I leave setup knowing what to do next.
**Acceptance:** "Connect to Golden Frijoles?" runs login, `init --ingest`, `north-star set`, the roadmap push with `--env-file` and `frijoles status`, each saying what it did and stopping with the fix on a failure; setup ends with three lines: the North Star, the first idea, the PR (or no code changed), and the console link.
**Risk:** high

### Story 2.3 — CLI 1.1.0, plugin + kit 1.3.0 ✅ `ad4b902`
**As** a founder updating, **I want** the new commands and setup in a release, **so that** `npx @golden-frijoles/cli@latest` and `/plugin update` give me them.
**Acceptance:** CLI 1.1.0 with `init --ingest` and `status`, pinning kit 1.3.0; plugin + kit 1.3.0; CHANGELOG entries; `check-release` agrees.
**Risk:** low

## Sprint QA
- **unit:** check-gate-words, onboarding parity, skills tests; CLI tests
- **browser smoke owed:** the interactive setup walkthrough on a scratch copy of a real product repo (Daniel)
- **deterministic gate:** as sprint 1

## Sprint 2 — Smoke walkthrough (do these in order)
Env: a scratch copy of a real product repo with no `Roadmap/`, and a scratch account.

1. (owed to Daniel — interactive) Run setup, pick "This repo", approve the strategy
   → "Add the measuring code now?"; on yes, a pull request listing the SDK install, the client module and one `track` per input that needed an event.
2. Answer yes to "Connect to Golden Frijoles?"
   → the browser opens once; each step reports; it ends with three lines and the console link.
3. Merge the pull request in the scratch repo, run the app, trigger one tracked action, run `frijoles status`
   → the first event and its time; Today shows it.

If any step fails, note the step number + what you saw — that's the bug report.
