---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-17T19:30:27Z"
slug: proving-workspaces-reading
title: "A reading for proving_workspaces"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 87   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 5    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=7, p25–p75"
hypothesis: "Our North Star's breadth input, proving workspaces, has no reading, so the strategy reads it by hand on 15 Dec. Counting a workspace when one of its bets is proven, without any tenant seeing another, makes it a number we can watch. We'll know when it reads itself."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: 2026-12-15       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "The product owner, reading Golden Frijoles' own North Star"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 98      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: A reading for proving_workspaces

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/proving-workspaces-reading.md`](../../00-ideas/seeds/proving-workspaces-reading.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Our North Star's breadth input, proving workspaces, has no reading, so the strategy reads it by hand on 15 Dec.
The platform records one event in its own project when a bet first reads proven, and inputs learn to count distinct
ids per month, so the number reads itself. Target: 0 → 2 by 2026-12-15 (Daniel, 2026-10-14).


## Platform-first note
Decided 2026-10-14 (Daniel): a self-tracking event, no new scheduler exemption. No tenant observes another: the push
route reads only its own project's previous artifact, and writes one event into the platform's own project (the
`scheduleFirstEventActivation` shape). Rule #2: Golden Frijoles' North Star is public, so the workspace id is an
HMAC and never shown.


## What already exists (reuse, don't rebuild)
- `apps/web/app/api/v1/roadmap/push/route.ts` (the previous artifact, D16), `apps/web/lib/roadmap-artifact-schema.ts`.
- `apps/web/lib/self-track.ts`, the `after()` pattern in `apps/web/app/api/v1/track/route.ts`.
- `apps/web/lib/north-star.ts` (`computeDailySeries`), `lib/north-star-schema.ts`, `lib/north-star-query.ts`,
  `20260716100000_north_star.sql`; `Roadmap/00-strategy/north-star.md`; `frijoles north-star set`.


## Architecture lock (2026-10-17, verified against live code and live data)

Live data read before the lock (production, `slweidgffcfndnskcskc`): `proving_workspaces` exists on `golden-frijoles`
as `external_push` with **0** pushed values; `leading_inputs` holds 11 rows (10 `external_push`, 1 `telemetry_event`);
the latest roadmap artifact of both pushing projects (`golden-frijoles` v486, `aomx` v32) carries **no** `proven`
verdict, so nothing is backfilled by accident; `SELF_SUBJECT_SECRET` is listed in Vercel production (its value is
proven only by a live event after the deploy, LEARNINGS' empty-value gotcha).

**Scope the live system disproved, corrected out loud:**
- **There is no `north_star_inputs` table** (sprint-1.md S1.2). The inputs live in `leading_inputs`
  (`20260716100000_north_star.sql`); the column goes there.
- **The sync refuses the switch S1.3 needs.** `lib/north-star-sync.ts` rejects any change to an existing input's
  `value_source` ("Cannot change value_source of an existing input"), and the CLI's dry run says `refused`. S1.3 as
  written would 400. Corrected by D7.
- **`/api/v1/public/north-star` is feature-scoped** (`?project=&feature=`, `getFeatureImpact` through
  `feature_inputs`), and `proving_workspaces` is linked to no feature, so smoke step 4's URL cannot show it. The
  public read of an input is the anonymous connector's `get_input_readings` (D10).
- **A running monthly count read "latest on or before" a day reads last month's number** when this month has no
  event yet: `inputReadings` (`lib/input-readings.ts`) takes the last point ≤ `to`, which is exactly how the 15 Dec read
  is taken. Corrected by D8's reset point.

**Decisions**
- **D1 — The transition rule** is one pure function, `newlyProvenEpics(previousItems, items)` in
  `lib/proven-transition.ts` (no server-only import, unit-tested). Epic rows only (`grain === 'Epic'`), matched by
  `slug`; newly proven = `verdict === 'proven'` now and the previous row absent or not `proven`. No previous artifact
  (a project's first push) → every proven epic counts. The previous read **failed** → nothing is sent: an unknown
  previous cannot prove a transition, and inventing one would count a workspace in a month it proved nothing. An
  unchanged push returns before this (D16), so it sends nothing.
- **D2 — Emit after the store, inside `after()`.** Only once `push_report_artifact` succeeded, and only when D1 found
  something and the secret is set, the deferred task reads the pushing project's own `workspace_id`
  (`projects` by `auth.projectId`: one project, its own) and sends one `workspace_proved_bet` per newly proven epic
  through `trackSelfEvent`, at most 10 per push (more add nothing to a distinct count). **No tags, no metadata:** the
  epic slug is the tenant's data and the self project is public (rule #2). The push's answer never waits.
- **D3 — The subject** is `HMAC-SHA256(key = SELF_SUBJECT_SECRET, message = workspace_id)`, hex, from
  `workspaceSubject()` in the same file. A missing or blank secret returns `null` and nothing is sent or read. Not a
  gate (rule #6 is about gates; this is a secret).
- **D4 — Vocabulary:** `WORKSPACE_PROVED_BET_EVENT = 'workspace_proved_bet'` in `lib/self-track-events.ts`,
  mapped in `EVENT_FEATURE` to a new `PROVING_SIGNAL_KEY = 'proving_workspaces'` (the `Record` makes a missing row a
  build error). The North Star read filters by event, not feature, so no registry row is required for the reading.
- **D5 — Migration** `20261019100000_leading_inputs_aggregate.sql`: `leading_inputs.aggregate TEXT NOT NULL DEFAULT
  'count' CHECK (aggregate IN ('count','distinct_monthly'))` plus `CHECK (aggregate = 'count' OR value_source =
  'telemetry_event')`. A constant default is metadata-only on PG17; 11 rows all become `count`. Expand-only: the old
  code ignores the column, so the push precedes the merge safely.
- **D6 — Sync schema:** `aggregate` optional, `count | distinct_monthly`, refused on `external_push`
  (`lib/north-star-schema.ts`). The sync writes `aggregate ?? 'count'`: the file is the truth, so dropping the key
  reverts the input. `listNorthStar` returns `aggregate` and `pushedValues`.
- **D7 — The one value-source switch allowed:** `external_push → telemetry_event` while the input has **no**
  `input_values` rows (nothing pushed can go invisible, which is what the guard protects). Every other change is still
  refused. The CLI's `planSync` says `switches to telemetry_event (nothing was pushed)` for it and compares `aggregate`
  for `updated`; CLI 1.11.0, **npm publish owed** (Daniel's 2FA). S1.3's sync runs the repo-built CLI, so nothing waits.
- **D8 — The series:** `computeDistinctMonthlySeries(events, sourceEvent, now)` beside `computeDailySeries`
  (`lib/north-star.ts`): each day with an event reads the distinct `userId`s from the 1st of its UTC month through
  that day, **and the 1st of every later month through `now`'s month reads 0 when it has no event of its own** — so
  "latest on or before 15 Dec" is December's number, never November's. `readInputSeries` selects `user_id` only for
  `distinct_monthly`; the `count` path is unchanged and pinned by a spec over a fixed sequence.
- **D9 — Surfaces:** `FeatureImpactInput` and the readings view carry `aggregate`; the North Star page labels the input
  `from your events · distinct per month`.
- **D10 — The public read** is the anonymous connector's `get_input_readings` (series is `{date, value}` only). A spec
  pushes a real proven transition from a fresh tenant, then reads the self project's input over the anonymous
  connector and asserts the count and that the subject string appears nowhere in the reply. Smoke step 4 is amended
  to it.
- **D11 — CI** (shared surface, done first): `.github/actions/e2e-on-server/action.yml` exports a random
  `SELF_SUBJECT_SECRET` beside the self key; specs compute the expected subject from it.
- **D12 — Routing:** tenancy, a migration and a request path: the architect (Opus) builds every story in place, one
  branch and one PR (one sprint, no review boundary inside it), nothing delegated. Review: `review-route.mjs`
  (general + security lens), plus the fresh `verifier` (high risk).
- **D13 — Rollout:** `supabase db push` before the merge, verified live; merge (deploys code and the secret);
  confirm the deploy; sync `north-star.md` with the repo CLI; read `proving_workspaces` back.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Emit on proven · S1.2 Distinct per month · S1.3 The input switched | high |

## Deploy order
`SELF_SUBJECT_SECRET` is in Vercel production (added 2026-10-14) and reaches the functions with this epic's merge.
S1.2's migration is `supabase db push`ed before the merge. S1.3's sync runs after the deploy.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
