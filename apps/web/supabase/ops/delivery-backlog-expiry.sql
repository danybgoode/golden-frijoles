-- delivery-back-on · Sprint 1, Story 1.2 — the July backlog is expired, not sent (epic README D2).
-- Run from apps/web (where the project is linked): supabase db query --linked -f supabase/ops/delivery-backlog-expiry.sql
--
-- Nothing dispatched in production from 2026-07-22 to this epic's switch-on (verify-spike F7), so every
-- delivery queued in that window would go out on the first tick, up to three months late. A webhook
-- that late is not a delivery, so those rows are dead-lettered with a reason that says why.
--
-- AN OPS STEP, NOT A MIGRATION (verifier, PR #405): run once by Daniel at the switch-on (sprint-1.md,
-- Story 1.3, step 5). As a pending migration it would fire on whichever unrelated `supabase db push`
-- came next, and its cutoff would mean that push, not the switch-on. Rows queued in the last hour are
-- left to send; anything older waited in the dark (all of it: there is no lower bound, and nothing
-- before 2026-07-22 is still waiting either).
--
-- REVERSIBLE PER ROW: replay_delivery() moves `dead` back to `pending` (20260725100000), so an
-- operator can still send any one of them. Only rows that are not already dead are touched, so a
-- re-run never rewrites an expired row. No dispatcher runs while the gate is off, so an `in_flight`
-- row from that window has no live worker to race.
-- ONE-SHOT PER PROJECT (Codex, PR #405 round 2): the hour-old cutoff moves, so a re-run AFTER the
-- switch-on could dead-letter live work (a retry in backoff is often older than an hour). Nothing was
-- attempted anywhere between July and this epic, so a project with ANY attempt since 2026-10-17 has
-- had delivery back on, and its rows are never touched again.
UPDATE event_deliveries d
   SET status = 'dead',
       last_error = 'expired: queued while delivery was off (2026-07-22 to its switch-on)',
       claimed_at = NULL,
       updated_at = now()
 WHERE d.status IN ('pending', 'failed', 'in_flight')
   AND d.created_at < now() - INTERVAL '1 hour'
   AND NOT EXISTS (
     SELECT 1
       FROM event_delivery_attempts a
      WHERE a.project_id = d.project_id
        AND a.created_at >= TIMESTAMPTZ '2026-10-17 00:00:00+00'
   );
