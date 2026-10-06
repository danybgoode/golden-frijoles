---
epic: night-garden-design-system
sprint: 2
title: "The pieces, and the public pages"
risk: low
phase: Shaping
stories_total: 5
stories:
  - id: S2.1
    title: "The Bean"
    as_a: "a founder"
    i_want: "results shown as beans I recognise at a glance"
    so_that: "I can see what paid off without reading"
    risk: low
    status: planned
  - id: S2.2
    title: "Icon names for night garden"
    as_a: "a founder"
    i_want: "icons where text used to sit"
    so_that: "pages read faster"
    risk: low
    status: planned
  - id: S2.3
    title: "Every control shows its state"
    as_a: "a founder"
    i_want: "every control to show when it can be clicked, is pressed, is working or is done"
    so_that: "I never wonder"
    risk: low
    status: planned
  - id: S2.4
    title: "Public pages in night garden"
    as_a: "a visitor"
    i_want: "the public pages in the same look"
    so_that: "the first run feels like the product"
    risk: low
    status: planned
  - id: S2.5
    title: "Density rules in the contract"
    as_a: "a builder"
    i_want: "the density rules in the contract"
    so_that: "later page epics build to them"
    risk: low
    status: planned
---
# Night garden, in the shared design system — Sprint 2: The pieces, and the public pages

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — The Bean
**As** a founder, **I want** results shown as beans I recognise at a glance, **so that** I can see what paid off
without reading.
A Bean component in four kinds (proven, growing, disproven, unclear) and three sizes (18, 24, 36 px), each carrying
its word for screen readers. Added to the prototype as an approved state and shown on `/app/design-system`. Not placed
on any other page (launch epics 4–6 do that).
**Acceptance:**
- The specimen shows all four kinds at all three sizes.
- Gold appears only on Proven; Ember only on Disproven.
- A screen reader announces each bean's word (Proven, Growing, Disproven, Unclear).
**Risk:** low

### Story 2.2 — Icon names for night garden
**As** a founder, **I want** icons where text used to sit, **so that** pages read faster.
Add to the closed union in `components/ui/Icon.tsx`, all from Lucide: target, split, coin, agent, user, doc, branch,
chart, calendar, mail, idea, eye.
**Acceptance:**
- The union compiles with the twelve new names; each renders on the specimen.
- `check-design-drift.mjs` passes (no pictographs inside `/app`).
**Risk:** low

### Story 2.3 — Every control shows its state
**As** a founder, **I want** every control to show when it can be clicked, is pressed, is working or is done, **so
that** I never wonder.
Check `system.css`'s ten-state taxonomy against the canvas States sheet and fill the gaps; do not edit
`references/ux-guidelines.md`.
**Acceptance:**
- On the specimen, every control shows rest, hover, focus, pressed, working, done and not ready, as on the canvas sheet.
- A keyboard-only pass reaches every control with a visible focus ring.
- `system-cascade.test.ts` passes.
**Risk:** low

### Story 2.4 — Public pages in night garden
**As** a visitor, **I want** the public pages in the same look, **so that** the first run feels like the product.
Night values in `apps/web/brand/tokens.css` (the `:root` set). Values only; no layout or copy change (the landing
redesign is launch epic 2).
**Acceptance:**
- `/`, `/install`, `/login` and `/methodology` use night values and the new fonts.
- No gold on actions.
**Risk:** low

### Story 2.5 — Density rules in the contract
**As** a builder, **I want** the density rules in the contract, **so that** later page epics build to them.
Write the canvas Density rules into `apps/web/design-system/CONSOLE-CONTRACT.md`: room to breathe, icons and graphics
before text, one idea per block. Docs only.
**Acceptance:**
- `CONSOLE-CONTRACT.md` has a Density section the page epics can point at.
**Risk:** low

## Sprint QA
- **api spec(s):** S2.1 → a pure-logic spec on kind → label, plus `design-system-specimen.authed.spec.ts` extended
  for the beans and icons; S2.3 → `system-cascade.test.ts`.
- **browser smoke owed:** yes, to Daniel — the walkthrough below, including the keyboard pass. No money or auth change.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Go to https://goldenfrijoles.com/
   → Night garden, Newsreader headline, no gold on buttons.
2. Go to https://goldenfrijoles.com/install, then https://goldenfrijoles.com/methodology
   → Same look as the landing.
3. Go to https://goldenfrijoles.com/login and sign in
   → Same look; the sign-in button shows hover, pressed and working.
4. Go to https://goldenfrijoles.com/app/design-system
   → Four beans at three sizes, gold only on Proven; the twelve new icons; every control's states.
5. On the same page, press Tab through the controls
   → A visible focus ring on every one.

If any step fails, note the step number + what you saw — that's the bug report.
