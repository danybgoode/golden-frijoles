---
epic: landing-launch-experiment
sprint: 4
title: "Plans + Stripe"
risk: high
phase: Building
stories_total: 4
stories:
  - id: S4.1
    title: "Workspace plans"
    as_a: "the product owner"
    i_want: "each workspace to carry a plan (free, growth, comped) that sets its limits"
    so_that: "pricing is per workspace and my own workspace is comped, not an admin bypass"
    risk: high
    status: done   # edfac38 · migration 20261022100000
  - id: S4.2
    title: "One event pool per workspace"
    as_a: "the product owner"
    i_want: "the event quota counted per workspace"
    so_that: "making more products never multiplies the quota"
    risk: high
    status: done   # ea2ae4f, 06b06b7, 0283529 · migration 20261022110000
  - id: S4.3
    title: "Checkout, webhook and portal"
    as_a: "a founder on the free tier"
    i_want: "to buy Growth in one step and cancel on my own"
    so_that: "paying is as easy as starting"
    risk: high
    status: done   # 8ad84a8 · sandbox lifecycle verified 2026-10-19; live keys owed
  - id: S4.4
    title: "Pricing copy on A and B"
    as_a: "a visitor reading pricing"
    i_want: "the price to be one I can actually pay"
    so_that: "the page stops saying billing is not live"
    risk: low
    status: planned
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 4: Plans + Stripe

**Status:** 🟦 In review — S4.1–S4.3 built; S4.4 waits for a real purchase in production

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
Locked 2026-10-19 — README **§ Wave 3 lock, D23–D28**. Live at $49/month (Daniel); Stripe installed by Daniel via the
Vercel Marketplace; no email at the pool. S4.1 → D23; S4.2 → D24; S4.3 → D25, D26, D27; S4.4 → D28 (and D22's debt).
Never delegated (money, migration, tenancy).

**Inherited from Sprint 3 (README D22):** B's (and A's) pricing says Growth has unlimited products and seats and a longer
history. S4.1's plan → limits map must make that true (Growth lifts `product_limit`; Free gets a history window Growth
exceeds), or S4.4 rewrites the copy before Checkout goes live.

**Deviation (2026-10-19):** `billing.checkout_enabled` is born **OFF**, not ON as planned. The Marketplace install
provisioned a Stripe **sandbox** (test keys in every environment, Production included), so an ON gate would sell Growth for
a test card. It is switched on — and from then on serves as the kill switch — only after live keys are verified in production.
The webhook is not gated: subscriptions must keep reaching their workspace whatever the switch says.

**Owed before `billing.checkout_enabled` goes ON (verifier, #412; Stripe's production guidance):**
- `charge.dispute.created`, `charge.refunded`, `radar.early_fraud_warning.created`: today recorded only; decide and build what
  each does (at least: tell the owner and the operator) before real money flows.
- `invoice.payment_failed`: Stripe's dunning moves the subscription to `past_due`/`unpaid` (handled), but the owner is not told.
- Stripe Tax: Daniel decides whether to register/collect before the first live charge (an accountant question, seed).
- A restricted API key (`rk_`) in place of the Marketplace's `sk_` for the app's server calls.
- A way to REACH the portal (verifier r3): nothing in the app posts to `/api/v1/billing/portal` yet, and D27 makes it the only
  cancel path. A "Manage billing" form for the workspace owner ships with S4.4, before the switch.

**Run log — 2026-10-19 (agent, Stripe sandbox, local production build):** `scripts/stripe-ensure-growth-price.mjs` created
`Golden Frijoles Growth` at $49.00 USD/month (`gf_growth_monthly`); a re-run created nothing. Through the local server with
`stripe listen` forwarding genuinely signed events: a signed-in owner's `GET /api/v1/billing/checkout` → 303
`checkout.stripe.com`, a real `cus_` recorded on the workspace; `/api/v1/billing/portal` → 303 `billing.stripe.com`; a paid
sandbox subscription → `customer.subscription.created/updated` → **growth** (subscription id matched); cancel at period end →
still growth; deleted → **free**. Every forwarded event answered 200 and was recorded once in `billing_events`.

**Run log — 2026-10-20 (agent, same sandbox set-up, after the review fixes; every call a POST):** checkout → 303
`checkout.stripe.com`, a real `cus_` recorded; portal → 303 `billing.stripe.com`; **two checkouts at once → 303 + 409** (the
claim); a paid sandbox subscription → growth (subscription matched); then, with the row forced back to Free while Stripe
held the subscription (a late webhook), **checkout → 303 `/app?billing=already`**, no session; cancel at period end → still
growth; deleted → free. `billing_events` held created, updated and deleted.

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
