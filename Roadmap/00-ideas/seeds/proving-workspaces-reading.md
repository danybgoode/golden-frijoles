---
title: "A reading for proving_workspaces"
slug: proving-workspaces-reading
status: scaffolded
area: "01"
type: feature
appetite: S
underwritten_by: wave-2026-10
risk: high
epic: "01-growth-engine/proving-workspaces-reading"
build_order: 98
updated: 2026-10-14
intent_ask: verbatim
hypothesis: "Our North Star's breadth input, proving workspaces, has no reading, so the strategy reads it by hand on 15 Dec. Counting a workspace when one of its bets is proven, without any tenant seeing another, makes it a number we can watch. We'll know when it reads itself."
persona: "The product owner, reading Golden Frijoles' own North Star"
grounded: true
grounded_reason: null
target_metric: proving_workspaces
target_from: 0
target_to: 2
read_date: 2026-12-15
flag_key: null
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
intent_match: 87
---

# Pitch — a reading for proving_workspaces

Moves: proving_workspaces · Tests: Value proposition (a workspace proves a bet with evidence)

## The ask, as given

> Spike question: which design reads it without one tenant observing another, and is it worth an exemption?
> — Raised 2026-10-09 by Daniel at setup-drafts-strategy's Plan gate.

### Claims
1. `proving_workspaces` gets a reading.
2. No tenant observes another's data.
3. No new tenancy exemption (decided 2026-10-14).

**Teach-back:** yes — the either/or was put in plain words on 2026-10-14 and Daniel chose the self-tracking event.

## Problem

`proving_workspaces` (workspaces with at least one proven bet this month, `Roadmap/00-strategy/north-star.md`) is an
`external_push` input that nobody pushes. Counting workspaces is a cross-tenant read, which AGENTS.md forbids on any
request path, and the scheduler exemption excludes "just a count across tenants" by name.

Re-read 2026-10-14: a telemetry input is computed by `computeDailySeries` (`lib/north-star.ts`), a plain **daily count**
of an event. "Distinct workspaces this month" isn't a count of events, and `/track` has no idempotency key, so the
emitter can't send exactly once per workspace per month without reading Golden Frijoles' own events on the tenant's
request path (a second project on that path).

## Appetite

S: one sprint, three stories.
quote: $5–17 (S, n=7, p25–p75)

## The design

