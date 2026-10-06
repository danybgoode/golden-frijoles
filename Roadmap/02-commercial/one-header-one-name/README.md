---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-06T23:55:27Z"
slug: one-header-one-name
title: "One header and one name per thing"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 64      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One header and one name per thing

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/one-header-one-name.md`](../../00-ideas/seeds/one-header-one-name.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
The Hub and the console are two products today (F35): the Hub has its own frame and reaches the console only through
a "Back to the console" button, and the header has no Plan. The same thing has several names (F36), and ⌘K can't
find an epic. This epic gives the whole product one header in the loop's order, Today · Plan · Ship · Measure · Setup,
puts the Hub's pages inside it, adds the board across all products next to Portfolio, teaches ⌘K epics and products,
and gives each thing one name on screen, guarded so old names don't come back. No page, URL or stored value changes.
Launch epic 3 of [`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md), decisions 2 and 3;
takes over `plain-outcome-rename` sprint 5. Moves: proving_workspaces · Tests: Value proposition.

**Signal:** sign in, press ⌘K, type an epic's name, open it, and walk Plan → Ship → Measure without a back button.

## Platform-first note
No data model change. Navigation is the surface inventory (`lib/project-route-inventory.ts`): a section list plus one
entry per surface, which the header, the rail and ⌘K already read. Labels change at the display layer; stage keys,
`status:` values, flag keys and URLs are the system of record and stay as they are.

## What already exists (reuse, don't rebuild)
- `lib/project-route-inventory.ts` (`CONSOLE_SECTIONS`, surfaces with section, `iconKey`, href), `lib/shell-nav.ts`
  (`getShellNav`, gates, the public-page branch), `components/product/ProductShell.tsx` (header, switcher, Portfolio
  entry, `portfolioHrefFor`), `ConsoleRail.tsx`.
- `app/hub/hub-frame.tsx` (`HubFrame`), `app/hub/[projectSlug]/{page,board,horizon,report,epic}`,
  `app/hub/w/[workspaceId]/board`, `lib/hub-query.ts` (`getHubRoadmap`), `lib/hub-board.ts`, `lib/hub-areas.ts`,
  `lib/stage-commands.ts`, `lib/dashboard-auth.ts` (`requireDashboardAccess`).
- `components/product/CommandPalette.tsx`, `lib/console-palette.ts` (`PaletteEntry`: `surface` · `feature`).
- `design-system/vocabulary.ts` and test, `lib/flag-vocabulary.ts`.
- `app/s/[token]/page.tsx`, `app/hub/report-components.tsx` (report titles).
- Design source: the private canvas, page 0: Map, Words, Nav.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Plan in the header, in the loop's order | low |
| 1 | S1.2 The Hub inside the console | low |
| 1 | S1.3 The board across all products in the switcher | low |
| 2 | S2.1 ⌘K finds epics and products | low |
| 2 | S2.2 One name per thing, guarded | low |
| 2 | S2.3 The roadmap overview, and the walkthrough | low |

**Renames (decision 2), screen only:** Features → Flags · "On in Production" → "Flags on" · Experiments → A/B tests ·
Report / Pod report → Outcome report · Setup's Destinations → Webhooks · Your workspace → Portfolio · Tasks → Agent
queue · Activity → Flag history · To groom → Backlog · Ready to build → Ready. **Kept:** FinOps, Today, North Star,
Journeys, Scenarios & drills, Scheduled changes, Roadmap, Board, Horizon (and its "destinations"), Portfolio's
Consider · Operate · Exit.

**No-gos:** any URL change, redirect or removed page · stored values (`status:`, stage keys, flag keys, tables) ·
`plain-outcome-rename` sprints 1–4 (after launch, re-groomed first) · the epic page merge (epic 5), the Outcome
report layout (epic 6), the build view (epic 8) · the share page's layout · plugin and skill wording (epic 7) ·
styling (epic 1).

**Rabbit holes** (detail in the seed): stage names are data keys, rename the label never the key · Hub pages for
non-members and the shared report keep working without console chrome · products in ⌘K come from the switcher's
membership list, per-project reads through `getWorkspaceProjects` · record the reversal of `design-system-rails` DD2 ·
guards that pin the old shape are updated deliberately · "destinations" means two things.

