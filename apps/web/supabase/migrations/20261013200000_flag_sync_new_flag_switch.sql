-- one-flag-switch S1.5 — a flag that arrives by sync starts with its switch set, from the default in its source.
--
-- The product owner, 2026-10-13: a flag has one switch per environment, On or Off, the same on the page and in the CLI.
-- A synced flag used to arrive with NO switch set anywhere: the page said Off while every app ran on its own built-in
-- literal, the one place the page and the apps could still disagree. Asked "when sync brings in a NEW flag, it gets
-- its switch set from the default in your source file, in every environment; existing flags are never switched by a
-- sync — right?", the answer was "yes".
--
-- Then, asked whether a new flag's RULES go live too (a file saying "off by default, 50% get it" goes live at 50% in
-- production on one CI sync): "yes as recommended" — the source file is the truth, and the sync output says what each
-- new flag now serves and to whom.
--
-- So after the import, and only for a flag THIS sync created, each environment in which that flag has never been
-- switched is set to the new version — its default AND its rules, as written — through the one activation function
-- every other path uses
-- (`set_flag_activation`: owner-checked, snapshot-versioned, audited), with the sync key's owner as the actor and the
-- source named in the reason. An existing flag, or an environment where the flag was ever switched, is never touched.
-- Additive: the function keeps its signature and its return shape.

CREATE OR REPLACE FUNCTION public.sync_flag_definition_catalog(
  p_key_hash TEXT,
  p_entries JSONB
)
RETURNS TABLE (flag_key TEXT, flag_id UUID, version_id UUID, version INTEGER, created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_key public.active_flag_sync_keys%ROWTYPE;
  v_row RECORD;
  v_environment TEXT;
  v_snapshot BIGINT;
BEGIN
  SELECT * INTO v_key
  FROM public.active_flag_sync_keys key
  WHERE key.key_hash = p_key_hash;
  IF NOT FOUND THEN RETURN; END IF;

  BEGIN
    FOR v_row IN
      SELECT imported.flag_key AS key, imported.flag_id AS id, imported.version_id AS vid,
             imported.version AS ver, imported.created AS is_new
      FROM public.import_flag_definition_catalog(
        v_key.project_id,
        p_entries,
        format('catalog sync from %s', v_key.flag_sync_source),
        v_key.flag_actor_user_id
      ) imported
    LOOP
      IF v_row.is_new THEN
        FOREACH v_environment IN ARRAY ARRAY['development', 'preview', 'production'] LOOP
          -- Always true for a flag this sync just created; kept so no future caller can switch a set environment.
          IF NOT EXISTS (
            SELECT 1 FROM public.flag_environment_activations activation
            WHERE activation.project_id = v_key.project_id
              AND activation.environment = v_environment
              AND activation.flag_id = v_row.id
          ) THEN
            -- The same lock `set_flag_activation` takes, held first so the snapshot read below cannot go stale.
            PERFORM pg_advisory_xact_lock(hashtextextended(v_key.project_id::TEXT || ':' || v_environment, 0));
            INSERT INTO public.flag_environment_states(project_id, environment)
            VALUES (v_key.project_id, v_environment) ON CONFLICT DO NOTHING;
            SELECT state.snapshot_version INTO v_snapshot
            FROM public.flag_environment_states state
            WHERE state.project_id = v_key.project_id AND state.environment = v_environment;
            PERFORM public.set_flag_activation(
              v_key.project_id,
              v_environment,
              v_row.id,
              v_row.vid,
              v_snapshot,
              format('catalog sync from %s: a new flag starts at its default', v_key.flag_sync_source),
              v_key.flag_actor_user_id
            );
          END IF;
        END LOOP;
      END IF;
      flag_key := v_row.key;
      flag_id := v_row.id;
      version_id := v_row.vid;
      version := v_row.ver;
      created := v_row.is_new;
      RETURN NEXT;
    END LOOP;
  EXCEPTION WHEN SQLSTATE '22023' THEN
    -- Drift is a conflict, not malformed input. The HTTP surface maps the SQLSTATE only; it never reflects an
    -- untrusted definition or another tenant's data in its response.
    IF SQLERRM LIKE 'flag catalog semantic drift for %' THEN
      RAISE EXCEPTION 'flag catalog semantic drift' USING ERRCODE = 'P0001';
    END IF;
    RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_flag_definition_catalog(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_flag_definition_catalog(TEXT, JSONB) TO service_role;