1. **Emit on the transition.** `POST /api/v1/roadmap/push` already reads the project's previous artifact (D16). For
   each epic whose `verdict` becomes `proven` in this push (it wasn't in the previous one), send
   `workspace_proved_bet` to Golden Frijoles' own project through `trackSelfEvent`, inside `after()`, with
   `userId = HMAC-SHA256(workspace_id, SELF_SUBJECT_SECRET)`. It's the same shape as `scheduleFirstEventActivation`
   (`app/api/v1/track/route.ts`): the platform writes one event into its own project; the tenant reads nothing.
2. **Count distinct subjects per month.** Telemetry inputs gain `aggregate: 'count' | 'distinct_monthly'` (default
   `count`, so every existing input is unchanged). `distinct_monthly` gives each day the running number of distinct
   `userId`s since the 1st of its month. One column, one function beside `computeDailySeries`.
3. **Switch the input.** `north-star.md`'s sync payload: `proving_workspaces` becomes `telemetry_event`,
   `sourceEvent: workspace_proved_bet`, `aggregate: distinct_monthly`, synced with `frijoles north-star set`.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| emit `workspace_proved_bet` on a verdict's first `proven` | the platform records what happened, in its own project |
| HMAC'd workspace id | the public project's readers can't map it back |
| `aggregate: distinct_monthly` on telemetry inputs | "workspaces this month", not "events per day" |
| the input switched and synced | the North Star reads it by itself |

## Scope

**In v1:** the three parts above, and a spec that the public connector never shows the hashed id.
**Out of v1 (no-gos):** a backfill (decided 2026-10-14: proven verdicts before this ships don't count); any read of a
tenant's data by the platform; a new scheduler exemption; the other three `external_push` inputs (their own ideas).

## Rabbit holes

- **The push re-sends the whole board.** Only a transition counts (previous artifact not `proven`, this one
  `proven`), and duplicates are harmless anyway because the reading counts distinct ids.
- **A revoked verdict** (`proven` → `unclear`) emits nothing and removes nothing; the month already counted it. Said in
  the input's description.
- **The secret.** `SELF_SUBJECT_SECRET` is a new server env var: set in Vercel production, then a commit to `main`
  (rule #4). Without it, nothing is emitted, and the push still succeeds.
- **The public project.** Golden Frijoles' funnels and North Star are public (rule #2). The input's daily value is a
  count, and the scrub (`lib/public-connector-scrub.ts`) must never emit the event's `userId`.
- **Golden Frijoles is a workspace too.** Its own proven bets count; it's one workspace among the rest.

## What already exists (reuse, don't rebuild)

- `app/api/v1/roadmap/push/route.ts` (the previous artifact, D16), `lib/roadmap-artifact-schema.ts` (`verdict`).
- `lib/self-track.ts` (`trackSelfEvent`), the `after()` pattern in `app/api/v1/track/route.ts`.
- `lib/north-star.ts` (`computeDailySeries`), `lib/north-star-schema.ts` (`valueSource`), `lib/north-star-query.ts`,
  `20260716100000_north_star.sql` (`north_star_inputs`).
- `Roadmap/00-strategy/north-star.md` (the sync payload), `frijoles north-star set`.

## Kill-switch / runtime gate

**None: carve-out.** It adds one event in the platform's own project and a counting mode no existing input uses;
without the secret it emits nothing. Rollback is `git revert`.

## Acceptance criteria

- **S1.1** (high): a push where an epic's verdict newly reads `proven` sends exactly one `workspace_proved_bet` to the
  self project, with the HMAC'd workspace id, after the response; a push with no transition sends none; no secret,
  none; the push's answer never waits on it. An api spec on a seeded previous artifact.
- **S1.2** (high): a migration adds `aggregate` to `north_star_inputs` (`count` default); `distinct_monthly` counts
  distinct `userId`s from the 1st of each month; pure specs (month boundary, duplicates, two subjects); every existing
  input's series is unchanged (pinned).
- **S1.3** (low): `proving_workspaces` switched in `north-star.md` and synced; the public connector shows the count and
  no hashed id (spec).
- QA: api + pure specs; the product owner sets the secret (a server env var, then a commit to `main`).

## Open risks / research

- Decided 2026-10-14 (Daniel): target 0 → 2 proving workspaces by 2026-12-15 (a); `SELF_SUBJECT_SECRET` added to Vercel production by the agent, live with the next commit to `main` (b).

## Decision (Daniel, 2026-10-14): a self-tracking event, no exemption

When any workspace records a **proven** verdict, the server also logs one event into Golden Frijoles' own project
(`SELF_PROJECT_SLUG`) through the existing self-tracking path, the way signups are already tracked. The event carries
only an opaque workspace id. `proving_workspaces` then becomes an ordinary **single-project** read: distinct workspace
ids with a proven event this month, in Golden Frijoles' own project.

- **No new scheduler exemption and no tenancy amendment.** Nothing reads across tenants. The platform writes one
  event into its own project at the moment a tenant acts, and no tenant observes anything.
- **No backfill, by choice:** proven verdicts recorded before this ships don't count.
- Rejected: an opt-in push (undercounts), a new cron exemption (AGENTS.md names "just a count across tenants" as
  forbidden, and it would set a precedent), and reading it by hand (manual every month, never on screen).

Reclassified from spike to feature (S): the spike's question is answered. Refining should confirm where a verdict
becomes "proven" (`lib/roadmap-result.ts`, the result record's verdict) and that the opaque id can't be reversed
by a public reader of the golden-frijoles project (rule #2: its funnels are public).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/proving-workspaces-reading.md
  coverage in   0.96  (3 claims)
  coverage out  0.77  (4 criteria)
  clarity       0.76  (4 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.41  (advisory, not in the total: rewrite the Why as a story)
Total 87 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.96,"coverage_out":0.768,"clarity":0.763,"teach_back":1,"total":87} -->
