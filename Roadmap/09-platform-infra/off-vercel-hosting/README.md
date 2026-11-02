---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: off-vercel-hosting
title: "Off Vercel: production on our own box"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 3
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 85   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 33
quote_basis: "M, n=27, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: null   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 102     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Off Vercel: production on our own box

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/off-vercel-hosting.md`](../../00-ideas/seeds/off-vercel-hosting.md)
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
goldenfrijoles.com has been down since 2026-10-30: nine projects shared one free Vercel quota and Miyagi's CI used it
up, so every visitor, SDK call, CLI command and connector request got a 402. This epic moves production to the Oracle
VM as a portable Docker image, deployed on every merge to `main`, so a free-tier meter can never take the product
offline again and nothing we build ties us to one host. We'll know when the domain, ingest, the connector and the
delivery waker answer from the VM and the 🚀 message names the merged commit.

## Platform-first note
No product primitive changes: Supabase stays the system of record and no migration ships. Rule #1 (the engine owns
telemetry) and rule #2 (public = demo only) are untouched. Rule #4 is REWRITTEN (Daniel approves the text, S3.2); rule
#5 holds (`SITE_URL` is set on the VM, never a Host header); rule #6 holds (gates stay catalog flags; the seam only
decides WHICH flag environment is read).

## What already exists (reuse, don't rebuild)
- CI's local server boot (`.github/workflows/ci.yml`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100`): the app already runs as a plain Node process.
- `lib/site-url-resolve.ts`: `SITE_URL` first, so the VM needs only `SITE_URL=https://goldenfrijoles.com`.
- `lib/gates-decision.ts → flagEnvironmentFor()`, `lib/notify-policy.ts`, `lib/billing-decision.ts`: the readers the seam replaces; extend their specs.
- `lib/gates-guard.test.ts`: the shape for the new `VERCEL_ENV` guard.
- `notify-telegram.yml` (`deployment_status`): keeps working if the deploy job writes GitHub Deployments.
- `/api/internal/resilience/probe`: the health check target.
- The pg_cron waker (`20261020100000_delivery_waker.sql`): calls a URL from Vault, same domain, no change.
- LEARNINGS on Miyagi's Cloud Run cutover: verify env vars by exercising behaviour, never by listing them.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One deploy-environment seam | high |
| 1 | S1.2 A portable Docker image, built and booted in CI | high |
| 2 | S2.1 The VM, inventoried and ready | high |
| 2 | S2.2 Deploy on merge to main | high |
| 3 | S3.1 DNS cutover and the production smoke | high |
| 3 | S3.2 The rules say where production lives | high |

## Deploy order
S1 merges first and is inert on Vercel (the seam falls back to `VERCEL_ENV`). S2 deploys to the VM while DNS still
points at Vercel, proved by IP. S3 flips DNS (rollback: the recorded records, or the previous image tag), then the
rules change. No Supabase migration. No previews in this epic.

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
