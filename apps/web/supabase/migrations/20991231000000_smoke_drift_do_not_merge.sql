-- SMOKE ONLY (verify-module S1 step 3): changes the stale branch without the model. Never applied; PR closed.
CREATE OR REPLACE FUNCTION claim_deliveries(
  p_project_id     UUID,
  p_limit          INTEGER,
  p_now            TIMESTAMPTZ,
  p_stale_after_ms INTEGER,
  p_max_attempts   INTEGER DEFAULT 6
)
RETURNS TABLE (id UUID, project_id UUID, event_id UUID, destination_id UUID, attempt_count INTEGER)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Fail closed: a budget below 1 would dead-letter every stale row it touched.
  IF p_max_attempts IS NULL OR p_max_attempts < 1 THEN
    RAISE EXCEPTION 'claim_deliveries: p_max_attempts must be >= 1 (got %)', p_max_attempts;
  END IF;

  -- LOCK ORDER: destination, then delivery — the order every other path here uses (settle, release,
  -- delete_destination). The `logged` INSERT below has composite FKs to event_destinations and events,
  -- so it takes KEY SHARE on the destination row; taken there, AFTER the delivery rows are locked, it
  -- would invert the order against delete_destination (FOR UPDATE on the destination, then the drain
  -- UPDATE on its deliveries) and the two could deadlock (verifier, PR #373). So lock the destinations
  -- of every stale candidate FIRST, in its own statement, in id order. A claim with no stale candidate
  -- locks nothing here and behaves exactly as before. (The events FK lock is left as is: nothing takes
  -- FOR UPDATE on an event row; only tenant offboarding deletes them, and a deadlock there aborts one
  -- side cleanly, never corrupts.)
  PERFORM 1
     FROM event_destinations dest
    WHERE dest.project_id = p_project_id
      AND dest.id IN (
        SELECT dd.destination_id
          FROM event_deliveries dd
         WHERE dd.project_id = p_project_id
           AND dd.status = 'in_flight'
           AND dd.claimed_at < p_now - make_interval(secs => p_stale_after_ms / 1000.0)
      )
    ORDER BY dest.id
    FOR KEY SHARE OF dest;

  RETURN QUERY
  WITH picked AS MATERIALIZED (   -- evaluated ONCE: a LIMIT … SKIP LOCKED subquery the planner
                                -- re-scanned inside a join could hand back a different set
    SELECT dd.id, (dd.status = 'in_flight') AS stale
      FROM event_deliveries dd
      JOIN event_destinations dest
        ON dest.id = dd.destination_id
       AND dest.project_id = dd.project_id      -- composite match: tenancy is a JOIN fact here too
     WHERE dd.project_id = p_project_id
       AND dest.enabled
       AND dest.target_url IS NOT NULL
       AND dest.signing_secret IS NOT NULL
       AND (
         (dd.status IN ('pending', 'failed') AND dd.next_attempt_at <= p_now)
         OR (dd.status = 'in_flight' AND dd.claimed_at < p_now - make_interval(secs => p_stale_after_ms / 1000.0))
       )
     ORDER BY dd.next_attempt_at ASC
     LIMIT p_limit
     FOR UPDATE OF dd SKIP LOCKED               -- the race-free claim; lock the delivery rows only
  ),
  upd AS (
    UPDATE event_deliveries d
       SET attempt_count = d.attempt_count + 2 * p.stale::int,
           status        = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN 'dead' ELSE 'in_flight' END,
           claimed_at    = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN NULL ELSE p_now END,
           last_error    = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN 'retry budget spent: the last claim was never settled (presumed sent)'
                                ELSE d.last_error END,
           -- the presumed attempt happened during the lost claim: stamp its time, so a row dead-lettered
           -- here never reads "6 attempts, last attempt —" (verifier nit, PR #373). Its `unconfirmed` attempt
           -- row below is dated p_now instead: that is when the loss was DETECTED, ≥ STALE_CLAIM_MS later.
           last_attempt_at = CASE WHEN p.stale THEN d.claimed_at ELSE d.last_attempt_at END,
           updated_at    = p_now
      FROM picked p
     WHERE d.id = p.id
       AND d.project_id = p_project_id
    RETURNING d.id, d.project_id, d.event_id, d.destination_id, d.attempt_count, d.status, p.stale
  ),
  logged AS (
    INSERT INTO event_delivery_attempts (
      project_id, delivery_id, destination_id, event_id, outcome, http_status, latency_ms, error, attempt_no, created_at
    )
    SELECT u.project_id, u.id, u.destination_id, u.event_id, 'unconfirmed', NULL, NULL,
           'unconfirmed: claimed but never settled; presumed sent', u.attempt_count, p_now
      FROM upd u
     WHERE u.stale
  )
  SELECT u.id, u.project_id, u.event_id, u.destination_id, u.attempt_count
    FROM upd u
   WHERE u.status = 'in_flight';
END;
$$;
