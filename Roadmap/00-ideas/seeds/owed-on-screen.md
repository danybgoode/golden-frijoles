---
title: "Owed on screen: what only the product owner can clear, in the console"
slug: owed-on-screen
status: raw
area: "02"
type: feature
appetite: M
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

# Raw — owed on screen

Raised by Daniel, 2026-10-14: "we recently implemented a way to collect all owed items, but im not sure where is it
written to".

## Problem

`scripts/owed-ledger.mjs` (#357) writes `Roadmap/00-ideas/OWED-LEDGER.md/.json`: 85 open items on 2026-10-14, 24 of
them judgments only the product owner can give, 7 production credentials and 2 npm publishes. Only `standup.mjs` and
`weekly-recap.mjs` read it. No screen does, so a person sees it only if they open the file.

## Rough shape

- **Carry it on the roadmap push.** Add a nullish `owed` per epic in `lib/roadmap-artifact-schema.ts`, the same way
  `finops` was added (`kind`, `category`, text, source `file:line`), filled from the ledger JSON.
- **The epic page** gets an "Owed" section.
- **Plan/Hub** gets one "Waiting on you" band grouped by who can clear it: *only you* (judgment, credential, publish)
  versus *an agent could, given a smoke account* (signed-in, interactive). Reuse `design-system/bands`. Keep it off
  the Tasks page, which holds signal-derived tasks with a claim/resolve lifecycle.
- **The portfolio card** shows the count.
- **Team-only and signed-in**, like outcome-report-v2's spend: the golden-frijoles roadmap is public, and owed lines
  name people and internal ids.

## Open questions for refining

- Can an item be cleared from the screen (write `✅` back through a PR or the CLI), or only shown?
- Should `unsorted` items appear at all, or only once triaged?
