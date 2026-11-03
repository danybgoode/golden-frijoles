---
epic: traffic-relaunch
sprint: 2
title: "Pages that answer questions"
risk: low
phase: In review
stories_total: 3
stories:
  - id: S2.1
    title: "Guides, comparisons and a glossary, from one content module"
    as_a: "a founder searching for how to build with agents"
    i_want: "pages that answer my question directly"
    so_that: "I find Golden Frijoles from search or an AI assistant"
    risk: low
    status: done
  - id: S2.2
    title: "Answers search engines and assistants can quote"
    as_a: "a founder asking an AI assistant or Google"
    i_want: "the answer quoted with its source"
    so_that: "I land on the page that answered me"
    risk: low
    status: done
  - id: S2.3
    title: "The outage post-mortem, on our own domain"
    as_a: "a founder who heard about the outage"
    i_want: "the numbers and what changed"
    so_that: "I trust a product that measures its own worst weekend"
    risk: low
    status: planned
---
# Traffic relaunch — Sprint 2: Pages that answer questions

**Status:** 🟡 2.1–2.2 in review · 2.3 waits for Daniel's numbers and his call on naming the host

## Stories

### Story 2.1 — Guides, comparisons and a glossary, from one content module ✅ `2a1a75d`
**As** a founder searching for how to build with agents, **I want** pages that answer my question directly, **so
that** I find Golden Frijoles from search or an AI assistant.
**Acceptance:**
- One typed module (`lib/content-library.ts`, the `lib/methodology-chapters.ts` pattern) holds every entry: section,
  slug, title, description, the one-line answer, body, FAQ pairs, and the date it was last edited by hand (a real
  date, so the sitemap can carry it honestly).
- Routes `/guides`, `/compare`, `/glossary` (index + `[slug]`), built with the methodology's components and the design
  system. Each page opens with the answer, then the command where there is one.
- `lib/public-routes.ts` feeds every entry into `sitemap.xml` and `llms.txt`; the absolute URLs come from
  `getSiteUrl()` (rule #5). Every entry passes the marketing-path allow-list, so the S1.1 consent rule applies.
- First entries, drafted from the deck's keyword clusters (Daniel approves the copy in review):
  - **Guides:** what comes after spec-driven development; how to measure feature adoption rate; A/B tests and feature
    flags from Claude Code.
  - **Compare:** spec-driven tools vs outcome-driven development; Golden Frijoles vs PostHog for a solo founder.
    Fair, dated, sourced.
  - **Glossary:** North Star metric, TARS funnel, kill switch, outcome-driven development, proven bet, agentic product
    management.
- The route sweep (mobile) and the design-system rails cover the new routes; `positioning-surfaces.spec.ts` still passes.
**Risk:** low.

### Story 2.2 — Answers search engines and assistants can quote ✅ `fe76118`
**As** a founder asking an AI assistant or Google, **I want** the answer quoted with its source, **so that** I land on
the page that answered me.
**Acceptance:**
- Guides and compare pages carry `FAQPage` JSON-LD built from the entry's FAQ pairs; glossary pages carry
  `DefinedTerm` inside a `DefinedTermSet`. A canonical URL and OG/Twitter metadata on every page (the existing
  `opengraph-image` pattern).
- A unit spec validates the JSON-LD shape for every entry in the module (so a new entry can't ship malformed).
**Risk:** low.

### Story 2.3 — The outage post-mortem, on our own domain
**As** a founder who heard about the outage, **I want** the numbers and what changed, **so that** I trust a product
that measures its own worst weekend.
**Acceptance:**
- The post-mortem is an entry at `/guides/outage-2026-11`, from the draft produced in the planning session
  (2026-11-03), with the numbers read via `frijoles events count` (S1.4) and approved by Daniel. A line we cannot
  support is cut, never estimated.
- Naming the host and the other project follows Daniel's call (the draft keeps both generic).
- It links to the methodology and `/install`; each video cut points here with its own `utm_content`.
**Risk:** low.

## Sprint QA
- **api spec(s):** a route spec that every `content-library` entry renders 200 and is in `sitemap.xml`; the JSON-LD
  unit spec (2.2).
- **browser smoke owed:** no money or auth step. Daniel reads the copy in review.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Open https://goldenfrijoles.com/guides
   → three guides plus the post-mortem, each with a one-line answer.
2. Open https://goldenfrijoles.com/guides/outage-2026-11
   → the numbers you approved; no `[__]` left anywhere.
3. Open https://goldenfrijoles.com/sitemap.xml
   → every guide, compare and glossary URL is listed.
4. Paste https://goldenfrijoles.com/glossary/north-star-metric into https://search.google.com/test/rich-results
   → a valid DefinedTerm, no errors.
5. In Search Console, URL Inspection on https://goldenfrijoles.com/guides → Request indexing
   → "URL added to priority crawl queue".

If any step fails, note the step number + what you saw — that's the bug report.
