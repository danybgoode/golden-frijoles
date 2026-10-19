---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
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
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
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
1. **Wave 1 — S1 + S2.** S2.1 first (shared seam). Raise the self project's quota (S1.4) before any launch post.
   The flag ships off, so A records its real prompt-copy baseline before B exists.
2. **Wave 2 — S3.** B merges dark (flag off). Launch day: `frijoles flags rollout landing.variant_b_enabled --percent 50
   --env production`, then set the experiment's read date (21 days or ~880 per variant).
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
