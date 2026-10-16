---
epic: drill-impact-for-agents
sprint: 2
title: "Read and judge"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S2.1
    title: "Agents read a run's impact"
    as_a: "a founder's agent"
    i_want: "frijoles scenarios impact <run-id> [--json]"
    so_that: "I can report what a drill did without opening the page"
    risk: low
    status: done
  - id: S2.2
    title: "The connector says which runs have impact"
    as_a: "a founder's agent in a chat"
    i_want: "list_scenarios to name each run's impact state"
    so_that: "I know which run to ask about"
    risk: low
    status: done
  - id: S2.3
    title: "The product owner judges the comparison on a real drill"
    as_a: "the product owner"
    i_want: "to read a real drill's impact comparison and answer D11"
    so_that: "we know whether it could be misread as a causal claim about customers"
    risk: low
    status: planned
---
# Drill impact for agents — Sprint 2: Read and judge

**Status:** ✅ shipped 2026-10-16 — #384 (merge `fc504cb`), deploy success · CLI 1.10.0 + plugin/kit 1.10.4 · S2.3 owed to the product owner

## Build contract (locked by the architect before the builder started)
Cite the epic README's D10–D14; never restate them. Per story: **S2.1** = D10 + D11 + D12 (the pure run-impact rule,
derived reasons, the member GET with `run=`, `frijoles scenarios impact`, CLI 1.10.0). **S2.2** = D10 + D13 (the state
per run in `toScenarioToolView`, nothing else added). **S2.3** is the product owner's judgment. Deviation: "not captured
yet (<reason>)" is derived from the run, not stored (README corrections).

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S2.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 2.1 — Agents read a run's impact ✅ 334e096 · f23a221 · d3abfc2 (release)
**As** a founder's agent, **I want** `frijoles scenarios impact <run-id> [--json]`, **so that** I can report what a
drill did without opening the page.
**Acceptance:** a member-gated CLI read (PAT) prints the comparison as a table (control vs treatment, the experiment
key@version, captured at), or exactly one of "not bound to an experiment" and "not captured yet (<reason>)". `--json`
returns the same fields. A CLI release, its npm publish owed to the product owner.
**Risk:** low

### Story 2.2 — The connector says which runs have impact ✅ f220c9d · a50327b
**As** a founder's agent in a chat, **I want** `list_scenarios` to name each run's impact state, **so that** I know
which run to ask about.
**Acceptance:** `lib/mcp-scenario-tools.ts` adds `impact: captured | not_captured | unbound` per run. On the public
project, `lib/public-connector-scrub.ts` still holds (no person's id). A spec pins the field.
**Risk:** low

### Story 2.3 — The product owner judges the comparison on a real drill — ⏳ owed to Daniel
**As** the product owner, **I want** to read a real drill's impact comparison and answer D11, **so that** we know
whether it could be misread as a causal claim about customers.
**Acceptance:** the walkthrough below, run on goldenfrijoles.com. The answer (keep, reword, or hide) is written into
`scenarios-pm-operable`'s decisions as D11's resolution. If "reword", the copy change is a follow-up idea, not this
epic.
**Risk:** low (a judgment, owed to the product owner by name)

## Sprint QA
- **api spec(s):** S2.1 → CLI route spec (three states); S2.2 → connector spec.
- **browser smoke owed:** yes, S2.3, to the product owner.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

0. Sprint 1's walkthrough steps 2–3 done (the experiment exists and `impact-check` is bound to it).
1. With the drill from Sprint 1's walkthrough, run `frijoles scenarios launch impact-check --project golden-frijoles`, send probes with `SCENARIO_PROBE_SECRET=… node scripts/scenario-drill.mjs --count 10` (the request cap is 10), then `frijoles scenarios stop <run-id> --project golden-frijoles`.
   → the stop answers ok and says `impact: captured`.
2. Run `frijoles scenarios impact <run-id> --project golden-frijoles`.
   → a table: control vs treatment, the experiment key@version, when it was captured.
3. Ask the golden-frijoles connector to list scenarios.
   → that run says `impact: captured`.
4. Signed in, open https://goldenfrijoles.com/app/scenarios/golden-frijoles and the drill's evidence.
   → the same comparison, rendered.
5. Read it as a stranger would. Could it be read as "this drill changed what customers did"? Answer keep, reword or
   hide.
   → your answer, written into `scenarios-pm-operable` D11.

Steps 4–5 are owed to the product owner by name (signed in, and a judgment). Steps 1–2 need the CLI release on npm.

If any step fails, note the step number + what you saw — that's the bug report.

### Run 2026-10-16 (the architect, production)
- Steps 0–2 and 4–5 need the experiment (Sprint 1 step 2) and CLI 1.10.0 on npm — **both owed to the product owner**.
- What could be checked live: `frijoles scenarios impact 062daf1b-6475-4be5-8fde-c4712c6a553e --project golden-frijoles`
  (CLI 1.10.0 from `main`) → `not bound to an experiment`; `--json` → `{ "impact": { "state": "unbound" } }`; an unknown
  run → `No such run in this project.` (exit 3). ✅
- Step 3 (the connector's `impact` per run): pinned by `mcp-scenario-tools.test.ts`; not asked through a live connector
  this run — owed with the walkthrough.
