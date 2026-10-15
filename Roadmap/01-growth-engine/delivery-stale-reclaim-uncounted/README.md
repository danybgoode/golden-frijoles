---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-15T00:21:44Z"
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

## Architecture lock (2026-10-14, verified against live code and live data)

Live facts this lock rests on (queried 2026-10-14 against prod `slweidgffcfndnskcskc`, read-only):
- `event_deliveries`: **323 `pending` (max `attempt_count` 0), 6 `delivered`, 0 `in_flight`**. Applying the
  migration dead-letters nothing; no live row is anywhere near the budget.
- `event_delivery_attempts`: 6 rows, all `delivered`, so re-adding the outcome CHECK validates instantly.
- `claim_deliveries` exists once, `(p_project_id uuid, p_limit integer, p_now timestamptz, p_stale_after_ms integer)`;
  no migration after `20260724100000` redefines it.
- `delivery.destinations_enabled` is **`off v1` in production** (and dev/preview): the live dispatcher returns
  `disabled` before it ever calls the claim. The deploy-window concern is therefore moot today; the `DEFAULT` is kept
  anyway, so the order stays safe the day the gate is turned on.
- `delivery_health` already counts `COUNT(*) FILTER (WHERE outcome IN ('retryable','permanent'))` as
  `failed_attempts` and `COUNT(*)` as `total_attempts`, so criterion 6 holds with **no SQL change** to the view.
- The deliveries dialog (`app/app/destinations/[projectSlug]/deliveries-dialog.tsx:90,180`) renders any outcome
  string as an off pill, and `lib/deliveries.ts:125` types it `string`: `unconfirmed` needs no UI or type change.

**D1 · One forward migration** `apps/web/supabase/migrations/20261016100000_delivery_stale_reclaim_charge.sql`. It
drops the 4-arg `claim_deliveries`, creates the 5-arg one (`p_max_attempts INTEGER DEFAULT 6`), and then
`REVOKE ALL … FROM PUBLIC, anon, authenticated` + `GRANT EXECUTE … TO service_role` + `COMMENT` on the new signature
(LEARNINGS: `DROP FUNCTION` + `CREATE` restores PUBLIC EXECUTE). The migration runs in one transaction, so there is no
moment with no claim function.

**D2 · One statement, three CTEs.** `picked` = the existing eligibility `SELECT` verbatim (project, enabled +
deliverable destination, due `pending|failed` OR stale `in_flight`, `ORDER BY next_attempt_at`, `LIMIT`,
`FOR UPDATE OF dd SKIP LOCKED`) plus `stale := dd.status = 'in_flight'`. `upd` = `UPDATE … FROM picked` that sets
`attempt_count = attempt_count + stale::int`; `status = 'dead'` when `stale AND charged >= p_max_attempts`, else
`in_flight`; `claimed_at = NULL` when dead, else `p_now`; `last_error` = the fixed presumed-loss text when dead, else
unchanged. `logged` = `INSERT INTO event_delivery_attempts` one row per stale row of `upd` (outcome `unconfirmed`,
`attempt_no` = charged count, `http_status`/`latency_ms` NULL, fixed `error` text). The function returns only `upd`
rows whose status is `in_flight`. A dead-lettered row is never handed to TS (seed rabbit hole 2).

**D3 · Fixed texts, no receiver data.** Attempt `error`: `unconfirmed: claimed but never settled; presumed sent`.
Dead `last_error`: `retry budget spent: the last claim was never settled (presumed sent)`. Both are constants in SQL.

**D4 · Outcome CHECK** `event_delivery_attempts_outcome_known` is dropped and re-added with `unconfirmed`. Nothing
else changes in that table; its grants (SELECT+INSERT to service_role) already cover the claim's INSERT, which runs
as the service-role caller (`SECURITY INVOKER`).

**D5 · The budget comes from TS.** `lib/delivery-dispatch.ts` passes `p_max_attempts: MAX_ATTEMPTS`
(`lib/retry-policy.ts`, the one definition). `DEFAULT 6` exists only for the deploy window. The SQL fails closed on
`p_max_attempts < 1` (`RAISE EXCEPTION`), so a bad budget can never dead-letter a whole batch.

**D6 · Budget arithmetic is unchanged downstream.** The claim returns the CHARGED count, and `sendAndSettle` still
settles `row.attempt_count + 1`, so a row reclaimed at `MAX-2` is returned at `MAX-1`, and its real send is the
`MAX`th attempt (dead on failure via `retryDecision`). Same `>=` comparison as the Quint fix
(`outbox.qnt:113-114`, `charged >= MAX_ATTEMPTS`).

**D7 · Concurrency.** No new lock and no new lock-order edge: the claim still locks only delivery rows; the attempt
INSERT's composite FK takes `KEY SHARE` on a delivery row this transaction already holds `FOR UPDATE`. A late settle
from the lost worker still loses: its claim token (`claimed_at`) no longer matches (re-stamped, or NULL + `dead`), and
settle requires `status = 'in_flight'`. `projects_with_due_work` is not touched: it may enumerate a project whose only
due row is about to be dead-lettered, and that claim simply returns nothing.

**D8 · Health view unchanged** (live fact above); a spec pins that `unconfirmed` lands in `total_attempts` only.

**D9 · Specs** (always-on `api` gate, local Supabase): `e2e/delivery-replay.spec.ts` gains RPC-level tests for
criteria 1, 2, 3, 5, plus one through `dispatchPendingDeliveries` (the dispatcher passes the budget), plus criterion
6 on `delivery_health`. `e2e/destinations.spec.ts`'s anon-denial call gains `p_max_attempts`, which pins the NEW
signature's REVOKE (criterion 4). Each new assertion is observed failing once against the old function body.

**D10 · No new flag** (deviation from the kickoff's generic "Flag" line, and in line with the seed's carve-out: a
flag cannot pick between two SQL function bodies). The kill switch is the existing `delivery.destinations_enabled`,
already `off v1` in production.

**D11 · Routing.** Migration + concurrency: built by the architect (Opus), never delegated. Reviews:
`review-route.mjs` (general + security lens: `risk: high`) plus the mandatory fresh `verifier`.

**Owed after this epic (named, not built):** the contract step that drops `DEFAULT 6` once a deploy has passed the
budget for a while.

### Scope corrected by the live system
- Criterion 6 needs no SQL: the live health view already behaves as Daniel decided (D8).
- Smoke step 4 (the cron log) cannot exercise the claim while the gate is off; the live check is instead the
  signature query, a 4-arg call on a project with no rows (proves the `DEFAULT` resolves, and changes nothing), and
  an anon call over PostgREST refused at the function level. Sprint 1's walkthrough is updated to match.

### Sprint 1 — Build contract (locked by the architect before the builder started)
- Cite D1–D9. One migration file, one line in `lib/delivery-dispatch.ts`, specs in the two files named in D9.
- Not touched: `projects_with_due_work`, `settle_delivery`, `release_deliveries`, `delivery_health`, any UI.

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
