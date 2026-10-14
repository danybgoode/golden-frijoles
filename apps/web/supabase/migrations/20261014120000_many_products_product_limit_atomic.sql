-- many-products · Sprint 1, Story 1.2 — the product cap, enforced atomically (agy security lens on #356).
--
-- createProductForUser checks `workspaces.product_limit` before it inserts, which gives a person the exact sentence
-- ("its limit is 10") — but a check before a separate insert can be raced: N parallel creates all see room and all land.
-- This trigger is the enforcement. It LOCKS the workspace row (FOR NO KEY UPDATE: enough to serialise creates, without blocking foreign-key checks), so concurrent inserts into one workspace queue behind each
-- other, then counts and refuses. The app's check stays for the wording; this is what holds.
--
-- Only rows created BY NAME (`from_signup = false`, D1) are capped: a signup's first product, the hand-seeded rows and the
-- seed scripts never name the column and stay exactly as before.

CREATE OR REPLACE FUNCTION public.enforce_workspace_product_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  IF NEW.from_signup THEN RETURN NEW; END IF;
  SELECT w.product_limit INTO v_limit FROM workspaces w WHERE w.id = NEW.workspace_id FOR NO KEY UPDATE;
  IF v_limit IS NULL THEN RETURN NEW; END IF; -- no such workspace: the foreign key answers that
  SELECT count(*) INTO v_count FROM projects p WHERE p.workspace_id = NEW.workspace_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'workspace product limit reached (% of %)', v_count, v_limit
      USING ERRCODE = 'P0001', HINT = 'workspace_product_limit';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_workspace_product_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS projects_workspace_product_limit_trg ON projects;
CREATE TRIGGER projects_workspace_product_limit_trg
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_product_limit();
