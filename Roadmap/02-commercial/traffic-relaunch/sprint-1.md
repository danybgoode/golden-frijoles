---
epic: traffic-relaunch
sprint: 1
title: "Count every visitor and its source"
risk: high
phase: In review
stories_total: 4
stories:
  - id: S1.1
    title: "The consent banner only where the law asks for it"
    as_a: "the founder reading the numbers"
    i_want: "GA4 and Clarity to load without a banner outside the EU/EEA, UK, Switzerland, Brazil and Canada"
    so_that: "I count the visitors I lose today, and the ones the law covers are still asked first"
    risk: high
    status: done
  - id: S1.2
    title: "Every visit carries its source"
    as_a: "the founder running the campaign"
    i_want: "each landing and methodology visit tagged with its UTM params or referrer host"
    so_that: "each video, search and community gets credit for the visitors it sent"
    risk: low
    status: done
  - id: S1.3
    title: "The privacy page says what we do"
    as_a: "a visitor"
    i_want: "the privacy page to state the region rule and name our real host"
    so_that: "what we say matches what the product does"
    risk: low
    status: done
  - id: S1.4
    title: "Count an event from the terminal"
    as_a: "a member of a project (or their agent)"
    i_want: "frijoles events count <event> [--days N] [--by <tag>]"
    so_that: "I can read visits per day and per source without opening a dashboard"
    risk: high
    status: done
---
# Traffic relaunch — Sprint 1: Count every visitor and its source

**Status:** 🟡 in review

## Stories

### Story 1.1 — The consent banner only where the law asks for it ✅ `512e6d4`
**As** the founder reading the numbers, **I want** GA4 and Clarity to load without a banner outside the EU/EEA, UK,
Switzerland, Brazil and Canada, **so that** I count the visitors I lose today, and the ones the law covers are still
asked first.
**Acceptance:**
- A pure helper `lib/consent-region.ts` → `consentRequired(country: string | null): boolean`. True for the EU-27,
  EEA (IS, LI, NO), GB, CH, BR, CA, and for null, empty, `XX`, `T1` or anything not two letters. Unit spec covers each
  group plus MX, US, JP → false.
- The root layout reads `CF-IPCountry` server-side and passes `consentRequired` to `ConsentManager`. The country is
  never computed client-side, never stored, and never sent in an event.
- `consentRequired === false` on a marketing path: GA4 + Clarity load on first render, no banner. Clarity gets
  `consentv2` analytics granted. "Cookie settings" in the footer still opens the banner; choosing no stores `denied` and
  reloads without the scripts (a stored `denied` wins over the region default).
- `consentRequired === true`: behaviour exactly as today (deny by default, banner).
- Off marketing paths nothing loads, whatever the country (`lib/marketing-paths.ts` unchanged).
- `e2e/consent.spec.ts` extended: with `CF-IPCountry: MX` → no banner, GA4 + Clarity tags present; with `DE` and with
  no header → banner, no tags. The existing specs stay green (no header in CI = unknown = banner).
- Production check: `curl -sI https://goldenfrijoles.com/` shows the HTML is not cached by Cloudflare
  (`cf-cache-status` DYNAMIC or BYPASS), and the origin receives `CF-IPCountry`.
**Risk:** high (privacy and legal surface; security lens on the review).

### Story 1.2 — Every visit carries its source ✅ `be918b0`
**As** the founder running the campaign, **I want** each landing and methodology visit tagged with its UTM params or
referrer host, **so that** each video, search and community gets credit for the visitors it sent.
**Acceptance:**
- `SelfTrackBeacon` sends `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` from the URL, and the referrer's
  host when it is not our own domain.
- `self-visit/route.ts` validates each one (lowercased; `[a-z0-9._-]`; at most 64 characters; anything else dropped,
  never stored) and passes it as `tags` to `trackSelfEvent` (rule #1: no new route, no direct insert). `ref_host` is a
  host only, never a path or query.
- A visit with no UTM and no external referrer is tagged `source=direct`.
- Unit spec on the sanitiser (pure function in `lib/`); api spec: POST with tags → event recorded with them; POST with
  a 200-character or `<script>` value → that tag absent.
**Risk:** low.

### Story 1.3 — The privacy page says what we do ✅ `4a45479`
**As** a visitor, **I want** the privacy page to state the region rule and name our real host, **so that** what we say
matches what the product does.
**Acceptance:**
- `lib/legal.ts`: "Analytics, only with your yes" is rewritten to state the rule. In the EU/EEA, UK, Switzerland,
  Brazil and Canada we ask first. Elsewhere GA4 and Clarity load on our public pages, and "Cookie settings" turns them
  off. They never load inside the console.
- The processors list names our hosting as our own server (Oracle Cloud) behind Cloudflare, not Vercel.
- The page's "last updated" date moves; `legal.test.ts` is updated and green.
**Risk:** low (copy, but legal: Daniel reads it in review).

### Story 1.4 — Count an event from the terminal ✅ `02828c7`
**As** a member of a project (or their agent), **I want** `frijoles events count <event> [--days N] [--by <tag>]
[--json]`, **so that** I can read visits per day and per source without opening a dashboard.
**Acceptance:**
- A CLI read route (beside `app/api/v1/cli/funnel`), authed the same way: the PAT/session resolves the user,
  `lib/membership.ts` checks the project, a non-member gets "not found". One project, resolved server-side, never from
  the body.
- The count comes from a new function in `lib/event-catalog-query.ts` (rule #1: the canonical read seam, no ad hoc
  `events` query). It returns one row per day, and with `--by <tag>` one row per tag value. `--days` defaults to 30,
  maximum 90.
- `packages/cli`: a new `events count` command with plain table output and `--json`; `frijoles --help` lists it; the
  CLI golden tests are updated.
- The read appears in the connector only if it already exposes event reads; otherwise it is out of scope (CLI-first).
- Specs: an api spec (member → counts, non-member → 404, `--by utm_source` groups) and a unit spec on the query's
  day bucketing.
- Release: the CLI version bump is in the PR; the npm publish (2FA) is owed to Daniel by name.
**Risk:** high (authed read path).

## Sprint QA
- **api spec(s):** 1.1 → `e2e/consent.spec.ts` (extended); 1.2 → `e2e/self-visit*.spec.ts` (extended or new); 1.4 →
  a new `e2e/cli-events.spec.ts`. Pure specs: `lib/consent-region.test.ts`, the UTM sanitiser, the day bucketing.
- **browser smoke owed:** yes, to Daniel. The two regions need two real network exits (step 1 and 2 below).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. On your phone (Mexico, mobile data), open https://goldenfrijoles.com/?utm_source=smoke&utm_medium=test
   → no cookie banner; the page works as before.
2. With a VPN exit in Germany, open https://goldenfrijoles.com/ in a private window
   → the cookie banner shows; nothing else changed.
3. Back in Mexico, scroll to the footer, click "Cookie settings", choose No
   → the page reloads; the banner does not come back on the next page.
4. Open https://goldenfrijoles.com/privacy
   → the analytics section names the five regions; hosting says our own server, not Vercel.
5. In a terminal: `frijoles events count landing_visited --days 7 --by utm_source --project golden-frijoles`
   → a row for `smoke` with at least 1 (from step 1).
6. (auth, owed to Daniel) Signed in, open https://goldenfrijoles.com/app
   → no banner, no GA4 or Clarity in the page source (the console is never a marketing path).

If any step fails, note the step number + what you saw — that's the bug report.
