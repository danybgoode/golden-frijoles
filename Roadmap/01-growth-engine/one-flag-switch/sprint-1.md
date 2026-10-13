---
epic: one-flag-switch
sprint: 1
title: "One switch"
risk: high
phase: In review
stories_total: 5
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
  - id: S1.4
    title: "On says who it reaches"
    as_a: "a founder"
    i_want: "an On flag to say who gets it — everyone, a percentage, or a named segment"
    so_that: "On for some is never mistaken for On for all"
    risk: low
    status: done
  - id: S1.5
    title: "A synced flag starts at its default"
    as_a: "a founder whose flags live in their app's code"
    i_want: "a new flag pushed by frijoles flags sync to start switched to its default"
    so_that: "the page never says Off while my app runs on its own built-in value"
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

### Story 1.4 — On says who it reaches
**As a** founder, **I want** an On flag to say who gets it, **so that** On for some is never mistaken for On for all.
**Acceptance:** beside every On (list, feature page, `frijoles flags ls/get`): `everyone`, `25% of people`, or the
segment's name — and until named segments exist, the placeholder `a segment (not named yet)` (the product owner,
2026-10-13). Same rule walk as the switch, so the words never disagree with it. CLI 1.5.1.
**Risk:** low · **Builder:** orchestrator

### Story 1.5 — A synced flag starts at its default
**As a** founder whose flags live in their app's code, **I want** a new flag pushed by `frijoles flags sync` to start switched to its default, **so that** the page never says Off while my app runs on its own built-in value.
**Acceptance:** after a sync creates a NEW flag, each environment where it was never switched is set to that version
(the default from the source file), through `set_flag_activation`, the sync key's owner as actor, the source named in
the reason. An existing flag's switch is never changed by a sync. The product owner, 2026-10-13: "yes". Migration
`20261013200000_flag_sync_new_flag_switch.sql` (additive: same signature). CLI 1.5.2, plugin + kit 1.7.3.
**Risk:** high (a migration; changes what a freshly synced flag serves) · **Builder:** orchestrator

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
