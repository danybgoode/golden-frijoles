---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: one-epic-page
title: "One epic page"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 65      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One epic page

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/one-epic-page.md`](../../00-ideas/seeds/one-epic-page.md)
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
An epic has two views with different content (F44): the Hub's epic page and the Board's card view. Neither says why
the epic exists or what it should move, neither shows its flag, and the commands are shorthand only our plugin
understands. This epic merges them into one page per epic, `/hub/<p>/epic/<e>`: where it is (a stage track), what to
do next (one plain-line command, the rest under More), why we're building it (hypothesis, target, read date, the bean
once read), progress by sprint, the flag's state, spend against quote and the documents, graphics before text. Old
`?card=` links land on it. Launch epic 5 of [`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md),
decision 4. Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** open any card; without scrolling, say why the epic exists, where it is, and the next command.

## Platform-first note
No new data store. The page reads the pushed roadmap row (`BoardCard`: stage, sprints, links, PR, kickoff, appetite,
bet, goal, FinOps fields), launch epic 4's target and verdict fields, and this project's flag registry. One new field,
`flag_key`, travels the same path as the others: written at grooming, copied by the scaffold, extracted and pushed.

## What already exists (reuse, don't rebuild)
- `app/hub/[projectSlug]/epic/[epicSlug]/page.tsx`, `app/hub/[projectSlug]/board/{page,board-components}.tsx`
  (`CardView`, `?card=`), `app/hub/w/[workspaceId]/board`, `app/hub/[projectSlug]/page.tsx`.
- `lib/hub-board.ts` (`BoardCard`), `lib/stage-commands.ts`, `lib/hub-query.ts`, `lib/hub-freshness.ts`,
  `lib/roadmap-finops.ts`, `lib/flag-registry.ts` (`getFlagRegistryView`), `/app/flags/[projectSlug]/[flagKey]`,
  `/app/finops/[projectSlug]`.
- `scripts/roadmap-extract.mjs`, `lib/roadmap-artifact-schema.ts`, groom Stage 6b (`references/kill-switch.md`),
  `scaffold-epic.mjs`, `Roadmap/SESSION-KICKOFFS.md` (the steps the commands start).
- From launch epics 1, 3, 4: the Bean, the label module, the target and verdict fields.
- Design source: the private canvas, page 0: Epic (seven stages) and "Where each part comes from".

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Every card opens one epic page | low |
| 1 | S1.2 Where the epic is, at a glance | low |
| 1 | S1.3 One next command, in plain words | low |
| 2 | S2.1 Why we're building this | low |
| 2 | S2.2 Progress, one bar per sprint | low |
| 2 | S2.3 Flag, spend and documents | low |

**No-gos:** changing a flag from the epic page (shown here, changed in Ship) · per-user flag targeting (open question
3) · the build view (epic 8) and the Outcome report (epic 6) · new stages or stored values ("Read" is shown when a
verdict exists) · the kickoff generator · styling (epic 1), header and names (epic 3).

**Rabbit holes** (detail in the seed): plain lines must start the same steps the shorthand does, proven by pasting
each into an agent · `?card=` is in shared links, redirect and keep filters · seeds have no README · the flag lookup is
this project's only · stage words through epic 3's label module · workspace cards go through the project's page.

**Flag:** none. Risk low. Rollback is a revert.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green. `flag_key` reaches the push schema (nullish) before the page
reads it; the groom and scaffold change follows the skills release flow.

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
