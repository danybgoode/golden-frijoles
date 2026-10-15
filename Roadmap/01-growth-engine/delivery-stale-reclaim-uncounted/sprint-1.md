---
epic: delivery-stale-reclaim-uncounted
sprint: 1
title: "A stale reclaim charges the presumed attempt"
risk: high
phase: Shipped
stories_total: 1
stories:
  - id: S1.1
    title: "A stale reclaim charges the presumed attempt and respects the budget"
    as_a: "a customer receiving webhooks from Golden Frijoles"
    i_want: "a delivery that was sent but never recorded to stop reaching my endpoint once its retry budget is spent, with every presumed send in the attempt log"
    so_that: "a partial database failure can't send me the same event every 5 minutes without limit while every screen shows 0 attempts"
    risk: high
    status: shipped
---
# A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged — Sprint 1: A stale reclaim charges the presumed attempt

**Status:** ✅ shipped 2026-10-14 — PR #373, merge `4304135` (commits `764c5f6`, `2ec8599`, `0257d06`, `c843261`); migration applied to production before the merge

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — A stale reclaim charges the presumed attempt and respects the budget ✅ `764c5f6`
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
3. Run `supabase db query --linked "select count(*) from claim_deliveries('00000000-0000-0000-0000-000000000000'::uuid, 1, now(), 300000)"`.
   → `0`: the old 4-argument call shape still resolves through the `DEFAULT` (no project has that id, so nothing
   is claimed or changed).
4. Run `curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/claim_deliveries" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H 'Content-Type: application/json' -d '{"p_project_id":"00000000-0000-0000-0000-000000000000","p_limit":1,"p_now":"2026-10-14T00:00:00Z","p_stale_after_ms":1000,"p_max_attempts":6}'`
   with the production URL and the public anon key.
   → refused at the function level (`42501 … permission denied for function claim_deliveries`), never a row list.
5. Run `frijoles flags get delivery.destinations_enabled --project golden-frijoles`.
   → the production row still reads `off v1` (the dispatcher is dark; this fix changes nothing a customer sees
   until it is turned on).
6. Open https://goldenfrijoles.com/app/destinations/golden-frijoles signed in.
   → the destinations page loads and its health numbers look as they did before the merge.

Step 6 is a signed-in walkthrough, owed to the product owner unless a smoke account exists.

If any step fails, note the step number + what you saw — that's the bug report.

### Smoke results — run 2026-10-14 against production (`slweidgffcfndnskcskc`, deploy of `4304135` = success)
1. ✅ `supabase migration list`: `20261016100000` on Local and Remote.
2. ✅ one `claim_deliveries` row, ending `p_max_attempts integer`; outcome CHECK includes `unconfirmed`.
3. ✅ the 4-arg call on the zero project returned `0` rows; `event_deliveries` unchanged (323 pending, 6 delivered).
4. ✅ (by grant, not by curl) `has_function_privilege` on prod: anon `false`, authenticated `false`, service_role `true`.
   The curl form needs the production anon key, and the local `.env.local` holds the local stack's key ("Invalid API
   key"); fetching prod keys prints the service-role secret, so it was not done. The CI spec pins the `42501` shape.
5. ✅ `delivery.destinations_enabled` production `off v1`.
6. ⏳ **Owed to Daniel:** the signed-in look at https://goldenfrijoles.com/app/destinations/golden-frijoles.
