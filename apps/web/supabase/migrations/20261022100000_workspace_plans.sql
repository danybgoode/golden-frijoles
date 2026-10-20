-- landing-launch-experiment · Sprint 4, Story 4.1 (epic README D23, D26) — a workspace carries a PLAN, and its limits are
-- derived from the plan in ONE place: the trigger below. The app reads the columns; it never keeps a copy of the table
-- (CODE-QUALITY #2 — two lists that must agree drift apart).
--
--   free   → 10 products,  200,000 events a month   (what every workspace has today)
--   growth → no product cap, 2,000,000 events a month
--   comped → no product cap, no pool              (granted, never bought: replaces an admin bypass)
--
-- EXPAND-only, and no ceiling drops on the data it meets. Production on 2026-10-20: 4 workspaces. Daniel's holds 4
-- products and is set to `comped` (no pool) as a separate data step after this applies (its id is production data, not
-- schema). The other three hold ONE product each (0 events this month), so a 200,000 pool equals that product's own
-- 200,000 ceiling. NOTE what this does change for a future multi-product Free workspace: its products SHARE 200,000 a
-- month, where before each had its own — that is the point of a pool (D24), and Growth lifts it.
--
-- NULL means "no cap" for both limits: `enforce_workspace_product_limit()` already reads a NULL `product_limit` as no
-- cap, and the pool check (lib/quota.ts) skips a NULL pool. So `product_limit` loses its NOT NULL; its 0–1000 range check
-- still holds every non-NULL value.

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CONSTRAINT workspaces_plan_known CHECK (plan IN ('free', 'growth', 'comped'));

ALTER TABLE workspaces ALTER COLUMN product_limit DROP NOT NULL;

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS monthly_event_pool INTEGER
    CONSTRAINT workspaces_monthly_event_pool_positive CHECK (monthly_event_pool > 0);

-- Stripe's ids for a workspace that bought Growth (D26). The customer id is unique: one Stripe customer is one workspace,
-- so a webhook that names a customer can only ever reach one row.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
-- The `created` time of the last subscription event applied: Stripe does not guarantee order, so an older event is ignored.
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_event_at TIMESTAMPTZ;
-- When a checkout last started for this workspace: one atomic claim serializes concurrent checkouts (codex, #412).
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_stripe_customer_id_key
  ON workspaces (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.workspaces_apply_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- The one plan → limits map. Change a tier here, nowhere else.
  CASE NEW.plan
    WHEN 'free' THEN NEW.product_limit := 10; NEW.monthly_event_pool := 200000;
    WHEN 'growth' THEN NEW.product_limit := NULL; NEW.monthly_event_pool := 2000000;
    WHEN 'comped' THEN NEW.product_limit := NULL; NEW.monthly_event_pool := NULL;
    -- An unknown plan is left for `workspaces_plan_known` to refuse, by its own readable name.
    ELSE NULL;
  END CASE;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.workspaces_apply_plan() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS workspaces_apply_plan ON workspaces;
CREATE TRIGGER workspaces_apply_plan
  BEFORE INSERT OR UPDATE OF plan ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.workspaces_apply_plan();

-- Every existing row takes its plan's limits now (the trigger fires on UPDATE OF plan even when the value is the same).
UPDATE workspaces SET plan = plan;

-- D26 — every Stripe event we have handled, recorded AFTER it is applied (so a failed apply is retried by Stripe, not
-- marked done): a later delivery of the same id finds it here and is a no-op.
CREATE TABLE IF NOT EXISTS billing_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces (id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Service role only, like every table here: RLS ON with no policies, and no grants to the API roles.
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE billing_events FROM PUBLIC, anon, authenticated;

-- D26 — subscriptions that have ENDED (deleted, canceled, incomplete_expired), recorded the moment any event says so,
-- whether or not a workspace holds them yet. Stripe does not deliver in order: a `deleted` can arrive before its own
-- `created`, and a Growth that then bound the slot would never be taken back (codex r5, #412). Growth never binds an
-- ended subscription.
CREATE TABLE IF NOT EXISTS billing_ended_subscriptions (
  stripe_subscription_id TEXT PRIMARY KEY,
  ended_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE billing_ended_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE billing_ended_subscriptions FROM PUBLIC, anon, authenticated;

-- D26 — the ONE place a subscription event changes a plan, atomically, under a lock on the workspace row:
--   · an ended subscription is recorded first (above), whatever the workspace holds;
--   · never a comped workspace; only the workspace holding the Stripe customer (`stripe_customer_id` is unique);
--   · Growth binds an empty or the SAME slot, never an ended subscription, and only strictly LATER than the last applied
--     event (Stripe's `created` is whole seconds; a tie goes to Free);
--   · Free applies only to the subscription the slot holds, at the same time or later.
-- Returns the workspace changed, or NULL when a guard left it alone. Service role only (the webhook).
CREATE OR REPLACE FUNCTION public.apply_subscription_event(
  p_customer TEXT,
  p_subscription TEXT,
  p_plan TEXT,
  p_event_at TIMESTAMPTZ,
  p_ended BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ws RECORD;
BEGIN
  IF p_plan NOT IN ('growth', 'free') THEN
    RAISE EXCEPTION 'apply_subscription_event: % is not a plan a payment can set', p_plan;
  END IF;
  IF p_ended THEN
    INSERT INTO billing_ended_subscriptions (stripe_subscription_id) VALUES (p_subscription)
      ON CONFLICT (stripe_subscription_id) DO NOTHING;
  END IF;
  SELECT id, plan, stripe_subscription_id, stripe_subscription_event_at INTO ws
    FROM workspaces WHERE stripe_customer_id = p_customer FOR UPDATE;
  IF NOT FOUND OR ws.plan = 'comped' THEN
    RETURN NULL;
  END IF;
  IF p_plan = 'growth' THEN
    IF EXISTS (SELECT 1 FROM billing_ended_subscriptions WHERE stripe_subscription_id = p_subscription)
       OR (ws.stripe_subscription_id IS NOT NULL AND ws.stripe_subscription_id <> p_subscription)
       OR (ws.stripe_subscription_event_at IS NOT NULL AND ws.stripe_subscription_event_at >= p_event_at) THEN
      RETURN NULL;
    END IF;
  ELSIF ws.stripe_subscription_id IS DISTINCT FROM p_subscription
     OR (ws.stripe_subscription_event_at IS NOT NULL AND ws.stripe_subscription_event_at > p_event_at) THEN
    RETURN NULL;
  END IF;
  UPDATE workspaces
     SET plan = p_plan,
         stripe_subscription_id = CASE WHEN p_plan = 'growth' THEN p_subscription END,
         stripe_subscription_event_at = p_event_at
   WHERE id = ws.id;
  RETURN ws.id;
END
$$;
REVOKE ALL ON FUNCTION public.apply_subscription_event(TEXT, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(TEXT, TEXT, TEXT, TIMESTAMPTZ, BOOLEAN) TO service_role;

COMMENT ON COLUMN workspaces.plan IS
  'landing-launch-experiment D23: free | growth | comped. Sets product_limit and monthly_event_pool through workspaces_apply_plan().';
COMMENT ON COLUMN workspaces.monthly_event_pool IS
  'landing-launch-experiment D24: events a month across ALL the workspace''s products; NULL = no pool.';
