---
epic: result-record
sprint: 3
title: "The agent fetches the number"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S3.1
    title: "The engine answers an agent: an input's readings, an experiment's decision"
    as_a: "a founder's agent"
    i_want: "to read a North Star input's readings and an experiment's decision record for my project"
    so_that: "I can bring the evidence instead of asking for it"
    risk: high
    status: planned
  - id: S3.2
    title: "gf reads them, and so does the connector"
    as_a: "a founder's agent"
    i_want: "gf commands and connector tools for those two reads"
    so_that: "any agent, in the terminal or the Claude app, can fetch the number"
    risk: low
    status: planned
  - id: S3.3
    title: "epic-read fetches the number itself"
    as_a: "a founder"
    i_want: "the read to arrive with the actual and its evidence already filled in"
    so_that: "all I do is approve"
    risk: low
    status: planned
---
# The result record — Sprint 3: The agent fetches the number

**Status:** 🏗 In progress

Amendment (Daniel, 2026-10-07): fetching the number is the value proposition; the CLI is the agent's surface. Lock
D14–D20 in the [epic README](README.md#amendment--sprint-3-the-agent-fetches-the-number-daniel-2026-10-07).

## Stories
<!-- Keep the heading shape `### Story 3.M — <title>`. When a story ships, append ✅ + its commit ref. -->

### Story 3.1 — The engine answers an agent: an input's readings, an experiment's decision
**As** a founder's agent, **I want** to read a North Star input's readings and an experiment's decision record for my
project, **so that** I can bring the evidence instead of asking for it.
`GET /api/v1/cli/north-star/readings` and `GET /api/v1/cli/experiments/decision`, member-gated through
`requireCliMember`, reading through the existing query libs (D14, D15).
**Acceptance:**
- A member gets their project's readings (with `latest` on or before `to`) and an experiment's decision records.
- A non-member gets 404; an unknown input or experiment is `not_found`.
**Risk:** high (a new request-path read; single project, membership-gated)

### Story 3.2 — gf reads them, and so does the connector
**As** a founder's agent, **I want** gf commands and connector tools for those two reads, **so that** any agent, in the
terminal or the Claude app, can fetch the number.
`gf north-star readings <input>`, `gf experiments decision <key>` (D16); connector tools `get_input_readings`,
`get_experiment_decision` (D18).
**Acceptance:**
- Both commands print a table, or the body under `--json`; errors carry the route's code and exit code.
- Both tools return the same body as the routes, scoped to the token's project.
**Risk:** low

### Story 3.3 — epic-read fetches the number itself
**As** a founder, **I want** the read to arrive with the actual and its evidence already filled in, **so that** all I
do is approve.
`epic-read` runs `gf north-star readings` (and `gf experiments decision` with `--experiment`), takes the latest reading
since shipping, and drafts with `north-star:<input>@<day>` as the evidence (D17). The owner's flags still win; any
failure falls back to asking.
**Acceptance:**
- With `gf` signed in, `epic-read --epic <slug>` drafts with a fetched actual and pointer; `--write` approves it.
- A reading from before shipping is not used; without `gf`, it says why and asks, as before.
**Risk:** low

## Sprint QA
- **api spec(s):** S3.1 → a CLI-route spec (member, non-member 404, not_found, `to`); S3.2 → CLI command specs, the
  connector spec; S3.3 → `epic-read.test.mjs` with an injected spawn.
- **browser smoke owed:** no; the walkthrough is in the terminal.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green. Risk high on S3.1: the security
  lens runs.

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. `gf login` (once per machine), then `gf projects use <your-project>`
   → `gf whoami` names you and the project.
2. `gf north-star readings <an input key> --json`
   → the input and its readings, with `latest`.
3. On an epic whose target names that input and whose read is due: `node scripts/epic-read.mjs --epic <slug>`
   → "actual: <n> (fetched: north-star:<input>@<day>)" and a drafted verdict; nothing written.
4. Approve with `--write`, then push the roadmap
   → the README carries the verdict and its fetched evidence; the bean shows on the board.

If any step fails, note the step number + what you saw — that's the bug report.
