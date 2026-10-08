---
epic: plugin-1-0
sprint: 4
title: "Release 1.0"
risk: high
phase: Shaping
stories_total: 2
stories:
  - id: S4.1
    title: "Plugin, kit and CLI 1.0.0"
    as_a: "a founder upgrading"
    i_want: "one release with a table of what was renamed"
    so_that: "I can find my old command"
    risk: high
    status: planned
  - id: S4.2
    title: "A stranger installs 1.0"
    as_a: "a founder in an empty repo"
    i_want: "to install from main and have every name work"
    so_that: "the release is proven, not assumed"
    risk: low
    status: planned
---
# Plugin 1.0 — Sprint 4: Release 1.0

**Status:** ⬜ not started

## Stories

### Story 4.1 — Plugin, kit and CLI 1.0.0
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
