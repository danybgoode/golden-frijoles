---
epic: owed-on-screen
sprint: 2
title: "On screen"
risk: low
phase: Locking architecture
stories_total: 4
stories:
  - id: S2.1
    title: "The epic page shows what is still owed"
    as_a: "a founder reading one epic"
    i_want: "its owed checks listed, with their kind and where each was written"
    so_that: "I can close the epic's loop from its own page"
    risk: low
    status: planned
  - id: S2.2
    title: "The board has one Waiting on you band"
    as_a: "a founder looking across epics"
    i_want: "every owed check in one band, split by who can clear it"
    so_that: "I clear what only I can do, and see what an agent could take"
    risk: low
    status: planned
  - id: S2.3
    title: "The portfolio card counts open checks"
    as_a: "a founder with several products"
    i_want: "each product's open owed count on its portfolio card"
    so_that: "I see which product has loose ends at a glance"
    risk: low
    status: planned
  - id: S2.4
    title: "The flag ships dark and the view is measured"
    as_a: "the product owner"
    i_want: "the screens behind hub.owed_enabled, with owed_viewed counted"
    so_that: "I roll it out when I choose and know whether it's used"
    risk: low
    status: planned
---
# Owed on screen — Sprint 2: On screen

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S2.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 2.1 — The epic page shows what is still owed
**As** a founder reading one epic, **I want** its owed checks listed, with their kind and where each was written,
**so that** I can close the epic's loop from its own page.
**Acceptance:** `app/hub/[projectSlug]/epic/[epicSlug]` shows an "Owed" section for a member (text, kind, `file:line`),
read through `owedForViewer`. The section is absent when nothing is owed, for a non-member, and with the flag off.
**Risk:** low

### Story 2.2 — The board has one Waiting on you band
**As** a founder looking across epics, **I want** every owed check in one band, split by who can clear it, **so that**
I clear what only I can do, and see what an agent could take.
**Acceptance:** `app/hub/[projectSlug]/board` shows "Waiting on you" (judgment, credential, publish, ops), "An agent
could, with a smoke account" (signed-in, interactive) and "Not sorted yet" (unsorted). Each line names its epic and
links to it. The band carries the push's freshness line (`lib/hub-freshness.ts`) and has an empty state. Built from
`design-system/bands`. A grouping function in `lib/` with a pure spec.
**Risk:** low

### Story 2.3 — The portfolio card counts open checks
**As** a founder with several products, **I want** each product's open owed count on its portfolio card, **so that** I
see which product has loose ends at a glance.
**Acceptance:** `app/app/portfolio` shows "N owed" per product card for members, nothing when zero or unpushed. The
count comes from each product's own latest push, one project per read (the portfolio already reads its products
through `getWorkspaceProjects()`).
**Risk:** low

### Story 2.4 — The flag ships dark and the view is measured
**As** the product owner, **I want** the screens behind `hub.owed_enabled`, with `owed_viewed` counted, **so that** I
roll it out when I choose and know whether it's used.
**Acceptance:** a `GATES` row plus `frijoles flags create hub.owed_enabled --enablement --all-envs`;
`frijoles flags get hub.owed_enabled` prints `off vN` in production. Off renders all three screens exactly as before.
`owed_viewed` is tracked through `trackSelfEvent`, once per page view that rendered at least one owed check. A browser
spec renders the board with the flag on and off.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Cites the epic README's D7, D9, D10, D11; builds only on S1's seams (`lib/owed.ts`, `lib/owed-read.ts`).
- **Every screen:** `if (await isOwedOnScreenEnabled())` FIRST, then `getOwedForViewer(<the id the page already
  resolved>, <session user id or null>)`. Flag off or `{ ok: false }` ⇒ render exactly what renders today (no section, no
  band, no count, no empty state).
- **S2.1** epic page: an "Owed" section (text, kind in words, `file:line` linked through the page's existing repo base
  like `EpicDocs`) for `items` where `epic === card.slug`; absent when none.
- **S2.2** board: one "Waiting on you" band from `design-system/bands.tsx` (`Band`, `TaskList`, `BandEmpty`), three groups
  per D10, each line naming its epic and linking `/hub/<slug>/epic/<epic>` (unattached lines name their file). The push's
  freshness line (`formatFreshness` of the owed read's `generatedAt`/`sourceCommit`). Empty state when the read is ok and
  holds zero. Project board only — the workspace board is out of scope.
- **S2.3** portfolio: the count per card through `getOwedForViewer(project.id, userId)` inside `getPortfolio` (the
  project list stays `getWorkspaceProjects()`); "N owed" when N > 0, nothing at 0 or on `{ ok: false }`.
- **S2.4** D9 row + `ci/gates.*.env` + catalog create (`off vN` in production, verified); D11 `owed_viewed`; a browser
  spec renders the board ON (ci on-server) and asserts the band's absence on the OFF server, following the existing
  `*-dark` spec pattern.
- Visual gate: with the flag off nothing changes, so no approved state moves; the lit band is a new state left unapproved
  (named in the PR body).

## Sprint QA
- **api spec(s):** pure specs for grouping and the count; browser spec for the band on/off (S2.4).
- **browser smoke owed:** yes, the signed-in walkthrough below, to the product owner.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `frijoles flags get hub.owed_enabled --project golden-frijoles`.
   → the production row says `off v1` (or a later version).
2. Signed in, open https://goldenfrijoles.com/hub/golden-frijoles/board.
   → the board looks as it did before, with no owed band.
3. Run `frijoles flags set hub.owed_enabled --value true --env production --project golden-frijoles`, wait 30 s, reload the board.
   → "Waiting on you" appears, its count matches `OWED-LEDGER.md`'s "Who can clear it" table, and it says when it
   was pushed.
4. Click a line under "Waiting on you".
   → it opens that epic's page, whose "Owed" section lists the same check with its `file:line`.
5. Open https://goldenfrijoles.com/app/portfolio.
   → each product card with owed checks shows "N owed".
6. Sign out and open the same board URL.
   → no owed band and no owed section anywhere.

Steps 2–5 are signed-in steps, owed to the product owner.

If any step fails, note the step number + what you saw — that's the bug report.
