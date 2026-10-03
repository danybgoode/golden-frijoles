---
epic: live-build-view
sprint: 1
title: "The band goes live"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "The band re-keys mid-turn: after every Bash call and every 30 s"
    as_a: "the product owner watching a build"
    i_want: "the band to change when the branch, a commit, a worktree or an epic doc changes"
    so_that: "I see what is being built while the one long agent turn runs"
    risk: low
    status: planned
  - id: S1.2
    title: "In review without a network call in the turn"
    as_a: "the product owner"
    i_want: "the band to say In review once a PR is open"
    so_that: "the last rung before ship shows without slowing any turn"
    risk: low
    status: planned
  - id: S1.3
    title: "The fixes we ship reach the session"
    as_a: "anyone running the plugin"
    i_want: "the band to say when the installed plugin is older than the published one, and the marketplace to auto-update"
    so_that: "a fixed band actually reaches the people looking at it"
    risk: low
    status: planned
---
# Live build view — Sprint 1: The band goes live

**Status:** ⬜ not started

## Stories

### Story 1.1 — The band re-keys mid-turn: after every Bash call and every 30 s
**As** the product owner watching a build, **I want** the band to change when the branch, a commit, a worktree or an
epic doc changes, **so that** I see what is being built while the one long agent turn runs.
**Acceptance:**
- A `tool.call` hook on `Bash` (after `next`) and a `$.clock.every(30_000)` started in `session.start` both run the
  same key check; `turn.start` keeps running it too. A resolve runs only when the key changed.
- The key is HEAD + branch + every other worktree's `HEAD` (one `git worktree list --porcelain`) + the newest
  `Roadmap/**` mtime (restores D4 of build-visualization-claude-mods).
- The key check is one `git` call plus one stat walk; its cost is measured and written in the PR (target ≤ 50 ms).
- The timer is cleared on reload; no check overlaps another (a running check skips the next tick).
- Pure parts (`keyFrom`, `shouldRefresh`) live in `build-view.mjs` with specs; `index.tsx` stays a thin renderer (D3).
**Risk:** low

### Story 1.2 — In review without a network call in the turn
**As** the product owner, **I want** the band to say In review once a PR is open, **so that** the last rung before
ship shows without slowing any turn.
**Acceptance:**
- A second timer (every 5 min, first run 60 s after `session.start`) runs the bundled resolver ONLINE once to refresh
  the facts snapshot (`gatherFacts` live mode, which already writes it), timeout-bound; then drops the cached view.
- `turn.start`, `tool.call` and the 30 s tick stay `--offline`: no `gh` call ever runs on a turn's path.
- No `gh` on the machine, or `gh` failing, logs once and leaves the last snapshot.
**Risk:** low

### Story 1.3 — The fixes we ship reach the session
**As** anyone running the plugin, **I want** the band to say when the installed plugin is older than the published
one, and the marketplace to auto-update, **so that** a fixed band actually reaches the people looking at it.
**Acceptance:**
- One band row, only when they differ: `Plugin  0.14.1 installed · 0.24.1 published — /plugin to update`. Installed =
  this module's own `plugin.json`; published = the local marketplace clone's `plugin.json` (no network).
- `.claude/settings.json` (this repo and the template) sets `"autoUpdate": true` on the `golden-frijoles` marketplace.
- `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is removed from both settings files and from `hooks.json`'s comment (Mods are on by
  default from Claude Code 2.1.287); `claude plugin validate` and `claude plugin test` stay green on 2.1.288.
**Risk:** low

## Sprint QA
- **specs:** `hooks/build-view.test.mjs` (key, refresh, version-row pure functions); `claude plugin test` for the
  hook registrations; the skills-ci "build view mod" steps.
- **browser smoke owed:** no — a terminal walkthrough, owed to the product owner (below).
- **deterministic gate:** skills-ci + root `node --test` + `check-script-parity` + `check-release` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: your machine, Claude Code ≥ 2.1.287, this repo, plugin updated to the release this sprint ships.

1. Restart Claude Code in the repo on `main`.
   → The band shows "No epic in flight" (or other worktrees' epics).
2. Send ONE message: "Run `git switch -c feat/scenarios-pm-operable`, then run `sleep 40`, then switch back to main."
   → While `sleep` runs, and without typing, the band changes to *Scenarios made PM-operable* within one Bash call.
3. In another terminal, edit any `Roadmap/01-growth-engine/scenarios-pm-operable/sprint-1.md` line while step 2's
   turn is still running.
   → Within 30 s the band redraws (the doc edit is in the key).
4. Open a draft PR from any epic branch, wait 5 minutes in a session on that branch.
   → The Status row says In review without you typing.
5. If your installed plugin is older than published: the band shows the `Plugin` row naming both versions.

If any step fails, note the step number + what you saw — that's the bug report.
