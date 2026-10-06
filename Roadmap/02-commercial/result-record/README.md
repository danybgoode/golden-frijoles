---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: result-record
title: "The result record"
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

# Epic: The result record

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/result-record.md`](../../00-ideas/seeds/result-record.md)
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
Nothing records whether an epic paid off (F37): no target, no read date, no verdict. So the Outcome report can't say
which epics paid off, the epic page can't show its result, and the North Star, Proven bets, can't be counted (F16).
This epic makes every newly groomed epic say up front which number it should move, from what to what, and when we
read it; on that date the agent drafts an evidenced verdict, Proven, Disproven or Unclear, and the product owner
approves it. The record lives in the epic file and reaches the Hub the way FinOps spend does. Launch epic 4 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md).
Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** groom a small epic with a read date a day out; ship it; next day run the read, approve it, see the bean on
the board.

## Platform-first note
The repo is the system of record for planning; the Hub reads what `roadmap-push` sends, stored as a JSON payload (no
migration). FinOps already uses this path for `quote_*` and `actual_*`; the result record follows it field for field.
Evidence comes from records the platform already keeps: A/B decision records and North Star readings. Golden
Frijoles's own North Star count is out of scope.

## What already exists (reuse, don't rebuild)
- FinOps path: `scripts/epic-actuals.mjs` (`--write` stamps the README), `scripts/roadmap-extract.mjs`
  (`finopsFields`), `apps/web/lib/roadmap-artifact-schema.ts`, `lib/roadmap-finops.ts`, `scripts/roadmap-push.mjs`.
- `skills/plugins/golden-frijoles/skills/groom/` (`SKILL.md` Stage 1.5 and the gate's bet block, `scaffold-epic.mjs`,
  `templates/scope-seed.md`, `strategy.mjs`), `scripts/lib/roadmap-contract.mjs`, `scripts/doc-format.mjs`.
- Evidence: `apps/web/lib/experiment-decision-query.ts`, `experiment-decision-contract.ts`, `lib/north-star-query.ts`,
  `packages/cli/src/commands/north-star.ts`.
- Reminders and display: `scripts/session-resume.mjs`, `apps/web/lib/today-bands.ts`, `lib/hub-board.ts` and the
  board card; epic 1's Bean.
- Rules: `Roadmap/00-strategy/north-star.md` (read date default 30 days after shipping, cap 90; the evidence ladder).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Every epic carries its hypothesis, target and read date | low |
| 1 | S1.2 Groom asks which number, by how much, by when | low |
| 1 | S1.3 The target and verdict reach the Hub | low |
| 2 | S2.1 The read: drafted by the agent, approved by you | low |
| 2 | S2.2 Read due, in the terminal and on Today | low |
| 2 | S2.3 The result as a bean on the board card | low |

**Fields:** `hypothesis`, `target_metric`, `target_from`, `target_to`, `read_date` (set at grooming); `verdict`
(proven · disproven · unclear), `verdict_actual`, `verdict_evidence`, `verdict_at` (set at the read).

**No-gos:** counting Golden Frijoles's own North Star · bulk backfill (one-at-a-time owner reads stay possible) · the
epic page's and Outcome report's displays (epics 5 and 6) · automatic verdicts · a new table or API · groom's gate
wording (epic 7).

**Rabbit holes** (detail in the seed): the default read date derived in one place, never written back silently ·
evidence or it doesn't count; a read after 90 days is marked late · works without an account · `target_metric`
names a North Star input when there is one, free text shown as "not grounded" · the seed holds the target until the
scaffold, then the README · the contract knows the fields · kit and plugin release flow.

**Flag:** none. Risk low. Rollback is a revert.

## Deploy order
Sprint 1: the contract and templates, then extract and the push schema (nullish, so older pushers keep working), then
the Hub read. Sprint 2: the kit script, then the reminders and the board card. Merge on green; the kit and plugin
release follows `skills/RELEASING.md`.

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