**Flag:** none. Risk low (navigation and labels; no data, auth or money). Rollback is a revert.

## Decisions — 🔒 LOCKED 2026-10-06 (architect, against live code at `ae04823`)

Builders cite these; they are not restated in the sprint files. Each was read off the code named, not off the seed.

- **D1 — `plan` joins the CLOSED `ConsoleSection` union, and `CONSOLE_SECTIONS` is reordered to the loop:** Today ·
  Plan · Ship · Measure · Setup (`lib/project-route-inventory.ts`). Live order was Today · Measure · Ship · Setup, so
  Measure *moves* after Ship: that is part of the change, not a side effect. The header (`buildConsoleHeader`) and
  the rail (`railLinksFor`) already read only this list and the inventory; nothing else is touched to get the tab.
  Plan's entry is its first surface (`getSectionEntryHref`), i.e. Roadmap.
- **D2 — Four inventory rows, no new route:** `hub` (Roadmap, `/hub/<slug>`), `hub/board` (Board), `hub/horizon`
  (Horizon) under `plan`, and `hub/report` under `measure`, placed after `scenarios` so Measure reads North Star ·
  FinOps · Journeys · Scenarios & drills · Outcome report. All `audience: 'member'`, `gate: 'always'`,
  `status: 'linked'`, `topLevelProjectRoute: false`. Icons from the closed set (it has no map or kanban glyph, and `route` is
  Journeys'): Roadmap `map-pin`, Board `panels`, Horizon `rocket`, Outcome report `book`. The report row is labelled **Outcome report** from birth (a new label never takes an old name).
- **D3 — The Hub pages render in `ProductShell`; `HubFrame` is deleted.** `section: 'plan'` for roadmap, board,
  horizon and epic (`railActive` = `hub`, `hub/board`, `hub/horizon`, `hub` respectively), `section: 'measure'` +
  `hub/report` for the report. Each page now renders its own `<main>` (console pages do; `Frame` used to). No URL,
  guard or data read changes: `requireDashboardAccess` still runs first, before the shell (ProductShell's own rule:
  chrome below the guard).
- **D4 — Who has no rail still gets the Hub's tabs.** `requireDashboardAccess` lets two non-member viewers through:
  an anonymous visitor on the demo project (`getShellNav` → `EMPTY` → the public bar), and a signed-in non-member of
  the demo (`emptyHeader` → Today alone, no rail). Deleting `HubFrame` naively strands both with no way between
  Roadmap/Board/Horizon/Report. So `ProductShell` gains an optional `fallbackNav` that renders as a tier-2
  `<nav aria-label="Hub sections">` **only when this render has no rail**; the Hub passes its four tabs through a
  small `app/hub/hub-shell.tsx`. A member never sees it (they have the rail). This is the seed's rabbit hole
  ("keep working without console chrome") answered in the shell, not per page.
- **D5 — The workspace board (`/hub/w/<id>/board`) renders in `ProductShell`, `section: 'plan'`, `railActive: null`,**
  with `projectSlug` = the `?project=` filter or the first project `getWorkspaceProjects` returned, so the header
  and rail name a project of THAT workspace. Its own reads are unchanged (the tenancy invariant's one multi-project
  read, already). No `fallbackNav`: it has no anonymous reader (it redirects to `/login`).
- **D6 — The switcher entry:** in `ProductShell`'s grouped switcher, a workspace group with
  `≥ PORTFOLIO_MIN_PRODUCTS` products shows **Portfolio** then **Board across all products**
  (`workspaceBoardHrefFor(id)` beside `portfolioHrefFor` in `lib/portfolio-workspace.ts`, `data-workspace-board-entry`).
  Same condition as Portfolio, so one product shows neither. It renders `header.projects`, already read.
- **D7 — ⌘K's new kinds read nothing new across tenants.** `PaletteEntry.kind` widens to
  `'surface' | 'feature' | 'epic' | 'product'`, and the palette's kind word is a closed `Record` over it (a fifth
  kind is a compile error). **Products** = `header.projects` (`getUserProjects` via `getShellNav`, already
  workspace-filtered and already rendered in the switcher), passed as a prop; href `todayHrefFor(slug)`; the current
  product excluded. That is a membership list, not a data read, so `getWorkspaceProjects` is not involved and no
  call is added (AGENTS § tenancy, the `getUserProjects` carve-out). **Epics** = the ACTIVE project only, fetched on
  first open from a new `app/api/internal/epic-index/[projectSlug]/route.ts` gated exactly like its sibling
  `feature-index` (`requireProjectMembership`, `private, no-store`), built from `getHubRoadmap` rows of grain `Epic`;
  href `/hub/<slug>/epic/<epic>`; hint = the stage's screen word (D8). Cache keyed by slug, as `feature-index`'s is.
