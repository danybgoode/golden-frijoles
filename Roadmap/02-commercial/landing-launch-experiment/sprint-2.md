---
epic: landing-launch-experiment
sprint: 2
title: "Experiment rail"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S2.1
    title: "variant() beside gate()"
    as_a: "the product owner"
    i_want: "our own site to read a per-visitor variant through the one gate seam"
    so_that: "a page can be tested without a second flag system"
    risk: high
    status: done   # c56ab49 · #408
  - id: S2.2
    title: "Prompt-copy and exposure events"
    as_a: "the product owner"
    i_want: "copying the start prompt to be counted on A and B"
    so_that: "the test has a frequent primary metric"
    risk: low
    status: done   # c958ebd · #408
  - id: S2.3
    title: "The flag and the experiment, registered"
    as_a: "the product owner"
    i_want: "`landing.variant_b_enabled` and its experiment ready before launch day"
    so_that: "launch day is one rollout command"
    risk: low
    status: in-progress   # flag verified off v1; builder draft owed (needs a signed-in browser)
  - id: S2.4
    title: "Unknown funnel period is an error"
    as_a: "an agent reading a funnel"
    i_want: "an unknown `period` to fail loudly"
    so_that: "I never read all-time numbers as last week's"
    risk: low
    status: done   # ffc8044, 6535969 · #408
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 2: Experiment rail

**Status:** ✅ Shipped 2026-10-19 — PR #408, merge `749695a`. Owed: S2.3's builder draft (the browser extension was not connected; it is needed only before launch day's Start).

## Stories

### Story 2.1 — variant() beside gate()
**As** the product owner, **I want** our own site to read a per-visitor variant through the one gate seam, **so that** a page can be tested without a second flag system.
**Acceptance:**
- `variant(key, visitorId)` lives in `lib/gates.ts` beside `gate()`, same catalog and 30 s cache; evaluated with `evaluateFlag` and the visitor id as targeting key.
- The same visitor always gets the same variant (pure-logic spec on bucketing stability over 10,000 ids, ~50/50 at a 50% rollout).
- Reports exactly one exposure per evaluation through the SDK's bound-experiment path, with `feature_id` = the experiment key (rabbit hole 2).
- Built FIRST and by the orchestrator: every later story imports it.
**Risk:** high (shared seam)

### Story 2.2 — Prompt-copy and exposure events
**As** the product owner, **I want** copying the start prompt to be counted on A and B, **so that** the test has a frequent primary metric.
**Acceptance:**
- `start_prompt_copied` joins the beacon's fixed list; no caller-named events.
- `CopyPromptCard` sends it on both variants, keyed on `gb_vid`; it needs no `feature_id` to be read.
- Obvious bot user agents get no exposure.
**Risk:** low

### Story 2.3 — The flag and the experiment, registered
**As** the product owner, **I want** `landing.variant_b_enabled` and its experiment ready before launch day, **so that** launch day is one rollout command.
**Acceptance:**
- `frijoles flags create landing.variant_b_enabled --enablement --all-envs`; `frijoles flags get` prints `off vN` in production.
- Experiment registered through the builder: metric `start_prompt_copied` (increase), guardrails `signup_started`, `account_confirmed`, ~880 per variant, bound to the flag; read date set on launch day (21 days, or 880 per variant).
- A `GATES` row only if the gate table needs one; no env var.
**Risk:** low

### Story 2.4 — Unknown funnel period is an error
**As an** agent reading a funnel, **I want** an unknown `period` to fail loudly, **so that** I never read all-time numbers as last week's.
**Acceptance:**
- `period=7d` on the 6 callers of `asPeriod` (`lib/flag-funnel.ts:69`) returns a 400 naming `all`, `90d`, `30d`; pages fall back visibly.
- Spec covers a valid, a missing and an unknown period.
**Risk:** low

## Build contract (locked by the architect before the builder started)
Ships in wave 1's single PR with Sprint 1 (README D16).
- **S2.1** → D1. Pure `resolveVariant` in `lib/gates-decision.ts` with its spec (10,000 ids: stable, ~50/50 at a 50%
  rollout, A on every unreadable input); `gate()`'s behaviour pinned unchanged.
- **S2.2** → D3 (`landing-copy` surface; bot UAs get no exposure), D13 (`CopyPromptCard` `trackSurface` prop, only on
  the landing's cards — never `/install`, Connect or the methodology).
- **S2.3** → D10 and README deviation 4: the flag exists off v1 everywhere; the experiment is saved as a builder DRAFT
  (entity `visitor`) once a real `start_prompt_copied` is in the catalog. Start is launch day, in Sprint 3.
- **S2.4** → D9 (`parsePeriod`, 5 callers).

## Sprint QA
- `lib/gates` bucketing spec (S2.1), beacon event-list spec (S2.2), period spec (S2.4)
- browser smoke owed: no — S2.3 is CLI-verified
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

1. Run `frijoles flags get landing.variant_b_enabled --project golden-frijoles`
   → production prints `off v1`
2. https://goldenfrijoles.com/api/v1/public/funnel?project=golden-frijoles&feature=landing_conversion&period=7d
   → 400 naming the accepted periods
3. https://goldenfrijoles.com/app → Experiments
   → the landing experiment's draft shows its metric, guardrails, sample size and the bound flag (Start is launch day)

If any step fails, note the step number + what you saw — that's the bug report.

### Run log — 2026-10-19 (agent, production)
1. `frijoles flags get landing.variant_b_enabled --project golden-frijoles` → production `off v1` ✅
2. `…/api/v1/public/funnel?project=golden-frijoles&feature=landing_conversion&period=7d` → `400 {"error":"Unknown period \"7d\". Use one of: all, 90d, 30d.","accepted":[…]}` ✅
3. The builder draft — **owed**: `start_prompt_copied` (subject `visitor`) is now in the catalog, so the builder can offer it; saving the draft needs a signed-in browser.
