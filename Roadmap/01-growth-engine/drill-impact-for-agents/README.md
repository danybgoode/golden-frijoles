---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-16T21:21:44Z"
slug: drill-impact-for-agents
title: "Drill impact for agents"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "A drill's impact comparison is empty unless a Miyagi admin key captures it. Letting an owner's agent bind a drill to an experiment and capture its impact at stop puts the evidence on the CLI and the page. We'll know when a stopped drill has impact."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "stopped drills with impact evidence recorded (scenario_impact_evidence rows, golden-frijoles)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, rehearsing a failure before customers meet it"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "Drills prove resilience, not a bet's outcome; no North Star input counts them."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 94      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Drill impact for agents

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/drill-impact-for-agents.md`](../../00-ideas/seeds/drill-impact-for-agents.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
A drill's impact comparison is empty unless a Miyagi admin key captures it, so the product owner's D11 judgment
(could the comparison be misread as a causal claim about customers?) was never made. An owner's agent binds a drill to
an experiment, impact is captured when it stops, and agents read it from the CLI and the connector. We'll know when
stopped drills have impact: 0 → 2 within 30 days of shipping.


## Platform-first note
Everything downstream exists: the canonical experiment analysis, the evidence table, the page's rendering. What's
missing is the binding and an owner door, the same gap target setup had before `scenarios-light-up` D2/D3, closed the
same way (`owner_*` functions behind `lib/scenario-owner-service.ts`). Tenancy holds: every function takes one
`project_id` and re-checks membership. The Miyagi key path stays.


## What already exists (reuse, don't rebuild)
- `apps/web/lib/scenario-impact-operations.ts`, `lib/scenario-impact.ts`, `lib/scenario-impact-link.ts`.
- `apps/web/lib/scenario-owner-service.ts`, `apps/web/app/api/v1/cli/scenarios/route.ts`, `packages/cli/src/commands/scenarios.ts`.
- Migrations: `20260809130000_scenario_impact_evidence.sql` (the key-hash pair to mirror),
  `20260813100000_scenario_owner_operations.sql` (the `owner_*` pattern).
- `packages/sdk/src/scenarios.ts` (`experiment?`), `lib/scenario-authoring-draft.ts`, `lib/mcp-scenario-tools.ts`,
  `apps/web/app/app/scenarios/[projectSlug]/drill-evidence.tsx`.


## Architecture lock (D1…D14) — verified against live code and live data, 2026-10-16

**Live data at the lock** (prod `slweidgffcfndnskcskc`, read-only):

| project | scenario defs | bound to an experiment | runs | impact rows | experiments | experiment↔flag bindings |
|---|---|---|---|---|---|---|
| golden-frijoles | 1 (`site-delay`, `site.drill_fault@2`) | 0 | 3 (all stopped) | 0 | **0** | 0 |
| miyagi | 2 | 2 | 5 | 3 (key path, 2026-07-30) | 1 | 1 |
| miyagisanchez | 0 | 0 | 0 | 0 | 2 | 0 |

**Scope the live system corrects (said out loud):**
- **golden-frijoles' drills have never recorded technical evidence.** Its two real runs made 14 probe requests
  (`request_count` 6 and 8) and wrote **zero** `scenario_executed` (or exposure) events. Cause, reproduced against the
  built SDK: `app/api/internal/resilience/probe/route.ts` creates its client with no `userId`, so every
  `trackScenarioExecution` answers `NO_USER` and the probe's `.catch(() => undefined)` swallows it. Every comparison a GF
  drill could capture would read 0 vs 0, and S2.3's judgment would be of an empty table. **Added as S1.4** (a one-line
  fix plus a unit test on the real SDK): without it the bet cannot be read at all.
- **golden-frijoles has no experiment**, and nothing an agent can call creates one: experiments are made in the
  console's experiment builder (signed-in owner, `save_experiment_draft`), which writes a new flag version bound to the
  experiment. So binding the GF drill is **owed to the product owner**: build an experiment on `site.drill_fault` in the
  console, then define the drill on the flag version it wrote. The walkthroughs say so. No experiment-creation CLI here.
- **Capture is owner-only, not member.** Every `owner_*` function proves `project_members.role = 'owner'`
  (`private.assert_scenario_owner`), and stop is owner-only already. S1.2's spec is "an owner's call succeeds; a member's,
  a stranger's and anon's fail". Reads (S2.1, S2.2) stay member-level.
- **`scenario_impact_evidence.external_actor_id` is `NOT NULL`** with a Miyagi-Clerk regex; the owner door has no external
  actor (every owner function passes `NULL` to the audit, whose column is nullable). The migration drops the NOT NULL
  (the CHECK stays, and a NULL passes it). The key-path **write** is unchanged; the key-path **reader**
  (`getScenarioImpactEvidence`) must accept `null`, or one owner capture turns Miyagi's `GET /api/v1/scenarios/impact`
  into a 500.
- **"not captured yet (<reason>)" has no stored reason.** A failed capture is not persisted (no new table). The read
  derives the reason from the run (D11); the stop's own answer carries the live failure reason.

### Sprint 1 — bind and capture
- **D1 · Binding is the definition's `experiment` field, which already exists end to end.** `ScenarioDefinition.experiment`
  (SDK `scenarios.ts`), `scenario_definition_versions.experiment_id/_version_id`, and
  `private.create_scenario_definition_version_core` already refuse an unknown experiment version and one not bound to
  the drill's flag version (22023). S1.1 only plumbs it: `ScenarioAuthoringDraft` gains optional
  `experimentKey`/`experimentVersion`; `buildScenarioDefinition` adds `experiment: { key, definitionVersion }` when
  both are set (one builder, page and CLI).
- **D2 · A named refusal at define time.** `ownerDirectOperation` (create_definition with an experiment) reads, project-
  scoped, before the RPC: experiment key missing → `No experiment \`<key>\` in this project.`; version missing →
  `Experiment <key> has no version <n>.`; not bound to the drill's flag version → `Experiment <key>@<n> is not bound to
  <flag>@<v>; the drill's flag version must be the one the experiment serves.` The DB check stays as the floor. A define
  answer carries `impactSource: { key, definitionVersion } | null`; the CLI prints `no impact source — not bound to an
  experiment` when null.
