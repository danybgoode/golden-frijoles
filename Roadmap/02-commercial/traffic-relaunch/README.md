---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: traffic-relaunch
title: "Traffic relaunch"
area: 02-commercial
risk: high
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 78   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 33
quote_basis: "M, n=28, p25–p75"
hypothesis: "Founders who search for a better way to build with agents never find us, and the ones who do go uncounted. If we count every visitor, credit the video or search that sent them, and answer what they search, 3 of them will prove a bet by 3 February."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_landing_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 3       # to what, a number
read_date: 2027-02-03       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "Startup founder who owns the product (solo to mid-size), building with coding agents, searching for spec-driven / Claude Code workflows and how to know if a feature paid off"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: everyone   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: landing_visited
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 103     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Traffic relaunch

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/traffic-relaunch.md`](../../00-ideas/seeds/traffic-relaunch.md)
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
After a 79-hour outage, traffic has to restart, and today we can't see it come back. Analytics wait for a yes everywhere,
our own counter records no source, and the site has nothing that answers what founders search. This epic counts every
visitor (asking first only where the law says to), credits each visit to the video, search or community that sent it,
reads those numbers from a terminal, and adds the first guides, comparisons and glossary pages. It is the code half of
the traffic relaunch plan (the deck: https://claude.ai/artifact/Q8xZfceV5VCzZfbfKkoSLv); video, outreach and Buffer are
operations outside it.

## Platform-first note
The growth engine already models visits: `landing_visited` and the methodology events go through
`/api/v1/public/self-visit` → `trackSelfEvent` with groupable `tags`. Source attribution is tags on those same events,
not a new table or pipeline (rule #1). The event count reads through `lib/event-catalog-query.ts`, single-project, behind
`lib/membership.ts`. The consent rule changes only who sees the banner; the marketing-path gate is untouched. No
migration, no new gate (rule #6), no public read path (rule #2).

## What already exists (reuse, don't rebuild)
- `components/consent/ConsentManager.tsx`, `lib/consent.ts`, `lib/marketing-paths.ts`, `lib/analytics-ids.ts`. The banner,
  the loaders and the path gate; gains one input.
- `components/landing/SelfTrackBeacon.tsx` → `app/api/v1/public/self-visit/route.ts` → `lib/self-track.ts` (`tags`).
- `lib/event-catalog-query.ts`, `app/api/v1/cli/funnel` (the authed CLI read pattern), `packages/cli/src/commands`.
- `lib/legal.ts` + `legal.test.ts`: the privacy copy's one source.
- `lib/methodology-chapters.ts`, `lib/public-routes.ts`, `app/sitemap.ts`, `app/llms.txt`, `lib/site-url.ts`. The
  typed-content + sitemap pattern.
- `e2e/consent.spec.ts`, `e2e/consent.authed.spec.ts`: extend, don't replace.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 The consent banner only where the law asks for it | high |
| 1 | 1.2 Every visit carries its source | low |
| 1 | 1.3 The privacy page says what we do | low |
| 1 | 1.4 Count an event from the terminal (`frijoles events count`) | high |
| 2 | 2.1 Guides, comparisons and a glossary, from one content module | low |
| 2 | 2.2 Answers search engines and assistants can quote | low |
| 2 | 2.3 The outage post-mortem, on our own domain | low |

## Deploy order
No migration. S1 ships first: 1.2 (tags) and 1.4 (the count) before the first campaign videos, so the post-mortem's
numbers and every clip's credit are readable. 1.1 + 1.3 merge together (the privacy page must state the rule the day it
goes live). The 1.4 CLI release (npm publish, 2FA) is owed to Daniel. S2 after S1; 2.3 waits for Daniel's numbers and
his call on naming the host.

**Daniel, already done (2026-11-03):** sitemap submitted to Google Search Console and Bing Webmaster Tools.

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
