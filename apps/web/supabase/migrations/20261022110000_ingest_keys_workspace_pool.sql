-- landing-launch-experiment · Sprint 4, Story 4.2 (epic README D24) — the ingest key resolves its project's WORKSPACE
-- pool in the same read it already does, so charging the pool costs no extra query per event.
--
-- `active_ingest_keys` stays the security property it was built to be (20260803100000): the scope, revocation, expiry
-- and soft-delete filters are untouched. Two columns are APPENDED (CREATE OR REPLACE VIEW can only add at the end), from
-- the key's OWN project's workspace — one row by id, never a read across workspaces (AGENTS.md § tenancy). A LEFT JOIN, so
-- the workspace can never be the reason a valid key stops authenticating; `projects.workspace_id` is NOT NULL anyway.

CREATE OR REPLACE VIEW active_ingest_keys AS
  SELECT
    k.id,
    k.project_id,
    k.key_hash,
    p.monthly_event_quota,
    p.ingest_rate_per_min,
    p.created_by,
    p.first_event_at,
    p.workspace_id,
    w.monthly_event_pool
  FROM api_keys k
  JOIN projects p ON p.id = k.project_id
  LEFT JOIN workspaces w ON w.id = p.workspace_id
  WHERE k.scope = 'ingest'
    AND k.revoked_at IS NULL
    AND (k.expires_at IS NULL OR k.expires_at > now())
    AND p.deleted_at IS NULL;

-- Unchanged grants, restated because a replaced view must never widen: service role only.
REVOKE ALL ON TABLE active_ingest_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE active_ingest_keys TO service_role;
