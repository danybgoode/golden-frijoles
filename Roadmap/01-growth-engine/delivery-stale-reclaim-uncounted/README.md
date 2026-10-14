---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: delivery-stale-reclaim-uncounted
title: "A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged"
area: 01-growth-engine
risk: high
type: bug
sprints_total: 1
stories_total: 1   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 83   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 5    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=7, p25–p75"
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
build_order: 88      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/delivery-stale-reclaim-uncounted.md`](../../00-ideas/seeds/delivery-stale-reclaim-uncounted.md)
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
Today, if a webhook reaches a customer but the database then fails to record it, the same event is sent to that
customer again every 5 minutes, with no limit, while every screen shows 0 attempts. After this, a presumed send counts
against the retry budget and shows in the attempt log, and the delivery stops once the budget is spent. It keeps
event delivery bounded and honest. Found by the `verify-spike` Quint model (finding F2), which also checked the fix.

## Platform-first note
The outbox already models everything needed: `claim_deliveries` (atomic, `FOR UPDATE SKIP LOCKED`, one project per
call), the append-only `event_delivery_attempts` log and the retry budget `MAX_ATTEMPTS`. The fix moves where the
budget is charged; it adds no table, route or screen. Rule #1 (one pipeline) and the tenancy invariant are untouched:
every claim stays single-project, and `projects_with_due_work` (the one registered scheduler exemption) is not edited.

## What already exists (reuse, don't rebuild)
- `apps/web/supabase/migrations/20260724100000_delivery_retry.sql`: `claim_deliveries` (stale branch at `:61`),
  `settle_delivery`, `event_delivery_attempts` and its outcome CHECK; `20260726100000_fanout_serialization.sql`
  redefines settle.
- `apps/web/lib/delivery-dispatch.ts` (`STALE_CLAIM_MS`, the claim RPC at `:134`), `apps/web/lib/retry-policy.ts`
  (`MAX_ATTEMPTS = 6`).
- `apps/web/supabase/migrations/20260725100000_delivery_health.sql`: the health view (counts every outcome in
  `total_attempts`).
- Specs: `apps/web/e2e/delivery-replay.spec.ts` (already seeds stale `in_flight` rows, `:506`),
  `apps/web/e2e/destinations.spec.ts:323` (function-level denial).
- The model: `Roadmap/09-platform-infra/verify-spike/` (`DECISION.md`, `quint/check.sh`, variant `outbox_timed_fixed`).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 A stale reclaim charges the presumed attempt and respects the budget | high |

## Deploy order
Backend first. `supabase db push` the migration to production **before** the merge. The `p_max_attempts DEFAULT 6`
keeps the running dispatcher's 4-argument call resolving until the merge deploys the code that passes the budget.
Kill switch: `delivery.destinations_enabled` (stops the whole dispatcher in ~30 s). Rollback: a forward migration
restoring the old body, plus `git revert`.

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
