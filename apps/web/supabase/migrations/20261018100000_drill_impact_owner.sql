-- drill-impact-for-agents · Sprint 1, Story 1.2 (epic README D4) — the owner door onto impact capture.
--
-- EXPAND-only. Until now a drill's impact could be captured only through a Miyagi `flag_admin` key
-- (`get_scenario_impact_source` / `record_scenario_impact_evidence`, 20260809130000). These two
-- functions are the same pair behind `private.assert_scenario_owner`, the 20260813100000 pattern: the
-- project and actor come from the server (a session or a CLI token), ownership is re-proved here, and
-- only service_role may execute them.
--
-- The key-path functions are NOT touched: the SELECT and the checks are duplicated on purpose, so the
-- live Miyagi path stays byte-identical. An owner has no external (Clerk) actor, so the evidence row
-- and its audit carry `external_actor_id = NULL`, as every owner function's audit row already does.

-- (a) An owner capture has no external actor. The CHECK stays: a NULL passes it, a value must still match.
ALTER TABLE scenario_impact_evidence ALTER COLUMN external_actor_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION private.assert_scenario_impact_owner_run(
  p_project_id UUID,
  p_run_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  -- Owner authoring never reaches an external cohort (every owner facade refuses it); neither does capture.
  IF EXISTS (
    SELECT 1
    FROM public.scenario_runs run
    JOIN public.scenario_definition_versions version
      ON version.project_id = run.project_id AND version.id = run.scenario_version_id
    WHERE run.project_id = p_project_id
      AND run.id = p_run_id
      AND version.definition->>'cohort' = 'external'
  ) THEN
    RAISE EXCEPTION 'external cohort is unavailable to owner authoring' USING ERRCODE = '42501';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION private.assert_scenario_impact_owner_run(UUID,UUID)
  FROM PUBLIC, anon, authenticated, service_role;

-- (b) The source an owner's capture is built from: get_scenario_impact_source with the run scoped by
-- the owner's project instead of the key's project + environment.
CREATE OR REPLACE FUNCTION owner_get_scenario_impact_source(
  p_project_id UUID,
  p_actor_user_id UUID,
  p_run_id UUID,
  p_as_of TIMESTAMPTZ
)
RETURNS TABLE (
  project_id UUID,
  project_slug TEXT,
  scenario_id UUID,
  scenario_version_id UUID,
  scenario_key TEXT,
  scenario_version INTEGER,
  run_revision BIGINT,
  cohort TEXT,
  flag_id UUID,
  flag_version_id UUID,
  flag_key TEXT,
  flag_definition_version INTEGER,
  experiment_id UUID,
  experiment_version_id UUID,
  experiment_key TEXT,
  experiment_definition_version INTEGER,
  technical JSONB,
  related_evidence JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM private.assert_scenario_owner(p_project_id, p_actor_user_id);
  PERFORM private.assert_scenario_impact_owner_run(p_project_id, p_run_id);
  IF p_as_of IS NULL OR p_as_of > statement_timestamp() THEN
    RAISE EXCEPTION 'invalid scenario impact timestamp' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    run.project_id,
    project.slug,
    run.scenario_id,
    run.scenario_version_id,
    registry.key,
    version.version,
    run.revision,
    version.definition->>'cohort',
    version.flag_id,
    version.flag_version_id,
    flag.key,
    flag_version.version,
    version.experiment_id,
    version.experiment_version_id,
    experiment.key,
    experiment_version.version,
    private.scenario_technical_evidence(
      run.project_id, registry.key, version.version, run.id, p_as_of
    ),
    private.scenario_related_evidence(
      run.project_id, ARRAY[registry.key, flag.key], p_as_of
    )
  FROM public.scenario_runs run
  JOIN public.projects project ON project.id = run.project_id
  JOIN public.scenario_definition_versions version
    ON version.project_id = run.project_id
   AND version.scenario_id = run.scenario_id
   AND version.id = run.scenario_version_id
  JOIN public.scenario_registries registry
    ON registry.project_id = version.project_id AND registry.id = version.scenario_id
  JOIN public.flag_registries flag
    ON flag.project_id = version.project_id AND flag.id = version.flag_id
  JOIN public.flag_definition_versions flag_version
    ON flag_version.project_id = version.project_id
   AND flag_version.flag_id = version.flag_id
   AND flag_version.id = version.flag_version_id
  JOIN public.experiment_registries experiment
    ON experiment.project_id = version.project_id AND experiment.id = version.experiment_id
  JOIN public.experiment_definition_versions experiment_version
    ON experiment_version.project_id = version.project_id
   AND experiment_version.experiment_id = version.experiment_id
   AND experiment_version.id = version.experiment_version_id
  WHERE run.project_id = p_project_id
    AND run.id = p_run_id
    AND version.definition->>'kind' = 'resilience'
    AND run.started_at IS NOT NULL
    AND run.started_at <= p_as_of;
END;
$$;

-- (c) Record an owner's evidence: record_scenario_impact_evidence with the run locked by the owner's
-- project, the owner as the actor, and no external actor.
CREATE OR REPLACE FUNCTION owner_record_scenario_impact_evidence(
  p_project_id UUID,
  p_actor_user_id UUID,
  p_run_id UUID,
  p_evidence JSONB,
  p_reason TEXT,
  p_idempotency_key UUID
)
RETURNS TABLE (evidence_id UUID, created_at TIMESTAMPTZ, created BOOLEAN)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_run public.scenario_runs%ROWTYPE;
  v_version public.scenario_definition_versions%ROWTYPE;
  v_scenario_key TEXT;
  v_flag_key TEXT;
  v_flag_version INTEGER;
  v_experiment_key TEXT;
  v_experiment_version INTEGER;
  v_expected_technical JSONB;
  v_expected_related JSONB;
  v_existing public.scenario_impact_evidence%ROWTYPE;
  v_inserted public.scenario_impact_evidence%ROWTYPE;
  v_generated_at TIMESTAMPTZ;
BEGIN
  PERFORM private.assert_scenario_owner(p_project_id, p_actor_user_id);
  PERFORM private.assert_scenario_impact_owner_run(p_project_id, p_run_id);
  IF p_reason IS NULL OR char_length(p_reason) NOT BETWEEN 1 AND 500 OR btrim(p_reason) = ''
     OR p_idempotency_key IS NULL
     OR private.scenario_impact_snapshot_is_valid(p_evidence) IS NOT TRUE
  THEN
    RAISE EXCEPTION 'invalid scenario impact command' USING ERRCODE = '22023';
  END IF;

  SELECT run.* INTO v_run
  FROM public.scenario_runs run
  WHERE run.project_id = p_project_id
    AND run.id = p_run_id
  FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT version.* INTO v_version
  FROM public.scenario_definition_versions version
  WHERE version.project_id = v_run.project_id
    AND version.scenario_id = v_run.scenario_id
    AND version.id = v_run.scenario_version_id;
  IF NOT FOUND OR v_version.experiment_id IS NULL OR v_version.definition->>'kind' <> 'resilience'
  THEN RETURN; END IF;

  SELECT registry.key INTO v_scenario_key
  FROM public.scenario_registries registry
  WHERE registry.project_id = v_run.project_id AND registry.id = v_run.scenario_id;
  SELECT registry.key, version.version INTO v_flag_key, v_flag_version
  FROM public.flag_registries registry
  JOIN public.flag_definition_versions version
    ON version.project_id = registry.project_id
   AND version.flag_id = registry.id
   AND version.id = v_version.flag_version_id
  WHERE registry.project_id = v_run.project_id AND registry.id = v_version.flag_id;
  SELECT registry.key, version.version INTO v_experiment_key, v_experiment_version
  FROM public.experiment_registries registry
  JOIN public.experiment_definition_versions version
    ON version.project_id = registry.project_id
   AND version.experiment_id = registry.id
   AND version.id = v_version.experiment_version_id
  WHERE registry.project_id = v_run.project_id AND registry.id = v_version.experiment_id;

  BEGIN
    v_generated_at := (p_evidence->>'generatedAt')::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'invalid scenario impact timestamp' USING ERRCODE = '22023';
  END;
  IF v_generated_at IS NULL OR v_generated_at > statement_timestamp() OR v_run.started_at IS NULL
     OR v_generated_at < v_run.started_at THEN
    RAISE EXCEPTION 'invalid scenario impact timestamp' USING ERRCODE = '22023';
  END IF;

  v_expected_technical := private.scenario_technical_evidence(
    v_run.project_id, v_scenario_key, v_version.version, v_run.id, v_generated_at
  );
  v_expected_related := private.scenario_related_evidence(
    v_run.project_id, ARRAY[v_scenario_key, v_flag_key], v_generated_at
  );
  IF p_evidence#>>'{scenario,key}' IS DISTINCT FROM v_scenario_key
     OR (p_evidence#>>'{scenario,definitionVersion}')::INTEGER IS DISTINCT FROM v_version.version
     OR (p_evidence#>>'{scenario,runId}')::UUID IS DISTINCT FROM v_run.id
     OR (p_evidence#>>'{scenario,runRevision}')::BIGINT IS DISTINCT FROM v_run.revision
     OR p_evidence#>>'{flag,key}' IS DISTINCT FROM v_flag_key
     OR (p_evidence#>>'{flag,definitionVersion}')::INTEGER IS DISTINCT FROM v_flag_version
     OR p_evidence#>>'{experiment,key}' IS DISTINCT FROM v_experiment_key
     OR (p_evidence#>>'{experiment,definitionVersion}')::INTEGER IS DISTINCT FROM v_experiment_version
     OR p_evidence->>'cohort' IS DISTINCT FROM v_version.definition->>'cohort'
     OR p_evidence->'technical'->'control' IS DISTINCT FROM v_expected_technical->'control'
     OR p_evidence->'technical'->'fault' IS DISTINCT FROM v_expected_technical->'fault'
     OR p_evidence->'relatedEvidence' IS DISTINCT FROM v_expected_related
  THEN
    RAISE EXCEPTION 'scenario impact evidence does not match canonical source'
      USING ERRCODE = '22023';
  END IF;

  SELECT evidence.* INTO v_existing
  FROM public.scenario_impact_evidence evidence
  WHERE evidence.project_id = v_run.project_id
    AND evidence.run_id = v_run.id
    AND evidence.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_existing.evidence IS DISTINCT FROM p_evidence
       OR v_existing.reason IS DISTINCT FROM p_reason
       OR v_existing.actor_user_id IS DISTINCT FROM p_actor_user_id
       OR v_existing.external_actor_id IS NOT NULL THEN
      RAISE EXCEPTION 'impact idempotency key was reused differently' USING ERRCODE = '22023';
    END IF;
    RETURN QUERY SELECT v_existing.id, v_existing.created_at, false;
    RETURN;
  END IF;

  INSERT INTO public.scenario_impact_evidence(
    project_id, scenario_id, scenario_version_id, scenario_version, run_id, run_revision,
    flag_id, flag_version_id, flag_definition_version,
    experiment_id, experiment_version_id, experiment_definition_version,
    evidence, reason, actor_user_id, external_actor_id, idempotency_key
  ) VALUES (
    v_run.project_id, v_run.scenario_id, v_run.scenario_version_id, v_version.version,
    v_run.id, v_run.revision, v_version.flag_id, v_version.flag_version_id, v_flag_version,
    v_version.experiment_id, v_version.experiment_version_id, v_experiment_version,
    p_evidence, p_reason, p_actor_user_id, NULL, p_idempotency_key
  ) RETURNING * INTO v_inserted;
  INSERT INTO public.scenario_lifecycle_audit(
    project_id, scenario_id, scenario_version_id, run_id, target_id,
    action, actor_user_id, external_actor_id, reason, metadata
  ) VALUES (
    v_run.project_id, v_run.scenario_id, v_run.scenario_version_id, v_run.id, v_run.target_id,
    'impact_evidence_recorded', p_actor_user_id, NULL, p_reason,
    jsonb_build_object('evidenceId', v_inserted.id)
  );
  RETURN QUERY SELECT v_inserted.id, v_inserted.created_at, true;
END;
$$;

REVOKE ALL ON FUNCTION
  owner_get_scenario_impact_source(UUID,UUID,UUID,TIMESTAMPTZ),
  owner_record_scenario_impact_evidence(UUID,UUID,UUID,JSONB,TEXT,UUID)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  owner_get_scenario_impact_source(UUID,UUID,UUID,TIMESTAMPTZ),
  owner_record_scenario_impact_evidence(UUID,UUID,UUID,JSONB,TEXT,UUID)
TO service_role;

DO $$
DECLARE v_signature TEXT;
BEGIN
  FOREACH v_signature IN ARRAY ARRAY[
    'public.owner_get_scenario_impact_source(uuid,uuid,uuid,timestamp with time zone)',
    'public.owner_record_scenario_impact_evidence(uuid,uuid,uuid,jsonb,text,uuid)'
  ]
  LOOP
    IF has_function_privilege('anon', v_signature, 'EXECUTE')
       OR has_function_privilege('authenticated', v_signature, 'EXECUTE')
       OR NOT has_function_privilege('service_role', v_signature, 'EXECUTE')
    THEN
      RAISE EXCEPTION 'scenario impact owner function privilege boundary failed for %', v_signature;
    END IF;
  END LOOP;
END;
$$;
