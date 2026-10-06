-- account-from-the-terminal · Sprint 2, Story 2.2 — `gf login` through the browser (epic D6).
--
-- A device code is the pairing between a terminal that ran `gf login` and a person who confirmed it
-- in a signed-in browser. It is a CREDENTIAL in flight, so it is shaped like one:
--
--   • The DEVICE code is the secret. Only the CLI holds it, only its sha256 is stored (through
--     lib/credential-hash.ts, the one hash this system uses), and only it can collect a token.
--   • The USER code (`KQ7M-3RTX`) is a display handle the person compares with their terminal. It
--     grants nothing on its own: approving it needs a signed-in session, and collecting needs the
--     device code.
--   • NO token is stored here, ever. The poll that wins an atomic approved→consumed transition mints a
--     `cli_tokens` row with `mintCliToken` and returns the plaintext once (D6's deviation from the
--     seed, which stored the minted token for hand-off).
--   • Ten minutes, single use: `expires_at` is checked in database time on every transition.
--
-- Expand-only: a new table, nothing existing changes. Applied BEFORE the deploy that reads it.

CREATE TABLE IF NOT EXISTS cli_device_codes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code_hash TEXT        NOT NULL UNIQUE,
  user_code        TEXT        NOT NULL UNIQUE,
  -- What the terminal said about itself (hostname, OS), shown on the confirm page and carried onto
  -- the minted token's label so Setup can name the machine. Free text from an unauthenticated
  -- caller: length-bounded here, and rendered as text, never HTML.
  label            TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending',
  -- ON DELETE CASCADE, the cli_tokens rule: a deleted account's pending pairings go with it.
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  decided_at       TIMESTAMPTZ,
  consumed_at      TIMESTAMPTZ
);

ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_hash_format;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_hash_format
  CHECK (device_code_hash ~ '^[0-9a-f]{64}$');

-- 8 characters of a 32-letter alphabet with no 0/O/1/I, grouped 4-4: what a person can read aloud.
ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_user_code_format;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_user_code_format
  CHECK (user_code ~ '^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$');

ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_label_length;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_label_length
  CHECK (char_length(label) BETWEEN 1 AND 120);

ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_status;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_status
  CHECK (status IN ('pending', 'approved', 'denied', 'consumed'));

-- The state machine's invariants, in the database so no code path can skip them: a pending code
-- belongs to nobody; an approved or consumed one belongs to exactly the person who confirmed it.
ALTER TABLE cli_device_codes DROP CONSTRAINT IF EXISTS cli_device_codes_owner_matches_status;
ALTER TABLE cli_device_codes ADD CONSTRAINT cli_device_codes_owner_matches_status
  CHECK (
    (status = 'pending' AND user_id IS NULL AND decided_at IS NULL AND consumed_at IS NULL)
    OR (status = 'denied' AND decided_at IS NOT NULL AND consumed_at IS NULL)
    OR (status = 'approved' AND user_id IS NOT NULL AND decided_at IS NOT NULL AND consumed_at IS NULL)
    OR (status = 'consumed' AND user_id IS NOT NULL AND decided_at IS NOT NULL AND consumed_at IS NOT NULL)
  );

ALTER TABLE cli_device_codes ENABLE ROW LEVEL SECURITY;

-- Service-role only, the cli_tokens grant shape: no anon or authenticated path exists, and the
-- service role cannot DELETE (an expired row is evidence, not clutter).
REVOKE ALL ON TABLE cli_device_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE cli_device_codes TO service_role;
REVOKE DELETE, TRUNCATE ON TABLE cli_device_codes FROM service_role;

-- ── The two transitions, as functions, so every one is atomic and judged in DATABASE time ────────
-- A person confirming and a CLI polling race each other by design. Each transition is ONE guarded
-- UPDATE (WHERE status = <the only legal prior state> AND expires_at > now()), so two pollers cannot
-- both collect and a confirm cannot land on an expired code, whatever the app servers' clocks say.
-- The outcome vocabulary is closed: the route maps it, it never forwards SQL errors.

-- Approve or deny a pending code on behalf of the signed-in person. p_user_id comes from the session
-- (lib/supabase-auth.ts), never from the request.
CREATE OR REPLACE FUNCTION decide_cli_device_code(p_user_code TEXT, p_user_id UUID, p_approve BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_row cli_device_codes%ROWTYPE;
BEGIN
  UPDATE cli_device_codes
     SET status = CASE WHEN p_approve THEN 'approved' ELSE 'denied' END,
         user_id = p_user_id,
         decided_at = now()
   WHERE user_code = p_user_code AND status = 'pending' AND expires_at > now()
  RETURNING * INTO v_row;
  IF FOUND THEN
    RETURN CASE WHEN p_approve THEN 'approved' ELSE 'denied' END;
  END IF;

  SELECT * INTO v_row FROM cli_device_codes WHERE user_code = p_user_code;
  IF NOT FOUND THEN RETURN 'unknown'; END IF;
  IF v_row.status = 'pending' THEN RETURN 'expired'; END IF;
  -- Already decided or collected: the code worked once, which is all it ever does.
  RETURN 'used';
END;
$$;

-- Collect: the CLI's poll. Exactly one caller can ever see 'approved' for a code, because the
-- approved→consumed UPDATE is the only way to read it; the caller then mints the token.
CREATE OR REPLACE FUNCTION collect_cli_device_code(p_device_code_hash TEXT)
RETURNS TABLE (outcome TEXT, user_id UUID, label TEXT)
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
    RETURN QUERY SELECT 'approved'::TEXT, v_row.user_id, v_row.label;
    RETURN;
  END IF;

  SELECT * INTO v_row FROM cli_device_codes AS c WHERE c.device_code_hash = p_device_code_hash;
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'unknown'::TEXT, NULL::UUID, NULL::TEXT;
  ELSIF v_row.status = 'consumed' THEN
    RETURN QUERY SELECT 'used'::TEXT, NULL::UUID, NULL::TEXT;
  ELSIF v_row.status = 'denied' THEN
    RETURN QUERY SELECT 'denied'::TEXT, NULL::UUID, NULL::TEXT;
  ELSIF v_row.expires_at <= now() THEN
    RETURN QUERY SELECT 'expired'::TEXT, NULL::UUID, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT 'pending'::TEXT, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION decide_cli_device_code(TEXT, UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION collect_cli_device_code(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decide_cli_device_code(TEXT, UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION collect_cli_device_code(TEXT) TO service_role;

COMMENT ON TABLE cli_device_codes IS
  'Browser sign-in for the gf CLI (account-from-the-terminal D6). device_code_hash is the secret the '
  'CLI holds; user_code is a display handle. No token is stored: the winning poll mints one. '
  'Ten minutes, single use, service-role only.';