- **D3 · The page offers only bound experiments.** `getScenarioDashboardView().faultFlags[]` gains
  `experiments: { key, version }[]` from `experiment_flag_version_bindings` (project-scoped, bounded 500) joined to
  `experiment_registries`/`experiment_definition_versions`. The workspace form adds an **Experiment** select under the
  fault flag: "None — no impact comparison" plus that flag version's bound experiments; changing the flag clears it.
- **D4 · Migration `20261018100000_drill_impact_owner.sql`, expand-only.** (a) `ALTER COLUMN external_actor_id DROP NOT
  NULL` on `scenario_impact_evidence`. (b) `owner_get_scenario_impact_source(p_project_id, p_actor_user_id, p_run_id,
  p_as_of)` — the key path's SELECT with `run.project_id = p_project_id` in place of the key's project+environment, after
  `private.assert_scenario_owner`. (c) `owner_record_scenario_impact_evidence(p_project_id, p_actor_user_id, p_run_id,
  p_evidence, p_reason, p_idempotency_key)` — the key path's body with the run locked by `project_id = p_project_id`,
  `actor_user_id = p_actor_user_id`, `external_actor_id = NULL` (row and audit). Both refuse an `external`-cohort run
  with 42501 (as every owner facade does), are `SECURITY DEFINER`, `SET search_path = pg_catalog, public, pg_temp`,
  `REVOKE ALL … FROM PUBLIC, anon, authenticated, service_role` then `GRANT EXECUTE … TO service_role`, and a closing
  `DO` block asserts the privilege boundary (the 20260813 pattern). Parameter named `p_actor_user_id`, not the story's
  `p_user_id`, to match every sibling `owner_*`. The key-path functions are not touched (duplicated SELECT, on purpose:
  the live Miyagi path stays byte-identical).
- **D5 · One capture, two doors.** `captureScenarioImpactEvidence` is split: the canonical-analysis + build step
  (`buildCapturedEvidence(source, asOf, runId)`) is shared; the key door keeps its RPC pair, the owner door
  (`captureOwnerScenarioImpact(owner, runId)` in `lib/scenario-impact-operations.ts`) calls the owner pair. Its answer:
  `{ state: 'captured', evidenceId, createdAt, created } | { state: 'not_captured', reason } | { state: 'unbound' }`.
