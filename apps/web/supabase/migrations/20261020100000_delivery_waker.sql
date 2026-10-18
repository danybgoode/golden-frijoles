-- delivery-back-on · Sprint 1, Story 1.1 — the dispatcher's waker moves into the database.
--
-- THE BUG (verify-spike finding F7): nothing called /api/internal/dispatch-deliveries in production.
-- Its `*/5` cron lived only in apps/web/vercel.json, which the platform never read (the Vercel
-- project's Root Directory is `.`), and the free Vercel plan refuses any cron that runs more than
-- once a day, so moving it to the root file would have failed every deploy.
--
-- THE FIX (epic README D1): pg_cron wakes the SAME route every five minutes through pg_net, with the
-- SAME bearer. Nothing about what the route does changes, so the AGENTS.md scheduler exemption is
-- unchanged: projects_with_due_work() keeps its one registered caller, the route, and the route keeps
-- every gate (CRON_SECRET fail-closed, then delivery.destinations_enabled).
--
-- THE SECRETS LIVE IN VAULT, never in this file or in cron.job: `dispatch_deliveries_url` and
-- `dispatch_deliveries_cron_secret` (the same value as Vercel's CRON_SECRET; rotate both together).
-- Until both are set, every tick sends nothing — which is the state of every local and CI database,
-- and of production until the switch-on runbook (sprint-1.md, Story 1.3).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- One tick: read the two Vault secrets and POST the route once. Returns pg_net's request id, or NULL
-- when it sent nothing. It reads no tenant data at all, so it is not a cross-tenant read and needs
-- no exemption of its own; the route it wakes is the registered caller.
--
-- FAILS CLOSED, like the route: a missing or empty secret sends nothing, and so does a URL that is
-- not https:// — the bearer is never put on a plaintext connection.
--
-- THE TIMEOUT is above the route's maxDuration (300 s) so pg_net never drops the connection while the
-- route is still dispatching, and the */5 schedule is no shorter than it, so ticks do not overlap
-- (D4). lib/delivery-timing.test.ts pins both against the route's literal.
CREATE OR REPLACE FUNCTION public.dispatch_tick()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url    TEXT;
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'dispatch_deliveries_url';
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'dispatch_deliveries_cron_secret';

  IF v_url IS NULL OR v_secret IS NULL OR v_secret = '' OR v_url NOT LIKE 'https://%' THEN
    RETURN NULL;
  END IF;

  RETURN net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 310000
  );
END;
$$;

-- No API role may call it: only pg_cron (running as the owner) and an operator on the database.
-- A re-CREATE restores PUBLIC's default EXECUTE, so the REVOKE travels with the definition
-- (e2e/delivery-waker.spec.ts asserts a function-level denial).
REVOKE ALL ON FUNCTION public.dispatch_tick() FROM PUBLIC, anon, authenticated, service_role;

-- The schedule. Scheduling an existing job name updates it in place, so a re-run is harmless.
-- Rollback: SELECT cron.unschedule('dispatch-deliveries');
SELECT cron.schedule('dispatch-deliveries', '*/5 * * * *', 'SELECT public.dispatch_tick()');
