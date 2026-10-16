---
epic: drill-impact-for-agents
sprint: 1
title: "Bind and capture"
risk: high
phase: Shipped
stories_total: 4
stories:
  - id: S1.1
    title: "A drill is bound to an experiment"
    as_a: "a founder's agent defining a drill"
    i_want: "frijoles scenarios define … --experiment <key>@<version>, and the same choice on the page"
    so_that: "the drill has an analysis its impact can come from"
    risk: low
    status: done
  - id: S1.2
    title: "Owners capture impact, not admin keys"
    as_a: "a founder who owns the project"
    i_want: "owner functions that read a run's impact source and record its evidence"
    so_that: "capture no longer needs a Miyagi flag_admin key"
    risk: high
    status: done
  - id: S1.3
    title: "Impact is captured when a bound drill stops"
    as_a: "a founder's agent stopping a drill"
    i_want: "its impact captured as part of the stop, with a retry if the capture fails"
    so_that: "nobody has to remember a second step"
    risk: high
    status: done
  - id: S1.4
    title: "A drill's technical evidence lands"
    as_a: "a founder reading a drill's comparison"
    i_want: "the probe's scenario_executed events to reach the engine"
    so_that: "the comparison is not 0 vs 0"
    risk: low
    status: done
---
# Drill impact for agents — Sprint 1: Bind and capture

**Status:** ✅ shipped 2026-10-16 — #382 (merge `a0cf3ba`), migration `20261018100000` pushed and verified before the merge, deploy success

## Build contract (locked by the architect before the builder started)
Cite the epic README's D1–D9; never restate them. Per story: **S1.1** = D1 + D2 + D3 (draft builder, the named
define-time refusal in `ownerDirectOperation`, the page's Experiment select). **S1.2** = D4 (one migration, owner-only,
function-level denial asserted by the spec, the key-path reader accepting a NULL actor). **S1.3** = D5 + D6 + D7 + D8
(owner capture door, deterministic retry, capture on stop, `capture_impact` + `frijoles scenarios impact --capture`).
**S1.4** = D9 (added at the lock: the probe's client gets a `userId`). Deviations from the stories as written: owner,
not member (README corrections); `p_actor_user_id`, not `p_user_id`; the walkthrough's experiment is created in the
console by the product owner, since none exists in golden-frijoles and no agent path makes one.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — A drill is bound to an experiment ✅ aac0de8 · 50c9354
**As** a founder's agent defining a drill, **I want** `frijoles scenarios define … --experiment <key>@<version>`, and
the same choice on the page, **so that** the drill has an analysis its impact can come from.
**Acceptance:** the CLI route's `define` and the page's authoring draft pass `experiment` into the one builder
(`buildScenarioDefinition`). An experiment key or version that doesn't exist in this project is refused at define
time, naming it. A drill defined without one still works and says it has no impact source.
**Risk:** low

### Story 1.2 — Owners capture impact, not admin keys ✅ bf4b803
**As** a founder who owns the project, **I want** owner functions that read a run's impact source and record its
evidence, **so that** capture no longer needs a Miyagi `flag_admin` key.
**Acceptance:** a migration adds `owner_get_scenario_impact_source(p_project_id, p_user_id, p_run_id, p_as_of)` and
`owner_record_scenario_impact_evidence(p_project_id, p_user_id, p_run_id, p_evidence, p_reason, p_idempotency_key)`,
mirroring the key-hash pair in `20260809130000_scenario_impact_evidence.sql` and the `owner_*` membership check in
`20260813100000_scenario_owner_operations.sql`. `REVOKE` from PUBLIC/anon/authenticated, `GRANT` to service_role. Specs:
a member's call succeeds; a non-member's and anon's fail at the function. The key-hash path is unchanged.
`supabase db push` runs before the merge.
**Risk:** high (an authorization boundary, a migration). Security lens on review.

### Story 1.3 — Impact is captured when a bound drill stops ✅ 40028fc · 2ac19cd
**As** a founder's agent stopping a drill, **I want** its impact captured as part of the stop, with a retry if the
capture fails, **so that** nobody has to remember a second step.
**Acceptance:** the owner service's stop (CLI `stop`, the page's stop action) captures impact for a bound drill through
the S1.2 functions and the canonical analysis (`captureScenarioImpactEvidence`'s logic, owner door). A failed capture
(analysis unavailable, a 409 version mismatch) doesn't fail the stop: the stop answers ok with
`impact: not captured (<reason>)`. `frijoles scenarios impact <run-id> --capture` retries, idempotently.
**Risk:** high (a write on the stop path).

### Story 1.4 — A drill's technical evidence lands ✅ 4580a1f · bb47016
**As** a founder reading a drill's comparison, **I want** the probe's `scenario_executed` events to reach the engine,
**so that** the comparison is not 0 vs 0.
**Acceptance:** D9. The probe route's client carries a `userId`; a unit test drives the real (built) SDK client and sees a
`scenario_executed` POST. Added at the lock: golden-frijoles' two real runs made 14 requests and recorded none.
**Risk:** low

## Sprint QA
- **api spec(s):** S1.1 → CLI define spec (bound, unknown key, unknown version, unbound flag version, none); S1.2 →
  function-level denial + owner success + member/stranger refusal + key-path reader with an owner row; S1.3 → stop
  captures, stop with a forced capture failure still succeeds, `capture_impact` is idempotent. S1.4 → unit test.
- **browser smoke owed:** no (Sprint 2 walks it end to end).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `supabase migration list` (linked to production).
   → `20261018100000` shows on both sides.
2. **Product owner, signed in:** at https://goldenfrijoles.com/app/experiments/golden-frijoles build an experiment on the
   `site.drill_fault` feature and save it. Note its key and the flag version it wrote (`frijoles flags get site.drill_fault`).
   → an experiment exists in golden-frijoles (there was none at the lock).
3. Run `frijoles scenarios define impact-check --target site.probe --flag site.drill_fault@<that version> --experiment <key>@<version> --project golden-frijoles`.
   → it prints the drill, naming the experiment.
4. Run the same with `--experiment <key>@999`.
   → it refuses, naming the version.

If any step fails, note the step number + what you saw — that's the bug report.

### Run 2026-10-16 (the architect, production)
1. `supabase migration list --linked` → `20261018100000` was the only pending one; `supabase db push` applied it **before** the
   merge. Verified live: both owner functions `SECURITY DEFINER`, EXECUTE for service_role only (anon/authenticated
   false); `scenario_impact_evidence.external_actor_id` nullable. ✅
2. **Owed to the product owner** — golden-frijoles still has no experiment (`frijoles scenarios ls --json` →
   `site.drill_fault` v1 and v2 each list `experiments: []`, the D3 field live).
3. Not runnable until step 2. The refusal path was checked instead: `frijoles scenarios define impact-check --target site.probe --flag site.drill_fault@2 --experiment no_such_experiment@1 --project golden-frijoles` (CLI 1.10.0 from `main`) → `No experiment \`no_such_experiment\` in this project.`; the project still holds 1 definition (nothing written). ✅
4. Owed with step 3 (`@999` names the version; pinned by `drill-impact.spec.ts` in CI).
