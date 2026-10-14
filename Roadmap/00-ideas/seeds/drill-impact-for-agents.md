---
title: "Drill impact for agents: a drill's effect, recorded and read from the CLI"
slug: drill-impact-for-agents
status: raw
area: "01"
type: feature
appetite: M
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-13
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — drill impact for agents (after launch)

From `scenarios-light-up` S2.3, 2026-10-13. The production drill on goldenfrijoles.com ran and stopped cleanly (an
agent through `frijoles scenarios`, then the product owner from the page), but the scenarios page's **impact
comparison was empty**, so the product owner's judgment of it (`scenarios-pm-operable` D11: could it be misread as a
causal customer claim?) could not be made. The product owner chose to seed this rather than build it before launch.

## Why it was empty

- Impact evidence is recorded only for a drill **bound to an experiment** (`ScenarioDefinition.experiment`, SDK
  `scenarios.ts`), and our drill had none.
- It is captured only through the credential route `POST /api/v1/scenarios/impact`
  (`captureScenarioImpactEvidence`, `lib/scenario-impact-operations.ts`), which takes a `flag_admin` key and a Miyagi
  user header — the same Miyagi-only shape target setup had before `scenarios-light-up` (D2/D3) gave it an owner path.
- `frijoles scenarios define` has no `--experiment`, and no command captures or reads impact.

## The ask, as it stands (agents first, the page for humans — the product owner, 2026-10-13)

1. `frijoles scenarios define … --experiment <key>@<version>` binds a drill to an experiment (page: the same choice).
2. An owner path to capture impact evidence for a stopped run (owner RPC beside the `owner_*` scenario functions; the
   CLI route and the page through the one owner service, `lib/scenario-owner-service.ts`).
3. `frijoles scenarios impact <run-id>` (and `--json`) reads it; the connector's `list_scenarios` names it.
4. Then the product owner judges the rendered comparison (D11) on a real drill.

## Open questions for refining

- Does every drill need an experiment, or can a drill record impact against its own control/fault arms only?
- Is capture automatic at stop, or an explicit step?
- The chart decision (#14) stays a comparison table unless refined otherwise.
