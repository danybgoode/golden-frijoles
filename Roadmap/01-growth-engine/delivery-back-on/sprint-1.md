---
epic: delivery-back-on
sprint: 1
title: "Delivery back on"
risk: high
phase: In review
stories_total: 3
stories:
  - id: S1.1
    title: "A minute-level waker on the database"
    as_a: "a tenant with a destination"
    i_want: "the dispatcher woken every five minutes on the free Vercel plan"
    so_that: "my events arrive within minutes, not never"
    risk: high
    status: done
  - id: S1.2
    title: "The July backlog, expired before the flip"
    as_a: "a tenant's receiver"
    i_want: "deliveries stranded since July expired, not sent three months late"
    so_that: "switching delivery on sends fresh events only"
    risk: high
    status: done
  - id: S1.3
    title: "Switch-on, with Daniel"
    as_a: "the product owner"
    i_want: "a runbook that proves the waker dark before the flag goes on"
    so_that: "a wrong URL or secret never dead-letters a tenant's events"
    risk: high
    status: planned
---
# Delivery back on: a dispatch schedule the free Vercel plan allows — Sprint 1: Delivery back on

**Status:** 🔍 in review — S1.1 + S1.2 built; S1.3 (switch-on) owed to Daniel after the migrations are pushed

## Stories

### Story 1.1 — A minute-level waker on the database ✅ `c22209e`
**As a** tenant with a destination, **I want** the dispatcher woken every five minutes on the free Vercel plan, **so
that** my events arrive within minutes, not never.
**Acceptance:**
- A migration enables `pg_cron` + `pg_net`, creates `dispatch_tick()` and schedules it `*/5` as job
  `dispatch-deliveries`.
- `dispatch_tick()` reads the URL and bearer from Vault (`dispatch_deliveries_url`, `dispatch_deliveries_cron_secret`).
  If either is missing, or the URL is not `https://`, it sends nothing and returns null.
- No API role can call it (`REVOKE … FROM PUBLIC, anon, authenticated, service_role`), pinned by a spec asserting a
  function-level denial.
- A spec: with no Vault secret, a tick enqueues no request; with both set, it enqueues one POST carrying the bearer.
- No `vercel.json` declares `crons`. `lib/delivery-timing.test.ts` pins that, plus pg_net's timeout and the schedule's
  interval each being ≥ the route's `maxDuration`.
- The route's header comment and the AGENTS registry *Caller* note name the pg_cron waker.
**Risk:** high (migration, shared infra)

### Story 1.2 — The July backlog, expired before the flip ✅ `eb462f5`
**As a** tenant's receiver, **I want** deliveries stranded since July expired, not sent three months late, **so that**
switching delivery on sends fresh events only.
**Acceptance:**
- `apps/web/supabase/ops/delivery-backlog-expiry.sql` (an ops step run once at the switch-on; **not** a migration, so
  no unrelated `supabase db push` can fire it early) sets every `pending | failed | in_flight` row created more than an
  hour before it runs to `dead`, with `last_error = 'expired: queued while delivery was off (2026-07-22 to its
  switch-on)'` and `claimed_at = NULL`. A re-run never rewrites an already-expired row.
- Each expired row is still replayable (`replay_delivery`: `dead → pending`).
**Risk:** high (production data)

### Story 1.3 — Switch-on, with Daniel
**As the** product owner, **I want** a runbook that proves the waker dark before the flag goes on, **so that** a wrong
URL or secret is caught before any tenant event is sent, and a bad first attempt is stopped and replayed.
**Acceptance:** Daniel runs the runbook below in order. Two scheduled ticks succeed, and a fresh `miyagisanchez` event
gets an attempt within 5 minutes. The poster's F7 "owed" line is cleared.
**Risk:** high (production writes, owed to Daniel by name)

#### The switch-on runbook (owed to Daniel: production writes, one sitting)
Run SQL from `apps/web` with `supabase db query --linked "<sql>"` (or `-f <file>`). It uses the CLI's own auth, so no
key goes in the shell. **No secret value is ever typed on a command line:** the bearer goes in through the dashboard.

1. **Before the merge, push the waker:** `supabase link --project-ref <ref> && supabase migration list` →
   `20261020100000` pending, then `supabase db push`, then `supabase migration list` → applied. Then merge PR #405.
