---
epic: plugin-1-0
sprint: 1
title: "The CLI is frijoles"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S1.1
    title: "frijoles is the CLI's command"
    as_a: "a founder installing Golden Frijoles"
    i_want: "to type `frijoles login` and have it run"
    so_that: "the first command works on a machine with oh-my-zsh"
    risk: high
    status: planned
  - id: S1.2
    title: "The kit answers to frijoles-kit"
    as_a: "a founder installing Golden Frijoles"
    i_want: "the kit's command to match the CLI"
    so_that: "one name family"
    risk: high
    status: planned
  - id: S1.3
    title: "Every surface says frijoles"
    as_a: "a founder installing Golden Frijoles"
    i_want: "the docs, the install page and the skills to name the command I will type"
    so_that: "I never meet `gf`"
    risk: low
    status: planned
---
# Plugin 1.0 — Sprint 1: The CLI is frijoles

**Status:** ⬜ not started

## Stories

### Story 1.1 — frijoles is the CLI's command
**As** a founder installing Golden Frijoles, **I want** to type `frijoles login` and have it run, **so that** the first command works on a machine with oh-my-zsh.
**Acceptance:** `packages/cli` bin is `frijoles`; `gf` still runs every command and prints one line to stderr naming `frijoles` and the removal date; `scripts/check-deprecations.mjs` (new) goes red after 2026-12-31 while `gf` or `gf-kit` remains in a `bin`. Specs: the bin map, the notice (stderr only, `--json` output unchanged), the expiry check with a fixed clock.
**Risk:** high

### Story 1.2 — The kit answers to frijoles-kit
**As** a founder installing Golden Frijoles, **I want** the kit's command to match the CLI, **so that** one name family.
**Acceptance:** `skills/kit` bin `frijoles-kit`, `gf-kit` kept the same way as S1.1; the kickoff and skill adverts print `frijoles-kit`; `check-release` and `kit-bin.test.mjs` follow.
**Risk:** high

### Story 1.3 — Every surface says frijoles
**As** a founder installing Golden Frijoles, **I want** the docs, the install page and the skills to name the command I will type, **so that** I never meet `gf`.
**Acceptance:** No `gf <verb>` left in skills, template, install.md, /install, /connect, console copy, READMEs, AGENTS.md (rule 6) except the deprecation note; a guard (extend `check-brand-host.mjs`'s pattern or `check-gate-words`) keeps `gf ` commands out of shipped text.
**Risk:** low

## Sprint QA
- **specs:** named per story above; pure-logic `node:test` specs on the scripts, the existing e2e suites for console labels.
- **browser smoke owed:** no money or auth path.
- **deterministic gate:** `npm run typecheck` + `npm run build` + `npm run test:unit` + Playwright `api` green; skills CI green on the split.
