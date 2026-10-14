---
title: 'A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged'
slug: delivery-stale-reclaim-uncounted
status: ready
area: '01'
type: bug
appetite: S
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-14
intent_ask: proxy      # the ask is the verify-spike model's finding F2, ranked #1 by Daniel on 2026-10-14
hypothesis: null
persona: null
grounded: null
grounded_reason: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
intent_match: 83
---

# Pitch — a stale reclaim charges the attempt it presumes was made

Moves · Tests: neither — a correctness bug on the live delivery path. Why: keeps event delivery bounded and honest.

## The ask, as given

> A delivery whose settle keeps failing is re-sent every 5 minutes, uncounted and unlogged
> — the seed's title (verify-spike finding F2), ranked #1 of the consolidated backlog by Daniel, 2026-10-14

### Claims
1. A delivery that was sent but never settled is not re-sent without limit.
2. Every presumed send is counted against the retry budget.
3. The operating view shows it (an attempt row), not 0 attempts.

**Teach-back:** <yes | partly | no> — "You want a stuck delivery to stop reaching the customer's endpoint after its retry budget,
and every presumed send to show in the attempt log, so a partial database failure can't silently spam a customer."

## Problem

**Reproduction** (from the Quint counterexample, re-read against the code 2026-10-14):
1. A delivery is claimed (`claim_deliveries`, `20260724100000_delivery_retry.sql:32`): `in_flight`, `claimed_at = now`.
2. The dispatcher sends the webhook (`lib/delivery-dispatch.ts` `sendAndSettle`).
3. `settle_delivery` fails (the function dies, or the RPC errors; `settleDelivery()` returns null). The row stays
   `in_flight`, and `attempt_count` was never incremented.
4. 5 minutes later (`STALE_CLAIM_MS`), the claim's stale branch (`:61`) reclaims it **with `attempt_count` untouched**.
5. Repeat: the same event reaches the customer every 5 minutes. `attempt_count` stays 0, `event_delivery_attempts`
   stays empty, and the destination's health shows nothing.

**Root cause:** only `settle_delivery` increments `attempt_count`, and the stale reclaim assumes the lost worker made
no attempt. The retry budget (`MAX_ATTEMPTS = 6`, `lib/retry-policy.ts`) is enforced only at settle time, so a row
that never settles never meets it. No later migration redefines `claim_deliveries` (checked 2026-10-14).

**Severity:** low likelihood, since the error text reaching settle is fixed transport text, so a receiver can't trigger
it. It needs a partial DB failure where settle keeps failing while claim keeps succeeding. High impact when it
happens: unbounded duplicate sends that no screen shows.

## Appetite

S, one session (a fixed-scope bug). The fix is already model-checked (`quint/outbox_timed_fixed`, 14 steps, no other
invariant regresses).
quote: $5–17 (S, n=7, p25–p75)

## Outcome & signal

A row reclaimed stale has `attempt_count + 1` and an `unconfirmed` attempt row. A stale row whose charged count reaches
`MAX_ATTEMPTS` goes `dead` instead of being sent again. Proven by the regression spec below, plus the Quint check
re-run against the shipped SQL's shape.

## Stage-2.5 bucket

Light enhancement: one SQL function changes plus one dispatcher argument. Nothing new on screen.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `claim_deliveries` stale branch: `attempt_count + 1` | the lost worker presumably sent: charge it |
| …and `dead` when the charged count reaches `p_max_attempts` | the budget must hold even when settle never lands |
| `p_max_attempts` param, passed from `MAX_ATTEMPTS` | one budget, defined once in TS |
| an `unconfirmed` row in `event_delivery_attempts` per charged reclaim | attempt log and `attempt_count` agree, the health view sees it |
| regression e2e spec | the bug can't come back silently |

## Scope

