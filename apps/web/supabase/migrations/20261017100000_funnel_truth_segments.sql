-- funnel-truth D9 — where a segment lives. A segment is a BEHAVIOUR rule a project defines: the people who did `event`
-- at least `min_count` times in the `days` before a moment (D11). A bet names one by `key` (D13) and its funnel's
-- Targeted becomes that segment's share of the base (D12). Definitions only: who is in a segment is computed from
-- `events` at read time (rule #1 — no second event table, no stored membership).
--
-- One project per row (the tenancy invariant): every read and write is `project_id`-scoped, resolved server-side by
-- the CLI route's membership check. `everyone` is the implicit segment every project has, so it can never be defined.
-- ON DELETE CASCADE: purge_deleted_project deletes the project row, and the cascade takes its segments with it, so the
-- purge needs no new line (its explicit deletes are for tables with no foreign key to projects).

CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL CHECK (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(key) <= 48 AND key <> 'everyone'),
  event TEXT NOT NULL CHECK (char_length(event) BETWEEN 1 AND 200),
  min_count INTEGER NOT NULL CHECK (min_count BETWEEN 1 AND 10000),
  days INTEGER NOT NULL CHECK (days BETWEEN 1 AND 365),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, key)
);

-- Service role only, enforced at the database: RLS on with no policies, and no table privilege for anyone else, so an
-- anon or authenticated request is refused as a PERMISSION error before any row is considered.
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE segments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE segments TO service_role;
