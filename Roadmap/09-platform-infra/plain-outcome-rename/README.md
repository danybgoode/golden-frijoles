---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: plain-outcome-rename
title: "Plain Outcome: one vocabulary and one lifecycle across the plugin, the repo and the console"
area: 09-platform-infra
risk: high
type: feature
sprints_total: 4
stories_total: 12   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 67    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 144
quote_basis: "L, n=3, p25–p75"
build_order: 81    # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Plain Outcome: one vocabulary and one lifecycle across the plugin, the repo and the console

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/plain-outcome-rename.md`](../../00-ideas/seeds/plain-outcome-rename.md)

> **Split, 2026-10-05 (Daniel, UX audit):** screen words are superseded by plain agile
> ([`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md), decision 1). Sprint 5 (console and
> report labels, the walkthrough and the roadmap overview) moved to launch epic 3,
> [`one-header-one-name`](../../02-commercial/one-header-one-name/README.md); its file is in git history. Sprints 1–4
> wait for after launch and are **re-groomed to plain agile words before anyone builds them** (stage names Backlog ·
> Grooming · Ready · Building · QA · Shipped, then Proven · Disproven · Unclear).
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
A stranger who installs Golden Frijoles today meets about forty house words from two methods and seven lifecycle
vocabularies for one journey, plus legacy and customer names. The agreed riskiest assumption is that the method doesn't
travel and that its vocabulary *is* the ceremony. This bet makes every surface (plugin, template, repo, console)
speak one plain, outcome-driven vocabulary with one lifecycle from Idea to Live and a verdict, before launch. Spec:
`00-ideas/audits/naming-spec-plain-outcome-2026-10-04.md`. Moves: proving_workspaces · Tests: Value proposition.

## Platform-first note
The stage of every initiative is already decided in one place, `scripts/lib/stage.mjs` (board-sinks-and-scrumban
D2/D13), and every client reads it; the lifecycle is an extension of that resolver, not a second one. Server-side,
`isRoadmapStatusShipped()` is the one place "shipped" is decided. Configuration already has one file with a section per
module and legacy fallbacks (`lib/config.mjs`). No new table, no telemetry path (AGENTS rule 1 untouched), no tenancy
change.

## What already exists (reuse, don't rebuild)
- `scripts/lib/stage.mjs` (`STAGES`, `DOCS_STAGE`), `lib/stage-facts.mjs`, `roadmap-extract.mjs`, `build-order.mjs`, `roadmap-push.mjs`
- `apps/web/lib/roadmap-artifact-schema.ts` (`isRoadmapStatusShipped`), `hub-board.ts`, `pod-report-view.ts`, `tars.ts`, `project-route-inventory.ts`
- groom's `scaffold-epic.mjs`, `templates/`, `vendor/emit-epic-kickoff.mjs`, `strategy.mjs`
- `skills/scripts/render-skill-adverts.mjs`, `build-kit.mjs`, `pack-skills.mjs`, `check-onboarding-parity.mjs`, `check-plugin-leaks.mjs`, `check-release.mjs`
- `lib/config.mjs` + `lib/config-registry.mjs` (one file, legacy fallbacks)
- `apps/web/lib/public-demo.ts` (`DEMO_PROJECT_SLUG` env-overridable)
- The naming spec and inventory in `Roadmap/00-ideas/audits/`

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Engine accepts old and new statuses (deploys first) | high |
| 1 | S1.2 One lifecycle in the stage resolver | high |
| 1 | S1.3 Writers emit the new values | high |
| 2 | S2.1 Skills, agent and coaches answer to their new names | high |
| 2 | S2.2 Skill bodies and templates speak Plain · Outcome | low |
| 2 | S2.3 Names checked and the release notes written | low |
| 3 | S3.1 Env vars under the product's name | high |
| 3 | S3.2 One config file and the demo slug | high |
| 3 | S3.3 Retired words gone, and kept gone | low |
| 4 | S4.1 One command moves a repo | high |
| 4 | S4.2 Every reader and the template use the new layout | high |
| 4 | S4.3 This repo migrated | high |

**Waves:** wave 1 = sprints 1–3 (plugin release 0.28.0, old names as stubs); wave 2 = sprint 4, re-bet at the boundary (stubs removed in the release after wave 2).

## Deploy order
1. **Engine first (S1.1):** accept-both on `/api/v1/roadmap/push` merges, deploys, and is verified with a real push of
   each kind **before** any client can emit a new value (LEARNINGS: a merge-triggered push races its own deploy).
2. **Plugin release 0.28.0 (S1.2–S3.3):** writers emit new values; old skill names as stubs; SDK minor for the env
   names. Mirrored to `golden-frijoles/skills` per `skills/RELEASING.md` (merge commit, never squash).
3. **Wave boundary:** re-bet. Then the layout script and this repo's migration (S4), then console labels (S5).
4. **Stub removal:** the release after wave 2, announced in the 0.28.0 CHANGELOG.

**Kill switch:** none (carve-out recorded in the seed): read-both compatibility and the plugin release gate every
change.

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
