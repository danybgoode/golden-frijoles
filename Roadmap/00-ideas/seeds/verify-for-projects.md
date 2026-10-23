---
title: "Verify for projects: the verification depth ladder offered to every project"
slug: verify-for-projects
status: raw
area: "09"
type: feature
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-23
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — verify for projects (after verify-module's shadow log reaches 30)

Split from `verify-module` at refining, 2026-10-14. That epic runs the checks on Golden Frijoles' own code and measures
Jev's verify-depth routing in shadow. This is the product half the original seed planned (unification audit §10, seed
12): a spec manifest and generators, the depth ladder in refine (off / light / standard / deep), CI checker jobs a
project can adopt, and evidence in the Hub with its bounds stated.

**The trigger is automatic:** `verify-module` S2.3 pings the product owner on Telegram and writes an owed line the day
the count reaches 30. **Shape it only once** Jev's shadow log has ≥ 30 labelled PRs (verify-spike `DECISION.md` rule 3), and no landing
claim until it ships (audit D7).

**2026-10-23 — unblocked by [`verify-labels`](verify-labels.md).** The log had 42 rows but 10 labelled. 41 of the 42
touch no spec path, and Jev called 17 of those something other than `off`. `verify-labels` counts rule labels toward
the 30 (so the ping fires on its first nightly) and backtests Jev on the ~12 historical spec-touching PRs. Read
`run.mjs --report`'s per-source split before shaping the ladder: a path filter first, Jev only on spec PRs, is the
leading hypothesis.
