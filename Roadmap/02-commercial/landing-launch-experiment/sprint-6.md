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
    status: done   # PR #423, merge f506392 — no migration (OPEN_ENDED_AT sentinel)
  - id: S6.3
    title: "A verdict at any volume"
    as_a: "the person running a test"
    i_want: "to roll the leader out or keep the control whenever I stop, with how sure the numbers are"
    so_that: "a low-traffic test ends in a decision, not only \"iterate\""
    risk: high
    status: done   # PR #422, merge 2e2297c
  - id: S6.4
    title: "frijoles experiments: create, start, stop, decide"
    as_a: "an agent working for the founder"
    i_want: "to launch and decide an experiment from the CLI"
    so_that: "a test takes minutes, and several can run at once"
    risk: high
    status: done   # PR #424, merge dbb4d0c
  - id: S6.6
    title: "Pause, resume and delete"
    as_a: "the person running tests"
    i_want: "to pause a test, resume it, or delete it, like any testing tool"
    so_that: "a test's life is mine to manage, not a one-way street"
    risk: high
    status: in-progress   # PR open — no migration
  - id: S6.5
    title: "The landing A/B, launched and read"
    as_a: "Daniel"
    i_want: "A vs B live on goldenfrijoles.com, exposures and copies recorded, readable any day"
    so_that: "the epic proves the engine end to end"
    risk: medium
    status: done   # launched 2026-10-21 by CLI: variant_b_copy_test_2
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 6: A test at any traffic

**Status:** 🟨 Building — S6.1–S6.5 ✅ (#421–#424; the landing A/B launched 2026-10-21); S6.6 in review.

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
**Acceptance:** step 5 takes "Until I stop it", or "Through <day>" (any day from tomorrow), beside the week chips. Analysis reads up to now (or the stop); the readout shows days running instead of a
planned share, and a stopped test's days stop at its stop.

**Design (deviation from the plan, recorded):** the plan said a migration would make `plannedWindow.endAt` nullable.
Built instead: "until I stop it" is the far timestamp `OPEN_ENDED_AT` (9999-12-31T00:00Z, `lib/experiment-definition.ts`),
so the definition validators (TS and SQL), the analysis window (min of planned end, stopped, as-of) and every stored
definition stay valid with no migration; only the screens ask `isOpenEnded`. A dated test runs THROUGH its day — it ends
at the next 00:00 UTC — and a day must be a real calendar day from tomorrow on (verifier, #423).

### Story 6.3 — A verdict at any volume
**Acceptance:** every live or stopped test offers roll out the leader / keep the control at ANY point — no data, a short
sample, a flat or worse result, a guardrail moved, even a failed check (Daniel: "what if I just want to roll it out
regardless of any results?"). The readout says how sure it is in words: each version's counts and the chance the leader is
really better (`lib/experiment-chance.ts`, Bayesian chance-to-beat, deterministic on a grid fitted to both posteriors); below the planned sample the call is
labelled directional, never withheld; the decision record keeps whether the planned sample was met (its snapshot carries
`decisionReady`). The page draws the button its reading points to as primary (Keep on a worse or flat result), the rest
secondary — available, never urged. The database already allowed it (`record_experiment_decision` has no sample rule);
only the readout gated it.

### Story 6.6 — Pause, resume and delete
**Acceptance:** a running test can be paused (its split off Production — everyone sees the feature as it was before the
test — and nobody new enters) and resumed (its own flag version served again; assignment is a hash of the visitor, so each
person lands in the same group); a paused test can still be decided and rolled out; a test can be deleted (its split off
Production first, every live version retired, gone from the list with a "N deleted not shown" line — the audit trail
stays, append-only). Console (Pause, Resume, Delete experiment) and CLI (`frijoles experiments pause|resume|delete`).

**Design (no migration):** Pause keeps the version RUNNING and serves `stripExperiment` of its flag — the readout's
"not serving" state, told apart as `paused` because Production serves exactly this test's base (`servingState`).
Resume is the partial state's Retry. The roll-out accepts that paused base. Delete reuses `invalid`; a decided experiment
is the record of a decision and is not deleted.

### Story 6.4 — `frijoles experiments`
**Acceptance:** `ls`, `show`, `create` (from flags — `--flag --metric [--guardrail] [--entity] [--ends|--weeks]` — or
`--from <answers.json>`), `start`, `stop`, `decide --ship [--variant]|--keep|… --reason [--rollout]` — member-gated reads,
owner-gated writes, through the same commands the console uses (one path: `lib/experiment-owner-commands.ts` is now the
console's decision path too), `--json` on each. Built and proven end to end (`e2e/cli-experiments.spec.ts`): no traffic and
a metric that never fired → create, start, show, decide ship with roll-out. Found on the way: zero traffic for "everyone"
failed as "nobody matches"; it now warns "nobody has been seen yet", and that fail (unreachable otherwise) is gone.

### Story 6.5 — The landing A/B, launched and read
**Acceptance:** `landing.variant_b_enabled`'s experiment started on production (by the CLI), A and B served 50/50 to
visitors, exposures and `start_prompt_copied` recorded per version, and the readout readable the same day.

**Run log — 2026-10-21 (agent):** `frijoles experiments create --flag landing.variant_b_enabled --metric
start_prompt_copied --guardrail signup_started --guardrail account_confirmed --entity visitor` → `variant_b_copy_test_2`
(until stopped; checks: 0 failing, the quiet metrics a warning); `start` → production flag v3, split 50/50. 40 fresh
`curl` loads of `/` split 21 A / 19 B (curl records nothing: the exposure is a browser beacon). One headless-browser visit
→ B, `experiment_exposed` (feature `variant_b_copy_test_2`, variant `on`, subject visitor) recorded and counted by
`frijoles experiments show`. Daniel's earlier 4-week draft `variant_b_copy_test` was left as a draft.
