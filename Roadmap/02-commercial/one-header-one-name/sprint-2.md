---
epic: one-header-one-name
sprint: 2
title: "One name per thing, and ⌘K"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S2.1
    title: "⌘K finds epics and products"
    as_a: "a founder"
    i_want: "⌘K to find epics and products"
    so_that: "I get to work by its name"
    risk: low
    status: shipped
  - id: S2.2
    title: "One name per thing, guarded"
    as_a: "a founder"
    i_want: "one name for each thing"
    so_that: "I never wonder if two words mean two things"
    risk: low
    status: shipped
  - id: S2.3
    title: "The roadmap overview, and the walkthrough"
    as_a: "the product owner"
    i_want: "the roadmap overview in the same words and the walkthrough run on production"
    so_that: "the launch surfaces are verified, not assumed"
    risk: low
    status: shipped
---
# One header and one name per thing — Sprint 2: One name per thing, and ⌘K

**Status:** ✅ shipped 2026-10-07 — PR #288, merge `e99019f` (S2.2 `535122b` + review `9a5151e`, S2.1 `05c3055`, S2.3 `bcd1a44`); deployed and the signed-out half verified live (below).

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — ⌘K finds epics and products ✅ `05c3055`
**As** a founder, **I want** ⌘K to find epics and products, **so that** I get to work by its name.
`PaletteEntry` gains kinds `epic` (the active project's epics, from `getHubRoadmap`; opens the epic page; hint: its
stage) and `product` (the projects in the switcher's membership list; opens that product's Today). Each kind is
labelled so it can be told apart. Products come only from `getShellNav`'s list; any per-project read across a
workspace goes through `getWorkspaceProjects` (the tenancy invariant).
**Acceptance:**
- Typing part of an epic's name lists it as "Epic · <stage>"; Enter opens it.
- Typing a product's name lists it as "Product"; Enter switches to it.
- No epic or product of a workspace you don't belong to ever appears.
**Risk:** low

### Story 2.2 — One name per thing, guarded ✅ `535122b`, `9a5151e`
**As** a founder, **I want** one name for each thing, **so that** I never wonder if two words mean two things.
Decision 2 on screen, through one label module with a test (carried over from `plain-outcome-rename` S5.1): Features →
Flags · "On in Production" → "Flags on" · Experiments → A/B tests · Report / Pod report → Outcome report (console,
Hub and the share page's title) · Setup's Destinations → Webhooks · Your workspace → Portfolio · Tasks → Agent queue ·
Activity → Flag history · To groom → Backlog · Ready to build → Ready. Stage keys (`lib/stage-commands.ts`,
`lib/hub-areas.ts`, pushed roadmaps), `status:` values, flag keys and URLs don't change. Horizon keeps "destinations".
The old screen words go into `design-system/vocabulary.ts` so a page that shows one fails its test.
**Acceptance:**
- Every label above reads its new name, in the header, rail, ⌘K, page titles and board columns.
- The board's columns still hold the same cards (no key renamed).
- Horizon still says destinations.
- Putting "Pod report" back on a page fails `vocabulary.test.ts`.
**Risk:** low

### Story 2.3 — The roadmap overview, and the walkthrough ✅ `bcd1a44` (walkthrough owed)
**As** the product owner, **I want** the roadmap overview in the same words and the walkthrough run on production,
**so that** the launch surfaces are verified, not assumed.
From `plain-outcome-rename` S5.2: `Roadmap/README.md` uses the decision 1 and 2 words and has no Golden Beans title.
Then Daniel runs both sprints' walkthroughs on production.
**Acceptance:**
- `Roadmap/README.md` has no retired word and no Golden Beans title.
- Both walkthroughs pass, blind.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Cites the epic README's D1–D13; nothing here restates them.
- **2.1** = D7. Files: `lib/console-palette.ts` (+ test), `CommandPalette.tsx`, `ProductShell.tsx` (products prop),
  new `app/api/internal/epic-index/[projectSlug]/route.ts`.
- **2.2** = D8 + D9 + D10 + D12. Files: new `lib/screen-words.ts` (+ test), the inventory labels, the page titles,
  crumbs and list labels the guard finds, board/roadmap stage rendering, `design-system/vocabulary.ts` (+ test).
- **2.3** = `Roadmap/README.md` only (decision 1 and 2 words, no Golden Beans title), then the walkthroughs.

## Sprint QA
- **api spec(s):** S2.1 → a pure-logic spec on the palette entries (kinds, labels, membership), and
  `command-center.authed.spec.ts`; S2.2 → the label module's test, `vocabulary.test.ts`, the visual gate; S2.3 → docs.
- **browser smoke owed:** yes, to Daniel: the walkthrough below.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, press ⌘K and type part of an epic's name
   → The epic shows as "Epic · <stage>"; Enter opens it.
2. Press ⌘K and type another product's name
   → It shows as "Product"; Enter switches to it.
3. Click Ship
   → The rail reads Flags, A/B tests, Scheduled changes, Flag history. No "Features", "Experiments" or "Activity".
4. Click Plan, then Board
   → Columns read Backlog · Grooming · Ready · Building · QA · Shipped, with the same cards as before.
5. Click Setup
   → Webhooks, not Destinations. Then Plan › Horizon: still "destinations".
6. Click Measure › Outcome report
   → Titled Outcome report, not Pod report.

If any step fails, note the step number + what you saw — that's the bug report.

**Run so far (2026-10-07, architect, production, signed out):** step 4's columns on the demo board read Backlog ·
Grooming · Ready · Building · QA · Shipped with `data-stage` still `To groom … Shipped` (same cards); step 6's report
page is titled **Outcome report**; step 5's Horizon still says "destinations"; the epic index sends an anonymous caller
to login. **Steps 1–6 signed in are owed to Daniel**; CI's authed suite runs the ⌘K epic and product steps on every PR.
