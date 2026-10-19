-- landing-launch-experiment · Sprint 1, Story 1.2 (epic README D5) — the landing variant a workspace came in through.
--
-- EXPAND-only, nullable, no backfill. NULL means "did not come in through the landing A/B": every workspace that exists
-- on 2026-10-19 (4 rows, all Golden Frijoles' own and hand-seeded) correctly reads NULL, and that is what keeps our own
-- bets out of `proving_landing_workspaces` (D6). Written once, when a signup CREATES the workspace
-- (lib/workspace-tenancy.ts → claimWorkspace); nothing updates it afterwards.
--
-- Its one reader is the roadmap push, which reads the pushing project's OWN workspace row (D6). Nothing reads it
-- across workspaces (AGENTS.md § The tenancy invariant).

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS acquisition_variant TEXT
    CONSTRAINT workspaces_acquisition_variant_known CHECK (acquisition_variant IN ('a', 'b'));

COMMENT ON COLUMN workspaces.acquisition_variant IS
  'landing-launch-experiment D5: the landing A/B variant (a|b) this workspace''s founder last saw before signing up; NULL = not acquired through the landing.';
