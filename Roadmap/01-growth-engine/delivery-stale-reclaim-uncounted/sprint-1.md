---
epic: delivery-stale-reclaim-uncounted
sprint: 1
title: "A stale reclaim charges the presumed attempt"
risk: high
phase: Shaping
stories_total: 1
stories:
  - id: S1.1
    title: "A stale reclaim charges the presumed attempt and respects the budget"
    as_a: "a customer receiving webhooks from Golden Frijoles"
    i_want: "a delivery that was sent but never recorded to stop reaching my endpoint once its retry budget is spent, with every presumed send in the attempt log"
    so_that: "a partial database failure can't send me the same event every 5 minutes without limit while every screen shows 0 attempts"
    risk: high
    status: planned
---
# A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged — Sprint 1: A stale reclaim charges the presumed attempt

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — A stale reclaim charges the presumed attempt and respects the budget
**As** a customer receiving webhooks from Golden Frijoles, **I want** a delivery that was sent but never recorded to
stop reaching my endpoint once its retry budget is spent, with every presumed send in the attempt log, **so that** a
partial database failure can't send me the same event every 5 minutes without limit while every screen shows 0
attempts.

**Build:** one forward migration redefining `claim_deliveries` (it gains `p_max_attempts INTEGER DEFAULT 6`; drop the
old 4-arg signature, then `REVOKE ALL … FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE … TO service_role`). Its
stale branch sets `attempt_count = attempt_count + 1`, and in the **same statement** sets `status = 'dead'` (not
returned) when the charged count reaches `p_max_attempts`. Each charged reclaim inserts one `event_delivery_attempts` row
with the new outcome `unconfirmed` (the outcome CHECK constraint gains it, `attempt_no` = the charged count).
`lib/delivery-dispatch.ts` passes `p_max_attempts: MAX_ATTEMPTS`. `projects_with_due_work` is not touched.

**Acceptance:**
1. A row `in_flight` past `STALE_CLAIM_MS` at `attempt_count = MAX_ATTEMPTS - 2` is claimed, and comes back with
   `attempt_count = MAX_ATTEMPTS - 1` and one `unconfirmed` attempt row.
2. The same row at `MAX_ATTEMPTS - 1` is **not** returned by the claim. It is `dead`, with one `unconfirmed` attempt
   row and `last_error` naming the presumed loss.
3. A due `pending`/`failed` row is claimed exactly as before: no charge, no attempt row.
4. `claim_deliveries` called as anon/authenticated is denied at the function level (`e2e/destinations.spec.ts:323`,
   moved to the new signature).
5. The old 4-argument call still resolves during the deploy window (the `DEFAULT`).
6. The destination health view counts `unconfirmed` in `total_attempts` only, not in `failed_attempts` (Daniel,
   2026-10-14).

**Risk:** high (a migration on the live delivery path, concurrency).

## Sprint QA
- **api spec(s):** S1.1 → `e2e/delivery-replay.spec.ts` (criteria 1–3, 5, 6) and `e2e/destinations.spec.ts`
  (criterion 4). They run in the always-on `api` gate against local Supabase.
- **browser smoke owed:** no, there's no UI.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.
- **migration:** `supabase db push` to production **before** the merge, confirmed by `supabase migration list`.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. From the repo root, run `supabase migration list` (linked to `slweidgffcfndnskcskc`).
   → the new `…_delivery_stale_reclaim_charge.sql` shows on both the Local and the Remote side.
2. Run `supabase db query --linked "select pg_get_function_identity_arguments(oid) from pg_proc where proname = 'claim_deliveries'"`.
   → exactly one row, ending in `p_max_attempts integer`.
3. Open https://goldenfrijoles.com/app/destinations/golden-frijoles signed in.
   → the destinations page loads and its health numbers look as they did before the merge (no row went dead from
   the fix itself).
4. After the next cron tick (at most 5 min), check the dispatcher's latest run in the Vercel logs for
   `/api/internal/dispatch-deliveries`.
   → no `could not claim deliveries` error.

Step 3 is a signed-in walkthrough, owed to the product owner unless a smoke account exists.

If any step fails, note the step number + what you saw — that's the bug report.
