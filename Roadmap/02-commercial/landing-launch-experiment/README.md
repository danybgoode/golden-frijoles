---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building             # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-19T20:38:51Z"
slug: landing-launch-experiment
title: "Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles"
area: 02-commercial
risk: high
type: feature
sprints_total: 5
stories_total: 18   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 86   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 41    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 62
quote_basis: "L, n=8, p25–p75"
hypothesis: "Today a founder who ships with agents lands on our page and reads about an operating context, not their job: knowing which of that work paid off. Show that job first and more of them will start and prove a first bet. We'll know when founders who came in through the new page prove bets by the read date."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_landing_workspaces"   # D6 (2026-10-19) — which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 5       # to what, a number
read_date: 2026-12-31       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "Startup founders who own the product (CEO or technical co-founder, solo to mid-size), shipping with coding agents and unsure which of that work paid off."   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: landing.variant_b_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: start_prompt_copied
retained_event: signup_started
retention_days: 7
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 101     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/landing-launch-experiment.md`](../../00-ideas/seeds/landing-launch-experiment.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Today a founder who ships with agents lands on goldenfrijoles.com and reads about an operating context, not their job:
knowing which of that work paid off. This epic puts that job first (variant B) and tests it against the current page (A)
on our own engine, end to end, with launch traffic. It also puts in place what the launch needs to be read and
paid for: consent-gated GA4 and Clarity, one identity from visit to workspace, Growth billing, and a white-glove offer.
The bet is read on `proving_workspaces`: 0 → 5 workspaces acquired through the landing proving a bet in December 2026
(best guess, seed → *Target*). The A/B itself decides on prompt copies at 21 days.

Prototype of B (approved, v3): https://claude.ai/artifact/NSTtdQkusMa7YmX6Hfs6RS · plan memo:
https://claude.ai/artifact/NS5Hwpfbg4LsfiKDg8Kf1V. Pitch, rabbit holes, no-gos and the dogfood log: the seed.

## Platform-first note
The engine already models all of it: flag bucketing by targeting key (`packages/sdk/src/flags.ts → evaluateFlag`),
exposures (`experiment_exposed`), A/B reads with intervals (`lib/ab*.ts`), experiments with guardrails and a sample size
(experiments-for-humans), kill from the CLI. Rule #1 holds: every new event goes through the self-track beacon and
`trackSelfEvent`, never a direct insert. Rule #6 holds: the variant is a catalog flag read through `lib/gates.ts`; the
GA4 and Clarity IDs are config, not gates. Tenancy holds: a plan is per workspace and nothing reads one across
workspaces; "comped" replaces an admin bypass.

## Architecture lock (2026-10-19, verified against live code and the production database)

Each decision names where its contract lives; builders cite the D-number, never a paraphrase. Waves 2 and 3 are
re-verified against live data at their boundary (the L bet is re-funded there), and any decision that moves is amended
here, dated.

**D1 · `variant()` is a second reader of the SAME catalog cache, not a second cache.** `lib/gates-decision.ts` grows
`EXPERIMENT_FLAGS` (today one row: `landingVariantB: { key: 'landing.variant_b_enabled' }`) and a pure
`resolveVariant(row, visitorId)`, which runs the SDK's `evaluateFlag` (`packages/sdk/src/flags.ts:541`) over the
served version's definition with `{ targetingKey: visitorId }`. `ServedEnvironment` gains the served version's
`flag` snapshot (`{ key, definitionVersion, definition }`) and the environment's `snapshotVersion`; `gates-catalog.ts`
fills both from `getFlagRegistryView` (it already returns `environments[].snapshotVersion`). `variant()` in
`lib/gates.ts` returns `{ b: boolean, variant, reason, flagVersion, snapshotVersion, experiment? }` where `experiment`
is `experimentForResolution(...)` (`packages/sdk/src/flag-telemetry.ts:65`). Anything unreadable — no catalog, no
served version, an invalid definition, no visitor id — is **A, with no experiment** (never B by accident, never an
exposure for a page nobody was assigned). `gate()` is untouched; a spec pins that its rows and answers did not move.
`variant()` never emits: exposure is D3's job, so a page render can never write an event.

**D2 · The visitor id exists before the first server render.** `middleware.ts` mints `gb_vid` on the public landing
paths when absent (same attributes as `SelfTrackBeacon.ensureVisitorId`: not httpOnly, `samesite=lax`, `path=/`, 1 y),
setting it on the request too so the page reads it in the same render. The Supabase refresh keeps running only on
`/app` and `/cli` (its matcher today), branched inside. Without this, a first visit has no id, the server cannot pick a
variant and the client would mint a different one: the visit and the exposure would be two people.

**D3 · The beacon is the only exposure writer, and it decides server-side.** `POST /api/v1/public/self-visit` keeps
its closed surface list (rule: no caller-named events) and grows one surface, `landing-copy` →
`start_prompt_copied`. For `landing` it (1) sends `landing_visited`, (2) recomputes `variant()` from the `gb_vid`
cookie — never from the body — and, when the served version binds an experiment AND the user agent is not an obvious
bot, sends ONE exposure through the SDK's `trackFlagEvaluation` with `experiment` set (`packages/sdk/src/index.ts:700`),
whose idempotency key (`flagEvaluationFingerprint`) makes it one per visitor per version however often they reload,
and (3) sets an httpOnly `gb_variant` cookie (`a`|`b`, from the server's own answer) for D5. The beacon may post the
variant it rendered; a mismatch with the server's answer (a kill landed between render and beacon) sends no exposure.
Every landing event carries `context.subject = { type: 'visitor', id: gb_vid }`, because the governed analysis joins
metric to exposure on the event SUBJECT (`lib/experiment-analysis.ts:299`), not on `user_id`.

**D4 · Which events go under which id (the dated note S1.2 requires — 2026-10-19).** No alias table.
| Event | Under the user id (unchanged) | Under the visitor id (new, only when a `gb_vid` cookie is present) |
|---|---|---|
| `landing_visited`, `start_prompt_copied`, `experiment_exposed` | — | yes, feature `landing_conversion`, subject `visitor` |
| `signup_started` | yes, feature `activation` (signup route) | yes, feature `landing_conversion` — sent from the signup route AND from the auth callback / `/app/provision` on `created`, because a Google sign-up never reaches the signup route (dedup is free: every read counts distinct ids) |
| `account_confirmed` | yes, feature `activation` | yes, feature `landing_conversion` (callback / `/app/provision`, on `created`) |
The activation funnel reads `feature_id = activation` and so is byte-for-byte unchanged; the A/B and landing reads
see only the visitor copies. `trackSelfEvent` gains an optional `{ featureId, subject }` (the typed `EVENT_FEATURE`
map stays the default, so no event can lose its feature). A confirmation link opened in another browser has no
`gb_vid` and is not joined — stated, not fixed (an alias primitive is dogfood gap 1's seed).

**D5 · The workspace records its acquisition variant, once, at creation.** Migration
`workspaces.acquisition_variant text null check (acquisition_variant in ('a','b'))`, expand-only, no backfill (4 rows,
all ours — they correctly read none). `provisionTenantForUser` takes it (both callers: the auth callback and
`/app/provision`) from the validated `gb_variant` cookie and writes it only when it CREATES the workspace
(`claimWorkspace`), never on a later sign-in. Nothing reads it across workspaces: its one reader is D6, which reads the
pushing project's own workspace row. A visitor can forge their own cookie and mislabel only their own workspace.

**D6 · The target gets its own input, because `proving_workspaces` counts us.** Live data: Golden Frijoles' own
workspace pushes proven verdicts into the same project, so `proving_workspaces` would count our bets toward a target
about founders acquired through the page. The roadmap push (`app/api/v1/roadmap/push/route.ts:124`) reads
`acquisition_variant` in the SAME single-row lookup it already does and, when set, sends a second event
`landing_workspace_proved_bet` (same HMAC subject, `tags.acquisition_variant`). A new North Star input
`proving_landing_workspaces` (`distinct_monthly`, telemetry) counts it; this epic's `target_metric` moves to it (0 → 5
unchanged). `proving_workspaces` is untouched.

**D7 · The landing funnel is retargeted, not rebuilt.** `EVENT_FEATURE[landing_visited]` → `landing_conversion`; new
`start_prompt_copied` → `landing_conversion`; the feature registered on the self project (stages `landing_visited →
start_prompt_copied → signup_started`) through the same path `scripts/seed-self-project.mjs` uses.
`waitlist_joined` keeps `waitlist_conversion` (its history stays readable); the feature stops receiving visits and is
marked retired where the registry supports it.

**D8 · Consent gates the third parties, and only on marketing pages.** A `ConsentManager` client component (deny by
default, the choice in `localStorage` with its date, reopened by a footer "Cookie settings" link) renders GA4
(`@next/third-parties/google`) and Clarity (inline loader + `clarity('consentv2', …)`) only after accept. It mounts
only on an allow-list of public marketing paths — `/`, `/methodology/**`, `/talk`, `/signup`, `/login` — and NEVER on
`/app`, `/hub`, `/s`, `/install`, `/cli` or `/auth`: Clarity records the screen, and a member's console, a share link
or `/install`'s minted connector URL must never reach a recording (tenancy). The IDs are constants in
`lib/analytics-ids.ts` (they ship in page source anyway; see deviation 2). The first-party beacon is outside consent.

**D9 · Unknown period is an error at the edge, a visible fallback on a page.** `asPeriod` is replaced by
`parsePeriod(raw): FunnelPeriod | null` (missing → `all`, unknown → `null`) in `lib/flag-funnel.ts`, so no caller can
keep the silent behaviour. The two API callers (`api/v1/public/funnel`, `api/v1/features/[key]/funnel`) answer 400
naming `all`, `90d`, `30d`; the three page callers (flag page, funnel page, epic page) fall back to `all` and say so on
the page. (The plan said 6 callers; `grep` finds 5.)

**D10 · Launch day is the experiment builder's Start, not a CLI rollout.** Start activates the experiment's flag
version in Production with the experiment's rules and metadata (`lib/experiment-builder-command.ts:151`).
`frijoles flags rollout --percent 50` writes a plain rollout with no experiment metadata, so `experimentForResolution`
returns nothing and the readout would read 0 exposures, forever, looking healthy. S2.3 saves the draft (entity
`visitor`, metric `start_prompt_copied` increase, guardrails `signup_started` + `account_confirmed`, split 50, ~880 per
variant); launch day presses Start (its window is the read date). Kill stays `frijoles flags kill` (serves false,
clears every rule → everyone gets A within 30 s, and exposures stop because no experiment rule matches).

**D11 · B can be seen before launch on a preview, without touching production.** Previews have no database
(`SUPABASE_*` is Production-only, verified with `vercel env ls`), so the catalog never answers there and every preview
serves A. On `VERCEL_ENV !== 'production'`, `/?variant=b` (or `a`) forces the tree, sends no exposure and sets no
`gb_variant`. Production ignores the parameter.

**D12 · Quota: raise the rate, not the month.** Live: the self project used 201 events in the last 30 days of a
200,000 monthly quota; launch adds ≈ 4 events × ~2,000 visitors. The per-minute rate (600, per key, shared by every
self-tracked event) is what a launch-post spike can exceed: S1.4 raises `ingest_rate_per_min` to 3,000 with a data
`UPDATE`; the monthly quota stays.

**D13 · A stays A.** Variant A's markup changes in exactly two places, both required: `CopyPromptCard` gains an
optional `trackSurface` prop (A's two landing cards pass it), and the footer gains "Cookie settings" (D8). B lives in
`components/landing-b/*`; `app/page.tsx` picks the tree. A spec pins A's rendered HTML minus those two.

**D14 · B's product shots are real.** Screenshots of the public `golden-frijoles` project captured from production
into `public/landing-b/`, never invented numbers (CODE-QUALITY #9), each with its capture date in the alt text's source
comment.

**D15 · Wave 3 is locked at its boundary, with one focused question.** S4 is money, a migration and tenancy, and Stripe
is a new external dependency: before S4 starts, the product owner answers one question (Stripe account/entity, test vs
live, the price) and S4's decisions (plan → limits map, the pool's expand/contract so no ceiling drops, the webhook's
idempotency table) are locked against the data on that day. Facts today: 4 workspaces, `product_limit` 10 each,
every product 200,000/month and 600/min.

**D16 · One PR for wave 1.** S1 and S2 do not split along a review boundary: S2.1's seam is S1.2's exposure, and
S1.2, S1.3 and S2.2 all change the beacon route and `trackSelfEvent`. Wave 1 ships as one PR on
`feat/landing-launch-experiment`; S3, S4 and S5 stack as `-s3`, `-s4`, `-s5`.

**D17 · Routing.** The architect (Opus) builds everything shared or high-risk: S2.1, S1.1, S1.2, S1.3, S2.2, S2.3,
S1.4, S3.4 and all of S4. Bounded stories go to a Sonnet builder on its own worktree: S2.4, S3.1–S3.3, S5.1–S5.2.
Every PR gets the fresh `verifier` (high risk) plus the routed external passes.

### Wave 2 lock (2026-10-19, re-verified at the boundary; the contract is `references/landing-b-prototype-v3.html`)

The approved prototype was saved locally by Daniel (`references/` is gitignored — it is the visual contract, not shipped
source). Read in full before any builder started.

**D18 · B is one tree, scoped.** `components/landing-b/` holds B: `LandingB.tsx` (the order: nav, hero, the six steps,
agent strip, founder note, pricing, closing CTA, the shared `Footer`) and one file per section. Its CSS lives in
`components/landing-b/landing-b.css`, every selector under `.lb` so nothing reaches A; colours only from
`brand/tokens.css` (the prototype's own `--roast-2` and `--dim-2` become local `.lb` variables derived there). The
prompt cards are the shared `CopyPromptCard` with `trackSurface="landing-copy"` and `installPrompt(getSiteUrl())` (the
prototype's prompt text IS that prompt), so the copy event and the copied text cannot diverge from A's.

**D19 · Product shots: the approved mockup's drawn branding shots, all six — AMENDED 2026-10-19 (Daniel, on PR #409:
"these must be branding shots, not that. same for cost section").** Every window is the prototype's drawn window with its
"Illustration · sample data" label; the two real screenshots (Why, Cost) were removed. The sample numbers belong to an
invented shop and are labelled as such, which is how CODE-QUALITY #9 holds; D14's "real screenshots" is superseded.
*Original wording, kept for the record:* **Product shots: real where a public page shows the step, the approved illustration where none does.** The
prototype's six windows are drawn stand-ins (its ribbon says so); D14 holds — a screenshot of a PUBLIC
`golden-frijoles` page from production, captured into `public/landing-b/`. A step with no honest public page keeps the
prototype's drawn window, labelled "Illustration · sample data" exactly as the prototype and A label theirs. Which step
is which is listed in sprint-3's run log; no invented number is presented as ours.

**D20 · Pricing stays honest until Checkout exists.** Until S4.3 is live (S4.4), B's Growth card carries A's line that
billing is not live yet, and its CTA is "Start free" → `/signup`, not "Get Growth". S4.4 turns it into "Get Growth" →
Checkout on both variants, as planned. The third tier's CTA goes to `/talk` (S5.2's target), not the prototype's `#note`.

**D21 · Links on B are real routes.** "Sign in" → `/login`, "Start free" → `#start`, "Read the methodology" →
`/methodology`, the founder note's conversation link → `/talk`. Plain `<a>` (or the design system `Button`) for `/login`
and `/signup` — they are full loads by D8's guard anyway.

**D22 · B's copy is the approved copy, including two claims ahead of the product (Daniel, 2026-10-19, on #409).** The
verifier flagged, under CODE-QUALITY #9: the Rehearse step's "floods the site with ten times the traffic and pulls a server"
(drills inject only delays and synthetic errors today), and pricing's "Add as many products and people as you like",
Growth's "Unlimited products and seats" and "Longer history" (every workspace is capped at 10 products; Free has no history
limit). Daniel kept the prototype's wording. **Sprint 4 inherits the debt:** Growth must lift the product cap and define a
history limit that Free does not have, or S4.4 changes the copy — the pricing claims are not left untrue after Checkout ships.
**Deliberately unowned (verifier r2, #409):** the Rehearse claim (load floods, servers pulled) and the header's "as many
products and people as you like" read for the FREE tier (capped at 10 products) have no follow-up: Daniel accepted them
as the page's ambition. A future drills or pricing epic that changes either should revisit this line.

### Wave 3 lock (2026-10-19, re-verified at the boundary — D15's question answered)

**Daniel's answers:** Stripe goes **live now at $49/month** (not test-first), installed through the Vercel Marketplace by
Daniel (accepting Stripe's terms and claiming the account is his step); and **no email at the pool** for now (no new
vendor — a console notice instead; email is a follow-up seed). Live data on 2026-10-19: 4 workspaces, every
`product_limit` 10, every product 200,000 events/month. Daniel's workspace is `9e58bc7d…` ("Daniel's products",
daniel@despachobonsai.com, 4 products, 800,000 summed quota).

**D23 · The plan is one column, and its limits are derived in ONE place: the database.** Migration:
`workspaces.plan text not null default 'free' check (plan in ('free','growth','comped'))`, `product_limit` becomes
nullable (NULL = no cap — `enforce_workspace_product_limit()` already reads NULL as "no cap"), and a new nullable
`monthly_event_pool`. A `BEFORE INSERT OR UPDATE OF plan` trigger sets both from the plan: **free** → 10 products,
200,000 events/month; **growth** → no product cap, 2,000,000 events/month; **comped** → no cap, no pool. The app reads the
columns, never a copy of the table (CODE-QUALITY #2). Expand-only: every existing workspace starts `free` (10, 200,000),
which equals its ceiling today, except Daniel's, set to `comped` in the same step. No ceiling drops.

**D24 · The pool is charged beside the project quota, not instead of it.** `track` resolves the key's project, then its
OWN workspace's pool (one row, by id — tenancy holds), and charges a second counter `quota:ws:<workspace_id>` exactly as
`checkMonthlyQuota` charges the project one (increment, compare, refund on reject). A NULL pool skips it. Past the pool:
the same 429 shape with the reset date, and the console shows the owner an "over this month's pool" notice with the
upgrade link. No email (Daniel), never a charge.

**D25 · Checkout acts on the caller's OWN workspace, resolved on the server.** `POST /api/v1/billing/checkout`
(session; the caller must OWN a project in the workspace — `workspace_members.role = 'owner'`) creates a Stripe Checkout
Session for the one $49/month price, with `client_reference_id` and `metadata.workspace_id` set from the server's
lookup, never the request body; success/cancel URLs from `getSiteUrl()` (rule #5). Behind the kill switch
`billing.checkout_enabled` (a `GATES` row, born ON; `frijoles flags kill` stops new checkouts in 30 s).

**D26 · The webhook is signed, idempotent and sets ONE workspace.** `POST /api/v1/billing/webhook` verifies the Stripe
signature with `STRIPE_WEBHOOK_SECRET` (the SDK's constant-time check) before reading anything; records each event id in a
new `billing_events (stripe_event_id primary key, …)` table first, so a replay is a 200 no-op; and acts only on the
workspace named by the Checkout Session's server-written metadata, matched against the stored `stripe_customer_id`
thereafter. `checkout.session.completed` → `growth` (+ customer and subscription ids); `customer.subscription.deleted` →
`free`; a cancel in the portal sets `cancel_at_period_end`, so the workspace stays Growth until Stripe deletes the
subscription at period end. Service-role writes only; RLS stays ON with no policies on the new table.

**D27 · The portal is the only cancel path.** `POST /api/v1/billing/portal` (owner session) opens Stripe's billing portal
for the workspace's stored customer; no cancel logic of our own.

**D28 · Pricing copy (S4.4) and D22's debt.** After a real purchase works in production: "billing is not live" goes, and
Growth's CTA becomes "Get Growth" → checkout on A and B (a signed-out visitor goes to `/signup` first). D23 makes "unlimited
products" and the larger allowance true for Growth; **"Longer history" is not built** (Free has no history limit), so
S4.4 replaces that line with something true — the D22 either/or, taken.

**Amended 2026-10-20 (verifier + Codex on #412, Daniel's calls):**
- **D24, pool-only on Growth and comped (Daniel):** a product's own monthly quota applies only on Free; on Growth and comped
  the workspace pool is the only monthly limit (the ingest view carries the workspace's plan).
- **D24's notice is a named tenancy carve-out (Daniel):** AGENTS § tenancy now lists it — one number about the caller's own
  workspace, to its workspace owner only.
- **D25/D27 are POST** (as planned): checkout and the portal are form submissions, never links a prefetch could follow; the
  checkout expires the customer's other open sessions first, so two tabs cannot become two subscriptions.
- **D26, only the subscription moves a plan:** checkout records the workspace's customer server-side before Stripe is
  involved; the webhook acts on `customer.subscription.*` alone, only for the `gf_growth_monthly` price, only forward in
  event time (`stripe_subscription_event_at`), binding Growth to an empty or the same subscription slot and Free to the
  subscription held. `checkout.session.completed` and Payment Link sessions move nothing. Stripe's `created` is whole
  seconds, so a same-second tie goes to Free (Growth must be strictly later; Codex r3).
- **D25, one sale per workspace (Codex r2, verifier r3):** checkout claims the workspace for 30 seconds
  (`workspaces.checkout_started_at`; a lost claim is 409) and asks STRIPE whether the customer already holds a live or
  pending Growth subscription before opening a session — a late webhook cannot let a second one be sold. Both the session
  (`metadata.workspace_id`, `client_reference_id`) and the subscription carry the workspace id, as written; nothing reads
  them to move a plan.
- **D25's "owner" is the workspace's CREATOR who is also its owner** (deviation, recorded): the house's own-workspace seam
  (`lib/workspace-tenancy.ts → findOwnWorkspace`) is `created_by`, one per person, and no flow transfers a workspace or adds
  a second owner. Choosing among several owned workspaces would need the request to name one, which D25 forbids. Revisit
  when ownership can move.
- **D27, the portal is never gated (Codex r2):** a paying customer can always cancel, whatever the checkout switch says.

**Routing:** all of S4 is money, a migration and tenancy — built by the architect, never delegated; the verifier and both
external passes on the PR; the migration applied and verified before the merge.

### Deviations from the plan (corrected out loud, 2026-10-19)
1. **Launch command** — `frijoles flags rollout --percent 50` would run a test that can never read (D10). Launch is
   the builder's Start. S3's smoke and the Deploy order are corrected.
2. **"IDs are public env vars"** → constants (D8). An env var adds a deploy-ordering step and a preview with no value,
   to hide a string every visitor's browser downloads.
3. **"A CSP allow-list for exactly these hosts"** → dropped. There is no CSP in this app to extend (no `headers()`, an
   empty `vercel.json`); a site-wide CSP needs nonces for Next's inline scripts and is its own piece of work (logged as
   dogfood gap 9).
4. **The flag already exists** — refine created `landing.variant_b_enabled` off v1 in all three environments
   (`frijoles flags get`, 2026-10-19). S2.3 verifies it rather than creating it.
5. **The target input** — `proving_workspaces` → `proving_landing_workspaces` (D6).
6. **"Raise the quota"** — the monthly quota is not the risk; the per-minute rate is (D12).
7. **"70 started / 1 confirmed"** — not in the events: live, `golden-frijoles` has 1 `signup_started` / 1
   `account_confirmed` (both 2026-10-14) and the archived `golden-beans` 3 / 2. Recorded in S1.2's notes.
8. **D1's file (verifier, #408, 2026-10-19)** — `EXPERIMENT_FLAGS` and `resolveVariant` live in
   `lib/variant-decision.ts`, not `gates-decision.ts`: bucketing needs the SDK's evaluator, and `gates-decision.ts` is
   import-free on purpose (the Playwright process reads it). The rule is unchanged.
9. **D6's lookup (verifier, #408)** — the push reads the workspace's `acquisition_variant` in a SECOND query, after
   `workspace_proved_bet` is sent, so a failed read can never cost the existing event. Still the pushing project's own
   workspace row only.
10. **D3's "one per visitor per version" (verifier, #408)** — the SDK's idempotency key includes the environment's
   snapshot version, so any flag change in production can expose a returning visitor again. The readout keeps each
   subject's first assignment, so the counts are unchanged.

## What already exists (reuse, don't rebuild)
- `apps/web/lib/gates.ts → gate()`, `lib/gates-decision.ts → GATES` — the one gate seam; `variant()` goes beside it.
- `packages/sdk/src/flags.ts → evaluateFlag`, the SDK's bound-experiment exposure (`index.ts:655–704`), `identify`.
- `apps/web/lib/ab.ts`, `lib/ab-query.ts` (exposure needs `feature_id` = experiment key; metric does not), `lib/experiment-*.ts`.
- `apps/web/app/api/v1/public/self-visit/route.ts`, `lib/self-track.ts`, `lib/self-track-events.ts` (`EVENT_FEATURE`).
- `apps/web/components/landing/*` (A, untouched), `CopyPromptCard`, `lib/install-prompt.ts`, `brand/tokens.css`.
- `apps/web/lib/provisioning.ts`, `workspaces.product_limit`, `lib/quota.ts`, migration `20261015100000`.
- `apps/web/lib/webhook-signature.ts`, `lib/rate-limit.ts`, `lib/site-url.ts` (rule #5).
- `apps/web/app/talk/page.tsx`, `lib/booking.ts`.
- `apps/web/lib/flag-funnel.ts → asPeriod` (S2.4).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Consent banner, GA4 and Clarity | high |
| 1 | S1.2 Visitor → user join, with the acquisition variant | high |
| 1 | S1.3 The landing funnel, retargeted | low |
| 1 | S1.4 Instruments verified, quota raised | low |
| 2 | S2.1 variant() beside gate() | high |
| 2 | S2.2 Prompt-copy and exposure events | low |
| 2 | S2.3 The flag and the experiment, registered | low |
| 2 | S2.4 Unknown funnel period is an error | low |
| 3 | S3.1 Hero and nav | low |
| 3 | S3.2 From why to paid off | low |
| 3 | S3.3 Agent strip, founder note, pricing and closing CTA | low |
| 3 | S3.4 / serves A or B | high |
| 4 | S4.1 Workspace plans | high |
| 4 | S4.2 One event pool per workspace | high |
| 4 | S4.3 Checkout, webhook and portal | high |
| 4 | S4.4 Pricing copy on A and B | low |
| 5 | S5.1 /talk becomes Set up with us | low |
| 5 | S5.2 Cross-links | low |

## Deploy order
Three waves, each re-bet at its boundary (appetite L).
1. **Wave 1 — S1 + S2, one PR (D16).** S2.1 first (shared seam). Apply the `acquisition_variant` migration before the
   merge. Raise the self project's rate (S1.4, D12) before any launch post. The flag ships off, so A records its real
   prompt-copy baseline before B exists; the experiment draft is saved once a real `start_prompt_copied` is in the catalog.
2. **Wave 2 — S3.** B merges dark (flag off). Launch day: press **Start** on the experiment in the builder (D10 — not
   `frijoles flags rollout`, which would record no exposures); its window is the read date (21 days or ~880 per variant).
3. **Wave 3 — S4 + S5**, independent of the test and of each other. S4's migrations are applied with `supabase db push`
   BEFORE the merge that reads them; checkout ships behind `billing.checkout_enabled`; S4.4's copy only after a real
   purchase works in production.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
