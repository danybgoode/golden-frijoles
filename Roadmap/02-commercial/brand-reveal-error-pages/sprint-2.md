---
epic: brand-reveal-error-pages
sprint: 2
title: "S2 Branded recovery pages"
risk: high
phase: Building
stories_total: 1
stories:
  - id: S2.1
    title: "Recover from missing and broken web pages"
    as_a: "visitor who reaches an error"
    i_want: "a branded explanation and useful next step"
    so_that: "I can recover without guessing what happened"
    risk: high
    status: planned
---
# A golden welcome and recovery pages — Sprint 2: S2 Branded recovery pages

**Status:** ⬜ not started

## Stories
<!-- One block per story. Thinnest shippable slice first.
     Each story ALSO has an entry in the frontmatter `stories:` list above — that entry is what tools
     read (the build view, build-state.mjs); the prose below is what people read. Add both, and keep
     `stories_total` (here and in the epic README) equal to the number of entries.
     Story `status:` is planned | in-progress | done. The sprint's `phase:` is the executive ladder
     (Shaping | Locking architecture | Building | Verifying | In review | Shipped), WRITTEN at each
     cadence event. Name the story in each commit subject (`S2.1 …`): that is how the build view
     knows which story is in flight.
     Keep the heading shape `### Story 2.M — <title>` (this is what the status board counts).
     When a story ships, append ✅ + its commit ref to the heading, e.g.
       ### Story 2.1 — <title> ✅ `abc1234`
     Note: the epic README frontmatter `status:` is the AUTHORITATIVE epic status; this ✅ marker only
     feeds the cosmetic per-sprint progress count, so a format slip can't mis-state shipped/not-shipped. -->

### Story 2.1 — Recover from missing and broken web pages
**As a** visitor who reaches an error, **I want** a branded explanation and useful next step, **so that** I can recover without guessing what happened.
**Acceptance:** Unknown pages and explicit browser 404s display the approved playful bean visual and working home/back links. Route crashes show a similarly branded retry state; root crashes also render when the normal layout fails. Mobile and desktop layouts are legible. Existing shared-link missing/expired/revoked states stay indistinguishable and existing API/auth statuses stay correct.
**Risk:** high

## Sprint QA
- **api spec(s):** existing public/share status specs plus a focused missing-page status assertion.
- **browser smoke owed:** yes, render 404 and a controlled error boundary locally and on preview; no money step.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: preview URL before merge, then production after merge.

1. Open `https://<your-domain>/this-page-does-not-exist` at desktop and mobile widths.
   → Branded 404, helpful copy and working home link; HTTP 404 for a non-streamed response.
2. Open an invalid `https://<your-domain>/s/<token>`.
   → Shared-link recovery remains generic and does not reveal token validity.
3. Exercise a local test-only throwing route in the browser.
   → Branded 500 boundary offers a retry and home link, without sensitive error detail.

<!-- Delete whichever pre-filled steps don't apply to this sprint; add more using the same shape
     (real clickable URL + one observable result). Flag any money/auth/checkout step by name —
     those are owed to your project's product owner (an automated browser smoke can't fully cover
     them). -->

If any step fails, note the step number + what you saw — that's the bug report.
