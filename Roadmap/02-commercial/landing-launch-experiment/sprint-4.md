---
epic: landing-launch-experiment
sprint: 4
title: "Plans + Stripe"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S4.1
    title: "Workspace plans"
    as_a: "the product owner"
    i_want: "each workspace to carry a plan (free, growth, comped) that sets its limits"
    so_that: "pricing is per workspace and my own workspace is comped, not an admin bypass"
    risk: high
    status: planned
  - id: S4.2
    title: "One event pool per workspace"
    as_a: "the product owner"
    i_want: "the event quota counted per workspace"
    so_that: "making more products never multiplies the quota"
    risk: high
    status: planned
  - id: S4.3
    title: "Checkout, webhook and portal"
    as_a: "a founder on the free tier"
    i_want: "to buy Growth in one step and cancel on my own"
    so_that: "paying is as easy as starting"
    risk: high
    status: planned
  - id: S4.4
    title: "Pricing copy on A and B"
    as_a: "a visitor reading pricing"
    i_want: "the price to be one I can actually pay"
    so_that: "the page stops saying billing is not live"
    risk: low
    status: planned
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 4: Plans + Stripe

**Status:** ⬜ not started

## Stories

### Story 4.1 — Workspace plans
**As** the product owner, **I want** each workspace to carry a plan (free, growth, comped) that sets its limits, **so that** pricing is per workspace and my own workspace is comped, not an admin bypass.
**Acceptance:**
- Migration: `workspaces.plan` (`free | growth | comped`, default `free`) mapping to `product_limit` and the event pool.
- Daniel's workspace set to `comped`. Nothing reads a plan across workspaces (tenancy invariant).
- Applied with `supabase db push` before the merge that reads it.
**Risk:** high (migration, tenancy)

### Story 4.2 — One event pool per workspace
**As** the product owner, **I want** the event quota counted per workspace, **so that** making more products never multiplies the quota.
**Acceptance:**
- Quota read per workspace; expand/contract so no existing project's ceiling drops.
- Over the pool → an email to the owner, never a charge.
**Risk:** high (tenancy, shared infra)

### Story 4.3 — Checkout, webhook and portal
**As a** founder on the free tier, **I want** to buy Growth in one step and cancel on my own, **so that** paying is as easy as starting.
**Acceptance:**
- Stripe via the Vercel Marketplace integration; Checkout for one monthly price.
- Signed webhook, idempotent on the event id, sets the plan on the ONE workspace from server-side session metadata, never the request body.
- Cancel in the portal returns the workspace to free at period end.
- Behind the kill switch `billing.checkout_enabled` (a `GATES` row, on). Local testing with `stripe listen`.
**Risk:** high (money)

### Story 4.4 — Pricing copy on A and B
**As a** visitor reading pricing, **I want** the price to be one I can actually pay, **so that** the page stops saying billing is not live.
**Acceptance:**
- "No billing rail yet" removed only once S4.3 is live in production; Growth CTA goes to Checkout on both variants.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Locked at the wave-3 boundary (README D15): one focused question to the product owner first (Stripe account and
entity, test vs live, the price), then the plan → limits map, the pool's expand/contract and the webhook's idempotency
store are locked against that day's data and written here. Never delegated (money, migration, tenancy).

**Inherited from Sprint 3 (README D22):** B's (and A's) pricing says Growth has unlimited products and seats and a longer
history. S4.1's plan → limits map must make that true (Growth lifts `product_limit`; Free gets a history window Growth
exceeds), or S4.4 rewrites the copy before Checkout goes live.

## Sprint QA
- webhook signature + idempotency spec, plan → limits spec, tenancy spec (no cross-workspace plan read)
- browser smoke owed: yes, to Daniel by name — a real Growth purchase and cancel
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 4 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

1. (money — owed to Daniel) Signed in to a test workspace, https://goldenfrijoles.com/#pricing → Get Growth
   → Stripe Checkout opens for $49/month
2. Pay with a Stripe test card in test mode
   → back on the app; the workspace shows Growth; products limit lifted
3. Settings → Billing → Manage
   → the Stripe portal opens; cancel
4. At period end (test clock)
   → the workspace is back on Free
5. Daniel's own workspace
   → shows Comped; no checkout prompt

If any step fails, note the step number + what you saw — that's the bug report.
