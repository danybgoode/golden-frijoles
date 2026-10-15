---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
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
