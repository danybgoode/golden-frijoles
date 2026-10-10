---
title: "TARS segments: named target segments, and every funnel on the agreed model"
slug: tars-segments
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

# Raw — TARS segments

From one-bet-wired's Plan gate (Daniel, 2026-10-10): TARS's **Targeted** is a strategy decision, the share of the user
base that has the problem, not who was exposed. one-bet-wired builds flag funnels on that model with
`target_segment: everyone`. This seed is the rest:

1. **Named segments.** "Power users" and the like: a definition (likely a Journeys cohort) and its share of the base.
   A bet's `target_segment` names one; Adopted is computed within it; adopters outside it are shown beside the funnel,
   never inside its rates (real evidence of value, not of the targeting hypothesis).
2. **The existing TAR funnels** (`lib/tars.ts`, growth-engine-v1) count a "target event" (exposure) as Targeted, do not
   restrict Adopted to the target, and have no Satisfied stage. Move them to the same model, so one project reads one
   way.
3. **Satisfied** beyond an optional event: a rating or a survey the product can ask, and how it is read.

4. **The funnel on screen, tested on and off** (one-bet-wired retro). The flag funnel's switch
   (`bets.flag_funnels_enabled`) has only a pure-rule test (`funnelBetOf`): no browser spec renders the epic page and
   Journeys with it on and off. That needs an authed-fixture epic with an `adopted_event`, which this seed builds
   anyway to test segments on screen.
5. **Golden Frijoles measures its own funnel** (one-bet-wired retro). Viewing a flag funnel emits no adoption event, so
   one-bet-wired has no `adopted_event` and is funded, not grounded. Give the funnel views an event and the epics that
   built them a measurement, so this feature's own funnel fills.

Each changes numbers people may already read, so the cut-over is said on screen.
