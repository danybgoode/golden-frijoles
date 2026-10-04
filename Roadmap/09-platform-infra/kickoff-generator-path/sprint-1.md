---
epic: kickoff-generator-path
sprint: 1
title: "S1 The kit carries the kickoff generators"
risk: low
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "emit-epic-kickoff ships in the kit (one source, groom vendored)"
    as_a: "a plugin user on any host"
    i_want: "npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug> to print the kickoff"
    so_that: "I never hand-compose one because the plugin path doesn't exist where I am"
    risk: low
    status: planned
  - id: S1.2
    title: "emit-kickoff + its template ship in the kit"
    as_a: "a plugin user running a one-sprint epic"
    i_want: "the per-sprint kickoff from the same kit"
    so_that: "the documented exception works on every host too"
    risk: low
    status: planned
  - id: S1.3
    title: "The packed kit runs both from a scratch project"
    as_a: "the product owner"
    i_want: "proof from the npm tarball, not the source tree"
    so_that: "a packaging hole can't ship green"
    risk: low
    status: planned
---
# Kickoff generators run from anywhere — Sprint 1: S1 The kit carries the kickoff generators

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started, 2026-10-04)
Cite, don't restate: the epic README's **D1, D2, D3, D6 as corrected by C1–C5** (§ Architecture lock). In short:
the groom copies are `groom/vendor/emit-*.mjs` (C1), the root rule lives once in `lib/kickoff-cli.mjs` (C2), the
template is `template/scripts/templates/kickoff.md` (C3), the specs move to `template/scripts/` (C4), and S1 releases
0.27.0 (C5).

## Stories

### Story 1.1 — `emit-epic-kickoff` ships in the kit (one source, groom vendored)
**As a** plugin user on any host, **I want** `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` to print the
kickoff, **so that** I never hand-compose one because the plugin path doesn't exist where I am.
**Acceptance:**
- `skills/template/scripts/emit-epic-kickoff.mjs` is the one source; it's declared in groom's `requires_scripts`, and
  `node skills/scripts/build-kit.mjs --list` shows it.
- Groom's `skills/groom/emit-epic-kickoff.mjs` is vendored output, and `render-hook-vendor.test.mjs` fails if it drifts.
- `--epic`, `--list` and `--repo-root` behave as today; with no `--repo-root`, the root comes from `lib/project-root.mjs`
  (`GF_PROJECT_ROOT` wins).
- The existing `emit-epic-kickoff.test.mjs` and `build-view.mod.test.ts` stay green unchanged, or with only a path change.
**Risk:** low

### Story 1.2 — `emit-kickoff` + its template ship in the kit
**As a** plugin user running a one-sprint epic, **I want** the per-sprint kickoff from the same kit, **so that** the
documented exception works on every host too.
**Acceptance:**
- `emit-kickoff.mjs` and its `kickoff.md` live once under `skills/template/scripts/`, are declared in groom's
  `requires_scripts`, and are vendored into groom the same way as 1.1.
- `emit-kickoff --epic <slug> --sprint 1` prints byte-identical output from the kit layout and from groom's copy.
**Risk:** low

### Story 1.3 — The packed kit runs both from a scratch project
**As the** product owner, **I want** proof from the npm tarball, not the source tree, **so that** a packaging hole
can't ship green.
**Acceptance:**
- A spec (or a scripted check in skills-ci) runs `npm pack` on the kit, installs the tarball into a temp dir holding
  only a fixture `Roadmap/09-x/<epic>/` (no plugin, no `scripts/`), and runs `gf-kit emit-epic-kickoff --epic <epic>`,
  `--list`, and `gf-kit emit-kickoff --epic <epic> --sprint 1`. All three exit 0 and print the expected headings.
- `gf-kit --list` includes both names.
**Risk:** low

## Sprint QA
- **specs:** `emit-epic-kickoff.test.mjs`, `emit-kickoff.test.mjs` (moved with their sources), `render-hook-vendor.test.mjs`
  (vendored bytes), `build-kit.test.mjs` (manifest), the new packed-tarball check (1.3).
- **browser smoke owed:** no (no web surface).
- **deterministic gate:** the root `npm run test:unit` + skills-ci green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: your terminal, on the S1 branch.

1. `cd skills/kit && npm pack && cd -`
   → a `golden-frijoles-kit-<v>.tgz` appears in `skills/kit/`.
2. `mkdir -p /tmp/kick && cp -R Roadmap /tmp/kick/ && cd /tmp/kick && npm i --no-save <path-to>/skills/kit/golden-frijoles-kit-<v>.tgz`
   → installs with no errors.
3. `npx gf-kit --list | grep emit`
   → shows `emit-epic-kickoff` and `emit-kickoff`.
4. `npx gf-kit emit-epic-kickoff --epic kickoff-generator-path`
   → prints the epic-mode orchestrator prompt for this epic, the same text `/build kickoff-generator-path` puts in the
   prompt box in Claude Code.
5. `npx gf-kit emit-kickoff --epic cli-think-skills-followups --sprint 1`
   → prints the per-sprint kickoff for that one-sprint epic.

If any step fails, note the step number + what you saw — that's the bug report.
