# A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged — Retrospective

_Closed: 2026-10-14_

Quote vs actual: $5–17 (S, n=7, p25–p75) → ≈$8.77 (claude-opus-5-5, one session; Codex/agy not measured).

## What shipped
- **verify-spike F2 is fixed in production** (PR #373, merge `4304135`, migration `20261016100000` applied before
  the merge). A stale reclaim of an unsettled `in_flight` row is now charged one attempt and logged as `unconfirmed`.
  Once the charged count reaches the budget, the row is dead-lettered **inside the claim** and never handed to the
  sender. A row whose settle never lands is now sent at most `MAX_ATTEMPTS` (6) times, and each presumed send shows in
  the attempt log; `delivery_health` counts it in `total_attempts` only (Daniel, 2026-10-14).
- The budget comes from `lib/retry-policy.ts` (`p_max_attempts: MAX_ATTEMPTS`). `DEFAULT 6` covers the deploy window,
  and the SQL refuses a budget below 1.
- The claim now locks the destinations of its stale candidates (`FOR KEY SHARE`, in id order) **before** any delivery
  row, keeping the subsystem's one lock order. A two-transaction `pg` spec pins it.
- No live row changed: production had 0 `in_flight` rows, and `delivery.destinations_enabled` is still `off v1`.

## What went well
- **The lock was checked against live data first.** Querying prod settled three things before any code:
  - applying the migration dead-letters nothing (0 `in_flight`);
  - criterion 6 needed no SQL (the health view already filtered `retryable|permanent`);
  - the old smoke step (read the cron log) could not exercise the claim, because the gate is off.

  The lock corrected each of these out loud.
- **Every new assertion was watched failing.** There were five mutations: the old body, dead rows returned, no
  REVOKE, no DEFAULT, and no destination pre-lock. Each one turned a spec red.
- **The fresh verifier found the defect that mattered, and found it twice.** The first time was the lock-order edge.
  The second was the deadlock spec itself, which used a sleep and could have passed vacuously on a slow runner.
- **The fix was model-checked before it was built.** The Quint `outbox_timed_fixed` variant holds on all five
  invariants under simulation, and the SQL uses the same `charged >= MAX` rule as the model.

## What we learned
- **Adding an INSERT to a locking function adds every foreign key of the target table to its lock order.** D7 said
  "no new lock-order edge" after checking only the delivery FK. The attempt log also has FKs to `event_destinations`
  and `events` (declared in another migration), so the claim took `KEY SHARE` on the destination after its delivery
  locks: the reverse of `delete_destination`. That was a real `deadlock detected`. Both external passes missed it,
  because they were scoped to the changed files and the FKs live in a migration outside that scope.
- **A concurrency spec that orders transactions with a sleep can pass for the wrong reason.** If the "second"
  transaction wins on a slow runner, `SKIP LOCKED` sidesteps the cycle and the spec stays green with the fix removed.
  Wait on `pg_stat_activity` (`wait_event_type = 'Lock'`) for the blocked backend instead. With that change the spec
  went 5/5 red without the fix and 5/5 green with it.
- **A shared "function-level denial" check that accepts `PGRST202` cannot prove a function exists.** "Function not
  found" also passes it. The re-created signature is now pinned to a real `42501`.

## Gaps / follow-ups
- **Owed to Daniel:** the signed-in look at `/app/destinations/golden-frijoles` (sprint-1 smoke step 6).
- **Contract step (named, not built):** drop `p_max_attempts`' `DEFAULT 6` once the deployed dispatcher has passed the
  budget for a while.
- **Review coverage:** Codex was capped, so both external passes (general and security lens) ran on agy, scoped to
  the migration and the dispatcher. The family independence came from agy's gemini vs gpt-oss models only.
- **Smoke step 4 was run by grant, not by curl:** the production anon key wasn't in the local env, and fetching it
  also prints the service-role secret.
- **Still dark:** `delivery.destinations_enabled` is `off v1`, so the fix matters the day delivery is turned on
  (F7, still owed to Daniel).

## Intent
Did we build what was meant? (owed to Daniel: one word)

_Intent: yes | mostly | no_
