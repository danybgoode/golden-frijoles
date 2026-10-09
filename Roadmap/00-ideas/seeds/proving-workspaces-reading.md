---
title: "A reading for proving_workspaces"
slug: proving-workspaces-reading
status: raw
area: "01"
type: spike
appetite: S
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-09
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
