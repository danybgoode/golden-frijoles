---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building                   # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-07T17:35:11Z"
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
build_order: 67      # integer position in the ONE global build sequence — the SSOT once the epic
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

## Architecture lock (2026-10-07, verified against live code and live data)

**Live data, queried read-only on prod before the lock:** one project has a pushed roadmap (`golden-beans-demo`,
roadmap v325, 67 Epic rows, 56 shipped). **0 epics carry a target or a hypothesis**; 22 carry `actual_usd`, 17 a
quote. Its North Star is `payable_sellers` with ONE input, `setup_guide_completions` (`external_push`, values
2026-07-03 → mid-July). Its `pod_report` has 263 versions: 36 in July, 63 in August, 92 in September, 72 in October
(latest v263, verdict step 1 "Assisted", 2 of 8 met). `miyagisanchez` has one `pod_report` and no roadmap.

**Scope the live system disproves, said out loud:**
- **"The North Star's actual" does not exist.** No table holds a level for the metric itself (`north-star-query.ts`
  `ProjectNorthStarResult` comment; `readNorthStar` returns `latestValue: null` unconditionally). Only inputs have a
  series. So the chart plots, per targeted metric, the input's actual series against its expected line; an epic that
  targets the North Star key itself gets an expected line and "no recorded value" for actual. Never a derived NS level.
- **Prod renders the "No targets yet" path.** With 0 targeted epics live, the sentence says it can't tell, the chart
  shows the input's actual only, and figures 1–2 say there is no expected value. The targeted paths are proven by
  pure specs and fixtures, not by prod.
- **`mergedPrs: 0` on every artifact since the public-monorepo move** (v99 onward): How fast's review latency and
  deploy frequency read null/0 in Aug–Oct. That is the pusher's computation (no new delivery metrics is a no-go); the
  deltas render what exists and say "not measured" for the rest.

- **D1 — The expected line (`lib/outcome-expected.ts`, pure, zero imports).** Input: `EpicResult[]` (from
  `epicResultsFromArtifact`) plus each row's `shipped_at`, the NS key and the input keys with their series. An epic is
  **grounded** when shipped, its target is complete (metric+from+to, the `epicResult` rule), it has a valid
  `shipped_at` day, its metric is the NS key or an input key, and it is not `late`. Per metric: the line starts at the
  earliest grounded epic's `from` on its ship day; each grounded epic adds `to − from`, linear from its ship day to its
  read date (`readDate`, already derived by the pusher at +30 d), flat after. No grounded epic on a metric → no line
  for it, ever (no flat invented line). Direction = sign of the summed deltas (lower-is-better targets work).
