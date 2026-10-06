---
epic: build-view-upgrade
sprint: 1
title: "Why, how far, and where"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "Why we're building it, while it builds"
    as_a: "a founder watching a build"
    i_want: "to see why we're building it"
    so_that: "the work stays tied to the number"
    risk: low
    status: planned
  - id: S1.2
    title: "Progress by sprint, and the stage as a track"
    as_a: "a founder watching a build"
    i_want: "progress by sprint and the stage as a track"
    so_that: "I see how far at a glance"
    risk: low
    status: planned
  - id: S1.3
    title: "The link opens the epic's page"
    as_a: "a founder"
    i_want: "the view's link to open this epic's page in my project"
    so_that: "one click shows the whole epic"
    risk: low
    status: planned
---
# Build view upgrade — Sprint 1: Why, how far, and where

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Why we're building it, while it builds
**As** a founder watching a build, **I want** to see why we're building it, **so that** the work stays tied to the
number.
A Why line after Epic: the hypothesis (truncated to fit), the metric from ━━▸ to, and the read date ("read 4 Dec", or
"30 days after shipping" when derived). No target: "Why · no target set". The Story line adds its user story on a
second line.
**Acceptance:**
- With a target, the Why line shows hypothesis, metric, from → to and read date; without one, "no target set".
- Lines fit an 80-column terminal.
**Risk:** low

### Story 1.2 — Progress by sprint, and the stage as a track
**As** a founder watching a build, **I want** progress by sprint and the stage as a track, **so that** I see how far at
a glance.
Progress: one bar per sprint (▰ done, ▱ not yet, │ between sprints), then "4 of 9 stories done · Sprint 2 of 3".
Status: "Grooming ─ Ready ─ ◉ Building ─ QA ─ Shipped · live from git" (or "from docs"), in launch epic 3's words.
**Acceptance:**
- The bars match each sprint's stories; the track marks the right stage for each stage.
**Risk:** low

### Story 1.3 — The link opens the epic's page
**As** a founder, **I want** the view's link to open this epic's page in my project, **so that** one click shows the
whole epic.
The link becomes `<board.hubUrl>/epic/<slug>` (https only, as today; none without a hub URL). At the lock, check which
project this repo pushes to (`roadmap-push`, `SELF_PROJECT_SLUG`; Daniel thinks `golden-beans-demo`) and set this
repo's `board.hubUrl` to it. The three copies of `build-state.mjs` stay identical.
**Acceptance:**
- The link opens `/hub/<project>/epic/<slug>` in the project this repo pushes to.
- `check-script-parity.mjs` and `render-hook-vendor.test.mjs` pass.
**Risk:** low

## Sprint QA
- **api spec(s):** `build-state.test.mjs` (Why with and without a target, width, bars per sprint state, track per
  stage, the link), `build-view.test.mjs`, parity checks.
- **browser smoke owed:** no; the walkthrough below is in Claude Code, owed to Daniel.
- **deterministic gate:** the tests and parity checks green before merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: Claude Code in this repo, with the plugin from this branch

1. Start building any epic groomed with a target
   → The view shows Epic, Why (hypothesis, from → to, read date), Story with its user story.
2. Look at Progress and Status
   → One bar per sprint; the stage track with the current stage marked.
3. Click the link
   → The epic's page opens in your project.
4. Switch to an epic groomed before launch epic 4
   → "Why · no target set".

If any step fails, note the step number + what you saw — that's the bug report.
