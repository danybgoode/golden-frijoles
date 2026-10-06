---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
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
