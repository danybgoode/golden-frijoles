---
title: "A reading for proving_workspaces"
slug: proving-workspaces-reading
status: raw
area: "01"
type: feature
appetite: S
underwritten_by: null
risk: high
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

# Raw — A reading for proving_workspaces

Our North Star's breadth input, `proving_workspaces` (workspaces with at least one proven bet this month), has no
reading: it is "pushed from outside until the bet-verdict record exists" (F16), and nobody pushes it. Setup drafts the
strategy (2026-10-09) targets it and reads it by hand on 2026-12-15.

**Why it is a decision, not a chore:** counting workspaces is a read across tenants. AGENTS.md's tenancy invariant
forbids it on any request path, and the scheduler exemption excludes "just a count across tenants" by name. Any
automatic reading needs Daniel's explicit approval of a new, registered exemption (or a different design: for example
each workspace pushing its own proven-bet count to the platform's own project, opt-in).

Spike question: which design reads it without one tenant observing another, and is it worth an exemption?
— Raised 2026-10-09 by Daniel at setup-drafts-strategy's Plan gate.

## Decision (Daniel, 2026-10-14): a self-tracking event, no exemption

When any workspace records a **proven** verdict, the server also logs one event into Golden Frijoles' own project
(`SELF_PROJECT_SLUG`) through the existing self-tracking path, the way signups are already tracked. The event carries
only an opaque workspace id. `proving_workspaces` then becomes an ordinary **single-project** read: distinct workspace
ids with a proven event this month, in Golden Frijoles' own project.

- **No new scheduler exemption and no tenancy amendment.** Nothing reads across tenants. The platform writes one
  event into its own project at the moment a tenant acts, and no tenant observes anything.
- **No backfill, by choice:** proven verdicts recorded before this ships don't count.
- Rejected: an opt-in push (undercounts), a new cron exemption (AGENTS.md names "just a count across tenants" as
  forbidden, and it would set a precedent), and reading it by hand (manual every month, never on screen).

Reclassified from spike to feature (S): the spike's question is answered. Refining should confirm where a verdict
becomes "proven" (`lib/roadmap-result.ts`, the result record's verdict) and that the opaque id can't be reversed
by a public reader of the golden-frijoles project (rule #2: its funnels are public).
