---
epic: plugin-1-0
sprint: 4
title: "Release 1.0"
risk: high
phase: In review
stories_total: 2
stories:
  - id: S4.1
    title: "Plugin, kit and CLI 1.0.0"
    as_a: "a founder upgrading"
    i_want: "one release with a table of what was renamed"
    so_that: "I can find my old command"
    risk: high
    status: done
  - id: S4.2
    title: "A stranger installs 1.0"
    as_a: "a founder in an empty repo"
    i_want: "to install from main and have every name work"
    so_that: "the release is proven, not assumed"
    risk: low
    status: planned
---
# Plugin 1.0 — Sprint 4: Release 1.0

**Status:** 🟡 S4.1 built; S4.2 is the walkthrough below, run after the one-sitting merge (D7)

## Stories

### Story 4.1 — Plugin, kit and CLI 1.0.0 ✅ `e1c7fbf`
**As** a founder upgrading, **I want** one release with a table of what was renamed, **so that** I can find my old command.
**Acceptance:** plugin + kit 1.0.0, CLI 1.0.0 (pins kit 1.0.0); CHANGELOG with the old → new table; `skills/RELEASING.md` followed. **Order:** Daniel publishes CLI 1.0.0 from the branch (2FA) and `npm view @golden-frijoles/cli bin` shows `frijoles`, THEN the four PRs merge in one sitting (D7); the kit publishes itself on the merge.
**Risk:** high

### Story 4.2 — A stranger installs 1.0
**As** a founder in an empty repo, **I want** to install from main and have every name work, **so that** the release is proven, not assumed.
**Acceptance:** Scratch repo, plugin from `main`: `/golden-frijoles:setup`, `refine`, `strategy`, `report`, `smoke` load; `frijoles --version`; under zsh with `plugins=(git)`, `frijoles login` runs. README screenshot retaken (Refining).
**Risk:** low

## Sprint QA
- **specs:** named per story above; pure-logic `node:test` specs on the scripts, the existing e2e suites for console labels.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `npm run test:unit` + Playwright `api` green; skills CI green on the split.

## Checked before the merge (agent, 2026-10-08)
- The built CLI through npm-style symlinks: `frijoles --version` → 1.0.0; `gf --version` → the stderr notice, then
  1.0.0; `--json whoami` stdout byte-identical under both names.
- The CLI's 158 tests against kit 0.43.0 installed clean (D9).
- `pack-skills` builds exactly five archives: refine, report, setup, smoke, strategy.
- Not checked: a Claude session loading the plugin (a nested `claude -p` is not allowed from the build session). That
  is step 2 below.

## Release order (D7, D9) — Daniel
1. From `feat/plugin-1-0-s4`, `cd packages/cli && npm publish` (2FA), then `npm view @golden-frijoles/cli bin`
   → `{ frijoles: …, gf: … }`.
2. Merge #324 → #325 → #326 → #327 in one sitting, merge commits (a `skills/` PR is never squashed).
3. The release job tags v0.44.0 … v1.0.0 and publishes kit 1.0.0 (OIDC); `npm view @golden-frijoles/kit version`
   → 1.0.0.

## Sprint 4 — Smoke walkthrough (a stranger's install, after the merge)
Env: an empty scratch repo; Claude Code; a zsh with oh-my-zsh's git plugin on.

1. `npm i -g @golden-frijoles/cli` then `frijoles --version`
   → 1.0.0.
2. In Claude Code: `/plugin marketplace update golden-frijoles`, then `/plugin` → golden-frijoles
   → version 1.0.0; skills refine, report, setup, smoke, strategy; agent verifier.
3. Paste the install prompt from https://goldenfrijoles.com/install
   → its last step says "Run the setup skill from the golden-frijoles plugin", and the agent runs `/golden-frijoles:setup`.
4. `frijoles login`
   → opens the browser (not `git fetch`).
5. `gf --version` from a script (`bash -c 'gf --version'`)
   → the notice on stderr, then 1.0.0.
6. Open https://goldenfrijoles.com/hub/golden-frijoles/board
   → Backlog · Refining · Ready · Building · QA · Shipped. Retake the README screenshot from this page.

If any step fails, note the step number + what you saw — that's the bug report.
