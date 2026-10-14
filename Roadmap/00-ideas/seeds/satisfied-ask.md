---
title: "The Satisfied ask: a rating the product can ask, read as TARS's last stage"
slug: satisfied-ask
status: raw
area: "01"
type: feature
appetite: null
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-14
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — the Satisfied ask (after funnel-truth)

Cut from `funnel-truth` at its Plan gate (2026-10-14), carried over from `tars-segments` item 3. Satisfied already
exists as an optional event (`satisfied_event`, `computeFunnel`), but nothing in the product *asks* for it: a team has
to build its own rating and send the event.

## The ask, as it stands

A rating or a one-question survey the product can show (an SDK call plus a small UI the customer's app renders), which
sends the bet's `satisfied_event`, and how the funnel reads it (a threshold, or any answer).

## Open questions for refining

- SDK-only (the customer draws it), or a drop-in component?
- What counts as satisfied: a score at or above a threshold, or any answer?
- Who is asked, and when (after retention, once per person)?
