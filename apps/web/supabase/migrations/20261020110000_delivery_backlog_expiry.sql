-- delivery-back-on · Sprint 1, Story 1.2 — the July backlog is expired, not sent (epic README D2).
--
-- Nothing dispatched in production from 2026-07-22 to this epic (verify-spike F7), so every delivery
-- queued in that window would go out on the first tick after the switch-on, up to three months late.
-- A webhook that late is not a delivery, so those rows are dead-lettered with a reason that says why.
--
-- REVERSIBLE PER ROW: replay_delivery() moves `dead` back to `pending` (20260725100000), so an
-- operator can still send any one of them.
--
-- Bounded by a FIXED cutoff, never now(), so the statement means the same thing wherever it runs, and
-- a second run changes nothing: it only touches rows that are not already dead. No dispatcher runs
-- while the gate is off, so an `in_flight` row from that window has no live worker to race.
UPDATE event_deliveries
   SET status = 'dead',
       last_error = 'expired: delivery was off 2026-07-22 → 2026-10-17',
       claimed_at = NULL,
       updated_at = now()
 WHERE status IN ('pending', 'failed', 'in_flight')
   AND created_at < TIMESTAMPTZ '2026-10-17 00:00:00+00';
