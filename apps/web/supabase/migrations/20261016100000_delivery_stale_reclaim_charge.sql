-- delivery-stale-reclaim-uncounted · Sprint 1, Story 1.1 — a stale reclaim charges the presumed attempt.
--
-- THE BUG (verify-spike finding F2, Roadmap/09-platform-infra/verify-spike/): only settle_delivery()
-- incremented attempt_count, and claim_deliveries()' stale branch (20260724100000) reclaimed a row
-- stuck in_flight with its count untouched. A worker that SENT and then failed to settle (the
-- function died, or the settle RPC errored) therefore left a row that was re-sent every
-- STALE_CLAIM_MS forever: the retry budget is enforced only at settle time, so a row that never
-- settles never meets it, and the attempt log and every health number stayed at 0.
--
-- THE FIX (epic README D1–D7): the stale branch charges the attempt the lost worker presumably made,
-- logs it to the append-only attempt log as `unconfirmed`, and — in the SAME statement — dead-letters
-- a row whose charged count reaches the budget instead of returning it. A dead-lettered row is never
-- handed back to the dispatcher, so even if settle keeps failing forever the event is not re-sent.
-- Over-charging a row that went stale WITHOUT being sent (the worker died before the send) is the
-- accepted cost (Daniel, 2026-10-14): stale rows are rare, the budget is 6, and replay resets it.
--
-- EXPAND (deploy order, epic README): p_max_attempts has DEFAULT 6, so the 4-argument call the
-- currently-deployed dispatcher makes still resolves between `supabase db push` and the merge. The
-- DEFAULT is dropped in a later contract step.

-- ── the attempt log learns the new outcome ─────────────────────────────────────────────────────
-- `unconfirmed` = a send the dispatcher presumes happened but never saw settle. Counted in
-- delivery_health()'s total_attempts only (its failed_attempts filter names retryable|permanent),
-- per Daniel 2026-10-14 — no change to that function is needed.
ALTER TABLE event_delivery_attempts DROP CONSTRAINT IF EXISTS event_delivery_attempts_outcome_known;
ALTER TABLE event_delivery_attempts
  ADD CONSTRAINT event_delivery_attempts_outcome_known
  CHECK (outcome IN ('delivered', 'retryable', 'permanent', 'skipped', 'unconfirmed'));

-- ── claim_deliveries(), now charging a stale reclaim ──────────────────────────────────────────
-- The signature gains an argument, so the old one is dropped explicitly (CREATE OR REPLACE would add
-- an overload, and two candidates for a 4-named-argument call is an ambiguity error at PostgREST).
DROP FUNCTION IF EXISTS claim_deliveries(UUID, INTEGER, TIMESTAMPTZ, INTEGER);

-- Everything 20260724100000 documented still holds: ALWAYS project-scoped (p_project_id required and
-- re-asserted), eligibility (destination enabled + deliverable) enforced HERE, FOR UPDATE SKIP LOCKED
-- so concurrent workers take different rows. NEW: when a stale candidate exists, its destination is
-- locked KEY SHARE before any delivery row (see the PERFORM in the body), keeping the subsystem's one
-- lock order — destination, then delivery — now that the claim writes attempt rows.
--
-- ONE statement, three CTEs:
--   picked — (MATERIALIZED) the eligible rows, locked, with `stale` = whether this is a reclaim of an in_flight row.
--            Under READ COMMITTED the lock re-reads the latest row version and re-checks the WHERE,
--            so `stale` reflects committed state: a row a late settle just moved off in_flight is
--            either skipped (still locked) or no longer matches.
--   upd    — stale rows are charged one attempt. A stale row whose charged count reaches the budget
--            goes `dead` (claimed_at cleared, so a late settle from the lost worker — whose claim
--            token no longer matches anyway — cannot resurrect it). Everything else goes in_flight
--            stamped with p_now, exactly as before.
--   logged — one `unconfirmed` attempt row per charged reclaim, attempt_no = the charged count.
-- Only the in_flight rows are returned: the dispatcher never sees a row it must not send.
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
       SET attempt_count = d.attempt_count + p.stale::int,
           status        = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN 'dead' ELSE 'in_flight' END,
           claimed_at    = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN NULL ELSE p_now END,
           last_error    = CASE WHEN p.stale AND d.attempt_count + 1 >= p_max_attempts
                                THEN 'retry budget spent: the last claim was never settled (presumed sent)'
                                ELSE d.last_error END,
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

-- DROP + CREATE restored Postgres' PUBLIC EXECUTE default (LEARNINGS.md), and a later GRANT to
-- service_role does not remove it: REVOKE from PUBLIC/anon/authenticated FIRST, then grant.
REVOKE ALL ON FUNCTION claim_deliveries(UUID, INTEGER, TIMESTAMPTZ, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_deliveries(UUID, INTEGER, TIMESTAMPTZ, INTEGER, INTEGER) TO service_role;

COMMENT ON FUNCTION claim_deliveries(UUID, INTEGER, TIMESTAMPTZ, INTEGER, INTEGER) IS
  'Atomically claims up to p_limit due (or stale-in_flight) deliveries for ONE project via FOR UPDATE SKIP LOCKED, flipping them to in_flight. A stale reclaim is charged one attempt and logged as unconfirmed; one whose charged count reaches p_max_attempts is dead-lettered in the same statement and NOT returned. Only claims rows whose destination is enabled AND deliverable. p_project_id must come from the caller, never a request body.';
