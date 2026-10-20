-- landing-launch-experiment · Sprint 4, Story 4.1 (epic README D23, D26) — a workspace carries a PLAN, and its limits are
-- derived from the plan in ONE place: the trigger below. The app reads the columns; it never keeps a copy of the table
-- (CODE-QUALITY #2 — two lists that must agree drift apart).
--
--   free   → 10 products,  200,000 events a month   (what every workspace has today)
--   growth → no product cap, 2,000,000 events a month
--   comped → no product cap, no pool              (granted, never bought: replaces an admin bypass)
--
-- EXPAND-only and ceiling-preserving. On 2026-10-19 there are 4 workspaces, each `product_limit` 10 and each product
-- 200,000 events a month; every workspace becomes `free` (10, 200,000), which is its ceiling today. Daniel's workspace is
-- set to `comped` as a separate production data step after this applies (its id is production data, not schema).
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

-- D26 — every Stripe event we have acted on, recorded BEFORE acting: a replay finds its id here and is a no-op.
CREATE TABLE IF NOT EXISTS billing_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  workspace_id UUID REFERENCES workspaces (id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Service role only, like every table here: RLS ON with no policies, and no grants to the API roles.
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE billing_events FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN workspaces.plan IS
  'landing-launch-experiment D23: free | growth | comped. Sets product_limit and monthly_event_pool through workspaces_apply_plan().';
COMMENT ON COLUMN workspaces.monthly_event_pool IS
  'landing-launch-experiment D24: events a month across ALL the workspace''s products; NULL = no pool.';
