---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: delivery-back-on
title: "Delivery back on: a dispatch schedule the free Vercel plan allows"
area: 01-growth-engine
risk: high
type: bug
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 84   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 20
quote_basis: "S, n=12, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: null   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 100     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Delivery back on: a dispatch schedule the free Vercel plan allows

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/delivery-back-on.md`](../../00-ideas/seeds/delivery-back-on.md)
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
Keeps event delivery working. A tenant who creates a destination should receive their events within minutes; since
2026-07-22 nobody has, because nothing wakes the dispatcher. The free Vercel plan allows a cron at most once a day, so
the waker moves to the database we already run.

## Platform-first note
Delivery is fully modelled (outbox, claim, retry, dead-letter, replay, `delivery_health`). This epic adds no delivery
logic: only the thing that calls `/api/internal/dispatch-deliveries` changes, from a Vercel cron that was never
registered to Supabase `pg_cron` + `pg_net`. The route stays the one registered caller of `projects_with_due_work()`
(AGENTS.md scheduler exemption: function and caller unchanged; only the registry's *Caller* note names the waker).

## Decisions
- **D1 — the waker is pg_cron + pg_net** (Daniel approved the plan, 2026-10-17, recommended option): free, minute-level,
  no new service. Vercel Pro stays open as a later money decision.
- **D2 — the July backlog is expired, not sent** (approved with the plan): rows become `dead` with an `expired:` reason,
  each still replayable by the operator.
- **D3 — the switch-on is Daniel's** (Vault secrets + flag flip are production writes): the runbook in sprint-1 is owed
  to him by name.
- **D4 — `*/5`, not every minute:** the route's 240 s tick budget keeps ticks from overlapping at 5 min.

## What already exists (reuse, don't rebuild)
- `app/api/internal/dispatch-deliveries/route.ts` — `CRON_SECRET` bearer, fail closed, gate check, GET + POST.
- `lib/delivery-dispatch.ts`, `lib/deliveries.ts` — dispatcher, enumeration, replay, health.
- `projects_with_due_work()` (`20260724100000`), `claim_deliveries` after #373 (`20261016100000`).
- Status `dead` + `last_error` and operator replay (`dead → pending`).
- Gate `delivery.destinations_enabled` (`lib/gates-decision.ts`) — the kill switch.
- `lib/delivery-timing.test.ts` — the timing-order guard this epic extends.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 A minute-level waker on the database | high |
| 1 | 1.2 The July backlog, expired before the flip | high |
| 1 | 1.3 Switch-on, with Daniel | high |

## Deploy order
1. `supabase db push` the migrations **before** the merge (the waker no-ops until Vault holds its secrets; the
   backlog expiry only touches rows already pending).
2. Merge (the route comment + dead-cron removal + guard ship; no runtime behaviour changes).
3. Daniel's runbook (sprint-1 → Story 1.3): Vault secrets → dark tick proves URL + secret → receiver check → flag on.

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
