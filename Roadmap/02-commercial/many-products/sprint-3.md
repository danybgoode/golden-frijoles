---
epic: many-products
sprint: 3
title: "Each product's own horizon"
risk: low
phase: Shaping
stories_total: 2
stories:
  - id: S3.1
    title: "The horizon travels with the roadmap push"
    as_a: "a founder"
    i_want: "to declare my product's destinations in its repo"
    so_that: "the horizon is mine, kept where the rest of my roadmap lives"
    risk: low
    status: planned
  - id: S3.2
    title: "/horizon shows the product's own destinations"
    as_a: "a founder looking at a product's horizon"
    i_want: "that product's destinations, or a way to add some"
    so_that: "I never see another product's end states"
    risk: low
    status: planned
---
# Many products — Sprint 3: Each product's own horizon

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites the epic README's Architecture lock; nothing here restates it.
- 3.1 → D14 (`horizon.md` parser + `destination:` list in the kit; optional `horizon` + row `destinations` in the schema;
  unknown id rejected on both sides, naming the epic; Golden Frijoles' list moves into its own `horizon.md`).
- 3.2 → D14 (`deriveHorizon(destinations, epics)`; `HORIZON_DESTINATIONS` deleted; `hub-horizon-empty` state approved).

## Stories

### Story 3.1 — The horizon travels with the roadmap push
**As a** founder, **I want** to declare my product's destinations in its repo, **so that** the horizon is mine, kept where the rest of my roadmap lives.
**Acceptance:**
- `Roadmap/00-strategy/horizon.md` declares destinations (id · title · one-line description); an epic names the one it
  lights with `destination: <id>` in its README frontmatter.
- `roadmap-extract` reads both; `roadmap-push` sends an optional, additive `horizon` key (the `board` precedent,
  `lib/roadmap-artifact-schema.ts:242`); a push without it still parses.
- An epic naming an unknown destination fails the push, naming the epic.
- Golden Frijoles' current list moves into its own `horizon.md`, and its epics gain `destination:`.
**Risk:** low (additive schema; the kit change is a plugin release)

### Story 3.2 — /horizon shows the product's own destinations
**As a** founder looking at a product's horizon, **I want** that product's destinations, or a way to add some, **so that** I never see another product's end states.
**Acceptance:**
- `/hub/<product>/horizon` reads destinations from the product's latest artifact; `deriveHorizon` keeps its rule (lit
  only when every epic under it shipped) and `HORIZON_DESTINATIONS` is deleted.
- Golden Frijoles' horizon looks the same as before.
- A product with no destinations shows the `hub-horizon-empty` state from the pitch (a new approved surface state).
- The `bets_placed_per_workspace` reading counts bets pushed from every product in the workspace, not only this repo's
  — confirmed by reading it after aomx places one (or the gap is filed and the target read by hand).
**Risk:** low

## Sprint QA
- **api spec(s):** schema accepts/omits `horizon`; unknown `destination:` rejected (S3.1, pure spec); `deriveHorizon`
  from artifact data + empty state (S3.2, pure spec + `hub.spec.ts`).
- **browser smoke owed:** yes, to the product owner — the signed-in aomx and golden-frijoles horizon pages.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. (signed in) Go to https://goldenfrijoles.com/hub/golden-frijoles/horizon
   → The same destinations as before, with the same lit / partly lit / on the way.
2. Go to https://goldenfrijoles.com/hub/aomx/horizon
   → "No destinations yet" with how to declare one — no Golden Frijoles destinations.
3. In the aomx repo, add `Roadmap/00-strategy/horizon.md` with one destination and `destination:` on one epic, then run roadmap-push.
   → https://goldenfrijoles.com/hub/aomx/horizon shows that destination, "on the way", with the epic under it.

If any step fails, note the step number + what you saw — that's the bug report.
