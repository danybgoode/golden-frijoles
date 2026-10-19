---
epic: landing-launch-experiment
sprint: 3
title: "Variant B"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S3.1
    title: "Hero and nav"
    as_a: "a founder landing on B"
    i_want: "a single-column hero that says what this is in one line, with the prompt right there"
    so_that: "I can start in one paste"
    risk: low
    status: done   # 339983b, ca658f6
  - id: S3.2
    title: "From why to paid off"
    as_a: "a founder reading B"
    i_want: "six blocks in the order a bet moves, each with a real product shot"
    so_that: "I see my own job: why, measure, cost, rehearse, decide, release"
    risk: low
    status: done   # e43d3c3, 95b610c
  - id: S3.3
    title: "Agent strip, founder note, pricing and closing CTA"
    as_a: "a founder deciding on B"
    i_want: "the reason it exists, the price and one more chance to start"
    so_that: "I can decide without leaving the page"
    risk: low
    status: done   # c61b2cc, 856b351
  - id: S3.4
    title: "/ serves A or B"
    as_a: "the product owner"
    i_want: "`/` to render A or B per visitor from the flag"
    so_that: "the test runs and can be killed in 30 s"
    risk: high
    status: done   # 8abc5e5, 23e4402 · kill verified on launch day
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 3: Variant B

**Status:** 🟦 In review — Sprint 3 PR (B dark: the flag stays off; launch is the builder's Start, D10)

## Stories

### Story 3.1 — Hero and nav
**As a** founder landing on B, **I want** a single-column hero that says what this is in one line, with the prompt right there, **so that** I can start in one paste.
**Acceptance:**
- "Ship work that matters" · "Thousands of PRs a day. Did any of them pay off?" · the install prompt card, as in the approved prototype (v3).
- `check-design-drift` passes (no terminal full stop on headings).
**Risk:** low

### Story 3.2 — From why to paid off
**As a** founder reading B, **I want** six blocks in the order a bet moves, each with a real product shot, **so that** I see my own job: why, measure, cost, rehearse, decide, release.
**Acceptance:**
- Screenshots of the public golden-frijoles project, never invented numbers (CODE-QUALITY #9).
- Cost shows spend vs quote and result vs target as two separate signals with symbols; Rehearse shows a real drill run; Release shows the flag in plain language (who sees it).
**Risk:** low

### Story 3.3 — Agent strip, founder note, pricing and closing CTA
**As a** founder deciding on B, **I want** the reason it exists, the price and one more chance to start, **so that** I can decide without leaving the page.
**Acceptance:**
- Founder note signed, with the methodology link; tiers with no subheadings; Growth CTA "Get Growth"; Set up with us "from $1,500" → `/talk`.
- Closing CTA "Your next epic could be the one that pays off" with the prompt card.
**Risk:** low

### Story 3.4 — / serves A or B
**As** the product owner, **I want** `/` to render A or B per visitor from the flag, **so that** the test runs and can be killed in 30 s.
**Acceptance:**
- `variant()` picks the tree on the server; `force-dynamic` kept; no client-side swap.
- A's markup unchanged (snapshot against `main`).
- Kill verified in production: rollout 50 → kill → a B visitor sees A within the cache window.
- The mobile route sweep covers both variants.
**Risk:** high (the public front door)

## Build contract (locked by the architect before the builder started)
Re-verified at the wave-2 boundary. Stacked as `feat/landing-launch-experiment-s3`.
- **All of S3** → D18–D21 (README § Wave 2 lock) and the prototype at `references/landing-b-prototype-v3.html`.
- **S3.1–S3.3** → D13 (B in `components/landing-b/*`, `brand/tokens.css` + design-system primitives, no raw hex), D14
  (real screenshots). The approved prototype v3 is the contract (WAYS-OF-WORKING: an approved design IS scope).
- **S3.4** → D1 (`variant()` picks the tree on the server), D11 (`?variant=` on non-production only), D10 (launch is
  Start; kill is `frijoles flags kill`).

## Sprint QA
- A snapshot spec (S3.4), landing-prompts spec on B, mobile sweep on both
- browser smoke owed: yes, to Daniel — read B on phone and desktop; the kill switch in production
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

1. Open the PR preview at `/?variant=b` (previews have no database, so the flag cannot answer there — D11)
   → B renders: single-column hero, six blocks, founder note, pricing, closing CTA
2. Open the same preview at `/`
   → A renders, unchanged
3. (launch day — Daniel) https://goldenfrijoles.com/app → Experiments → the landing experiment → Start (D10), then open goldenfrijoles.com in two private windows
   → both variants are served; each window keeps its variant on reload
4. `frijoles flags kill landing.variant_b_enabled --env production`, wait 30 s, reload the B window
   → A renders

If any step fails, note the step number + what you saw — that's the bug report.

### Build log — 2026-10-19 (agent, local production build)
- `/` with no flag served → A; its markup equals `main`'s (`e2e/landing-variants.spec.ts`, fixture generated on this branch and
  passed against `main`'s `page.tsx`; a one-word change to an A section turns it red).
- `/?variant=b` (non-production, D11) → B: hero, six steps, agent strip, founder note, pricing, closing CTA, the shared footer.
  Both variants pass the mobile rail at 360 and 390 (`e2e/landing-variants.authed.spec.ts`, run by CI); no horizontal scroll.
- The six shots (D19, amended by Daniel on #409): all six are the mockup's drawn branding shots, each labelled
  "Illustration · sample data". An earlier build used real screenshots for Why and Cost; Daniel asked for the mockup's
  windows instead, and the screenshots were removed.
- Deviations from the prototype: the shared `BrandLockup` instead of the drawn bean; the shared `CopyPromptCard`, skinned on
  B to the prototype's look but with a 44px copy button (the mobile tap-target rule) and its own "copy prompt" wording;
  Growth's CTA is "Start free" with the billing-not-live line (D20); "Book a conversation" → `/talk` (D21); the agent strip's
  third command is `frijoles scenarios launch black-friday` (`--watch` belongs to `scenarios runs`).
