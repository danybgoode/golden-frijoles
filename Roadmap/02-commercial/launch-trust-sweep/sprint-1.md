---
epic: launch-trust-sweep
sprint: 1
title: "Launch trust sweep: every public surface says Golden Frijoles, on goldenfrijoles.com"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "The public text speaks Golden Frijoles"
    as_a: "a developer who finds Golden Frijoles"
    i_want: "The public text speaks Golden Frijoles: a user README at the root, the poster's licence and host lines, the SDK and CLI READMEs, the landing's GitHub link"
    so_that: "nothing they read contradicts the product or its licence"
    risk: low
    status: planned
  - id: S1.2
    title: "No Vercel host left, and CI keeps it that way"
    as_a: "a developer who finds Golden Frijoles"
    i_want: "No Vercel host is left in the repo outside the tests that check the rule, and CI keeps it that way"
    so_that: "every link and fallback lands on goldenfrijoles.com"
    risk: low
    status: planned
  - id: S1.3
    title: "The loader opens on a different phrase"
    as_a: "anyone moving between pages"
    i_want: "The navigation loader opens on a different phrase each time, and a screen reader hears \"Loading\" once"
    so_that: "the loader feels alive and a screen reader is not flooded"
    risk: low
    status: planned
---
# Launch trust sweep — Sprint 1: every public surface says Golden Frijoles

**Status:** ⬜ not started

## Stories

### Story 1.1 — The public text speaks Golden Frijoles
**As** a developer who finds Golden Frijoles, **I want** the repo and the landing to describe the product as it is,
**so that** nothing I read contradicts the product or its licence.
**Acceptance:**
- Root `README.md` is a user README: one-line pitch, the 30-second quickstart (the paste-this prompt), a screenshot,
  what you get, links, the licence table. Maintainer material moves to `CONTRIBUTING.md`.
- `Roadmap/README.md`'s licence section points to `LICENSE` (no "Private / internal"); its host lines say
  `goldenfrijoles.com`.
- `packages/sdk/README.md` and `packages/cli/README.md` say Golden Frijoles and describe today's `login`.
- The landing footer's GitHub link opens `github.com/danybgoode/golden-frijoles`.
**Risk:** low

### Story 1.2 — No Vercel host left, and CI keeps it that way
**As** a developer who finds Golden Frijoles, **I want** every link and fallback to use the brand domain, **so that**
every link and fallback lands on goldenfrijoles.com.
**Acceptance:**
- `roadmap-push.yml` and `pod-report-push.yml` fall back to `https://goldenfrijoles.com`.
- Every `golden-beans-gamma.vercel.app` in docs → `goldenfrijoles.com`; every preview host → `<preview URL>`.
- A CI check fails on a `vercel.app` host outside an allow-list (the tests that check the site-URL rule).
**Risk:** low

### Story 1.3 — The loader opens on a different phrase
**As** anyone moving between pages, **I want** the loader to open on a random phrase and never the same one twice in a
row, **so that** the loader feels alive and a screen reader is not flooded.
**Acceptance:** the first phrase is random and differs from the previous navigation's; the phrase is hidden from
assistive tech and the live region says "Loading" once. A unit test pins the pick.
**Risk:** low

## Sprint QA
- **api spec(s):** none needed; the pick is a pure function with a unit test, and the guard has its own test.
- **browser smoke owed:** no (no money or auth path).
- **deterministic gate:** `npm run typecheck` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com (or the preview URL before merge)

1. Open https://github.com/danybgoode/golden-frijoles
   → the README opens with the pitch, the quickstart and a screenshot; no "golden-beans", no `vercel.app`.
2. Open https://goldenfrijoles.com and click the GitHub icon in the footer
   → the repo opens, not a profile.
3. Open https://goldenfrijoles.com/hub/golden-frijoles and click between Roadmap and Board three times
   → the loader shows a different phrase each time.
4. Open https://golden-beans-gamma.vercel.app
   → redirects to goldenfrijoles.com (after Daniel's domain setting, below).

**Outside the PR (account settings, Daniel):** the GitHub description and homepage of `danybgoode/golden-frijoles` and
`golden-frijoles/skills` (the agent can run `gh repo edit` on your go), and the Vercel domain redirect
(`golden-beans-gamma.vercel.app` → `goldenfrijoles.com`, 308) in the project's Domains settings.

If any step fails, note the step number + what you saw — that's the bug report.
