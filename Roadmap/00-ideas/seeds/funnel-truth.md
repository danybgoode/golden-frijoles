---
title: "Funnel truth: named target segments, one model for every funnel, and the trend over time"
slug: funnel-truth
status: raw
area: "01"
type: feature
appetite: L
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-14
intent_ask: verbatim
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — funnel truth (after launch)

**Consolidated 2026-10-14** from two seeds, now archived: [`tars-segments`](tars-segments.md) and
[`funnel-trend`](funnel-trend.md). They change the same read (`lib/flag-funnel-read.ts`, the one model
`tars-one-model` D3 put every funnel on), and each changes numbers people may already read. One epic means one
cut-over, explained once on screen, instead of two.

> If i launch a feature thats flagged and measured through tars, i should be able to measure its performance across
> time. This means that if i want to check how the features performed over the last year i should.
> — Daniel, 2026-10-12

## What it carries

From `tars-segments` (one-bet-wired's Plan gate, Daniel, 2026-10-10: **Targeted** is the share of the user base that
has the problem, a strategy decision, not who was exposed):

1. **Named segments.** "Power users" and similar: a definition (probably a Journeys cohort) and its share of the base.
   A bet's `target_segment` names one, and Adopted is computed within it. Adopters outside the segment show beside the
   funnel, never inside its rates.
2. **The legacy TAR funnels** (`lib/tars.ts`, growth-engine-v1) still count an exposure as Targeted, don't restrict
   Adopted to the target, and have no Satisfied stage. Move them to the same model, so one project reads one way.
3. **Satisfied** beyond an optional event: a rating or survey the product can ask, and how it is read.
4. **The funnel tested on screen, on and off.** `bets.flag_funnels_enabled` has only a pure-rule test (`funnelBetOf`).
   The authed-fixture epic with an `adopted_event` that segments need anyway gives it a browser spec.
5. **Golden Frijoles measures its own funnel.** Viewing a flag funnel emits no adoption event, so one-bet-wired is
   funded, not grounded. Give the funnel views an event.

From `funnel-trend`:

6. **The trend.** The same stages, cohorted by the month (or week) people first got the feature, drawn as a line
   (`design-system/charts` `Plot`/`SmallMultiple`, no new dependency). `tars-one-model` already reads a feature's
   whole life or its last 30 or 90 days and has cohort periods. This draws them over time, back to the first exposure.

## Open questions for refining

- Is a segment a Journeys cohort, a new definition, or both?
- What does Satisfied ask, and who renders the ask (SDK, page, or neither in this epic)?
- How far back does the trend go when the history predates the agreed model? Recompute it, or start the line at the
  cut-over?
- What is the cut: segments plus legacy migration first, then the trend? Or the trend first, since it is Daniel's
  verbatim ask?
