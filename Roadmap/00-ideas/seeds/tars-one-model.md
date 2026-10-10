---
title: "TARS, one model: the older funnels read the way flag funnels do"
slug: tars-one-model
status: raw
area: "01"
type: feature
appetite: M
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-10
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — TARS, one model (before launch)

Split from `tars-segments` (items 2 and 4) by Daniel, 2026-10-10: "i do think tars segment item 2 goes in before
launch please."

1. **The existing TAR funnels** (`lib/tars.ts`, growth-engine-v1) count a "target event" (exposure) as Targeted, do not
   restrict Adopted to the target, and have no Satisfied stage. Move them to the model one-bet-wired agreed (Targeted is
   a segment, `everyone` until segments exist; exposure is its own stage; adopters outside counted beside), so one
   project reads TARS one way. The connector's `get_tars_funnel` and every screen that shows a TAR funnel move with it.
2. **The funnel on screen, tested on and off.** A browser spec renders the epic page and Journeys with
   `bets.flag_funnels_enabled` on and off, and the moved TAR funnels, from an authed-fixture epic with an
   `adopted_event`.

The numbers change for anyone already reading a TAR funnel, so the cut-over is said on screen.
