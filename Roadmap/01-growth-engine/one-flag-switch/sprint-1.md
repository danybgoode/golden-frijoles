---
epic: one-flag-switch
sprint: 1
title: "One switch"
risk: high
phase: In review
stories_total: 3
stories:
  - id: S1.1
    title: "One rule for on and off"
    as_a: "a founder"
    i_want: "every screen to say On only when the feature is actually on"
    so_that: "what I read is what my customers get"
    risk: high
    status: done
  - id: S1.2
    title: "The page switch writes what the CLI writes"
    as_a: "a founder"
    i_want: "the page switch to make the same change as frijoles flags set/kill"
    so_that: "a change from my agent or from me lands the same way"
    risk: high
    status: done
  - id: S1.3
    title: "The CLI says on or off by the same rule, and a test keeps them together"
    as_a: "an agent"
    i_want: "frijoles flags ls/get to say on or off exactly as the page does"
    so_that: "the page and the CLI can never disagree again"
    risk: high
    status: done
---
# One flag switch: on or off, the same in the CLI, the SDK, MCP and the page — Sprint 1: One switch

**Status:** 🟡 built, in review

## Stories

### Story 1.1 — One rule for on and off ✅ `5ed6f2c`
**As a** founder, **I want** every screen to say On only when the feature is actually on, **so that** what I read is what my customers get.
**Acceptance:** one pure rule (`lib/flag-switch-state.ts`): a boolean flag is **On** in an environment when the version
it serves gives `true` by default or through a rule, otherwise **Off** (including never set, or taken out). The list and
the feature page use it; "never", "dormant" and "activated" leave the screens. A non-boolean flag shows the value it
serves, with no switch.
**Risk:** high · **Builder:** orchestrator

### Story 1.2 — The page switch writes what the CLI writes ✅ `174765f`
**As a** founder, **I want** the page switch to make the same change as `frijoles flags set` / `kill`, **so that** a change from my agent or from me lands the same way.
**Acceptance:** the switch (list row and feature page) calls one server action that runs `executeCliFlagWrite` — on =
`set` to the true variant, off = `kill` — owner-only, with the same confirm on off. The page has no deactivate control.
**Risk:** high · **Builder:** orchestrator

### Story 1.3 — The CLI says on or off by the same rule, and a test keeps them together ✅ `26cd3e1`
**As an** agent, **I want** `frijoles flags ls` / `get` to say on or off exactly as the page does, **so that** the page and the CLI can never disagree again.
**Acceptance:** the CLI's flag view carries the same on/off from S1.1's rule. A parity spec: CLI `kill` → the page's
view says Off; the page action off → the CLI view says off and serves `false`; on → on and `true`.
**Risk:** high · **Builder:** orchestrator

## Sprint QA
- **api spec(s):** <which testable story → which `e2e/*.spec.ts`>
- **browser smoke owed:** <no · or: yes, to the product owner — name the money/auth step>
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://<your-domain>   (or the preview URL while testing pre-merge)

1. Go to https://<your-domain>/<page-or-path>
   → <observable expected result>
2. In <the relevant authed area>, go to https://<your-domain>/<authed-path>
   → <observable expected result>
3. (money path — owed to <product owner> by name) <the money-path steps for your project> using a
   test-mode payment credential.
   → <observable expected result>

<!-- Delete whichever pre-filled steps don't apply to this sprint; add more using the same shape
     (real clickable URL + one observable result). Flag any money/auth/checkout step by name —
     those are owed to your project's product owner (an automated browser smoke can't fully cover
     them). -->

If any step fails, note the step number + what you saw — that's the bug report.
