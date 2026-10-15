---
epic: drill-impact-for-agents
sprint: 1
title: "Bind and capture"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "A drill is bound to an experiment"
    as_a: "a founder's agent defining a drill"
    i_want: "frijoles scenarios define … --experiment <key>@<version>, and the same choice on the page"
    so_that: "the drill has an analysis its impact can come from"
    risk: low
    status: planned
  - id: S1.2
    title: "Owners capture impact, not admin keys"
    as_a: "a founder who owns the project"
    i_want: "owner functions that read a run's impact source and record its evidence"
    so_that: "capture no longer needs a Miyagi flag_admin key"
    risk: high
    status: planned
  - id: S1.3
    title: "Impact is captured when a bound drill stops"
    as_a: "a founder's agent stopping a drill"
    i_want: "its impact captured as part of the stop, with a retry if the capture fails"
    so_that: "nobody has to remember a second step"
    risk: high
    status: planned
---
# Drill impact for agents — Sprint 1: Bind and capture

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — A drill is bound to an experiment
**As** a founder's agent defining a drill, **I want** `frijoles scenarios define … --experiment <key>@<version>`, and
the same choice on the page, **so that** the drill has an analysis its impact can come from.
**Acceptance:** the CLI route's `define` and the page's authoring draft pass `experiment` into the one builder
(`buildScenarioDefinition`). An experiment key or version that doesn't exist in this project is refused at define
time, naming it. A drill defined without one still works and says it has no impact source.
**Risk:** low

### Story 1.2 — Owners capture impact, not admin keys
**As** a founder who owns the project, **I want** owner functions that read a run's impact source and record its
evidence, **so that** capture no longer needs a Miyagi `flag_admin` key.
**Acceptance:** a migration adds `owner_get_scenario_impact_source(p_project_id, p_user_id, p_run_id, p_as_of)` and
`owner_record_scenario_impact_evidence(p_project_id, p_user_id, p_run_id, p_evidence, p_reason, p_idempotency_key)`,
mirroring the key-hash pair in `20260809130000_scenario_impact_evidence.sql` and the `owner_*` membership check in
`20260813100000_scenario_owner_operations.sql`. `REVOKE` from PUBLIC/anon/authenticated, `GRANT` to service_role. Specs:
a member's call succeeds; a non-member's and anon's fail at the function. The key-hash path is unchanged.
`supabase db push` runs before the merge.
**Risk:** high (an authorization boundary, a migration). Security lens on review.

### Story 1.3 — Impact is captured when a bound drill stops
**As** a founder's agent stopping a drill, **I want** its impact captured as part of the stop, with a retry if the
capture fails, **so that** nobody has to remember a second step.
**Acceptance:** the owner service's stop (CLI `stop`, the page's stop action) captures impact for a bound drill through
the S1.2 functions and the canonical analysis (`captureScenarioImpactEvidence`'s logic, owner door). A failed capture
(analysis unavailable, a 409 version mismatch) doesn't fail the stop: the stop answers ok with
`impact: not captured (<reason>)`. `frijoles scenarios impact <run-id> --capture` retries, idempotently.
**Risk:** high (a write on the stop path).

## Sprint QA
- **api spec(s):** S1.1 → CLI define spec; S1.2 → function-level denial + member success; S1.3 → stop captures, and
  stop with a forced capture failure still succeeds.
- **browser smoke owed:** no (Sprint 2 walks it end to end).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `supabase migration list` (linked to production).
   → the new owner impact migration shows on both sides.
2. Run `frijoles scenarios define impact-check --target <a verified target> --flag <its flag>@<version> --experiment <a live experiment>@<its version> --project golden-frijoles`.
   → it prints the drill, naming the experiment.
3. Run the same with `@999`.
   → it refuses, naming the version.

If any step fails, note the step number + what you saw — that's the bug report.
