-- scenarios-light-up · S1.1 — an owner (or their agent, through the CLI) makes an app a drill target.
--
-- Until now only Miyagi could: registration and verification needed a flag_admin key and a Miyagi user id
-- (`register_scenario_target` / `verify_scenario_target`, 20260809110000). Those stay exactly as they are.
--
-- This adds a second target kind, `owner_token_v1` (D2). Registering stores only the SHA-256 of a one-time token the
-- app is given; the token never travels again. Verifying is a challenge the app answers with an HMAC keyed by that
-- hash, so only an app holding the token can answer, and the engine checks it against the stored hash. The
-- application does the network check; these functions re-prove ownership (D3), bind the hash it checked against, and
-- write the lifecycle and its audit. Additive only: one CHECK widens, two functions are added.

ALTER TABLE scenario_targets DROP CONSTRAINT scenario_targets_target_kind_check;
ALTER TABLE scenario_targets ADD CONSTRAINT scenario_targets_target_kind_check
  CHECK (target_kind IN ('miyagi_resilience_probe_v1', 'owner_token_v1'));

CREATE OR REPLACE FUNCTION owner_register_scenario_target(
  p_project_id UUID,
  p_actor_user_id UUID,
  p_target_key TEXT,
  p_origin TEXT,
  p_token_hash TEXT,
  p_reason TEXT
)
RETURNS TABLE (target_id UUID, status TEXT, created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_target_id UUID;
BEGIN
  PERFORM private.assert_scenario_owner(p_project_id, p_actor_user_id);
  IF p_target_key IS NULL OR p_target_key !~ '^[a-z][a-z0-9_.-]{0,127}$'
     OR p_origin IS NULL
     OR p_origin !~ '^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?$'
     OR p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$'
     OR p_reason IS NULL OR char_length(p_reason) NOT BETWEEN 1 AND 500 OR btrim(p_reason) = ''
  THEN
    RAISE EXCEPTION 'invalid scenario target command' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    p_project_id::TEXT || ':scenario-target:' || p_target_key,
    0
  ));
  -- A key is registered once. The token was shown once and only its hash is kept, so a second registration can
  -- neither return the first token nor replace it (the hash is immutable): revoke and register under a new key.
  IF EXISTS (
    SELECT 1 FROM public.scenario_targets target
    WHERE target.project_id = p_project_id AND target.key = p_target_key
  ) THEN
    RAISE EXCEPTION 'scenario target key is already registered' USING ERRCODE = '55000';
  END IF;
  IF (
    SELECT COUNT(*) FROM public.scenario_targets target
    WHERE target.project_id = p_project_id
  ) >= 100 THEN
    RAISE EXCEPTION 'scenario target limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.scenario_targets(
    project_id, key, target_kind, origin, ownership_challenge_hash, created_by
  ) VALUES (
    p_project_id, p_target_key, 'owner_token_v1', p_origin, p_token_hash, p_actor_user_id
  ) RETURNING id INTO v_target_id;
  INSERT INTO public.scenario_lifecycle_audit(
    project_id, target_id, action, actor_user_id, external_actor_id, reason
  ) VALUES (
    p_project_id, v_target_id, 'target_registered', p_actor_user_id, NULL, p_reason
  );
  RETURN QUERY SELECT v_target_id, 'pending'::TEXT, true;
END;
$$;

-- The caller has already checked the app's answer against `p_checked_hash`, which it read from this row. Binding it
-- here means a target whose hash differs from the one checked is never marked verified.
CREATE OR REPLACE FUNCTION owner_verify_scenario_target(
  p_project_id UUID,
  p_actor_user_id UUID,
  p_target_id UUID,
  p_checked_hash TEXT,
  p_reason TEXT
)
RETURNS TABLE (target_id UUID, status TEXT, changed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_target public.scenario_targets%ROWTYPE;
BEGIN
  PERFORM private.assert_scenario_owner(p_project_id, p_actor_user_id);
  IF p_checked_hash IS NULL OR p_checked_hash !~ '^[0-9a-f]{64}$'
     OR p_reason IS NULL OR char_length(p_reason) NOT BETWEEN 1 AND 500 OR btrim(p_reason) = ''
  THEN
    RAISE EXCEPTION 'invalid scenario target verification' USING ERRCODE = '22023';
  END IF;
  SELECT target.* INTO v_target
  FROM public.scenario_targets target
  WHERE target.project_id = p_project_id AND target.id = p_target_id
  FOR UPDATE;
  IF NOT FOUND
     OR v_target.target_kind <> 'owner_token_v1'
     OR v_target.ownership_challenge_hash <> p_checked_hash
  THEN
    RETURN;
  END IF;
  IF v_target.status = 'revoked' THEN
    RAISE EXCEPTION 'revoked scenario target cannot be verified' USING ERRCODE = '55000';
  END IF;
  IF v_target.status = 'verified' THEN
    RETURN QUERY SELECT v_target.id, v_target.status, false;
    RETURN;
  END IF;
  UPDATE public.scenario_targets
  SET status = 'verified', verified_by = p_actor_user_id, verified_at = now()
  WHERE project_id = p_project_id AND id = v_target.id;
  INSERT INTO public.scenario_lifecycle_audit(
    project_id, target_id, action, actor_user_id, external_actor_id, reason
  ) VALUES (
    p_project_id, v_target.id, 'target_verified', p_actor_user_id, NULL, p_reason
  );
  RETURN QUERY SELECT v_target.id, 'verified'::TEXT, true;
END;
$$;

REVOKE ALL ON FUNCTION
  owner_register_scenario_target(UUID,UUID,TEXT,TEXT,TEXT,TEXT),
  owner_verify_scenario_target(UUID,UUID,UUID,TEXT,TEXT)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  owner_register_scenario_target(UUID,UUID,TEXT,TEXT,TEXT,TEXT),
  owner_verify_scenario_target(UUID,UUID,UUID,TEXT,TEXT)
TO service_role;

DO $$
DECLARE v_signature TEXT;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.owner_register_scenario_target(uuid,uuid,text,text,text,text)',
    'public.owner_verify_scenario_target(uuid,uuid,uuid,text,text)'
  ]
  LOOP
    IF has_function_privilege('anon', v_signature, 'EXECUTE')
       OR has_function_privilege('authenticated', v_signature, 'EXECUTE')
       OR NOT has_function_privilege('service_role', v_signature, 'EXECUTE')
    THEN
      RAISE EXCEPTION 'scenario owner target function privilege boundary failed for %', v_signature;
    END IF;
  END LOOP;
END;
$$;
