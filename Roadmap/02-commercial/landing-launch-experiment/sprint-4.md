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
    status: done   # PR #419, merge 2a6068a — shipped before the first real purchase, on Daniel's call
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 4: Plans + Stripe

**Status:** ✅ Shipped 2026-10-21 — S4.1–S4.3 #412 #414 #416, S4.4 #419, the money follow-ups #420; checkout ON in production (Daniel, 2026-10-20). Owed: the first real Growth purchase from a Free account (the walkthrough below); Stripe Tax (Daniel).

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
- Behind the switch `billing.checkout_enabled` (a `GATES` row, born OFF — see the deviation below; the portal is never
  gated). Local testing with `stripe listen`.
**Risk:** high (money)

### Story 4.4 — Pricing copy on A and B
**As a** visitor reading pricing, **I want** the price to be one I can actually pay, **so that** the page stops saying billing is not live.
**Acceptance:**
- "No billing rail yet" removed only once S4.3 is live in production; Growth CTA goes to Checkout on both variants.
- D28's signed-out path is the BUTTON's job (codex r4, #412): signed out, "Get Growth" links to `/signup`; signed in, it is
  the POST form to checkout. The route's own signed-out answer (303 `/login?next=/#pricing`) only catches a session that
  expired on the page — `/signup` takes no `next`, so it would lose the visitor's place.
**Risk:** low

**Deviation (Daniel, 2026-10-20): S4.4 ships before the first real purchase, not after.** Daniel switched
`billing.checkout_enabled` on (`on v2` in production) before buying, so the landing said "billing is not live" while
Checkout was open; the copy follows the switch rather than waiting. The first real purchase (sprint walkthrough) is
still owed and still the proof of the money path. Built: one `GrowthCta` (`components/landing/GrowthCta.tsx`) on A and B,
decided by `lib/billing-view.ts → growthCta` — signed in → POST form to checkout; signed out → "Get Growth" → `/signup`;
switch off → "Start free" with "Growth is paused"; sign-up off → the page's waitlist. D22's debt: B's "Longer history"
(never built) became "2,000,000 events a month (Free: 200,000)" and "Cancel any time from Plan & billing". A's markup
pin (D13) was edited by hand for exactly the tier's button and note.

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
- ~~`charge.dispute.created`, `charge.refunded`, `radar.early_fraud_warning.created`: today recorded only; decide and build what
  each does (at least: tell the owner and the operator) before real money flows.~~ ✅ 2026-10-20 (#420): the operator gets one
  Telegram line each (ids, amount, Stripe's code). **Decision: the owner is not told by us** — Stripe emails a refund
  receipt, and a dispute or fraud warning is the operator's to answer, not the buyer's.
- ~~`invoice.payment_failed`: Stripe's dunning moves the subscription to `past_due`/`unpaid` (handled), but the owner is not told.~~
  ✅ 2026-10-20 (#420): the operator is alerted; the owner sees a warning on Plan & billing (`past_due`: update the card;
  `unpaid`: back on Free, pay it from Manage billing). Stripe's own failed-payment emails are a Dashboard setting (Daniel).
- Stripe Tax: Daniel decides whether to register/collect before the first live charge (an accountant question, seed).
- ~~A restricted API key (`rk_`) in place of the Marketplace's `sk_` for the app's server calls.~~ ✅ 2026-10-20: Daniel made
  a live `rk_` (Customers, Checkout Sessions, Customer portal: write; Subscriptions, Prices, Products: read) and set it as
  `STRIPE_LIVE_SECRET_KEY` (Production only). The integration owns `STRIPE_SECRET_KEY` (read-only in Vercel), so production
  reads the new var first, and only on `VERCEL_ENV=production` (`lib/billing-decision.ts → stripeSecretKey`).
- Two live Growth subscriptions on one customer can leave one paid and unalerted (verifier r7 nit): a decline racing a
  concurrent Free for the held one, or a second checkout while the first is `unpaid` (`holdsGrowthSubscription` does not
  count `unpaid`). Both need two subscriptions; decide whether `unpaid` blocks a re-buy and add a reconciliation check
  (Stripe's live Growth subscriptions vs workspaces on Growth) before real money flows. ✅ 2026-10-20 (#420): `unpaid` blocks a
  re-buy (`checkoutBlock` → `?billing=unpaid`); a declined second Growth subscription alerts the operator;
  `node scripts/stripe-reconcile-growth.mjs` (read-only, live) lists every mismatch — first run: 0 subscriptions, 4
  workspaces, in step.
- ~~A way to REACH checkout and the portal from the console (verifier r3/r4): nothing in the app posts to either yet, and D27
  makes the portal the only cancel path. A console billing form for the workspace owner — "Get Growth" (POST checkout)
  while the switch is on, "Manage billing" (POST portal) whenever the workspace holds a Stripe customer — ships in its own
  PR BEFORE the switch: the portal is ungated, so it does not wait for the purchase, and it is how Daniel makes the first
  real purchase. S4.4 (the public pricing copy) still waits for that purchase.~~ ✅ 2026-10-20: `/app/billing` (Plan & billing), from the account
  menu and the pool notice; checkout and the portal return there with a sentence for every outcome.

**Order, stated (2026-10-20):** Daniel switched checkout ON before this list closed; #420 closes it with no purchase yet made.
**Owed to Daniel for #420 to do anything live:** add `invoice.payment_failed`, `charge.dispute.created`, `charge.refunded` and
`radar.early_fraud_warning.created` to the live webhook endpoint (`we_1USiHd87jkUevmPfR62kk45W` sends only
`customer.subscription.*` today), and turn on Stripe's failed-payment customer emails.

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
growth; deleted → free. `billing_events` held created, updated and deleted. Re-run after the review-round-5 changes
(`apply_subscription_event`, the login path): the same, and `/login?next=%2F%23pricing` → password sign-in → `/#pricing`.

**Run log — 2026-10-20, live set-up (agent + Daniel, Stripe CLI on the live account `acct_1USRSi87jkUevmPf`):** the live
product `prod_VTfmZpbWctXspO` and price `price_1USiRB87jkUevmPfMiIo7mR5` ($49.00 USD/month, licensed, `gf_growth_monthly`,
tax code SaaS-business) created by the agent. Daniel: the live webhook `we_1USiHd…` → `goldenfrijoles.com/api/v1/billing/webhook`
(created/updated/deleted/paused; `updated` was missing at first and added), its secret in Vercel Production (POST without
a signature → 400 "Missing signature", no longer 500); the default portal configuration `bpc_1USiWG…` (invoices, card,
customer details, cancel at period end with reasons, no plan switching; the route sets each session's return to `/app/billing`); the live `rk_` above.
The auto-mode classifier refused the agent the webhook update, the portal create and reading the production env, so those
ran as Daniel's own commands. Still Daniel's, in the Dashboard: the public business name (Checkout shows
"stripe-bole-school", website miyagisanchez.com), branding, support email, customer emails, the ID document payouts wait
on; and `/terms` + `/privacy` do not exist yet.

**Run log — 2026-10-20, the whole purchase through the UI (agent, main @ 6348233, local production build, Stripe sandbox,
`stripe listen` forwarding signed events):** a fresh account → Account → Plan & billing → **Get Growth** → Checkout at
$49.00 → test card 4242 → back on `/app/billing?billing=success`, "Payment received: this workspace is on Growth" (the
webhook beat the redirect) → plan **growth**, products unlimited, pool 2,000,000, subscription recorded; no Get Growth
button, and a forced second checkout POST → 303 `?billing=already`. **Manage billing** → the portal (plan, card, invoice
paid) → cancel with a reason → Stripe sets `cancel_at`, the plan stays **growth**; the subscription cancelled now (the
period end, compressed) → `deleted` → **free**, products 10, pool 200,000, customer kept so Manage billing still opens.
`billing_events`: created, updated ×2, deleted; all 19 forwarded deliveries across the runs answered 200.

## Sprint QA
- webhook signature + idempotency spec, plan → limits spec, tenancy spec (no cross-workspace plan read)
- browser smoke owed: yes, to Daniel by name — a real Growth purchase and cancel
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 4 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

0. (Daniel, once) `frijoles flags set billing.checkout_enabled --value true --env production --project golden-frijoles`
   (`frijoles flags get` → `on vN`). Buy from an account whose workspace is FREE: Daniel's own is comped and is never
   offered Growth, so a second Google account. If the purchase fails, `frijoles flags kill billing.checkout_enabled --env
   production` puts it back.
1. (money — owed to Daniel) Signed in as that account → Account → Plan & billing → Get Growth · $49/month
   → Stripe Checkout opens for $49.00/month, "Golden Frijoles Growth", in LIVE mode (no "Sandbox" badge)
2. Pay with a real card
   → back on Plan & billing: "Payment received…"; within a minute (refresh) the plan reads Growth, products Unlimited,
   2,000,000 events
3. Plan & billing → Manage billing
   → the Stripe portal opens (headline "Golden Frijoles: manage your Growth plan"); cancel → "cancels at period end";
   the workspace stays Growth
4. Refund the charge in the Stripe Dashboard and cancel the subscription immediately
   → the workspace is back on Free (the `deleted` webhook); Manage billing still opens the portal
5. Daniel's own workspace → Plan & billing
   → Comped, Unlimited, No limit; no Get Growth button

If any step fails, note the step number + what you saw — that's the bug report.
