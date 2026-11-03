---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-11-03T22:23:49Z"
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

## Architecture lock (D1–D10) — verified against live code 2026-11-03

- **D1 · The region decision is made in the middleware, never in the layout.** Reading `headers()` in the root layout
  would make every route dynamic, including the static ones. The marketing pages already pass through
  `middleware.ts` (they mint the visitor id there). On a marketing path the middleware reads `CF-IPCountry` and sets a
  session cookie `gf_cr` = `ask` | `load` on the request and the response. It is not httpOnly, because
  `ConsentManager` reads it on mount. The cookie carries no country and no expiry. Off the matcher nothing changes.
  *Deviation from the pitch:* the pitch said "a prop from the layout". The lock moves it to the middleware for this reason.
- **D2 · One pure helper owns the list.** `lib/consent-region.ts` exports `OPT_IN_COUNTRIES` (EU-27, IS, LI, NO, GB,
  CH, BR, CA) and `consentMode(country: string | null): 'ask' | 'load'`. Any value that is not two letters A–Z, plus
  `XX` and `T1`, returns `ask`. It also exports `consentRequiredFromCookie(value)`: only the exact value `load` returns
  false, so a missing or tampered cookie means ask. Fail closed in both directions.
- **D3 · A stored answer wins over the region default.** `analyticsAllowed(stored, required)` returns
  `stored.choice === 'granted'` when there is an answer, else `!required`. The banner opens on its own only when
  there is no answer AND `required`. "Cookie settings" opens it everywhere. Choosing no after analytics ran still
  reloads. The marketing-path gate and every off-list reload rule in `ConsentManager` are untouched.
- **D4 · The country is never stored or sent.** It is not in an event, a tag, a log line or the cookie.
- **D5 · Source attribution is tags on the existing events (rule #1).** The beacon sends a raw `source` object: the
  four `utm_*` params from `location.search` and `document.referrer`. A pure `lib/visit-source.ts → sanitizeSource()`
  on the server keeps lowercased values matching `[a-z0-9._-]{1,64}`. It reduces the referrer to its host and drops
  our own host (via `getSiteUrl()`). It adds `source` = `utm_source` ?? `ref_host` ?? `direct`. The tags ride
  `landing_visited` (`trackVisitorEvent` gains an optional `tags`) and both methodology events, merged with `chapter`.
  `landing-copy` stays tagless. The route's "always 200" contract holds: bad input drops a tag and never errors.
- **D6 · Privacy copy has one home, `lib/legal.ts`.** The analytics section states the five-region rule. The cookie
  list gains `gf_cr`, through `STORAGE_NAMES` and its spec. The processor list replaces Vercel with Oracle Cloud
  (hosting) behind Cloudflare. `LEGAL_UPDATED` moves to the merge date.
- **D7 · Event counts read through the canonical seam.** `lib/event-catalog-query.ts → countEvents(projectId, event,
  { days, byTag })` reads `created_at` and `tags` for one project and one event in the window, in pages of 1000. The
  index scan is project_id-prefixed (no index covers event without a subject; corrected at review). A cap of 100,000 rows returns `truncated: true`, never a short
  number presented as whole. It buckets by UTC day, and with `byTag` by that tag's value (`(none)` when absent).
  `days` runs 1–90, default 30. `byTag` must match `[a-z0-9_]{1,40}`. The route is `app/api/v1/cli/events/route.ts`
  (the `cli/funnel` shape: `requireCliMember`, 404 for a non-member, one project resolved server-side). The CLI is
  `packages/cli/src/commands/events.ts` → `frijoles events count`. No connector change (CLI-first).
- **D8 · No migration, no flag, no new gate, no public read path.** Rules #1, #2 and #6 hold by construction.
  Rollback is `git revert`.
- **D9 · The S2 content routes join the marketing paths.** `/guides`, `/compare` and `/glossary` with their prefixes
  are added to `lib/marketing-paths.ts` AND the middleware matcher; the existing spec pins the two lists together. So the
  visitor id, the region cookie and the consent rule apply there too.
- **D10 · Branches.** S1 is `feat/traffic-relaunch` → PR into main. S2 is `feat/traffic-relaunch-s2`, stacked on S1,
  merged after it. Models: this session (Opus) builds S1, because 1.1 and 1.4 are high risk. S2 copy is drafted here,
  and Daniel approves the copy in review.

### Sprint 1 build contract (locked by the architect before the builder started)
Cite D1–D8. Specs: `lib/consent-region.test.ts`, `lib/visit-source.test.ts`, the day-bucketing unit, the
`e2e/consent.spec.ts` extension (header `CF-IPCountry: MX` → no banner + GA4/Clarity; `DE` and none → banner), the
self-visit tag spec, and `e2e/cli-events.spec.ts` (member → counts; non-member → 404).

### Sprint 2 build contract
Cite D9. One typed module `lib/content-library.ts` feeds the routes, `lib/public-routes.ts` (sitemap + llms.txt) and
the JSON-LD. A unit spec validates every entry's JSON-LD. Copy is approved by Daniel in review.

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