- **D6 · Deterministic capture, idempotent retry.** The owner door captures `asOf` = the run's `stopped_at` rounded UP to
  the millisecond (canonical `.sssZ`), idempotency key = a UUID derived from `sha256('owner-impact:' + runId)`, reason
  always `Impact captured for a stopped drill.`. If the run already has an evidence row, the answer is that row
  (`created: false`) and nothing is written. A run with no `stopped_at` → `not_captured (the run has not stopped)`.
- **D7 · Capture rides the stop, and never fails it.** In `ownerDirectOperation`, after a `transition_run` stop returns
  ok, a bound run is captured (D5/D6); the stop answer gains `impact` (D5's shape). A capture failure (no analysis, a
  409 version mismatch, an RPC error) becomes `not_captured` with a plain reason; the stop is still `ok`. The CLI prints
  `impact: captured`, `impact: not captured (<reason>)` or `impact: none — not bound to an experiment`. Both doors (the
  CLI's `stop`, the page's stop action) already pass through `ownerDirectOperation`, so neither changes.
- **D8 · The retry is a CLI write.** `POST /api/v1/cli/scenarios {command: 'capture_impact', runId}` (owner, authoring
  switch first like every write) → `captureOwnerScenarioImpact`. `frijoles scenarios impact <run-id> --capture` calls it.
- **D9 · S1.4: the probe identifies itself.** `createGrowthEngineClient({ apiKey, userId: 'scenario-probe', ...engine() })`
  in the probe route. A unit test drives the REAL SDK client (built `dist`) with an injected `fetchImpl` and asserts a
  `scenario_executed` POST leaves it — the test the fake `track` in `scenario-probe.test.ts` could not be.

### Sprint 2 — read and judge
- **D10 · One run-impact rule.** `lib/scenario-run-impact.ts` (pure, no `server-only`): `scenarioRunImpact(view, runId)`
  → `unbound` (the run's definition has no `experiment`) | `captured` (the newest `view.impacts` row for the run: its
  experiment key@version, `capturedAt`, technical control and fault arms, deltas, claim status + blockers) |
  `not_captured` with D11's reason. CLI (S2.1) and connector (S2.2) both call it.
- **D11 · Derived reasons.** `draft` → `the run never started`; `running` → `the run has not stopped`; otherwise →
  `no capture recorded — run \`frijoles scenarios impact <run-id> --capture\``.
- **D12 · CLI read.** `GET /api/v1/cli/scenarios?project=&run=<id>` (member) → `{ project, runId, impact }`; an unknown
  run → `not_found`. `frijoles scenarios impact <run-id> [--json]` prints the table `ARM | ATTEMPTS | FAILURES | P95 MS`
  (control, treatment) with the experiment key@version, claim status and captured-at, or exactly one of the two state
  lines. CLI minor bump **1.10.0**; its npm publish is owed to the product owner.
- **D13 · Connector.** `toScenarioToolView` adds `impact: 'captured' | 'not_captured' | 'unbound'` per run (the state
  only — the allow-list stays an allow-list; no evidence body reaches the connector). `public-connector-scrub.ts`
  unchanged (no person id is added); the existing scrub spec still passes.
- **D14 · No flag.** Scenario authoring's switch gates every write here, as the README's deploy order says. No new
  gate row.

**Routing.** S1 (migration, an authorization boundary, a write on the stop path) is built by the architect (Opus) and
never delegated. S2.1/S2.2 go to a Sonnet builder against D10–D13; S2.3 is the product owner's. Fresh `verifier` on
every PR (high risk) plus the routed external passes; the security lens on S1.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Bind to an experiment · S1.2 Owner impact functions · S1.3 Capture at stop · S1.4 The probe's telemetry lands (added at the lock) | high |
| 2 | S2.1 CLI impact read · S2.2 Connector impact state · S2.3 D11 judged (product owner) | low |

## Deploy order
Sprint 1's migration is `supabase db push`ed before its merge. No new flag: scenario authoring's switch already
gates both doors. The CLI release (S2.1, S2.2's agents) is an npm publish owed to the product owner, and S2.3's
walkthrough needs it.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
