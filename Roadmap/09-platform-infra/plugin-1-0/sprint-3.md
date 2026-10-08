---
epic: plugin-1-0
sprint: 3
title: "Five skills and the verifier"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S3.1
    title: "strategy holds the four chapters"
    as_a: "a founder installing Golden Frijoles"
    i_want: "one strategy skill"
    so_that: "I find the cold read, the PMF narrative, the North Star and risk validation in one place"
    risk: low
    status: planned
  - id: S3.2
    title: "report posts daily, weekly or monthly"
    as_a: "a founder who wants a recap"
    i_want: "one report skill with a cadence"
    so_that: "I don't pick between three"
    risk: low
    status: planned
  - id: S3.3
    title: "setup is the front door; the ops skills leave"
    as_a: "a founder installing Golden Frijoles"
    i_want: "the front door called setup and no internal ops skills"
    so_that: "the list I install reads like my job"
    risk: high
    status: planned
  - id: S3.4
    title: "The verifier"
    as_a: "a founder whose agent opens pull requests"
    i_want: "an independent verifier, with a security lens"
    so_that: "every claim is checked against evidence before it merges"
    risk: low
    status: planned
---
# Plugin 1.0 — Sprint 3: Five skills and the verifier

**Status:** ⬜ not started

## Stories

### Story 3.1 — strategy holds the four chapters
**As** a founder installing Golden Frijoles, **I want** one strategy skill, **so that** I find the cold read, the PMF narrative, the North Star and risk validation in one place.
**Acceptance:** `strategy/` with one SKILL.md that routes by chapter; the four bodies move to `references/`; `strategy.mjs`, the one-pagers and the Strategy gate find them; the cold-read seal unchanged.
**Risk:** low

### Story 3.2 — report posts daily, weekly or monthly
**As** a founder who wants a recap, **I want** one report skill with a cadence, **so that** I don't pick between three.
**Acceptance:** `report/` routes `--cadence daily|weekly|monthly` to `standup.mjs`, `weekly-recap.mjs`, `pmo-report.mjs` (unchanged).
**Risk:** low

### Story 3.3 — setup is the front door; the ops skills leave
**As** a founder installing Golden Frijoles, **I want** the front door called setup and no internal ops skills, **so that** the list I install reads like my job.
**Acceptance:** `golden-frijoles/` → `setup/` (`/golden-frijoles:setup`; install prompt, README, install.md follow); `build-order-sync`, `doc-hygiene`, `vercel-prune`, `babysit-pr`, `prose-draft` move to this repo's `.claude/skills/`; the template's routine prompts call the kit scripts by name; `live-smoke` → `smoke`. Adverts regenerated: 5 skills.
**Risk:** high

### Story 3.4 — The verifier
**As** a founder whose agent opens pull requests, **I want** an independent verifier, with a security lens, **so that** every claim is checked against evidence before it merges.
**Acceptance:** `agents/pr-reviewer.md` → `agents/verifier.md` with `lens: general|security`; `review-route.mjs`, WAYS-OF-WORKING, the PR template and every doc that names it follow.
**Risk:** low

## Sprint QA
- **specs:** named per story above; pure-logic `node:test` specs on the scripts, the existing e2e suites for console labels.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `npm run test:unit` + Playwright `api` green; skills CI green on the split.
