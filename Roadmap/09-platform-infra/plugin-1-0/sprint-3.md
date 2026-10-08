---
epic: plugin-1-0
sprint: 3
title: "Five skills and the verifier"
risk: high
phase: In review
stories_total: 4
stories:
  - id: S3.1
    title: "strategy holds the four chapters"
    as_a: "a founder installing Golden Frijoles"
    i_want: "one strategy skill"
    so_that: "I find the cold read, the PMF narrative, the North Star and risk validation in one place"
    risk: low
    status: done
  - id: S3.2
    title: "report posts daily, weekly or monthly"
    as_a: "a founder who wants a recap"
    i_want: "one report skill with a cadence"
    so_that: "I don't pick between three"
    risk: low
    status: done
  - id: S3.3
    title: "setup is the front door; the ops skills leave"
    as_a: "a founder installing Golden Frijoles"
    i_want: "the front door called setup and no internal ops skills"
    so_that: "the list I install reads like my job"
    risk: high
    status: done
  - id: S3.4
    title: "The verifier"
    as_a: "a founder whose agent opens pull requests"
    i_want: "an independent verifier, with a security lens"
    so_that: "every claim is checked against evidence before it merges"
    risk: low
    status: done
---
# Plugin 1.0 — Sprint 3: Five skills and the verifier

**Status:** 🟡 built, in review (stacked on S2; merges with S1–S4 in one sitting, D7)

## Stories

### Story 3.1 — strategy holds the four chapters ✅ `7dcdf50`
**As** a founder installing Golden Frijoles, **I want** one strategy skill, **so that** I find the cold read, the PMF narrative, the North Star and risk validation in one place.
**Acceptance:** `strategy/` with one SKILL.md that routes by chapter; the four bodies move to `references/`; `strategy.mjs`, the one-pagers and the Strategy gate find them; the cold-read seal unchanged.
**Risk:** low

### Story 3.2 — report posts daily, weekly or monthly ✅ `0f9d299`
**As** a founder who wants a recap, **I want** one report skill with a cadence, **so that** I don't pick between three.
**Acceptance:** `report/` routes `--cadence daily|weekly|monthly` to `standup.mjs`, `weekly-recap.mjs`, `pmo-report.mjs` (unchanged).
**Risk:** low

### Story 3.3 — setup is the front door; the ops skills leave ✅ `f326890`
**As** a founder installing Golden Frijoles, **I want** the front door called setup and no internal ops skills, **so that** the list I install reads like my job.
**Acceptance:** `golden-frijoles/` → `setup/` (`/golden-frijoles:setup`; install prompt, README, install.md follow); `build-order-sync`, `doc-hygiene`, `vercel-prune`, `babysit-pr`, `prose-draft` move to this repo's `.claude/skills/`; the template's routine prompts call the kit scripts by name; `live-smoke` → `smoke`. Adverts regenerated: 5 skills.
**Risk:** high

### Story 3.4 — The verifier ✅ `6da8410`
**As** a founder whose agent opens pull requests, **I want** an independent verifier, with a security lens, **so that** every claim is checked against evidence before it merges.
**Acceptance:** `agents/pr-reviewer.md` → `agents/verifier.md` with `lens: general|security`; `review-route.mjs`, WAYS-OF-WORKING, the PR template and every doc that names it follow.
**Risk:** low

## Sprint QA
- **specs:** named per story above; pure-logic `node:test` specs on the scripts, the existing e2e suites for console labels.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `npm run test:unit` + Playwright `api` green; skills CI green on the split.

## Sprint 3 — Smoke walkthrough (do these in order)
Env: Claude Code with the plugin installed from `main` after the one-sitting merge (D7).

1. Run `/plugin` and open golden-frijoles
   → five skills (refine, report, setup, smoke, strategy) and one agent (verifier).
2. Type `/golden-frijoles:strategy` with no other words, in a repo with no `Roadmap/00-strategy/`
   → it starts the PMF narrative chapter and offers the cold read first, once.
3. Ask "what should our North Star be?"
   → the strategy skill loads its North Star chapter (step 1 of 7).
4. Ask "post the weekly recap"
   → the report skill runs its weekly chapter (`scripts/weekly-recap.mjs`).
5. Ask "use the verifier on PR #<an open PR>, security lens"
   → a report in the verifier's format, saying it ran the security lens and that the cross-family pass is still owed.
6. Run `npx -y @golden-frijoles/kit --list`
   → still lists build-order-sync, babysit-pr, doc-hygiene and vercel-prune-previews.
7. **Daniel's live routines** (cloud and local): open each routine that names `build-order-sync`, `vercel-prune`,
   `babysit-pr`, `doc-hygiene`, `standup-post`, `weekly-recap` or `pmo-report` as a skill, and paste the matching step
   from `skills/template/scripts/routines/` (or run `node scripts/routine-bootstrap.mjs <name>` again).

If any step fails, note the step number + what you saw — that's the bug report.
