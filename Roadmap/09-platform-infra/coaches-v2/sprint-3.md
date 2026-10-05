---
epic: coaches-v2
sprint: 3
title: "Per-coach fixes and the one-pagers"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S3.1
    title: "Per-coach fixes"
    as_a: "a maker running the sequence"
    i_want: "the narrative to narrow a rich answer to one insight and pick one person before the problem, the North Star to test candidates against customer scenarios, and the riskiest-assumption coach to read the North Star"
    so_that: "the three coaches catch what this run caught by hand"
    risk: low
    status: planned
  - id: S3.2
    title: "One-pagers as standard outputs of the coaches"
    as_a: "a founder who finished the coaches"
    i_want: "a business model canvas, a value proposition sheet and a persona poster produced as standard outputs whenever a coach file is agreed, rendered from the agreed files as printable HTML and Markdown"
    so_that: "I can consult it in seconds without rereading the narrative"
    risk: low
    status: planned
  - id: S3.3
    title: "Voice, sources and one copy"
    as_a: "a stranger reading a coach"
    i_want: "persona and sources rewritten to the brand platform, the send command's CLI version taken from the kit, and the claude.ai duplicates retired"
    so_that: "the coaches sound like the product and exist once"
    risk: low
    status: planned
---
# Coaches v2 — Sprint 3: Per-coach fixes and the one-pagers

**Status:** ⬜ not started

## Stories

### Story 3.1 — Per-coach fixes
**As a** a maker running the sequence, **I want** the narrative to narrow a rich answer to one insight and pick one person before the problem, the North Star to test candidates against customer scenarios, and the riskiest-assumption coach to read the North Star, **so that** the three coaches catch what this run caught by hand.
**Acceptance:** Each fix has a fixture conversation in the skill's tests; the North Star scenario table appears before the PO picks.
**Risk:** low

### Story 3.2 — One-pagers as standard outputs of the coaches
**As a** founder who finished the coaches, **I want** a business model canvas, a value proposition sheet and a persona poster produced as standard outputs whenever a coach file is agreed, rendered from the agreed files as printable HTML and Markdown, **so that** I can consult the strategy in seconds without rereading the narrative, and the sheets never drift from it.
**Acceptance:**
- **Part of the flow, not a separate step:** each coach regenerates the sheets it feeds when its file reaches `status: agreed` (narrative → all three; North Star → value proposition sheet; riskiest assumption → the "not claimed yet" lines), into `strategy/one-pagers/`; `gf-kit one-pagers` re-renders on demand; the docs that describe the coach sequence list the three sheets as its outputs.
- **Derived, never typed:** every line on a sheet comes from an agreed file. The narrative template gains a structured persona block in *Target audience* (role, stage, background, goals, frustrations, drivers, moments they reach for it, where to find them, words to use and avoid, not-this-persona), filled during the audience step; the business model canvas reads the narrative and the business model section; the value proposition sheet reads Problem, Value proposition and the North Star.
- **Honest labels:** each claim shows true today, agreed, sourced or hypothesis; a sheet whose source file is still `draft` is watermarked "draft".
- The canvas carries "Strategyzer.com" under it (CC licence); the value proposition sheet uses no VPC layout or name; this repo's three sheets (`00-strategy/one-pagers/`, 2026-10-05) and `one_pagers.py` are the reference examples and fixtures.
**Risk:** low

### Story 3.3 — Voice, sources and one copy
**As a** a stranger reading a coach, **I want** persona and sources rewritten to the brand platform, the send command's CLI version taken from the kit, and the claude.ai duplicates retired, **so that** the coaches sound like the product and exist once.
**Acceptance:** No outside methodology brand in coach text; the pinned version matches the kit; the PO confirms the duplicates are gone (owed to the PO).
**Risk:** low

## Sprint QA
- **specs:** fixture conversations and pure-logic specs per skill (`strategy-templates.test`, `check-skill-scripts`); the seal and the renderer as pure functions.
- **browser smoke owed:** no.
- **deterministic gate:** unit suites + `check-release` and `check-onboarding-parity` green (a plugin release under `skills/RELEASING.md`).

## Sprint 3 — Smoke walkthrough (do these in order)
Env: a local repo with the plugin installed from this branch's release

1. Run `node scripts/one-pagers.mjs`
   → three sheets open: a business model canvas with Strategyzer.com under it, a value proposition sheet and a persona poster.
2. Run `/golden-frijoles:north-star` to the metric step
   → a scenario table appears before you pick.

If any step fails, note the step number + what you saw — that's the bug report.
