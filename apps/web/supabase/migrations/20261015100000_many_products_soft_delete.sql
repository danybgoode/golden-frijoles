-- many-products · Sprint 2, Stories 2.1 + 2.2 (Roadmap/02-commercial/many-products — lock D9, D10).
--
-- An owner deletes a product (S2.1): it is gone at once and every credential it ever issued stops working. Its data is
-- kept for 30 days, then the owner may purge it (S2.2). No scheduler: purge is a command the owner runs, so the scheduler
-- exemption registry (AGENTS.md) is untouched.
--
-- ── Where "gone" is enforced ────────────────────────────────────────────────────────────────────────────────────────
-- In the database first: every credential view below gains `p.deleted_at IS NULL`, so every lookup and every SQL
-- function that reads one inherits it — an ingest key, an agent-write key, a flag admin/read/sync key and a share link of
-- a deleted product resolve to nothing. The views keep their exact columns (CREATE OR REPLACE may not change them), and
-- each still JOINs, so none becomes auto-updatable (the forged-credential property cli-api.spec.ts pins on its sibling).
-- The app seams (lib/membership.ts, the connector token, every other projects read) filter in code, pinned by
-- lib/soft-delete-guard.test.ts.
--
-- The row stays until purge, so the slug stays taken (projects_slug_key) — nobody can register a deleted product's name
-- and inherit a link to it.
--
-- Expand-only: the column is new and NULL everywhere, so the running deploy sees no change until a product is deleted.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN projects.deleted_at IS
  'Soft delete (many-products S2.1). Set = the product is not found anywhere and its credentials are dead; purge_deleted_project removes it 30 days on.';

-- ── the six credential views (latest definitions: 20260803100000, 20260806100000, 20260808110000, 20260807100000,
--    20260810100000, 20260803120000), each with ONE added condition ────────────────────────────────────────────────

CREATE OR REPLACE VIEW active_ingest_keys AS
  SELECT
    k.id,
    k.project_id,
    k.key_hash,
    p.monthly_event_quota,
    p.ingest_rate_per_min,
    p.created_by,
    p.first_event_at
  FROM api_keys k
  JOIN projects p ON p.id = k.project_id
  WHERE k.scope = 'ingest'
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
    AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW active_agent_write_keys AS
  SELECT
    k.id,
    k.project_id,
    k.key_hash,
    p.slug AS project_slug
  FROM api_keys k
  JOIN projects p ON p.id = k.project_id
  WHERE k.scope = 'agent_write'
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
    AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW active_flag_admin_keys AS
  SELECT key.id, key.project_id, key.key_hash, key.flag_environment, key.flag_actor_user_id
  FROM api_keys key
  JOIN project_members member
    ON member.project_id = key.project_id
   AND member.user_id = key.flag_actor_user_id
   AND member.role = 'owner'
  JOIN projects p ON p.id = key.project_id
  WHERE key.scope = 'flag_admin'
    AND key.flag_environment IN ('development','preview','production')
    AND key.revoked_at IS NULL
    AND (key.expires_at IS NULL OR key.expires_at > now())
    AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW active_flag_read_keys AS
  SELECT k.id, k.project_id, k.key_hash, k.flag_environment
  FROM api_keys k JOIN projects p ON p.id = k.project_id
  WHERE k.scope = 'flag_read' AND k.flag_environment IN ('development','preview','production')
    AND k.revoked_at IS NULL AND (k.expires_at IS NULL OR k.expires_at > now())
    AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.active_flag_sync_keys AS
  SELECT key.id, key.project_id, key.key_hash, key.flag_actor_user_id, key.flag_sync_source
  FROM public.api_keys key
  JOIN public.projects project ON project.id = key.project_id
  JOIN public.project_members member
    ON member.project_id = key.project_id
   AND member.user_id = key.flag_actor_user_id
   AND member.role = 'owner'
  WHERE key.scope = 'flag_sync'
    AND key.flag_sync_source ~ '^[a-z][a-z0-9_-]{0,63}$'
    AND key.revoked_at IS NULL
    AND (key.expires_at IS NULL OR key.expires_at > now())
    AND project.deleted_at IS NULL;

CREATE OR REPLACE VIEW active_share_links AS
  SELECT
    k.id,
    k.project_id,
    k.key_hash,
    k.share_lens,
    p.slug AS project_slug
  FROM api_keys k
  JOIN projects p ON p.id = k.project_id
  WHERE k.scope = 'share'
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
    AND p.deleted_at IS NULL;