- **D2 — Pace and the sentence.** Per metric with both lines: compare the latest actual point to the expected value on
  that day. `on` when |gap| ≤ max(5% of |expected|, 10% of the planned move Σ(to − from)), else `ahead`/`behind` by
  direction. *(Amended at review, #299: the lock's absolute "min 0.5" floor made every 0–1 fraction metric "on
  pace" forever.)* A targeted metric with no reading is named in the sentence; no North Star registered says so. Overall: no metric with
  both → "No targets yet, so we can't say if it's on pace" (or "…no reading yet…" when targets exist but no actual);
  all agree → "<product> is ahead of / on / behind the pace you planned."; mixed → "Mixed: ahead on X, behind on Y."
  The headline metric (figure 1) = the metric with the most grounded epics, ties by key.
- **D3 — Four figures (`lib/outcome-figures.ts`, pure).** F1 headline metric now · expected (gap, ▲/▼ neutral). F2
  epics paid off = Proven of those with a verdict, plus "N not read yet" (shipped + target + no verdict). F3 spend =
  Σ`actual_usd`; against Σ quote low–high over the epics that have BOTH, "within" or "▲ $x over $l–h" (neutral), and
  "N with spend have no quote". F4 cost per epic that paid off = Σ actual ÷ Proven; says it has no expected value.
  Each figure carries one line on what it is. Read through `epicFinops` / `epicResult`, never re-parsed.
- **D4 — The epics table (same module).** Rows: every Epic with a complete target or a verdict, plus every shipped
  Epic with `actual_usd` (live: the 22 spend rows — so prod's table is real). Order: shipped first by `shipped_at`
  desc, then by slug. Columns exactly: *Epic · what we bet* (name, hypothesis under it) · *Metric · expected →
  actual* (metric name in the cell, `from → to`, actual or "not read yet", gap) · *Result* (the `Bean`, or "no
  target") · *Spend · vs quote* (`$x`, "within $l–h" / "▲ $d over $l–h" / "not quoted"). Each row links to
  `/hub/<p>/epic/<slug>`. Gold only through the Bean; no Ember anywhere in these parts.
- **D5 — Lens (`lib/pod-report-lens.ts` owns it).** `LensPolicy` gains `showSpend`, `showEpicsTable`, `showLinks`,
  `showAgentPrompt` — true for team only. `applyPayingOffLens` (pure, same file) drops F3/F4, the table, and the
  epic names on chart markers where `showJourney` is false; the sentence, the chart lines, F1, F2 and **the unread
  count** are copied unconditionally (added to `LENS_INVARIANT_FIELDS`). Client and investor therefore see the
  sentence, the chart and two figures — S1.2's acceptance.
- **D6 — One read path.** `getPodReportByProjectId` additionally reads the latest `roadmap` artifact
  (`getLatestArtifact`) and `getProjectNorthStarByProjectId`, builds `payingOff` and lenses it; the Hub page and
  `/s/[token]` both get it from there. A failed roadmap/NS read is `payingOff.unavailable` (the third state, like
  `outcome.unavailable`), never a thrown page and never "no targets".
- **D7 — The chart.** Inline SVG in `report-components.tsx` (the epic page's SVG-bar precedent), existing `ds`
  tokens only; actual solid, expected dashed; each grounded epic marked by its `Bean` at its ship day. A text
  equivalent (`<figcaption>` + `data-*`) carries the numbers for screen readers and specs.
- **D8 — Deltas (S2.1).** `report-artifacts.ts` gains `getLatestArtifactBefore(projectId, kind, beforeIso)`. The two
  comparisons are the latest version generated before the first day of the current artifact's month, and before the
  first day of the month before that. `MetricRow` gains `raw: number | null`; a pure `speedDeltas(current, earlier[])`
  gives ▲/▼ + "vs Sep". Fewer than two → shows what exists and says how many. Speed is never narrowed, so deltas show
  in every lens.
- **D9 — The Steps of AI Adoption (S2.2).** `lib/adoption-steps.ts` holds a copy of `STEP_LABELS` pinned by a spec
  that imports `scripts/lib/maturity-lens.mjs` (the `roadmap-result.ts` pattern). Next step = verdict step + 1 (none
  past 4); its criteria are the artifact's rows with that `ladderStep` ("1 of 6 met" live). The guardrails git can't
  show = `maturity.notInstrumented` (the existing panel). Prompt text is fixed by the story, product = the project
  slug. Criterion rows keep `showMaturityRows`; the Copy button is `showAgentPrompt` (team).
- **D10 — A line and a link per section (S2.3).** Each section gets one lede line; links (North Star
  `/app/north-star/<p>`, FinOps `/app/finops/<p>`, Board `/hub/<p>/board`, epic pages) render only where
  `showLinks` — a share visitor can open none of them. Who did the work = one bar (the latest month's agent share)
  and its line. Benchmarks = "Read against" external links, kept in every lens (public https pages).
- **D11 — No migration, no flag, no new production mutation, no kit/plugin release.** Read-only; rollback is a revert.
- **D12 — Routing.** The architect builds both sprints in place (the only session in this checkout, one builder);
  review through `review-route.mjs --builder claude`.

### Build contract — Sprint 1 (locked by the architect before the builder started)
D1–D7, D11. New: `lib/outcome-expected.ts` (+ `.test.ts`: none / one / several / input vs North Star / lower-is-
better / late and undated excluded), `lib/outcome-figures.ts` (+ `.test.ts`: figures, table rows, spend wording),
lens additions (+ `pod-report-lens.test.ts`: client and investor have no F3/F4/table, unread count present).
`pod-report-surface.spec.tsx` renders team and client through the real components.

### Build contract — Sprint 2 (locked by the architect before the builder started)
D8–D10. New: `getLatestArtifactBefore`, `speedDeltas` (+ spec with 0, 1, 2 earlier versions),
`lib/adoption-steps.ts` (+ spec pinned to `maturity-lens.mjs`, prompt text), section ledes and links (+ surface spec:
team has the links, client has none of `/app/` or `/hub/`).

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
