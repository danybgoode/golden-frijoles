---
epic: coaches-v2
sprint: 2
title: "Shared coach behaviours: progress, options, save, check"
risk: low
phase: Shaping
stories_total: 4
stories:
  - id: S2.1
    title: "One shared coach reference"
    as_a: "a maker in any coach"
    i_want: "every coach to open by playing back the agreed files before it, show 'Step N of X' on every message, and save a draft after each step with early answers parked under their headings"
    so_that: "I always know where I am and never lose work"
    risk: low
    status: planned
  - id: S2.2
    title: "Options, research and current use cases"
    as_a: "a maker who would rather choose than write from scratch"
    i_want: "2–4 options to pick from or edit at each step, looked up online when the step leans on the present, with current use cases and the classic ones as fallback"
    so_that: "the session is faster and more fun, and grounded in today's market"
    risk: low
    status: planned
  - id: S2.3
    title: "Delegation, the product check and private strategy"
    as_a: "a maker with a real product on a public repo"
    i_want: "an options brief when I hand a step over (marked proposed), claims labelled true today or aspirational against my repo, and the strategy folder git-ignored unless I opt in"
    so_that: "the coach does the homework honestly and my strategy stays mine"
    risk: low
    status: planned
  - id: S2.4
    title: "Ladder up: an example becomes a need, with evidence"
    as_a: "a founder answering the narrative coach"
    i_want: "the coach to turn each example I give into the need behind it, check it against outside evidence, and ask me to confirm before it becomes a dimension or a persona line"
    so_that: "my strategy and one-pagers carry real goals and frustrations, not anecdotes"
    risk: low
    status: planned
---
# Coaches v2 — Sprint 2: Shared coach behaviours: progress, options, save, check

**Status:** ⬜ not started

## Stories

### Story 2.1 — One shared coach reference
**As a** a maker in any coach, **I want** every coach to open by playing back the agreed files before it, show "Step N of X" on every message, and save a draft after each step with early answers parked under their headings, **so that** I always know where I am and never lose work.
**Acceptance:** All three coaches read the shared reference; a session cut at step 3 leaves a draft with steps 1–3; X is fixed per coach.
**Risk:** low

### Story 2.2 — Options, research and current use cases
**As a** a maker who would rather choose than write from scratch, **I want** 2–4 options to pick from or edit at each step, looked up online when the step leans on the present, with current use cases and the classic ones as fallback, **so that** the session is faster and more fun, and grounded in today's market.
**Acceptance:** Each step offers options; present-day facts are cited or the coach says it couldn't look; no invented figures.
**Risk:** low

### Story 2.3 — Delegation, the product check and private strategy
**As a** a maker with a real product on a public repo, **I want** an options brief when I hand a step over (marked proposed), claims labelled true today or aspirational against my repo, and the strategy folder git-ignored unless I opt in, **so that** the coach does the homework honestly and my strategy stays mine.
**Acceptance:** A delegated section is `proposed` until I agree; an aspirational benefit is labelled in the file; a public repo gets the folder ignored by default.
**Risk:** low

### Story 2.4 — Ladder up: an example becomes a need, with evidence
**As a** founder answering the narrative coach, **I want** the coach to turn each example I give into the need behind it, check it against outside evidence, and ask me to confirm before it becomes a dimension or a persona line, **so that** my strategy and one-pagers carry real goals and frustrations, not anecdotes.
**Acceptance:** A fixture conversation where the founder answers with three anecdotes produces three needs, each with a source or a "hypothesis" label, and none of the anecdotes verbatim in `narrative.md` or the persona poster; the persona poster labels every line sourced, agreed or hypothesis. (Dogfood F34: on 2026-10-04 the coach wrote the founder's career anecdotes down as the persona's frustrations and drivers.)
**Risk:** low

## Sprint QA
- **specs:** fixture conversations and pure-logic specs per skill (`strategy-templates.test`, `check-skill-scripts`); the seal and the renderer as pure functions.
- **browser smoke owed:** no.
- **deterministic gate:** unit suites + `check-release` and `check-onboarding-parity` green (a plugin release under `skills/RELEASING.md`).

## Sprint 2 — Smoke walkthrough (do these in order)
Env: a local repo with the plugin installed from this branch's release

1. Run `/golden-frijoles:pmf-narrative`
   → the first message says "Step 1 of 8" and offers options to choose from.
2. Stop after step 3 and open `Roadmap/00-strategy/pmf-narrative.md`
   → steps 1–3 are saved as a draft.
3. Run `git status` on a public repo
   → the strategy folder isn't listed (`.gitignore` gained `Roadmap/00-strategy/` and a line saying how to opt in).

If any step fails, note the step number + what you saw — that's the bug report.
