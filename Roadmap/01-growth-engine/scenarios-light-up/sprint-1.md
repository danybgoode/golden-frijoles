---
epic: scenarios-light-up
sprint: 1
title: "Anyone can make an app a target, from the terminal or the page"
risk: high
phase: In review
stories_total: 5
stories:
  - id: S1.1
    title: "Owner target setup in the engine"
    as_a: "a founder (or their agent)"
    i_want: "to register my app's origin and verify it without a special key"
    so_that: "my app can take a drill"
    risk: high
    status: done
  - id: S1.2
    title: "The SDK's ownership handler"
    as_a: "an agent adding drills to an app"
    i_want: "one SDK call that answers the ownership check"
    so_that: "I never hand-roll a proof"
    risk: high
    status: done
  - id: S1.3
    title: "The CLI route over the owner service"
    as_a: "an agent"
    i_want: "an authenticated API for targets, definitions, runs and stops"
    so_that: "the CLI can do everything the page does"
    risk: high
    status: done
  - id: S1.4
    title: "frijoles scenarios commands"
    as_a: "an agent in a terminal"
    i_want: "frijoles scenarios commands with --json"
    so_that: "I can run a whole drill without a browser"
    risk: low
    status: done
  - id: S1.5
    title: "Target setup on the page"
    as_a: "a founder"
    i_want: "to register and verify a target on the scenarios page"
    so_that: "I am not stuck at waiting on target verification"
    risk: low
    status: done
---
# Scenarios, switched on — Sprint 1: Anyone can make an app a target

**Status:** 🟡 built, in review (#PR)

## Stories

### Story 1.1 — Owner target setup in the engine ✅ `9862079`
**As a** founder (or their agent), **I want** to register my app's origin and verify it without a special key, **so that** my app can take a drill.
**Acceptance:** an additive migration adds the `origin_token_v1` kind and `owner_register_scenario_target` /
`owner_verify_scenario_target` (service-role only; grant-denial spec). Registering returns a token once and stores
only its hash; verifying fetches the token from `<origin>/api/internal/resilience/ownership` through the guarded fetch,
and a match marks the target verified, audited with the owner as actor. Wrong token, unreachable origin or a
non-owner: no change, a plain reason (non-owner = not found). Miyagi's route and kind unchanged (its specs stay green).
**Risk:** high (migration, auth) · **Builder:** orchestrator

### Story 1.2 — The SDK's ownership handler ✅ `eafcd80`
**As an** agent adding drills to an app, **I want** one SDK call that answers the ownership check, **so that** I never hand-roll a proof.
**Acceptance:** `createScenarioOwnershipHandler({ token })` returns `(request: Request) => Promise<Response | null>`:
the ownership path gets the token in the agreed shape, every other path `null` (not handled). Unit tests; README
section "Make your app a drill target" with a Next.js route example. SDK 1.1.0, packed-tarball check.
**Risk:** high (a contract strangers depend on) · **Builder:** orchestrator

### Story 1.3 — The CLI route over the owner service ✅ `aa405ca`
**As an** agent, **I want** an authenticated API for targets, definitions, runs and stops, **so that** the CLI can do everything the page does.
**Acceptance:** `GET /api/v1/cli/scenarios?project=` (member) lists targets, definitions, compatible fault flags and
runs; `POST` (owner) takes `register_target · verify_target · revoke_target · define · launch · stop`. One owner service
in `lib/` is called by this route and by the page's server actions. Writes 404 while authoring is off; a launch 404s
while its kind's switch is off. API specs: owner writes, member 403 on writes, a stranger "not found", gates off.
**Risk:** high (auth, tenancy) · **Builder:** orchestrator

### Story 1.4 — `frijoles scenarios` commands ✅ `1dc94d2`
**As an** agent in a terminal, **I want** `frijoles scenarios` commands with `--json`, **so that** I can run a whole drill without a browser.
**Acceptance:** `frijoles scenarios ls`, `targets add <key> --origin <url>` (prints the token once, with the next
step), `targets verify <key>`, `targets revoke <key>`, `define <key> --flag <flag>@<version> --target <key> …`,
`launch <scenario>`, `stop <run>`, `runs [--watch]`; each with `--json` and a help line naming the next command. Golden
tests. CLI 1.4.0.
**Risk:** low (a client of S1.3) · **Builder:** Sonnet

### Story 1.5 — Target setup on the page ✅ `c146c7f`
**As a** founder, **I want** to register and verify a target on the scenarios page, **so that** I am not stuck at "waiting on target verification".
**Acceptance:** the page's target section offers Register (origin + key) → the token shown once with the CLI and SDK
snippet → Verify; a failed verify says why. Owner only, behind the authoring switch. The authed spec covers it.
**Risk:** low (UI over S1.3's actions) · **Builder:** Sonnet

## Sprint QA
- **api spec(s):** `e2e/scenario-owner-targets.spec.ts` (S1.1/S1.3: register, verify against a local origin, wrong
  token, non-owner, grants), `e2e/cli-scenarios.spec.ts` (S1.3), CLI golden tests (S1.4), SDK unit tests (S1.2).
- **browser smoke owed:** yes, to the product owner — the target section signed in (S1.5).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com (after the merge and the switches in sprint 2)

1. In a terminal, run `frijoles scenarios ls --project golden-frijoles`
   → It lists targets, definitions and runs (the golden-frijoles target from sprint 2 among them).
2. Go to https://goldenfrijoles.com/app/scenarios/golden-frijoles (signed in, owner)
   → The target section shows goldenfrijoles.com as **verified**, and a Register control.
3. Register a target with origin `https://example.com` and key `walkthrough.check`
   → The token is shown once, with the snippet to add to an app.
4. Press Verify
   → It fails and says the origin did not return the token (example.com doesn't serve it). Nothing is verified.
5. Revoke `walkthrough.check`
   → It shows as revoked.

If any step fails, note the step number + what you saw — that's the bug report.
