---
title: "A project with two North Star metrics breaks its North Star page and its Pod Report"
slug: north-star-multi-metric-read
status: scaffolded
area: "01"
type: bug
appetite: S
underwritten_by: wave-backfill
risk: low
epic: "01-growth-engine/north-star-multi-metric-read"
build_order: 73
updated: 2026-10-04
intent_ask: proxy   # found in CI's server log on #243 (2026-10-04); Daniel asked to seed it alongside ci-diet
intent_match: 87
---

# Pitch — a project with two North Star metrics breaks its North Star page and its Pod Report

## The ask, as given

> `[pod-report-query] north-star lookup failed: { code: 'PGRST116', details: 'Results contain 15 rows,
> application/vnd.pgrst.object+json requires 1 row' }`
> — the Next server log in #243's CI run (`37167782795`), repeated on every Pod Report render of the seeded project

### Claims
1. A project that holds more than one North Star metric gets a working North Star page and a working Pod Report.
2. Every reader agrees on which metric is "the" North Star, by one rule.

**Teach-back:** <unasked> — "You want the readers to handle the several-metrics state that `gf north-star set` can
create, so that the page and the report never show an outage for a legitimate state."

## Problem

think-skills made it legal for a project to hold several metrics: a sync with a new key is *added beside* the existing
one (think-skills README:58, RETROSPECTIVE:25). The schema allows it too (`UNIQUE (project_id, key)`). But two readers
still assume one row and call `.maybeSingle()`, which errors with PGRST116 on two or more:
- `apps/web/lib/north-star-query.ts:194` (`getProjectNorthStarByProjectId`) returns `query_failed`, and
  `/app/north-star/[projectSlug]/page.tsx:42` **throws** → the error boundary. A legitimate state renders as an outage.
- `apps/web/lib/pod-report-query.ts:185` (`readNorthStar`) returns `unavailable: true` → the Pod Report says it couldn't
  read the North Star. Its `leading_inputs` count is also project-wide, not per metric.

The sync's own `.single()` (`north-star-sync.ts:138`) follows an upsert and is correct.
**Prod impact is unknown.** A read-only count of projects with more than one metric was blocked by the auto-mode
classifier on 2026-10-04 and is owed: Daniel, or the architect at the lock. The query:
`select count(*) filter (where n>1) from (select project_id, count(*) n from north_star_metrics group by project_id) t`.

## Appetite
S: one shared read helper and two call sites, with specs. Fixed-scope lane.
quote: $11–17 (S, n=3, p25–p75)

## Outcome & signal
A project with two metrics opens `/app/north-star/<slug>` and sees one North Star (by the rule below) with that
metric's inputs. Its Pod Report shows the same metric and the same input count. No PGRST116 in the server log.

## Stage-2.5 bucket
**Light enhancement**: a read rule plus one helper.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| One helper, `currentNorthStar(projectId)` in `lib/north-star-query.ts`: the rule below, `order … limit 1`, never `.maybeSingle()` on a non-unique filter | one rule for every reader; the class, not the instance |
| Both readers call it; the Pod Report counts only that metric's inputs | the page and the report agree |
| Specs: 0, 1 and 2 metrics, for both readers (DB-backed `api` spec, two metrics with distinct `created_at`) | the fixture-of-one trap (memory: *A fixture with ONE of something hides ordering bugs*) |

**Decided (Daniel, 2026-10-04): the most recently created metric is "the" North Star**, ties broken by `key`. Why: a revision
reuses its key (an upsert, so `created_at` doesn't move), and a new key is a deliberate new North Star. Rejected alternative: the page lists every metric with its own inputs (a UI change, M).

## Scope
**In v1:** the helper, both call sites, specs.
**Out of v1 (no-gos):** UI listing several metrics; deleting or archiving old metrics (`gf` never deletes); changing
the sync semantics; the MCP `get_north_star` tool (check at the lock whether it shares the bug; if it does, it's in
scope because it's the same helper).

## Rabbit holes
- **Ties on `created_at`** (two keys in one sync). Break ties by `key` so the answer is deterministic.
- **The page's comment (line 28: "Live data has exactly three")** is about inputs, not metrics. Don't "fix" it.
- **Other `.maybeSingle()` calls on non-unique filters.** Grep `north_star_metrics` / `leading_inputs` readers at the
  lock; the MCP connector's North Star read is the likely third.

## What already exists (reuse, don't rebuild)
- `getProjectNorthStarByProjectId` / `readNorthStar`: keep their result shapes (`ok`/`query_failed`, `unavailable`).
- The `leading_inputs → north_star_metrics(key)` join already used at `north-star-query.ts:200`.
- Disposable DB fixtures in `apps/web/e2e/helpers/`.

## UX heuristics & rails check
- **CI guards covering this surface:** the North Star api specs; nothing seeds a second metric today.
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** n/a.

## Acceptance criteria
- With two metrics (the second created later), `/app/north-star/<slug>` renders the second metric and its inputs, not
  the error boundary.
- The Pod Report for the same project shows that metric and that metric's input count, and the server log holds no
  PGRST116.
- With zero metrics, both still say "none registered"; with one, nothing changes (existing specs green).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/north-star-multi-metric-read.md
  coverage in   0.95  (2 claims)
  coverage out  0.80  (3 criteria)
  clarity       0.87  (3 criteria)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
Total 87 / 100 — uncalibrated · signals: coverage in, coverage out, clarity
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.955,"coverage_out":0.8,"clarity":0.869,"teach_back":null,"total":87} -->