-- ── delete (S2.1) ───────────────────────────────────────────────────────────────────────────────────────────────────
-- One guarded UPDATE: only an OWNER, only a live product, never a protected one (the caller passes the public demo's
-- and the self-tracking project's slugs, which are env-driven and so cannot be named here). p_user_id comes from a
-- resolved credential or session, never a request body.
CREATE OR REPLACE FUNCTION delete_project(p_slug TEXT, p_user_id UUID, p_protected TEXT[])
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT p.id INTO v_id
    FROM projects p
    JOIN project_members m ON m.project_id = p.id AND m.user_id = p_user_id AND m.role = 'owner'
   WHERE p.slug = p_slug AND p.deleted_at IS NULL;
  IF v_id IS NULL THEN RETURN 'not_found'; END IF;
  IF p_slug = ANY (COALESCE(p_protected, ARRAY[]::TEXT[])) THEN RETURN 'protected'; END IF;
  -- from_signup goes false too: a person who deletes the product their signup made is not "already provisioned" by it,
  -- so their next sign-in makes a fresh one instead of adopting the deleted row (projects_one_per_creator_idx, D1).
  UPDATE projects SET deleted_at = now(), from_signup = false WHERE id = v_id AND deleted_at IS NULL;
  RETURN 'deleted';
END;
$$;

-- ── purge (S2.2) ────────────────────────────────────────────────────────────────────────────────────────────────────
-- Only an owner, only a product deleted at least 30 days ago (judged in database time). The DELETE cascades through the
-- 26 `ON DELETE CASCADE` foreign keys; the append-only ledgers let a cascade through (their triggers' `pg_trigger_depth()
-- > 1` exits, or a check that the parent is already gone). Nine tables carry project_id with no foreign key at all and are
-- cleared explicitly, after it. e2e/product-delete.spec.ts purges through a pushed roadmap artifact (one of them).
-- One project_id, resolved here — never a list.
--
-- SECURITY DEFINER, because service_role holds no DELETE on the append-only ledgers (that is their point): the purge is
-- the one statement allowed to remove them, and only for the one project it resolved. search_path is pinned so a
-- definer function cannot be steered, and EXECUTE is service_role's alone (below; the spec asserts the denial).
CREATE OR REPLACE FUNCTION purge_deleted_project(p_slug TEXT, p_user_id UUID)
RETURNS TABLE (outcome TEXT, purge_after TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  SELECT p.id, p.deleted_at INTO v_id, v_deleted_at
    FROM projects p
    JOIN project_members m ON m.project_id = p.id AND m.user_id = p_user_id AND m.role = 'owner'
   WHERE p.slug = p_slug AND p.deleted_at IS NOT NULL;
  IF v_id IS NULL THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;
  IF v_deleted_at + INTERVAL '30 days' > now() THEN
    RETURN QUERY SELECT 'too_soon'::TEXT, v_deleted_at + INTERVAL '30 days';
    RETURN;
  END IF;
  DELETE FROM projects WHERE id = v_id;
  -- Tables that carry project_id with NO foreign key to projects (checked against the schema at the lock), so the
  -- cascade above cannot reach them. Each one's immutability trigger lets a row go once its parent is gone, which the
  -- DELETE above just made true. Any failure raises and the whole purge rolls back: nothing is half-purged.
  DELETE FROM report_artifacts WHERE project_id = v_id;
  DELETE FROM experiment_decision_records WHERE project_id = v_id;
  DELETE FROM scenario_impact_evidence WHERE project_id = v_id;
  DELETE FROM breaker_audit WHERE project_id = v_id;
  DELETE FROM flag_lifecycle_audit WHERE project_id = v_id;
  DELETE FROM experiment_lifecycle_audit WHERE project_id = v_id;
  DELETE FROM experiment_flag_binding_audit WHERE project_id = v_id;
  DELETE FROM journey_definition_audit WHERE project_id = v_id;
  DELETE FROM scenario_lifecycle_audit WHERE project_id = v_id;
  RETURN QUERY SELECT 'purged'::TEXT, NULL::TIMESTAMPTZ;
END;
$$;

-- breaker_audit shared breaker_policies' trigger, which allows a DELETE only inside a cascade (pg_trigger_depth() > 1) —
-- but breaker_audit has no foreign key, so no cascade ever reaches it. Its own function adds the second exit
-- scenario_impact_evidence already has: the row may go once its project is gone. While the project exists it is as
-- immutable as before.
CREATE OR REPLACE FUNCTION private.forbid_breaker_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (
    pg_trigger_depth() > 1 OR NOT EXISTS (SELECT 1 FROM public.projects project WHERE project.id = OLD.project_id)
  ) THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'breaker policy evidence is immutable' USING ERRCODE = '55000';
END;
$$;
REVOKE ALL ON FUNCTION private.forbid_breaker_audit_mutation() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS breaker_audit_immutable_trg ON breaker_audit;
CREATE TRIGGER breaker_audit_immutable_trg
  BEFORE UPDATE OR DELETE ON breaker_audit
  FOR EACH ROW EXECUTE FUNCTION private.forbid_breaker_audit_mutation();

REVOKE ALL ON FUNCTION delete_project(TEXT, UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION purge_deleted_project(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_project(TEXT, UUID, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION purge_deleted_project(TEXT, UUID) TO service_role;