**In v1:** the migration (new `claim_deliveries` signature: drop the old one, `REVOKE` from PUBLIC/anon/authenticated,
`GRANT` to service_role); the outcome constraint gains `unconfirmed`; the dispatcher passes the budget; the regression
spec; the existing function-level-denial spec moves to the new signature.
**Out of v1 (no-gos):** knowing *whether* the lost worker actually sent (a send-intent stamp before the request:
bigger, and the model doesn't need it); changing `STALE_CLAIM_MS`; any UI change; the verify-module CI jobs (that's
`verify-module`'s first slice).

## Rabbit holes

- **Over-charging.** A row can go stale without having been sent: the worker died before the send, or a deadline
  release failed. Charging it costs one attempt of budget it didn't use. Accepted: stale rows are rare, the budget is
  6, and replay resets it. The alternative (a send-intent stamp) is the no-go above.
- **The pathological loop still churns.** If settle *and* the dead-letter keep failing, the row is reclaimed every
  5 min, but it's **dead-lettered in the claim itself**, so it is never re-sent. That's the property that matters.
  The claim's UPDATE must set `dead` in the same statement, never return the row for TS to decide.
- **Signature change ordering.** `supabase db push` before the merge (AGENTS Workflow). The old dispatcher calling the
  new 5-arg function would fail between push and deploy, so either keep a 4-arg overload for the deploy window, or
  default `p_max_attempts` (`DEFAULT 6`) so the old call shape still resolves. Prefer the DEFAULT, and drop it in a
  later contract step (expand/contract).
- `projects_with_due_work` (the one registered scheduler exemption) **is not touched**: its predicate is unchanged,
  and it still returns bare `project_id`s.

## What already exists (reuse, don't rebuild)

- `claim_deliveries`, `settle_delivery`, `event_delivery_attempts` (append-only by grant),
  `20260724100000_delivery_retry.sql`; the settle redefinition in `20260726100000_fanout_serialization.sql`.
- `lib/delivery-dispatch.ts` (`STALE_CLAIM_MS`, the claim RPC call at `:134`), `lib/retry-policy.ts` (`MAX_ATTEMPTS`,
  `retryDecision`).
- Specs: `e2e/delivery-replay.spec.ts` (seeds stale `in_flight` rows already, `:506`), `e2e/destinations.spec.ts:323`
  (the function-level denial for `claim_deliveries`).
- The Quint model and trace: `Roadmap/09-platform-infra/verify-spike/` (`DECISION.md`, `quint/check.sh`).
- The delivery health view `20260725100000_delivery_health.sql` counts every outcome in `total_attempts`.

## UX heuristics & rails check

- **CI guards covering this surface:** the `api` e2e suite (delivery specs), the function-level-denial spec, the
  semantic-lint `tenancy` rule (unchanged: still one `project_id` per claim).
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** none (no UI).

## Kill-switch / runtime gate

**None: carve-out.** The fix changes a SQL function, so a flag can't select between two function bodies. The existing
`delivery.destinations_enabled` gate (`lib/gates-decision.ts`) already stops the whole dispatcher in ~30 s if
something goes wrong. Rollback is a forward migration restoring the old body plus `git revert`.

## Acceptance criteria

**S1.1: A stale reclaim charges the presumed attempt and respects the budget** (risk: high)
- A row `in_flight` past `STALE_CLAIM_MS` at `attempt_count = MAX_ATTEMPTS - 2` is claimed, and comes back with
  `attempt_count = MAX_ATTEMPTS - 1` and one `unconfirmed` attempt row.
- The same row at `MAX_ATTEMPTS - 1` is **not** returned by the claim. It is `dead`, with one `unconfirmed` attempt row
  and `last_error` naming the presumed loss.
- A due `pending`/`failed` row is claimed exactly as before: no charge, no attempt row.
- `claim_deliveries` called as anon/authenticated is denied at the function level (the existing spec, new signature).
- The old 4-argument call still resolves during the deploy window (`p_max_attempts DEFAULT 6`).
- QA: e2e in `delivery-replay.spec.ts` (api project, the always-on gate). No browser smoke: there's no UI, and the
  walkthrough is the spec run plus `supabase migration list` showing the migration applied in production before the
  merge.

## Open risks / research

- The Quint model used `MAX_ATTEMPTS = 3`. The code uses 6, and the fix is parametric in the budget.
- Whether the health page should count `unconfirmed` as a *failure* is decision (a) at the gate; by default it lands
  only in `total_attempts`.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/delivery-stale-reclaim-uncounted.md
  coverage in   0.95  (3 claims)
  coverage out  0.71  (6 criteria)
  clarity       0.82  (6 criteria)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
Total 83 / 100 — uncalibrated · signals: coverage in, coverage out, clarity
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
Untraced (trace it to the ask or cut it):
  criterion 4 (0.44): "`claim_deliveries` called as anon/authenticated is denied at the function level (the exis…"
```

<!-- intent-match: {"coverage_in":0.947,"coverage_out":0.712,"clarity":0.824,"teach_back":null,"total":83} -->
