---
epic: one-product-project
sprint: 2
title: "One gate reader"
risk: high
phase: Verifying
stories_total: 3
stories:
  - id: S2.1
    title: "lib/gates.ts reads every gate from the catalog"
    as_a: "the product owner"
    i_want: "one seam that serves every gate from golden-frijoles' flags"
    so_that: "a gate is switched in the product, not in Vercel"
    risk: high
    status: done
  - id: S2.2
    title: "Every gate call goes through the seam"
    as_a: "a builder"
    i_want: "every isXEnabled() to await the seam"
    so_that: "no gate reads process.env on Vercel"
    risk: high
    status: done
  - id: S2.3
    title: "Guard: no env-var gates outside the seam"
    as_a: "a builder"
    i_want: "CI to fail on a new process.env.*_ENABLED read"
    so_that: "the next epic cannot reach for an env var"
    risk: low
    status: done
---
# One product project, and every flag in it — Sprint 2: One gate reader

**Status:** 🟡 built and reviewed; merge + prod step owed to Daniel (README → Cutover runbook)

## Stories

### Story 2.1 — `lib/gates.ts` reads every gate from the catalog
**As** the product owner, **I want** one seam that serves every gate from `golden-frijoles`' flags, **so that** a gate
is switched in the product, not in Vercel.
**Acceptance:**
- `lib/gates-decision.ts` (pure) holds the gate table: key · retired env var · fallback (epic README).
- `lib/gates.ts` reads the registry once per 30 s per process (one query, all keys) for the env `VERCEL_ENV` maps to.
  `auth.terminal_sign_in_enabled` moves onto it.
- If the read fails, or a flag is never activated, it serves the gate's fallback. Previews (no DB) get the fallbacks.
- Off Vercel (`VERCEL !== '1'`), a set old env var overrides (D6). On Vercel, env is ignored.
- `FLAG_SERVING_ENABLED` and `CLI_WRITE_API_ENABLED` retire: the code is always on (D2).
- Pure specs: fallback on read failure, never-activated ⇒ fallback, an off-Vercel override, on-Vercel env ignored.
**Risk:** high

### Story 2.2 — Every gate call goes through the seam
**As** a builder, **I want** every `isXEnabled()` to await the seam, **so that** no gate reads `process.env` on Vercel.
**Acceptance:** the `lib/flags.ts` function names are kept and now async. Every caller awaits them. Sync registration
predicates (MCP tools, shell nav) take the resolved values. `tsc` + the ON/OFF e2e servers are green, unchanged.
**Risk:** high

### Story 2.3 — Guard: no env-var gates outside the seam
**As** a builder, **I want** CI to fail on a `process.env.*_ENABLED` read outside `lib/gates.ts`, **so that** the next
epic cannot reach for an env var.
**Acceptance:** a spec scans `apps/web/{app,lib,components}`. It is mutation-checked: adding a read turns it red.
**Risk:** low

## Sprint QA
- **api spec(s):** `lib/gates-decision.test.ts` (new), `lib/flags.test.ts` (updated), the env guard spec; the existing
  ON/OFF servers unchanged
- **browser smoke owed:** no (no UI change)
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Go to https://goldenfrijoles.com/signup
   → the signup page renders (the gate serves ON from the catalog)
2. Go to https://goldenfrijoles.com/install
   → the connector instructions render
3. (signed in, owed to Daniel) Open https://goldenfrijoles.com/app
   → the agent rail is on the right

If any step fails, note the step number + what you saw — that's the bug report.
