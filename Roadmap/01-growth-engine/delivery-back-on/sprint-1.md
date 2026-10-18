---
epic: delivery-back-on
sprint: 1
title: "Delivery back on"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "A minute-level waker on the database"
    as_a: "a tenant with a destination"
    i_want: "the dispatcher woken every five minutes on the free Vercel plan"
    so_that: "my events arrive within minutes, not never"
    risk: high
    status: planned
  - id: S1.2
    title: "The July backlog, expired before the flip"
    as_a: "a tenant's receiver"
    i_want: "deliveries stranded since July expired, not sent three months late"
    so_that: "switching delivery on sends fresh events only"
    risk: high
    status: planned
  - id: S1.3
    title: "Switch-on, with Daniel"
    as_a: "the product owner"
    i_want: "a runbook that proves the waker dark before the flag goes on"
    so_that: "a wrong URL or secret never dead-letters a tenant's events"
    risk: high
    status: planned
---
# Delivery back on: a dispatch schedule the free Vercel plan allows — Sprint 1: Delivery back on

**Status:** 🔨 building

## Stories

### Story 1.1 — A minute-level waker on the database
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

### Story 1.2 — The July backlog, expired before the flip
**As a** tenant's receiver, **I want** deliveries stranded since July expired, not sent three months late, **so that**
switching delivery on sends fresh events only.
**Acceptance:**
- A migration sets every `pending | failed | in_flight` row created before 2026-10-17 to `dead`, with
  `last_error = 'expired: delivery was off 2026-07-22 → 2026-10-17'` and `claimed_at = NULL`. A second run changes
  nothing.
- Each expired row is still replayable (`replay_delivery`: `dead → pending`).
**Risk:** high (production data)

### Story 1.3 — Switch-on, with Daniel
**As the** product owner, **I want** a runbook that proves the waker dark before the flag goes on, **so that** a wrong
URL or secret never dead-letters a tenant's events.
**Acceptance:** Daniel runs the runbook below in order. Two scheduled ticks succeed, and a fresh `miyagisanchez` event
gets an attempt within 5 minutes. The poster's F7 "owed" line is cleared.
**Risk:** high (production writes, owed to Daniel by name)

#### The switch-on runbook (owed to Daniel: production writes)
Run each SQL line from `apps/web` with `supabase db query --linked "<sql>"`. It uses the CLI's own auth, so no key goes
in the shell.

1. **Migrations are live:** `supabase migration list` shows this epic's two migrations applied remotely.
2. **The extensions exist:** `select extname from pg_extension where extname in ('pg_cron','pg_net');` → two rows.
3. **Vault secrets.** The bearer is the SAME value as Vercel's `CRON_SECRET`; from now on, rotate both together.
   `select vault.create_secret('https://goldenfrijoles.com/api/internal/dispatch-deliveries', 'dispatch_deliveries_url');`
   `select vault.create_secret('<CRON_SECRET>', 'dispatch_deliveries_cron_secret');`
4. **Dark tick** (flag still off): `select public.dispatch_tick();` → a request id. A few seconds later,
   `select status_code, content from net._http_response order by created desc limit 1;` → `200` and
   `{"enabled":false,…}`. A `401` means the bearer differs from Vercel's `CRON_SECRET`: fix that before going on.
5. **The backlog is expired:** `select status, count(*) from event_deliveries group by status;` → no `pending`,
   `failed` or `in_flight` rows created before 2026-10-17.
6. **The receiver is still there** (Miyagi):
   `curl -s -X POST https://miyagisanchez.com/api/webhooks/golden-beans -d '{}'` → `{"error":"Invalid signature"}`
   means the secret is loaded. `{"error":"Unauthorized"}` means it is gone: stop. A 401 is permanent and would
   dead-letter every delivery.
7. **Flag on:** `frijoles flags get delivery.destinations_enabled` (expect `off vN` in production), then
   `frijoles flags set delivery.destinations_enabled --value true --env production`, then `get` again → `on vN+1`.
8. **Watch two ticks:**
   `select status, return_message, start_time from cron.job_run_details order by start_time desc limit 2;` → both
   `succeeded`, and `net._http_response` → `200` with `"enabled":true`.

**Rollback:** `frijoles flags kill delivery.destinations_enabled --env production` (lands within 30 s), and/or
`select cron.unschedule('dispatch-deliveries');`.

## Sprint QA
- **api spec(s):** `e2e/delivery-waker.spec.ts` (S1.1: no-op, one POST, function-level denial; S1.2: the expiry is
  idempotent and replayable). Pure guard: `lib/delivery-timing.test.ts` (no `crons` in any `vercel.json`; pg_net
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
