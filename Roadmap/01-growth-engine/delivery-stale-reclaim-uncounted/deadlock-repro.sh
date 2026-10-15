#!/bin/bash
# delivery-stale-reclaim-uncounted (verifier, PR #373): reproduces the claim-vs-delete_destination
# lock-order deadlock. Run against LOCAL Supabase only: `bash deadlock-repro.sh "$DB_URL"`.
# Fixed claim → "A: done" + "B: 1". Without the destination pre-lock → "B: ERROR: deadlock detected".
# $1 = DB_URL. Sets up a project w/ one destination + one stale in_flight delivery, then races
# A (delete_destination-shaped: dest FOR UPDATE, sleep, update deliveries) vs B (claim).
DB=$1
read PID DID <<<$(psql "$DB" -tA -F' ' <<'SQL'
WITH w AS (SELECT id FROM workspaces LIMIT 1),
p AS (INSERT INTO projects (workspace_id, slug, api_key_hash) SELECT id, 'race-'||gen_random_uuid(), 'h-'||gen_random_uuid() FROM w RETURNING id),
d AS (INSERT INTO event_destinations (project_id, name, enabled, target_url, signing_secret, secret_set_at) SELECT id, 'd', true, 'https://r.example.test/h', 'whsec_race_0123456789abcdef', now() FROM p RETURNING id, project_id),
e AS (INSERT INTO events (project_id, user_id, event) SELECT id, 'u', 'x' FROM p RETURNING id, project_id),
x AS (INSERT INTO event_deliveries (project_id, event_id, destination_id, status, claimed_at) SELECT e.project_id, e.id, d.id, 'in_flight', now() - interval '10 min' FROM e, d RETURNING 1)
SELECT p.id, d.id FROM p, d, x;
SQL
)
( psql "$DB" -v ON_ERROR_STOP=1 -q <<SQL 2>&1 | sed 's/^/A: /'
BEGIN;
SELECT 1 FROM event_destinations WHERE id='$DID' FOR UPDATE \g /dev/null
SELECT pg_sleep(1.5) \g /dev/null
UPDATE event_deliveries SET last_error='drained' WHERE destination_id='$DID';
COMMIT;
SQL
echo "A: done" ) &
sleep 0.5
psql "$DB" -q -tA -c "SELECT count(*) AS claimed FROM claim_deliveries('$PID', 10, now(), 300000, 6)" 2>&1 | sed 's/^/B: /'
wait
psql "$DB" -q -c "DELETE FROM projects WHERE id='$PID'"
