-- proving-workspaces-reading · Sprint 1, Story 1.2 (epic README D5) — a telemetry input can count distinct subjects
-- per month instead of events per day.
--
-- EXPAND-only. The column defaults to 'count', which is what every input computed before it existed, so all 11 live
-- rows (2026-10-17) keep their series; code that predates it never reads it. The sprint doc named the table
-- `north_star_inputs`: there is none, the inputs live in `leading_inputs` (corrected at the lock).
--
-- 'distinct_monthly' is a way of counting EVENTS, so an `external_push` input (its values arrive pre-counted in
-- `input_values`) cannot carry it: the second CHECK says so in the database, beside the sync schema's own refusal.

ALTER TABLE leading_inputs
  ADD COLUMN IF NOT EXISTS aggregate TEXT NOT NULL DEFAULT 'count'
    CONSTRAINT leading_inputs_aggregate_known CHECK (aggregate IN ('count', 'distinct_monthly'));

ALTER TABLE leading_inputs
  ADD CONSTRAINT leading_inputs_aggregate_telemetry_only
    CHECK (aggregate = 'count' OR value_source = 'telemetry_event');
