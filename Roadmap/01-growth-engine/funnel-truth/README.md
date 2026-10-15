---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building                   # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-15T13:49:03Z"
slug: funnel-truth
title: "Funnel truth"
area: 01-growth-engine
risk: high
type: feature
sprints_total: 2
stories_total: 8   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 84   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 49    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 68
quote_basis: "L, n=7, p25–p75"
hypothesis: "A funnel today is one number per period, and Targeted is always everyone. Showing it by the month people first got the feature, aimed at a named segment, lets founders judge a bet over its whole life. We'll know when members open funnel trends."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "members who opened a funnel trend in the last 30 days (funnel_trend_viewed)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 3       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, judging whether a shipped bet is working"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "It is how a bet's verdict gets read honestly (proven_bets), but no North Star input counts funnel reads directly."   # only with grounded: false
flag_key: bets.funnel_trend_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: funnel_trend_viewed
retained_event: null
retention_days: null
satisfied_event: null
build_order: 93      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Funnel truth

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/funnel-truth.md`](../../00-ideas/seeds/funnel-truth.md)
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
A funnel today is one number per period, and Targeted is always everyone. This draws a flagged feature's funnel by
the month people first got it, back to its first exposure, and lets a bet aim at a named segment, so a founder
judges a bet over its whole life for the people it was meant for (Daniel, 2026-10-12). We'll know when members open
funnel trends: 0 → 3 within 30 days of shipping.


## Platform-first note
The model is finished: `computeFunnel` (`lib/flag-funnel.ts`) already follows cohorts with `since`, and every funnel
reads through it (tars-one-model D3). The trend is that model per period; a segment replaces one line
(`targeted = base`). Rule #1 holds (no new event table: segments are definitions over `events`); the tenancy
invariant holds (one project per read, segments per project). Bets on `everyone` keep today's numbers.


## What already exists (reuse, don't rebuild)
- `apps/web/lib/flag-funnel.ts`, `apps/web/lib/flag-funnel-read.ts` (`FLAG_FUNNEL_ROW_CAP`), `apps/web/lib/tars-query.ts`.
- `apps/web/design-system/charts` (`SmallMultiple`, `Plot`, `ChartUnreadable`).
- `apps/web/app/app/flags/[projectSlug]/[flagKey]/feature-panes.tsx`, the Hub epic page.
- Connector `get_tars_funnel` (`apps/web/app/api/v1/public/mcp/c/[token]/route.ts`), `packages/cli`, `lib/self-track.ts`,
  `lib/membership.ts`, `lib/gates.ts`.
- `apps/web/lib/roadmap-artifact-schema.ts` (`target_segment`).


## Architecture lock (D1…D16) — verified against live code and live data, 2026-10-15

**Live data at the lock** (prod `slweidgffcfndnskcskc`, read-only): the largest project holds **366 events in total**
(golden-frijoles), so no read is within 1% of `FLAG_FUNNEL_ROW_CAP` (50,000). golden-frijoles has **zero
`flag_evaluated` rows**: no measured flag funnel there has a single exposure. Its registry features are `activation`,
`methodology_reading`, `setup_guide` (seeded, all 2026-07-16). No `segments` table exists; every pushed bet carries
`target_segment: everyone`. `bets.flag_funnels_enabled` is `on v1` in production.

**Scope the live system corrects (said out loud):**
- **The flag page's Funnel tab is a registry-feature funnel, not a flag-exposure one.** It calls
  `getFeatureFunnelByProjectId(…, flag.key, …)` (a feature registered under the flag's key). The Hub epic page reads
  the *flag* funnel (`flag_evaluated` exposures + the card's measure). They are two sources of the one model and give
  different numbers, so sprint 1's smoke step 3 ("the same numbers") is corrected below: each surface shows its own
  source's trend, and the CLI/connector read the **registry** source (the connector's `get_tars_funnel` already takes a
  `featureKey`).
- **This epic's own bet funnel cannot fill.** `lib/gates.ts` never reports gate evaluations as `flag_evaluated`, so the
  epic page's flag funnel for `bets.funnel_trend_enabled` reads "not exposed" (as owed-on-screen's does). The target is
  read from `funnel_trend_viewed` people directly (`target_metric` is free text, `grounded: false`). Not fixed here.
- **The SQL-aggregation path is not built.** A feature whose life holds more than 50,000 adoption events reads every
  period `unreadable` with the reason (D3). Nothing live is near it; seeded as a follow-up if one gets close.

### Sprint 1 — the trend
- **D1 · Cohort periods.** `computeFunnelTrend(events, rule, measure, { by, now, baseActivity? })` in
  `lib/flag-funnel.ts`. A period is a UTC calendar month or an ISO week (Monday 00:00 UTC). Periods run from the one
  holding the first exposure to the one holding `now`, gaps included (a gap is exposed 0, a real zero). Each period is
  `computeFunnel` with `since = start`, `until = end`. **`until` is new on `computeFunnel`**: it bounds cohort
  membership (first exposure in `[since, until)`), the base and adopted-without-exposure; adoption, retention and
  satisfaction still follow the cohort to the last event read. `until` absent is today's output exactly (a spec runs the
  existing fixtures through both). Σ periods' `exposed` = the `all` funnel's `exposed` (a spec).
- **D2 · Maturing.** A period is `maturing` when `end + retentionDays > now` (the current period always is). Its
  retained and satisfied are never drawn as points; the table says "still maturing". Adoption is drawn.
- **D3 · The bounded read.** `readFunnelTrend(client, projectId, source, measure, by, now, { rowCap? })` in
  `lib/flag-funnel-read.ts`: the same three reads as `readFunnel` (exposures, the measure's events, the base), sharing
  its query builders, one project, from the first exposure to now, each bounded by `FLAG_FUNNEL_ROW_CAP` (`rowCap` only
  for the spec). Completeness is derived per period from where each cut landed, never guessed:
  exposures are read ascending, so a cut at arrival time T makes **every period ending after T** unreadable; the
  measure's events follow every cohort to now, so **a cut there makes every period** unreadable; the base is read
  newest first, so a cut at T makes **every period starting before T** unreadable. A period's base is the people with an
  event arriving in `[start, end)`. Cuts are by arrival (`created_at`) while a period is placed by `occurred_at ??
  created_at`, as `readFunnel` does; a backfilled event older than its arrival is the known skew. A second, beside the
  funnel only (verifier, #378): when exposures are cut, someone first exposed after the cut who adopted unexposed in an
  earlier, read period and again after that exposure still counts as adopting without it there; the stages are exact.
- **D4 · Shape.** `FunnelTrendRead = { state: 'not_exposed' } | { state: 'measured', by, from, to, periods }`, each
  period `{ label, start, end, maturing } & ({ state: 'read', funnel } | { state: 'unreadable', reason })`. Cached by
  `getFunnelTrend` in `lib/event-catalog-query.ts` (same seconds and key shape as `getFunnel`, plus `by`).
  `getFeatureFunnelTrendByProjectId` in `lib/tars-query.ts` is the registry-feature entry (the flag page, `/app/funnel`,
  the CLI, the connector); `getFlagFunnelTrend` the flag entry (the epic page).
- **D5 · On screen.** `funnelTrendView` (pure, `lib/flag-funnel-view.ts`) → `FunnelTrend`
  (`components/product/FunnelTrend.tsx`): one `SmallMultiple` per stage — *Got it* (people), *Adopted* (% of those who
  got it), *Retained* (% of adopters), *Satisfied* only when measured — whose series holds read periods only (and, for
  retained/satisfied, mature ones only); an unreadable period is never a point and is named under the chart in words
  (`ChartUnreadable`). A table under it gives every period's numbers (the seed's table), "still maturing" or "couldn't
  be read: <reason>". A `By month · By week` choice (`?by=`, default month) sits beside the period choice; the trend
  ignores `period` (it is the whole life by definition).
- **D6 · The gate.** `GATES.funnelTrend = { key: 'bets.funnel_trend_enabled', envVar: 'FUNNEL_TREND_ENABLED', fallback:
  false }` (an enablement, born dark), `isFunnelTrendEnabled()` in `lib/flags.ts`, a row in `ci/gates.on.env` /
  `gates.off.env`, created with `frijoles flags create bets.funnel_trend_enabled --enablement --all-envs` (production
  must print `off v1`). It gates the trend on the flag page's Funnel tab, `/app/funnel/…` (one component, two mounts) and
  the Hub epic page (there also behind `bets.flag_funnels_enabled`), and S2.4's segment screens. Off = each page exactly
  as today.
- **D7 · `funnel_trend_viewed`.** A new `SelfTrackEvent` mapped to `hub_engagement` (as `owed_viewed`), fired with
  `after()` once per page view that rendered a trend, **only for a signed-in member of that project** (person = their
  user id). An anonymous reader of the public project sees the trend and fires nothing.
- **D8 · Agents.** `GET /api/v1/cli/funnel?project=&feature=&by=` (`requireCliMember`, one project) → `frijoles funnel
  <feature-key> [--by month|week] [--project] [--json]`, a table of period · got it · adopted · retained or JSON; not
  flag-gated. The connector's `get_tars_funnel` gains optional `by: 'month' | 'week'`: present → the same period rows
  (`trend`) instead of one funnel; the anonymous public reader's reply still passes `scrubToolText` (counts only, no
  ids). The CLI version bumps minor; npm publish is the product owner's 2FA step.

### Sprint 2 — segments
- **D9 · Where a segment lives.** Migration `20261017100000_funnel_truth_segments.sql`: `segments (id uuid pk,
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE, key text, event text, min_count int, days int,
  created_by uuid, created_at, updated_at, UNIQUE (project_id, key))`; `key` is kebab (`^[a-z0-9]+(-[a-z0-9]+)*$`,
  ≤ 48) and never `everyone`; `min_count` 1–10,000; `days` 1–365. RLS on with no policies, `REVOKE ALL … FROM PUBLIC,
  anon, authenticated`, `GRANT … TO service_role`. The cascade means `purge_deleted_project` needs no new line (checked:
  its explicit deletes are only for FK-less tables). Applied with `supabase db push` before the S2 merge.
- **D10 · Defining one.** `POST /api/v1/cli/segments` (`requireCliOwner`: an owner defines, as North Star and
  scenarios writes) upserts by key and answers the definition plus its share; `GET` (`requireCliMember`) lists them.
  `frijoles segments define <key> --event <e> --min <n> --days <d>` and `frijoles segments ls`. `everyone` is reserved
  and always listed first with share 100%.
- **D11 · Who is in it.** Pure `segmentMembers(events, def, at)`: the people with at least `min_count` of `event`
  arriving in `(at − days, at]`. For a funnel, `at` = the period's end, capped at now. The share is
  `|base ∩ members| / |base|` over the last 30 days' base.
- **D12 · Targeted is the segment.** `computeFunnel` takes optional `segment: ReadonlySet<string>`; `targeted = base ∩
  segment` replaces `targeted = base`, and the cohort is already `∩ targeted`. Exposed people outside the segment and
  their adoptions go in an `outside: { exposed, adopted }` field that exists **only** when a segment is given, so an
  `everyone` funnel is byte-identical (a spec deep-equals the existing fixtures). The trend passes each period's
  segment. The read fetches the segment's event over `[first exposure − days, now]` under the same cap; a cut there
  makes the funnel unreadable with the reason.
- **D13 · A bet names it.** `target_segment` in `roadmap-artifact-schema.ts` accepts `everyone` or a D9 key;
  `hub-board`'s `targetSegment` widens to `string`; `scripts/lib/roadmap-contract.mjs` (and its `skills/` copy) and the
  CLI's `bet.ts` stop refusing a key. An unknown key pushes fine and reads on screen as "This bet targets <key>, which
  this project hasn't defined", with no funnel numbers — never as everyone. The refine seed template's comment names
  the option (a `skills/` change, so a plugin + kit release).
- **D14 · On screen.** ~~`/app/segments/[projectSlug]`~~ **Amended 2026-10-15 (architect, during S2.4):** a "Segments"
  section on Journeys (Measure, member-gated, beside the bets' funnels), behind D6, rendered only once the project has
  defined a segment. A new `/app/<x>/[projectSlug]` route must be a classified rail surface, and a new rail item would
  change the approved Measure rail; the section leaves every approved default state untouched. It lists each segment's
  rule and its share of the last 30 days' active people. Each funnel's Targeted row reads "Targeted: everyone" or
  "Targeted: power-users, 18% of active people", and "N exposed outside power-users (M adopted): beside the funnel, not
  in its rates". Registry-feature funnels name no segment: they are `everyone`.

### Process
- **D15 · Stack and routing.** `feat/funnel-truth` (S1) → `feat/funnel-truth-s2` (S2), one PR each, in place (one
  session in this checkout). The architect (Opus) builds the high-risk seams itself — D1–D4, D9–D12 — and the gate
  (D6). Lower-risk surface stories may go to a Sonnet builder with this README as its contract. Every PR: the fresh
  `verifier` (mandatory, high risk) plus `review-route.mjs` (general + security lens on the paths).
- **D16 · Releases owed to the product owner.** CLI on npm after S1 (`funnel`) and S2 (`segments`); plugin + kit after
  S2 (D13's template comment).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Cohort periods · S1.2 Honest bounded read · S1.3 On the flag and epic pages · S1.4 CLI + connector | high |
| 2 | S2.1 Segment definitions (migration) · S2.2 Targeted = the segment · S2.3 The bet names it · S2.4 On screen | high |

## Deploy order
Sprint 1 ships behind `bets.funnel_trend_enabled` (off in production until the product owner sets it on); the CLI
and connector reads aren't flag-gated. Sprint 2's migration is `supabase db push`ed before its merge. Two releases owed
to the product owner: the CLI on npm (S1.4, S2.1) and the plugin for the seed template's comment (S2.3).


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
