---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: night-garden-design-system
title: "Night garden, in the shared design system"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 8   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 74      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Night garden, in the shared design system

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/night-garden-design-system.md`](../../00-ideas/seeds/night-garden-design-system.md)
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
Launch needs Golden Frijoles to look like one product. Today the console, the Hub and the public pages still wear the
coffee palette the brand left behind, gold is spent on buttons so it can't mean "proven", there is no bean for a
result, and pages read as walls of text. This epic switches the whole product to the night garden look in one move,
from the one approved file the design system already generates everything from, and adds the pieces later launch
epics build pages with: the Bean, the icon names, the ten control states and the density rules. It is launch epic 1
of [`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md). Moves · Tests: neither, it is the
visual base the other launch epics stand on.

**Signal:** open `/login`, `/app`, a Hub board and `/` side by side; all four look like one product, and the visual
gate is green.

## Platform-first note
No data is involved: this is the design system only. The system of record for the look is
`apps/web/design-system/console-prototype.html`, hash-pinned in `APPROVED.md`; `tokens.css`, `reference.css`,
`tokens.ts` and `MEASURED-SPEC.md` are generated from it and never hand-edited. The public pages keep their own
`:root` set in `apps/web/brand/tokens.css`; change values in both, merge neither.

## What already exists (reuse, don't rebuild)
- `apps/web/design-system/console-prototype.html` (33 approved states) and `APPROVED.md` (approval lines, hash).
- `extract-css.mjs` (emits `tokens.css`, `reference.css`, `tokens.ts`; `FONT_STACK_OVERRIDES`), `measure-contract.mjs`,
  `render-reference.mjs`, `_harness.mjs`.
- `system.css`: the ten-state taxonomy from `references/ux-guidelines.md` (byte-mirrored and guarded, don't edit the reference).
- `components/ui/Icon.tsx`: a closed union over Lucide; Flag, Check, Copy, Lock, Users, Shield, TriangleAlert, Route,
  Webhook, Gauge and Clock already exist.
- `apps/web/app/layout.tsx`: `next/font` (Archivo and IBM Plex Mono today).
- `apps/web/brand/tokens.css`: the public pages' 27 tokens on `:root`.
- `/app/design-system`: the specimen route (`e2e/design-system-specimen.authed.spec.ts`).
- CI: `extract-css --check`, `measure-contract --check`, the visual gate and its coverage ratchet, `tokens.test.ts`,
  `tokens-defined.test.ts`, `system-cascade.test.ts`, `check-design-drift.mjs`.
- Design source: the private canvas, foundation page (Visual, Beans, States, Density, Icon). Night garden values:
  Night #111312 · Soil #181b19 · Lines #2a2f2b/#22261f/#333a35 · Paper #ece7dc · Dim #a8a99f/#868980/#c9c6bc ·
  Moonlight #8db7e0 (text #a9cdee) · Sprout #93c58a (chip #2c4029/#b5dcae) · Ember #e07a6a (light #f0a497) ·
  Gold #e6b84a. Fonts: Newsreader, Hanken Grotesk, IBM Plex Mono.

> **Note (2026-10-07, result-record D11):** the Bean already exists — `apps/web/design-system/bean.tsx`, built by
> result-record S2.3 to S2.1's spec (four kinds, three sizes, its word, gold only on proven) in today's tokens, and
> placed on shipped board cards. S2.1 here re-skins it with night-garden values and adds the specimen; it does not
> build a second one.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The approved prototype in night garden | low |
| 1 | S1.2 Tokens regenerated, fonts switched | low |
| 1 | S1.3 Every page passes the visual gate in the new look | low |
| 2 | S2.1 The Bean | low |
| 2 | S2.2 Icon names for night garden | low |
| 2 | S2.3 Every control shows its state | low |
| 2 | S2.4 Public pages in night garden | low |
| 2 | S2.5 Density rules in the contract | low |

**No-gos:** no token renames (`--roast`, `--crema`, `--gold` stay; a later chore) · no layout changes (the page epics
own those) · no beans placed on pages (launch epics 4–6) · no landing redesign (launch epic 2) · no light theme · no
edits to `references/ux-guidelines.md`.

**Rabbit holes:** font metrics move text a few pixels everywhere, so every baseline re-renders once; a route failing
for any other reason is a real regression · gold as the action colour is a rule change, made in the prototype only;
any gold outside "proven" is a bug · the `.is-console` alias and the bare-class rules in `console.css` read the same
token names, don't rename them · two token sets, change values in both · nothing ships on an unapproved hash.

**Flag:** none. Risk low, decided at grooming (no runtime behaviour changes).

## Deploy order
Sprint 1 first, in one PR: the prototype change goes up for Daniel's review as rendered states (S1.1); only after his
approval line lands in `APPROVED.md` are tokens regenerated and baselines re-rendered (S1.2, S1.3). Sprint 2 builds on
the merged look. Preview first; production after the smoke walkthrough. No backend, no migrations, no flag.

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