2. **The extensions exist, owned right:**
   `select extname, extversion from pg_extension where extname in ('pg_cron','pg_net');` → two rows;
   `select username, schedule, active from cron.job where jobname = 'dispatch-deliveries';` → `postgres`, `*/5 * * * *`;
   `select pg_get_userbyid(proowner) from pg_proc where proname = 'dispatch_tick';` → `postgres`.
3. **Vault secrets** (Supabase dashboard → Project Settings → Vault → *Add new secret*, so the value never touches a
   shell): `dispatch_deliveries_url` = `https://goldenfrijoles.com/api/internal/dispatch-deliveries`;
   `dispatch_deliveries_cron_secret` = the same value as Vercel's `CRON_SECRET`. **Rotate both together** from now on
   (the dashboard's edit, or `vault.update_secret(<id>, …)`). A mismatch shows as `401` in step 4, never a silent pass.
4. **Dark tick** (flag still off): `select public.dispatch_tick();` → a request id `<id>`. A few seconds later,
   `select status_code, content from net._http_response where id = <id>;` → `200` and `{"enabled":false,…}`.
   `401` = the bearer differs from Vercel's; fix it in Vault and repeat.
5. **Expire the backlog:** `supabase db query --linked -f supabase/ops/delivery-backlog-expiry.sql`, then
   `select count(*) from event_deliveries where status in ('pending','failed','in_flight') and created_at < now() -
   interval '1 hour';` → `0`, and `select count(*) from event_deliveries where last_error like 'expired: queued while
   delivery was off%';` → about the 320 the 2026-10-14 read found.
6. **The receiver is still there** (Miyagi):
   `curl -s -X POST https://miyagisanchez.com/api/webhooks/golden-beans -d '{}'` → `{"error":"Invalid signature"}`
   means a secret is loaded; `{"error":"Unauthorized"}` means it is gone: stop. This proves a secret is set, **not**
   that it equals the destination's signing secret — step 8 catches that.
7. **Flag on:** `frijoles flags get delivery.destinations_enabled` (expect `off vN` in production), then
   `frijoles flags set delivery.destinations_enabled --value true --env production`, then `get` again → `on vN+1`.
8. **Watch the first attempts, before walking away:**
   `select a.http_status, a.outcome, a.created_at from event_delivery_attempts a order by a.created_at desc limit 5;`
   → `2xx` / `delivered`. **Any `401`** means the receiver's secret differs from the destination's signing secret, and a
   401 is permanent (those rows go `dead`): kill the flag (below), fix the secret on one side, then replay the dead rows
   from the destination's page. Then two scheduled ticks:
   `select status, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname =
   'dispatch-deliveries') order by start_time desc limit 2;` → both `succeeded`, and
   `select id, status_code, left(content, 200) from net._http_response where id > <id> order by id;` → one `200` per
   tick with `"enabled":true` (no migration here uses pg_net for anything else, so each id after step 4's should be a
   tick).

**Rollback:** `frijoles flags kill delivery.destinations_enabled --env production` (lands within 30 s), and/or
`select cron.unschedule('dispatch-deliveries');`.

## Sprint QA
- **api spec(s):** `e2e/delivery-waker.spec.ts` (S1.1: no-op, one POST, function-level denial; S1.2: the ops expiry never rewrites a
  row twice and stays replayable). Pure guard: `lib/delivery-timing.test.ts` (no `crons` in any `vercel.json`; pg_net
  timeout and schedule interval vs `maxDuration`).
- **browser smoke owed:** yes, to Daniel (signed in): the destinations page shows a fresh *last attempt*.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run the switch-on runbook above, steps 1–8 (owed to Daniel: production writes).
   → step 8 shows two `succeeded` ticks returning `"enabled":true`.
2. Go to https://goldenfrijoles.com/app, open **miyagisanchez**, then its destinations (owed to Daniel: signed in).
   → the `miyagi-merchant-lifecycle` destination shows a *last attempt* less than 5 minutes old.
3. Trigger any tracked action on https://miyagisanchez.com (for example, open the setup guide).
   → within 5 minutes a new attempt appears on that destination, `delivered` (HTTP 202 for a non-merchant event).

If any step fails, note the step number + what you saw — that's the bug report.
