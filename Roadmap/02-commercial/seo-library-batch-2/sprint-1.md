---
epic: seo-library-batch-2
sprint: 1
title: "Ten pages for searches founders already type"
risk: low
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "Eight English pages: comparisons, guides and one term"
    as_a: "a founder comparing tools or learning the method"
    i_want: "a page that answers the exact thing I searched"
    so_that: "I find Golden Frijoles from search"
    risk: low
    status: planned
  - id: S1.2
    title: "Two Spanish pages, linked to their English twins"
    as_a: "a Spanish-speaking founder"
    i_want: "the answer in Spanish"
    so_that: "search sends me the page in my language"
    risk: low
    status: planned
  - id: S1.3
    title: "Daniel approves the copy"
    as_a: "the founder"
    i_want: "to read every new page before it ships"
    so_that: "nothing public says what we wouldn't"
    risk: low
    status: planned
---
# SEO library, batch 2 — Sprint 1: Ten pages for searches founders already type

**Status:** ⬜ not started

## Stories

### Story 1.1 — Eight English pages: comparisons, guides and one term
**As** a founder comparing tools or learning the method, **I want** a page that answers the exact thing I searched, **so
that** I find Golden Frijoles from search.
**Acceptance:**
- **Comparisons:** `compare/spec-kit-alternatives`, `compare/posthog-alternatives-self-hosted`,
  `compare/growthbook-alternatives`.
- **Guides:** `guides/claude-code-plugin-marketplace`, `guides/spec-driven-development-claude-code`,
  `guides/agentic-product-management-tools`, `guides/feature-flags-for-solo-founders`.
- **Glossary:** `glossary/feature-adoption-rate`.
- Every entry opens with its answer and carries JSON-LD (validated by `content-jsonld.test.ts`). The sitemap and
  llms.txt list each one (`library-routes.spec.ts`).
- Every claim about another tool is generic and hedged ("check its site for current plans"). Nothing is quoted that we
  cannot source.
**Risk:** low

### Story 1.2 — Two Spanish pages, linked to their English twins
**As** a Spanish-speaking founder, **I want** the answer in Spanish, **so that** search sends me the page in my language.
**Acceptance:**
- `guides/spec-driven-development-que-es` (es, twin `guides/after-spec-driven-development`) and
  `guides/north-star-metric-ejemplos` (es, twin `glossary/north-star-metric`).
- The entry type gains optional `lang: 'es'` and `twin: { section, slug }`. A Spanish entry renders
  `<article lang="es">`. Both pages of a pair carry `alternates.languages` (hreflang `en` / `es`) pointing at each other.
- A unit spec: every `lang: 'es'` entry names a twin that exists, and the hreflang map is symmetric.
**Risk:** low

### Story 1.3 — Daniel approves the copy
Daniel reads the ten pages on the PR (or its preview) before merge. Any line he rejects is cut or rewritten.

## Sprint QA
- **api spec(s):** `e2e/library-routes.spec.ts` already covers every entry (200, JSON-LD, sitemap, llms.txt). Add the
  `lang="es"` + hreflang check for the Spanish pair.
- **unit:** `content-jsonld.test.ts` (every entry, automatically), plus the twin/hreflang spec (1.2).
- **browser smoke owed:** no. Daniel reads the copy.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `test:unit` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Open https://goldenfrijoles.com/compare
   → five comparisons, three of them new.
2. Open https://goldenfrijoles.com/guides/spec-driven-development-que-es
   → the page in Spanish, opening with its answer.
3. View the page source of step 2
   → `hreflang="en"` pointing at `/guides/after-spec-driven-development`.
4. In Search Console, URL Inspection on https://goldenfrijoles.com/compare → Request indexing.

If any step fails, note the step number + what you saw — that's the bug report.
