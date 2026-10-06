---
epic: one-header-one-name
sprint: 1
title: "One header"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "Plan in the header, in the loop's order"
    as_a: "a founder"
    i_want: "Plan in the header, in the loop's order"
    so_that: "I find the roadmap and board where the rest of the product is"
    risk: low
    status: planned
  - id: S1.2
    title: "The Hub inside the console"
    as_a: "a founder"
    i_want: "the Hub pages inside the console"
    so_that: "it feels like one product"
    risk: low
    status: planned
  - id: S1.3
    title: "The board across all products in the switcher"
    as_a: "a founder with several products"
    i_want: "the board across all of them next to Portfolio in the switcher"
    so_that: "I can see all my work in one move"
    risk: low
    status: planned
---
# One header and one name per thing — Sprint 1: One header

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Plan in the header, in the loop's order
**As** a founder, **I want** Plan in the header, in the loop's order, **so that** I find the roadmap and board where
the rest of the product is.
`CONSOLE_SECTIONS` becomes Today · Plan · Ship · Measure · Setup. Roadmap, Board and Horizon join the surface
inventory under Plan (hrefs to `/hub/<project>`, `/board`, `/horizon`); the Outcome report joins Measure
(`/hub/<project>/report`). Each gets an icon from the closed set. Today: Today, Agent queue · Ship: Flags, A/B tests,
Scheduled changes, Flag history · Measure: North Star, FinOps, Journeys, Scenarios & drills, Outcome report · Setup:
Connect your agent, CLI access, Keys, Webhooks, Share links.
**Acceptance:**
- The header reads Today · Plan · Ship · Measure · Setup on every console page.
- Plan's rail lists Roadmap, Board and Horizon; Measure's lists the Outcome report.
- Every href is an existing URL.
**Risk:** low

### Story 1.2 — The Hub inside the console
**As** a founder, **I want** the Hub pages inside the console, **so that** it feels like one product.
The Hub pages (`/hub/<project>`, `/board`, `/horizon`, `/report`, `/epic/<e>`, and `/hub/w/<workspace>/board`) render
in `ProductShell` with Plan (or Measure, for the report) current. `HubFrame` and its "Back to the console" button go.
URLs stay. The shared report (`/s/<token>`) and any Hub page a non-member can open keep working without console chrome
(read `shell-nav.ts`'s public-page branch first). Record in `design-system-rails/README.md` that its DD2 (the Hub kept
out of the header) is reversed by audit decision 3.
**Acceptance:**
- A member on any Hub page sees the console header and rail; no "Back to the console" anywhere.
- `/s/<token>` opens signed out, as today.
- `design-system-rails` README carries the DD2 reversal line.
**Risk:** low

### Story 1.3 — The board across all products in the switcher
**As** a founder with several products, **I want** the board across all of them next to Portfolio in the switcher,
**so that** I can see all my work in one move.
In `ProductShell`'s switcher, under each workspace with two or more products, "Board across all products"
(`/hub/w/<workspace>/board`) sits beside Portfolio. One product: neither shows, as today.
**Acceptance:**
- With two products in a workspace, the switcher's top shows Portfolio and Board across all products.
- With one product, neither shows.
**Risk:** low

## Sprint QA
- **api spec(s):** S1.1 → `route-manifest.test.ts`, `surface-map.test.ts`; S1.2 → `console-shell.authed.spec.ts` and
  `console-shell-public.browser.spec.ts` for a member and a visitor; S1.3 → an authed spec on the switcher with one and
  two products. Guards that pinned the old shape are updated deliberately, never deleted.
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, go to https://goldenfrijoles.com/app
   → The header reads Today · Plan · Ship · Measure · Setup.
2. Click Plan
   → The roadmap opens in the console, with Roadmap · Board · Horizon in the rail. No "Back to the console" button.
3. Click Board
   → Your board, same URL as before (/hub/<project>/board), inside the console.
4. Click Measure, then Outcome report
   → The report, inside the console.
5. Open the product switcher (with two products in the workspace)
   → Portfolio and Board across all products at the top.
6. Signed out, open a share link (/s/…)
   → The report opens, as before.

If any step fails, note the step number + what you saw — that's the bug report.
