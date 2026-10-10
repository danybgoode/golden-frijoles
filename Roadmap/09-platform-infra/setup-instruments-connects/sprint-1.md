---
epic: setup-instruments-connects
sprint: 1
title: "Connect and see it land"
risk: high
phase: Shipped
stories_total: 3
stories:
  - id: S1.1
    title: "frijoles init --ingest"
    as_a: "a founder connecting at setup"
    i_want: "one command that writes the keys my app and the plugin need"
    so_that: "connecting is one step and no key is ever in my code"
    risk: high
    status: done
  - id: S1.2
    title: "The first-event read and frijoles status"
    as_a: "an agent finishing setup"
    i_want: "to ask whether the project has received its first event"
    so_that: "I can tell the founder it worked"
    risk: high
    status: done
  - id: S1.3
    title: "Today's first-event band behind its kill switch"
    as_a: "a founder opening the console after setup"
    i_want: "to see my first event arrive"
    so_that: "I know the measuring works"
    risk: high
    status: done
---
# Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen — Sprint 1: Connect and see it land

**Status:** ✅ shipped 2026-10-10 (#338, merge `37bb5e0`; CLI 1.1.0, plugin + kit 1.3.0)

## Stories

### Story 1.1 — frijoles init --ingest ✅ `0a2aeae`
**As** a founder connecting at setup, **I want** one command that writes the keys my app and the plugin need, **so that** connecting is one step and no key is ever in my code.
**Acceptance:** `frijoles init --ingest` mints an ingest key and writes `GROWTH_ENGINE_API_KEY` and `GROWTH_ENGINE_URL` into the ignored `.env.local` (refusing before minting, as today, when the file is not ignored or not writable); a re-run keeps the key and says so; it prints names, never values.
**Risk:** high

### Story 1.2 — The first-event read and frijoles status ✅ `ea3c0dd`
**As** an agent finishing setup, **I want** to ask whether the project has received its first event, **so that** I can tell the founder it worked.
**Acceptance:** `getProductEventMarks` returns one project's earliest and latest non-reserved event; `GET /api/v1/cli/status` (members only, gated) returns them; `frijoles status` prints waiting or the first and latest event with their times; `--json` for agents.
**Risk:** high

### Story 1.3 — Today's first-event band behind its kill switch ✅ `977f744`
**As** a founder opening the console after setup, **I want** to see my first event arrive, **so that** I know the measuring works.
**Acceptance:** with the gate on, Today shows "Waiting for your first event" (key names, a link to Connect's snippet) until the project has a product event, then "Your first event arrived" for 7 days; nothing after; with the gate off, nothing; the flag exists in every environment with the hypothesis as its description.
**Risk:** high

## Sprint QA
- **unit:** CLI `init` tests (ingest minted once, names only, refusal before minting), `status` command tests; the route's member check and gate (api spec); `getProductEventMarks` (reserved events excluded, one project); the band's states
- **api spec:** `e2e/cli-status.spec.ts` (member 200, non-member 404, gate off 404, waiting → first event after a `track`)
- **browser smoke owed:** the signed-in Today band on production (Daniel's walkthrough)
- **deterministic gate:** typecheck + build + Playwright `api` and `authed` + the Skills CI replay

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com, a scratch project you own.

1. In a scratch app folder with `.env.local` ignored, run `npx -y @golden-frijoles/cli@1.1.0 init --ingest`
   → it names `GROWTH_ENGINE_API_KEY` and `GROWTH_ENGINE_URL` as written; running it again says the key was kept.
2. Run `npx -y @golden-frijoles/cli@1.1.0 status`
   → "Waiting for the first event".
3. Open https://goldenfrijoles.com/app on that project
   → the First event band: "Waiting for your first event", with the key names and a link to Connect.
4. Send one event (`node --env-file=.env.local -e "…createGrowthEngineClient({apiKey: process.env.GROWTH_ENGINE_API_KEY}).track('hello', …)"`), then run `status` and refresh Today
   → "First event: hello, just now"; the band says it arrived.

If any step fails, note the step number + what you saw — that's the bug report.
