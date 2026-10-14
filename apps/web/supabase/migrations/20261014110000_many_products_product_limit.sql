-- many-products · Sprint 1, Story 1.2 (lock D2, amended 2026-10-14 by the product owner: "Cap per account").
--
-- One product per signup is gone (D1), and every product carries its own monthly_event_quota, so an uncapped create
-- would multiply an account's quota. The cap lives on the account's OWN workspace — the one createProductForUser
-- creates into — as data, like the quota: raising one person's ceiling is an UPDATE, never a deploy.
--
-- Expand-only: a new column with a default, read by code that ships after it.

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS product_limit INTEGER NOT NULL DEFAULT 10;

ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_product_limit_range;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_product_limit_range CHECK (product_limit BETWEEN 0 AND 1000);

COMMENT ON COLUMN workspaces.product_limit IS
  'How many products this workspace may hold (many-products). createProductForUser refuses past it; raise it with an UPDATE.';
