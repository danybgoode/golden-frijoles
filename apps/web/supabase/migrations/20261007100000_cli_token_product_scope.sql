-- account-from-the-terminal · Sprint 2, Story 2.2 (amended 2026-10-05, canvas First run frame 6) — the approve page
-- names ONE product, so the token it mints reaches that product only.
--
--   • cli_tokens.project_id: NULL = account-wide (every token minted before this, and every console mint);
--     set = the token resolves for that project alone. lib/cli-auth.ts is the one seam that enforces it, and the
--     MCP connector's flag-write actor re-checks it. ON DELETE CASCADE: a token for a deleted product dies with it.
--   • cli_device_codes.project_id: the product the person picked on /cli/connect, carried from decide to collect.
--   • cli_device_codes.repo_hint: what the terminal says its repo is called, to pre-select a product. Free text
--     from an unauthenticated caller, like `label`: length-bounded, shown as text, and only ever a SUGGESTION —
--     the product is picked from the person's own memberships, never resolved from this.
--
-- Expand-only. decide_cli_device_code gains a 4-argument overload; the 3-argument one stays (the running deploy
-- calls it, and it still mints an account-wide token). collect_cli_device_code returns one more column, which the
-- running deploy ignores. Applied BEFORE the deploy that reads it.

ALTER TABLE cli_tokens ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE cli_device_codes ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE cli_device_codes ADD COLUMN IF NOT EXISTS repo_hint TEXT;

ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_repo_hint_length;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_repo_hint_length
  CHECK (repo_hint IS NULL OR char_length(repo_hint) BETWEEN 1 AND 120);

-- A pending code has picked nothing yet.
ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_project_after_decide;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_project_after_decide
  CHECK (status <> 'pending' OR project_id IS NULL);

-- The view gains the column at the END (CREATE OR REPLACE VIEW may only append). Same liveness rule as before.
CREATE OR REPLACE VIEW active_cli_tokens AS
  SELECT t.id, t.user_id, t.token_hash, t.label, t.project_id
    FROM cli_tokens t
   WHERE t.revoked_at IS NULL
     AND (t.expires_at IS NULL OR t.expires_at > now());

REVOKE ALL ON TABLE active_cli_tokens FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE active_cli_tokens TO service_role;

-- Approve (for one product) or deny. p_user_id comes from the session and p_project_id from the person's own
-- membership (lib/membership.ts), never from the request. The membership is re-checked HERE too, in the same
-- statement that writes, so no caller can bind a token to a product its person does not belong to.
CREATE OR REPLACE FUNCTION decide_cli_device_code(
  p_user_code TEXT, p_user_id UUID, p_approve BOOLEAN, p_project_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row cli_device_codes%ROWTYPE;
BEGIN
  IF p_approve AND (
    p_project_id IS NULL
    OR NOT EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p_project_id AND m.user_id = p_user_id)
  ) THEN
    RETURN 'not_member';
  END IF;

  UPDATE cli_device_codes
     SET status = CASE WHEN p_approve THEN 'approved' ELSE 'denied' END,
         user_id = p_user_id,
         project_id = CASE WHEN p_approve THEN p_project_id ELSE NULL END,
         decided_at = now()
   WHERE user_code = p_user_code AND status = 'pending' AND expires_at > now()
  RETURNING * INTO v_row;
  IF FOUND THEN
    RETURN CASE WHEN p_approve THEN 'approved' ELSE 'denied' END;
  END IF;

  SELECT * INTO v_row FROM cli_device_codes WHERE user_code = p_user_code;
  IF NOT FOUND THEN RETURN 'unknown'; END IF;
  IF v_row.status = 'pending' THEN RETURN 'expired'; END IF;
  RETURN 'used';
END;
$$;

-- The return type changes (one more column), which CREATE OR REPLACE cannot do: drop and recreate, in this
-- migration's one transaction.
DROP FUNCTION IF EXISTS collect_cli_device_code(TEXT);
CREATE FUNCTION collect_cli_device_code(p_device_code_hash TEXT)
RETURNS TABLE (outcome TEXT, user_id UUID, label TEXT, project_id UUID)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row cli_device_codes%ROWTYPE;
BEGIN
  UPDATE cli_device_codes AS c
     SET status = 'consumed', consumed_at = now()
   WHERE c.device_code_hash = p_device_code_hash AND c.status = 'approved' AND c.expires_at > now()
  RETURNING * INTO v_row;
  IF FOUND THEN
    RETURN QUERY SELECT 'approved'::TEXT, v_row.user_id, v_row.label, v_row.project_id;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM cli_device_codes AS c WHERE c.device_code_hash = p_device_code_hash;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'unknown'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID;
  ELSIF v_row.status = 'consumed' THEN
    RETURN QUERY SELECT 'used'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID;
  ELSIF v_row.status = 'denied' THEN
    RETURN QUERY SELECT 'denied'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID;
  ELSIF v_row.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID;
  ELSE
    RETURN QUERY SELECT 'pending'::TEXT, NULL::UUID, NULL::TEXT, NULL::UUID;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION decide_cli_device_code(TEXT, UUID, BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION collect_cli_device_code(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decide_cli_device_code(TEXT, UUID, BOOLEAN, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION collect_cli_device_code(TEXT) TO service_role;

COMMENT ON COLUMN cli_tokens.project_id IS
  'NULL = account-wide. Set = this token reaches that one project only (gf login through /cli/connect).';
