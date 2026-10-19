# Delivery back on: a dispatch schedule the free Vercel plan allows — Retrospective

_Closed: 2026-10-19_
_Intent: yes | mostly | no_
<!-- Owed to Daniel: his one word. -->
_Quote vs actual: quote $8–20 (S, n=12, p25–p75) → actual not measured (`epic-actuals` found no transcripts on this machine) (—)_
_Crew (actual): Opus 5.5 orchestrated and built all three stories · reviewers Codex gpt-5.6-luna xhigh (3 general rounds), agy Gemini 3.8 flash (security lens, scoped to 4 files; gpt-oss returned empty twice), two fresh verifier passes · prose: the orchestrator — as planned_

## What shipped
- **S1.1** (`c22209e`, PR #405 `a7a9d71`): `20261020100000_delivery_waker.sql` — pg_cron job `dispatch-deliveries`
  (`*/5`) runs `dispatch_tick()`, which POSTs `/api/internal/dispatch-deliveries` with the bearer from Vault and fails
  closed (no secret, empty bearer, non-https URL). No API role can call it. The dead `crons` entry is gone and the
  timing guard forbids one. Pushed to production 2026-10-17.
- **S1.2** (`eb462f5`, `6c263c4`, `b8b85ae`): the July backlog expiry, as an ops step
  (`supabase/ops/delivery-backlog-expiry.sql`), one-shot per project. Run 2026-10-18 18:19 UTC: 324 rows expired.
- **S1.3**: the switch-on, by Daniel on 2026-10-18 — new `CRON_SECRET` in Vercel and Vault, flag on (production had
  been on since 2026-10-15), expiry run, then the 18:20 tick delivered 3 fresh Miyagi events (HTTP 202, signature
  verified, non-merchant dropped). The next day: 447 scheduled runs, all succeeded; every retained response `200`.

## What went well
- The platform-first read shrank the bet to one migration: delivery was fully built and only its waker was missing.
- The dark tick by request id and the read-only probes of `vault.secrets` names found the switch-on's one real
  problem (a leading space in a secret's name) in a single query, before any event was sent.
- Two rounds of review moved the expiry out of the migrations and made it one-shot; both were real hazards.

## What we learned
Promoted to `Roadmap/LEARNINGS.md` → *A scheduler the platform won't run, and a secret no one can read*.
- The plan's first runbook said to push both migrations before the merge; that would have fixed the cutoff at push
  time on a migration any agent could push. Pushing order is now free because the one remaining migration is inert.
- The memory note said the flag was off; production had it on since 2026-10-15. Read the flag before trusting a note.
- The runbook claimed nothing else in the project uses pg_net; a response from 2026-10-14 says otherwise. The step 8
  check reads the newest two only, which still works.
- The smoke walkthrough named "open the setup guide" on Miyagi without knowing where that event fires. Name events from
  the event catalog, not from memory.

## Gaps / follow-ups
- Owed to Daniel: the `_Intent_` word above, and the signed-in look at the destinations page (the data is verified
  from the database; the page itself was not opened).
- A waker that goes silent is still only visible by looking (`cron.job_run_details`); alerting was a no-go for v1.
- Daniel's redeploy for the new `CRON_SECRET` was manual, not a commit to `main` (rule #4). It worked; the next merge
  to `main` replaces it either way.