- **D8 — One label module: `lib/screen-words.ts`.** It holds the decision-2 renames as data and `stageLabel(stage)`:
  `'To groom'` → Backlog, `'Ready to build'` → Ready, the rest unchanged. **Keys never change**:
  `ROADMAP_STAGES`, `BOARD_STAGES`, `lib/stage-commands.ts`, `lib/hub-areas.ts` keep their literals; every place a
  stage is *shown* goes through `stageLabel`. Inventory labels, page titles, crumbs, ListCard labels and the
  CommandCenter tile take the new words. Horizon's "destinations" is a different thing and is not touched.
- **D9 — The guard:** `design-system/vocabulary.ts` gains `RETIRED_SCREEN_WORDS` (each with its replacement), and
  `vocabulary.test.ts` scans the screen surfaces (`app/app`, `app/hub`, `app/s`, `components/product`,
  `lib/project-route-inventory.ts`) with comments stripped. Multi-word names (`Pod report`, `On in Production`,
  `Your workspace`) fail anywhere in a rendered string or JSX text; single words (`Features`, `Experiments`,
  `Destinations`, `Tasks`, `Activity`) fail only as a WHOLE label (a string/JSX text that is exactly the word);
  the stage words fail only as JSX text, because they are legal as keys in comparisons. A mutation check (put
  "Pod report" back) is run and recorded.
- **D10 — Approved surfaces are not edited.** `design-system/surfaces/hub-board*.surface` still say "To groom …
  Ready to build" in their tiles line. The gate measures block kinds and counts, not words
  (`STATE-CONTRACT.json` → `hub-board`: `tiles count 6`), so the rename stays green without touching an approved hash.
  Per LEARNINGS (connect-page: *a structural contract can be satisfied by a different page*), the words drifting
  under an unchanged contract is said here and put to Daniel at close: re-approving the six board surfaces with the
  new words is his line to add, owed, not blocking.
- **D11 — DD2's reversal is recorded where DD2 lives:** `apps/web/design-system/APPROVED.md` (DD2's text) and
  `design-system-rails/README.md`, both citing audit decision 3. The manifest's six hub rows move to
  `frame: 'console'`, `seam: 'product-shell'`, `surface: <segment>` (the workspace board keeps `surface: null`);
  `Frame`'s `hub` variant and the CSS only it used go with `HubFrame` once nothing renders them. Guards that pinned
  the old shape (`route-manifest.test.ts` seam counts, `project-route-inventory.test.ts`, `console-shell.test.ts`,
  `hub-board.authed.spec.ts`'s tab assertion) are updated with the reason, never deleted.
- **D12 — Kept, deliberately, though the canvas words differ:** Setup's first item stays **Connect** (connect-page
  D4 titled it that today; "Connect your agent" is decision 3's description, not a decision-2 rename). Landing copy
  (`lib/maker-ops.ts`' "Experiments") is outside the console and outside this epic.
- **D13 — Shape of the run:** no flag (standing rule; risk low), no migration, no prod data read or written, so no
  live row counts decide anything here (the only "data" question, whether a real workspace holds 2+ products, is
  answered by the production walkthrough on Daniel's workspace). Stack `feat/one-header-one-name` → `-s2`, one PR per
  sprint. **The architect builds both sprints in place** — one session, one checkout, and both sprints edit the same
  shared seams (inventory, shell, palette), which WAYS-OF-WORKING routes to the strongest tier first. Preview cannot
  serve signed-in pages (`design-system-rails` D9), so walkthroughs run on production after each merge.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green (low risk). No migration, no flag, no backend change. Preview
walkthrough before each merge; production walkthrough at S2.3.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
