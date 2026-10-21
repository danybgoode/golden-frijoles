---
epic: landing-launch-experiment
sprint: 6
title: "A test at any traffic, launched in minutes"
risk: high
phase: Building
stories_total: 6
stories:
  - id: S6.1
    title: "Too little traffic never blocks Start"
    as_a: "a founder launching with a handful of visitors"
    i_want: "to start an A/B test whatever my traffic or yesterday's conversions"
    so_that: "the test records from day one instead of waiting for volume it may never get"
    risk: medium
    status: done   # PR #421, merge 9e7500f
  - id: S6.2
    title: "Any end date, or none"
    as_a: "the person running a test"
    i_want: "to pick any end date, or run it until I decide"
    so_that: "a run length is my call, not a menu of 1–8 weeks"
    risk: high
    status: planned   # awaiting Daniel's go: a migration relaxes plannedWindow.endAt
  - id: S6.3
    title: "A verdict at any volume"
    as_a: "the person running a test"
    i_want: "to roll the leader out or keep the control whenever I stop, with how sure the numbers are"
    so_that: "a low-traffic test ends in a decision, not only \"iterate\""
    risk: high
    status: in-progress
  - id: S6.4
    title: "frijoles experiments: create, start, stop, decide"
    as_a: "an agent working for the founder"
    i_want: "to launch and decide an experiment from the CLI"
    so_that: "a test takes minutes, and several can run at once"
    risk: high
    status: planned
  - id: S6.6
    title: "Pause, resume and delete"
    as_a: "the person running tests"
    i_want: "to pause a test, resume it, or delete it, like any testing tool"
    so_that: "a test's life is mine to manage, not a one-way street"
    risk: high
    status: planned
  - id: S6.5
    title: "The landing A/B, launched and read"
    as_a: "Daniel"
    i_want: "A vs B live on goldenfrijoles.com, exposures and copies recorded, readable any day"
    so_that: "the epic proves the engine end to end"
    risk: medium
    status: planned
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 6: A test at any traffic

**Status:** 🟨 Building — S6.1 ✅ (#421); S6.3 in progress; S6.2, S6.4–S6.6 planned. Daniel approved the sprint 2026-10-20 ("if your stories above will do that lets go ahead").

## Why this sprint exists (Daniel, 2026-10-20)
Launch day for the landing A/B: the builder refused to start it — "A metric has gone quiet" (no prompt copy in 24 hours)
and "Not enough people for any run length" (161,690 days at ~20 visits a day) — and nothing in the CLI could create or
start an experiment. Daniel: low traffic "must never be a constraint to launch an A/B test, or to record its performance";
the test must reach a verdict and be saved with whatever time limit, or none; and the engine an agent runs must launch a
test in minutes. The epic exists to prove the engine; this is the engine failing that proof, fixed here.

## Stories

### Story 6.1 — Too little traffic never blocks Start
**Acceptance:** the builder's power checks (no run length fits; the test ends before enough people; a saved draft whose
estimate outruns its dates) and the quiet-metric check are WARNINGS with plain advice ("read the result as directional"),
never `fail`. Only facts still fail: a window whose dates have passed, conditions nobody can match, a feature with no code
or another test on it. The server's Start re-plans with the same checks, so the rule holds there too.

### Story 6.2 — Any end date, or none
**Acceptance:** step 5 takes a date (any future day) or "until I stop it"; the definition's `plannedWindow.endAt` may be
null (migration relaxing the validator), analysis reads up to now, and the readout shows days running instead of a
planned share.

### Story 6.3 — A verdict at any volume
**Acceptance:** every live or stopped test offers roll out the leader / keep the control at ANY point — no data, a short
sample, a flat or worse result, a guardrail moved, even a failed check (Daniel: "what if I just want to roll it out
regardless of any results?"). The readout says how sure it is in words: each version's counts and the chance the leader is
really better (`lib/experiment-chance.ts`, Bayesian chance-to-beat, exact on a grid); below the planned sample the call is
labelled directional, never withheld; the decision record keeps whether the planned sample was met (its snapshot carries
`decisionReady`). The page draws the button its reading points to as primary (Keep on a worse or flat result), the rest
secondary — available, never urged. The database already allowed it (`record_experiment_decision` has no sample rule);
only the readout gated it.

### Story 6.6 — Pause, resume and delete
**Acceptance:** a running test can be paused (nobody new counted, the split stops serving) and resumed (counting again,
the same assignment); a test can be deleted (its split off, gone from the list — the audit trail stays, append-only).

### Story 6.4 — `frijoles experiments`
**Acceptance:** `ls`, `create --from <file>`, `start`, `stop`, `decide` — member/owner-gated like `frijoles flags`, through
the same commands the builder uses (one path, so the rules above hold for agents too), `--json` on each.

### Story 6.5 — The landing A/B, launched and read
**Acceptance:** `landing.variant_b_enabled`'s experiment started on production (by the CLI), A and B served 50/50 to
visitors, exposures and `start_prompt_copied` recorded per version, and the readout readable the same day.
