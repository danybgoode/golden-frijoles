---
epic: brand-reveal-error-pages
sprint: 1
title: "S1 Golden terminal welcome"
risk: high
phase: Shipped
stories_total: 1
stories:
  - id: S1.1
    title: "Reveal FRIJOLES during interactive setup"
    as_a: "person setting up the CLI"
    i_want: "a short green-to-gold bean and lettering reveal"
    so_that: "the first setup moment feels recognizably Golden Frijoles"
    risk: high
    status: done
---
# A golden welcome and recovery pages — Sprint 1: S1 Golden terminal welcome

**Status:** ✅ shipped 2026-10-10 (#340, merge `f0cadd1`; CLI 1.2.0 and kit 1.4.0 on npm)

## Stories
### Story 1.1 — Reveal FRIJOLES during interactive setup ✅ `5a353d0`
**As a** person setting up the CLI, **I want** a short green-to-gold bean and lettering reveal, **so that** the first setup moment feels recognizably Golden Frijoles.
**Acceptance:** Interactive `frijoles setup` shows a green bean ripening to gold and a left-to-right gold sweep that reveals legible FRIJOLES before setup prompts. A no-motion setting shows a static branded mark. JSON, `--yes`, non-TTY, CI, and narrow/dumb terminals remain readable and do not emit animation control sequences. Existing setup choices and results stay unchanged.
**Risk:** high

## Sprint QA
- **CLI spec(s):** frame/color behavior and setup output modes in `packages/cli/src` tests.
- **browser smoke owed:** no; this is a terminal flow.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: locally built CLI, temporary working directory and temporary config path.

1. Run `frijoles setup` in a wide interactive terminal.
   → Green bean becomes gold; the sweep reveals FRIJOLES; setup questions follow.
2. Run `FRIJOLES_NO_MOTION=1 frijoles setup` in the same terminal.
   → Static readable branding appears, followed by the same questions.
3. Run `frijoles setup --yes --json` with output captured.
   → Exactly one JSON result appears on stdout, with no animation escapes.

<!-- Delete whichever pre-filled steps don't apply to this sprint; add more using the same shape
     (real clickable URL + one observable result). Flag any money/auth/checkout step by name —
     those are owed to your project's product owner (an automated browser smoke can't fully cover
     them). -->

If any step fails, note the step number + what you saw — that's the bug report.
