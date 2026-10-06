-- account-from-the-terminal · Sprint 3 — a connector URL can carry the person who made it (epic D11, D12).
--
-- Expand-only: two NULLABLE columns, no backfill. Every URL that exists today keeps created_by NULL
-- and therefore stays exactly what it is — project-scoped and read-only. Only a URL minted after this
-- deploy, by a signed-in owner, names a person; the route then offers the flag write tools AS that
-- person while they are still an owner of the URL's project (re-checked on every request).
--
-- ON DELETE SET NULL, not CASCADE: deleting the account must not silently delete a project's URL
-- (other people may use it); it turns the URL back into a read-only one, which is the safe direction.

ALTER TABLE connector_tokens
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- "Turns green the first time it's used" (S3.2). Credential hygiene like cli_tokens.last_used_at:
-- stamped on resolve, throttled to once a minute, never read for authorization.
ALTER TABLE connector_tokens
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

COMMENT ON COLUMN connector_tokens.created_by IS
  'The owner who minted this URL (account-from-the-terminal D11). NULL = project-only and read-only, '
  'as every pre-existing URL and every demo-project URL is. Never set for DEMO_PROJECT_SLUG.';
COMMENT ON COLUMN connector_tokens.last_used_at IS
  'Last time the URL resolved, at most once a minute. Display only (Setup › Connections).';
