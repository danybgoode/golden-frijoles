---
epic: drill-impact-for-agents
sprint: 2
title: "Read and judge"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Agents read a run's impact"
    as_a: "a founder's agent"
    i_want: "frijoles scenarios impact <run-id> [--json]"
    so_that: "I can report what a drill did without opening the page"
    risk: low
    status: planned
  - id: S2.2
    title: "The connector says which runs have impact"
    as_a: "a founder's agent in a chat"
    i_want: "list_scenarios to name each run's impact state"
    so_that: "I know which run to ask about"
    risk: low
    status: planned
  - id: S2.3
    title: "The product owner judges the comparison on a real drill"
    as_a: "the product owner"
    i_want: "to read a real drill's impact comparison and answer D11"
    so_that: "we know whether it could be misread as a causal claim about customers"
    risk: low
    status: planned
---
# Drill impact for agents — Sprint 2: Read and judge

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S2.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 2.1 — Agents read a run's impact
**As** a founder's agent, **I want** `frijoles scenarios impact <run-id> [--json]`, **so that** I can report what a
drill did without opening the page.
**Acceptance:** a member-gated CLI read (PAT) prints the comparison as a table (control vs treatment, the experiment
key@version, captured at), or exactly one of "not bound to an experiment" and "not captured yet (<reason>)". `--json`
returns the same fields. A CLI release, its npm publish owed to the product owner.
**Risk:** low

### Story 2.2 — The connector says which runs have impact
**As** a founder's agent in a chat, **I want** `list_scenarios` to name each run's impact state, **so that** I know
which run to ask about.
**Acceptance:** `lib/mcp-scenario-tools.ts` adds `impact: captured | not_captured | unbound` per run. On the public
project, `lib/public-connector-scrub.ts` still holds (no person's id). A spec pins the field.
**Risk:** low

### Story 2.3 — The product owner judges the comparison on a real drill
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

1. With the drill from Sprint 1's walkthrough, run `frijoles scenarios launch impact-check --project golden-frijoles`, wait a minute, then `frijoles scenarios stop <run-id> --project golden-frijoles`.
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
