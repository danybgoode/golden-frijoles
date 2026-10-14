-- many-products · Sprint 1, Story 1.1 (Roadmap/02-commercial/many-products — lock D1).
--
-- `projects_one_per_creator_idx` (20260721100000) was a signup double-click guard: two confirmation callbacks for one
-- account must produce ONE project. It also made every account own at most one product, which is the limit this epic
-- removes. The guard now covers only the product SIGNUP creates, marked by `from_signup`.
--
-- ── One migration, safe in either deploy order ──────────────────────────────────────────────────────────────────────
-- The column DEFAULTS to true. The running code's signup insert never names it, so its rows are guarded before AND after
-- the deploy that ships `createProductForUser` — the one writer that sets it false, explicitly. The index keeps its
-- NAME, so `CREATOR_CONSTRAINT` in lib/provisioning.ts (which tells the creator race from a taken slug) is unchanged.
--
-- Hand-seeded rows (`created_by IS NULL`) are set false: they were never a signup, and the index ignores them either way.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS from_signup BOOLEAN NOT NULL DEFAULT true;

UPDATE projects SET from_signup = false WHERE created_by IS NULL AND from_signup;

-- Drop and recreate under the same name, in this migration's one transaction: there is no instant without the guard.
DROP INDEX IF EXISTS projects_one_per_creator_idx;
CREATE UNIQUE INDEX projects_one_per_creator_idx
  ON projects(created_by) WHERE created_by IS NOT NULL AND from_signup;

COMMENT ON COLUMN projects.from_signup IS
  'true = the product a signup created (one per account, projects_one_per_creator_idx). false = created later, or hand-seeded.';
