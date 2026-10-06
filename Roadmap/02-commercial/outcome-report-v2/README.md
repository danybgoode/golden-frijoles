---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: outcome-report-v2
title: "Outcome report v2"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 66      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Outcome report v2

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/outcome-report-v2.md`](../../00-ideas/seeds/outcome-report-v2.md)
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
Today's Pod report is hard to read even for its author (F42): it leads with delivery numbers, never says whether the
product is paying off, has no expected values, and its ladder doesn't explain itself. This epic makes the Outcome
report answer "is it paying off?" first, with the North Star's actual against an expected line built from the epics'
targets, then four figures and an epics table with expected against actual, How fast with deltas, the Steps of AI
Adoption with an agent prompt, and one line plus a link for every section. Launch epic 6 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md), decision 5.
Moves: proving_workspaces · Tests: Value proposition.

**Signal:** someone who has never seen the product opens a share link and can say in one sentence whether it's paying
off and which epics did.

## Platform-first note
The report stays one read path, `getPodReport`: a pushed, versioned delivery artifact joined to a live outcome read,
narrowed by the audience lens that share links enforce. The epics' targets, verdicts and spend come from the pushed
roadmap (launch epic 4 and FinOps). The ladder is the existing `maturity-lens.mjs` scoring against
`references/Steps-of-AI-Adoption.md`. No new store, no migration.

## What already exists (reuse, don't rebuild)
- `app/hub/[projectSlug]/report/page.tsx`, `app/hub/report-components.tsx` (`PodReportBody`, `OutcomeSectionView`,
  `MaturityLadder`, `MetricTable`, `NotInstrumentedPanel`, `BenchmarkLink`), `app/s/[token]/page.tsx`.
- `lib/pod-report-query.ts`, `lib/pod-outcome.ts`, `lib/pod-report-lens.ts`, `lib/pod-report-view.ts`,
  `lib/pod-report-schema.ts`, `lib/report-artifacts.ts`, `lib/report-shares.ts`, `lib/north-star-query.ts`,
  `lib/tars-query.ts`, `lib/roadmap-finops.ts`, `lib/portfolio.ts`.
- `scripts/pod-report.mjs`, `scripts/lib/maturity-lens.mjs`, `references/Steps-of-AI-Adoption.md`.
- From launch epics 1, 3, 4, 5: the Bean, the name and Measure, target and verdict, the epic page.
- Design source: the private canvas, page 0: Outcome (v2) and "Where each part comes from".

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Is it paying off: the sentence and the chart | low |
| 1 | S1.2 Four figures, each against expected | low |
| 1 | S1.3 The epics table | low |
| 2 | S2.1 How fast, with a subtitle and deltas | low |
| 2 | S2.2 The Steps of AI Adoption, with a prompt for your agent | low |
| 2 | S2.3 A line and a link for every section | low |

**No-gos:** a product-level North Star target · Ember for overspend (neutral, "▲ … over …") · spend or per-epic rows
on client or investor share links (after launch) · the name and Measure (epic 3), the result record (epic 4) ·
counting Golden Frijoles's own North Star · new delivery metrics.

**Rabbit holes** (detail in the seed): the expected line counts only grounded epics, per metric, and never invents a
flat line · honesty counts survive every lens; new detail is team-only · deltas need earlier artifact versions · one
read path for the Hub and the share page · step names and criteria come from the guide, never retyped · gold only
for Proven, Ember only for broken.

**Flag:** none. Risk low: read-only, and nothing new reaches a share link. Rollback is a revert.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green. The lens rules land with the parts they guard, in the same PR.

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
