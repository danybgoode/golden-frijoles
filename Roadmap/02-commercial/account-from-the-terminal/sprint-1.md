---
epic: account-from-the-terminal
sprint: 1
title: "Read before installing"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "install.md: what it installs, changes and contacts"
    as_a: "a careful founder"
    i_want: "a page my agent reads before installing anything"
    so_that: "I know what it installs, changes and contacts"
    risk: low
    status: planned
  - id: S1.2
    title: "The prompt reads first and waits"
    as_a: "a founder"
    i_want: "the prompt to have my agent read install.md, summarise it, offer a security review and wait for my go-ahead"
    so_that: "nothing installs before I agree"
    risk: low
    status: planned
  - id: S1.3
    title: "The landing hero in one line"
    as_a: "a visitor"
    i_want: "the landing to say what it does in one line, with the prompt right there"
    so_that: "I know in five seconds whether it's for me"
    risk: low
    status: planned
---
# Account from the terminal — Sprint 1: Read before installing

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — install.md: what it installs, changes and contacts
**As** a careful founder, **I want** a page my agent reads before installing anything, **so that** I know what it
installs, changes and contacts.
`GET /install.md` (text/markdown), a route like `app/llms.txt/route.ts`, built with `getSiteUrl()` and generated from
the constants in `lib/cli-install.ts` and `lib/install-prompt.ts`. Sections: per agent (Claude Code; other agents via
`npx skills`), what installs (plugin, optional `gf` CLI), what changes on the machine (plugin cache, `Roadmap/`,
`golden-frijoles.config.json`, the CLI credentials file, only after sign-in), which services it contacts (github.com,
the npm registry, goldenfrijoles.com only with an account), how to remove it.
**Acceptance:**
- `goldenfrijoles.com/install.md` returns the page; every install command on it is one the site already shows.
- Every service the install contacts is named; nothing is named that isn't contacted.
**Risk:** low

### Story 1.2 — The prompt reads first and waits
**As** a founder, **I want** the prompt to have my agent read `install.md`, summarise it, offer a security review and
wait for my go-ahead, **so that** nothing installs before I agree.
Text, as on the canvas Landing frame: "Set up Golden Frijoles in this project. 1. Read <site>/install.md before
installing anything. 2. Tell me in a few lines what it installs, what changes on this machine and which services it
contacts. Offer me a security review, and wait for my go-ahead. 3. Install it the way install.md says for the agent
you are. 4. Run the golden-frijoles skill and start its setup." It now names a goldenfrijoles.com URL, so it is built
with `getSiteUrl()` here (AGENTS rule #5); the transcriptions in `skills/` (`golden-onboarding.mjs`, the README, the
umbrella SKILL.md) carry the production URL, and the lock decides how the parity check compares them.
**Acceptance:**
- The landing, `/install` and onboarding show the same prompt, character for character.
- `install-prompt.test.ts`, `site-url-callers.test.ts` and `check-onboarding-parity.mjs` are green; no preview URL in
  the skills repo.
**Risk:** low

### Story 1.3 — The landing hero in one line
**As** a visitor, **I want** the landing to say what it does in one line, with the prompt right there, **so that** I
know in five seconds whether it's for me.
`MakerHero` becomes "Plan, ship and prove it paid off." plus the copy-prompt box. Every section below the hero stays
exactly as it is.
**Acceptance:**
- The hero shows the one line and the prompt with a working Copy button.
- Nothing below the hero changed (the visual gate shows only the hero moving).
**Risk:** low

## Sprint QA
- **api spec(s):** S1.1 → a pure-logic spec on the generated `install.md` (commands, services) and `GET /install.md`
  200; S1.2 → `install-prompt.test.ts`, `check-onboarding-parity.mjs`; S1.3 → `landing.browser.spec.ts`.
- **browser smoke owed:** yes, to Daniel: paste the prompt into a real agent and watch it wait.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Go to https://goldenfrijoles.com/
   → The hero reads "Plan, ship and prove it paid off." with the prompt and a Copy button; the rest of the page is unchanged.
2. Click Copy, then go to https://goldenfrijoles.com/install
   → The same prompt, word for word.
3. Go to https://goldenfrijoles.com/install.md
   → A plain page: what installs, what changes on your machine, which services it contacts, how to remove it.
4. Paste the prompt into Claude Code in an empty folder
   → The agent reads install.md, summarises it in a few lines, offers a security review and waits. Nothing installs yet.
5. Say "go ahead"
   → It installs the way install.md says and starts setup.

If any step fails, note the step number + what you saw — that's the bug report.
