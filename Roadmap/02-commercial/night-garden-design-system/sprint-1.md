---
epic: night-garden-design-system
sprint: 1
title: "The look, approved"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "The approved prototype in night garden"
    as_a: "the product owner"
    i_want: "the approved prototype in night garden"
    so_that: "I approve the look once for every page"
    risk: low
    status: planned
  - id: S1.2
    title: "Tokens regenerated, fonts switched"
    as_a: "a builder"
    i_want: "the tokens regenerated from the newly approved prototype and the fonts switched"
    so_that: "the product resolves the new look from one definition"
    risk: low
    status: planned
  - id: S1.3
    title: "Every page passes the visual gate in the new look"
    as_a: "anyone using the product"
    i_want: "every page to pass the visual gate in the new look"
    so_that: "nothing breaks quietly"
    risk: low
    status: planned
---
# Night garden, in the shared design system — Sprint 1: The look, approved

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — The approved prototype in night garden
**As** the product owner, **I want** the approved prototype in night garden, **so that** I approve the look once for
every page.
Change `apps/web/design-system/console-prototype.html` only: night garden values (Night/Soil grounds, Paper text and
actions, Moonlight for the agent, Sprout for live, Ember for broken only, Gold for proven only), the three fonts
(Newsreader display, Hanken Grotesk UI, IBM Plex Mono numbers), Paper as the action colour. Render the 33 states with
`render-reference.mjs` and put them in front of Daniel for review.
**Acceptance:**
- The 33 states render with zero page errors.
- No gold on any action, link or button; gold appears only where a state means "proven".
- Daniel has reviewed the renders and written his approval line, with the new hash, in `APPROVED.md`.
**Risk:** low

### Story 1.2 — Tokens regenerated, fonts switched
**As** a builder, **I want** the tokens regenerated from the newly approved prototype and the fonts switched, **so
that** the product resolves the new look from one definition.
Run `extract-css.mjs` and `measure-contract.mjs` (never hand-edit their outputs). Switch `next/font` in
`apps/web/app/layout.tsx` to Newsreader, Hanken Grotesk and IBM Plex Mono (`next/font/google`, as Archivo is today)
and update `FONT_STACK_OVERRIDES` to match. Token names stay as they are.
**Acceptance:**
- `extract-css --check` and `measure-contract --check` are green.
- `tokens.test.ts`, `tokens-defined.test.ts` pass.
- No Archivo anywhere in `apps/web`.
**Risk:** low

### Story 1.3 — Every page passes the visual gate in the new look
**As** anyone using the product, **I want** every page to pass the visual gate in the new look, **so that** nothing
breaks quietly.
Re-render the baselines once (they derive from the prototype). A route that fails for anything other than font
metrics is a real regression and gets fixed, not re-baselined.
**Acceptance:**
- The visual gate is green on every in-scope route; the coverage ratchet holds (`coverage.json` does not shrink).
- `check-design-drift.mjs` passes.
**Risk:** low

## Sprint QA
- **api spec(s):** none new; the generated-file checks (`extract-css --check`, `measure-contract --check`), `tokens.test.ts`,
  `tokens-defined.test.ts`, and `console-visual.authed.spec.ts` (the visual gate) cover S1.1–S1.3.
- **browser smoke owed:** yes, to Daniel — the approval of the renders (S1.1) and the walkthrough below. No money or
  auth change.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Go to https://goldenfrijoles.com/login
   → Night background, Paper text, the Newsreader heading; the sign-in button is Paper, not gold.
2. Signed in, go to https://goldenfrijoles.com/app
   → The console in night garden; the header, rail and cards read in Hanken Grotesk, numbers in Plex Mono.
3. Go to a Hub board, https://goldenfrijoles.com/hub
   → Same look as the console: one product.
4. Go to https://goldenfrijoles.com/app/design-system
   → The specimen in night garden; no gold on any button or link.

If any step fails, note the step number + what you saw — that's the bug report.
