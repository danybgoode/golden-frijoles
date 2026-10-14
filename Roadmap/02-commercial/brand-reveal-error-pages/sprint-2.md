---
epic: brand-reveal-error-pages
sprint: 2
title: "S2 Branded recovery pages"
risk: high
phase: Shipped
stories_total: 1
stories:
  - id: S2.1
    title: "Recover from missing and broken web pages"
    as_a: "visitor who reaches an error"
    i_want: "a branded explanation and useful next step"
    so_that: "I can recover without guessing what happened"
    risk: high
    status: done
---
# A golden welcome and recovery pages — Sprint 2: S2 Branded recovery pages

**Status:** ✅ shipped 2026-10-10 (#340, merge `f0cadd1`); steps 1–2 checked live on 2026-10-14

## Stories
### Story 2.1 — Recover from missing and broken web pages ✅ `1d6ab59`
**As a** visitor who reaches an error, **I want** a branded explanation and useful next step, **so that** I can recover without guessing what happened.
**Acceptance:** Unknown pages and explicit browser 404s display the approved playful bean visual and working home/back links. Route crashes show a similarly branded retry state; root crashes also render when the normal layout fails. Mobile and desktop layouts are legible. Existing shared-link missing/expired/revoked states stay indistinguishable and existing API/auth statuses stay correct.
**Risk:** high

## Sprint QA
- **api spec(s):** existing public/share status specs plus a focused missing-page status assertion.
- **browser smoke owed:** yes, render 404 and a controlled error boundary locally and on preview; no money step.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: preview URL before merge, then production after merge.

1. ✅ *(2026-10-14: HTTP 404 and "We couldn’t find that page… Back to Golden Frijoles", desktop and mobile user agents)*
   Open `https://goldenfrijoles.com/this-page-does-not-exist` at desktop and mobile widths.
   → Branded 404, helpful copy and working home link; HTTP 404 for a non-streamed response.
2. ✅ *(2026-10-14: HTTP 404 and the generic "Whoever shared it can make you a new one")*
   Open an invalid `https://goldenfrijoles.com/s/<token>`.
   → Shared-link recovery remains generic and does not reveal token validity.
3. Exercise a local test-only throwing route in the browser.
   → Branded 500 boundary offers a retry and home link, without sensitive error detail.

<!-- Delete whichever pre-filled steps don't apply to this sprint; add more using the same shape
     (real clickable URL + one observable result). Flag any money/auth/checkout step by name —
     those are owed to your project's product owner (an automated browser smoke can't fully cover
     them). -->

If any step fails, note the step number + what you saw — that's the bug report.
