---
epic: scenarios-light-up
sprint: 2
title: "Our site, the drill, the switches"
risk: high
phase: Building
stories_total: 4
stories:
  - id: S2.1
    title: "The connector's scenarios tool and the agent docs"
    as_a: "an agent in claude.ai or a fresh repo"
    i_want: "to see drills through the connector and find the commands in the plugin"
    so_that: "I know drills exist and how to run one"
    risk: low
    status: done
  - id: S2.2
    title: "goldenfrijoles.com as a target, the probe and the drill script"
    as_a: "the product owner"
    i_want: "our own site to be a drill target with a probe nobody else can reach"
    so_that: "the first drill runs on us, not on a customer"
    risk: high
    status: done
  - id: S2.3
    title: "The production drill, by an agent; the switches on"
    as_a: "the product owner"
    i_want: "an agent to run and stop one drill in production, and me to stop one from the page"
    so_that: "drills are switched on only once they are proven"
    risk: high
    status: planned
  - id: S2.4
    title: "Close scenarios-pm-operable; poster"
    as_a: "the product owner"
    i_want: "the old epic closed and the poster to say drills are live"
    so_that: "the roadmap tells the truth"
    risk: low
    status: planned
---
# Scenarios, switched on — Sprint 2: Our site, the drill, the switches

**Status:** 🟡 S2.1–S2.2 built, in review; S2.3–S2.4 after the merge, in production

## Stories

### Story 2.1 — The connector's scenarios tool and the agent docs ✅ `0f9c389 + dd86ee5`
**As an** agent in claude.ai or a fresh repo, **I want** to see drills through the connector and find the commands in the plugin, **so that** I know drills exist and how to run one.
**Acceptance:** a read-only connector tool lists targets, definitions and runs with state and stop reason, member
scoped like the flag tools (parity test); the public connector scrubs person ids. The plugin's agent docs name the
`frijoles scenarios` commands and the SDK handler (kit/plugin minor).
**Risk:** low · **Builder:** Sonnet

### Story 2.2 — goldenfrijoles.com as a target, the probe and the drill script ✅ `685c589`
**As the** product owner, **I want** our own site to be a drill target with a probe nobody else can reach, **so that** the first drill runs on us, not on a customer.
**Acceptance:** `/api/internal/resilience/ownership` on our app is the SDK handler with the token from env.
`/api/internal/resilience/probe` answers only a request signed with `SCENARIO_PROBE_SECRET` for a `synthetic:`
subject; it resolves the scenario, reserves, applies only a capped `delay` or `none`, settles and records the
execution; otherwise 404. `scripts/scenario-drill.mjs --count N` sends signed probes and prints each result. Specs:
unsigned, not synthetic, switches off → 404.
**Risk:** high (a production fault path) · **Builder:** orchestrator

### Story 2.3 — The production drill, by an agent; the switches on
**As the** product owner, **I want** an agent to run and stop one drill in production, and me to stop one from the page, **so that** drills are switched on only once they are proven.
**Acceptance:** with authoring and resilience on: the agent, using only `frijoles` and the drill script, registers and
verifies goldenfrijoles.com, makes a `delay` fault flag, defines the drill, launches it, sees probes take the delay,
stops it, and the run is terminal with its stop reason and no breaker trip; the transcript is in the PR. The product
owner launches and stops a second run from the page and judges the impact comparison (D11). Then security on.
`frijoles flags get` shows the three `true` in production; breakers off.
**Risk:** high · **Builder:** orchestrator + the product owner

### Story 2.4 — Close `scenarios-pm-operable`; poster
**As the** product owner, **I want** the old epic closed and the poster to say drills are live, **so that** the roadmap tells the truth.
**Acceptance:** `scenarios-pm-operable` README `status: shipped`, its retro gaps answered with this epic's evidence,
`epic-dod` passes; the poster's scenarios entries say live; the landing's ops claims match what is on.
**Risk:** low · **Builder:** Sonnet

## Sprint QA
- **api spec(s):** `e2e/scenario-probe.spec.ts` (S2.2), the connector parity test (S2.1).
- **browser smoke owed:** yes, to the product owner — the page launch/stop and the impact read (S2.3).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `npx -y @golden-frijoles/cli flags get ops.scenario_authoring_enabled --project golden-frijoles`
   → production serves `true` (and the same for `ops.resilience_scenarios_enabled`).
2. Go to https://goldenfrijoles.com/app/scenarios/golden-frijoles
   → goldenfrijoles.com is a verified target; the agent's drill is in run history as stopped, with its reason.
3. Open the `delay` drill and press Launch, then confirm
   → The run shows as running, with its caps and the thresholds that would abort it.
4. Ask the agent to run `node scripts/scenario-drill.mjs --count 5`
   → It prints five probes; the ones in the fault arm took the delay.
5. Press Stop on that run and confirm
   → The run ends, terminal, with your stop reason; no breaker trip appears.
6. Open the run's impact comparison
   → Decide: could this be read as proof that something caused a customer result? Say yes or no — that is the D11
     judgment.
7. Visit https://goldenfrijoles.com/api/internal/resilience/probe in a browser
   → 404.

If any step fails, note the step number + what you saw — that's the bug report.
