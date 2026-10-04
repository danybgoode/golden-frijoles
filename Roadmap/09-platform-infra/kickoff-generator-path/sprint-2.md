---
epic: kickoff-generator-path
sprint: 2
title: "S2 Every doc names the kit command, guarded, released"
risk: low
phase: Shaping
stories_total: 2
stories:
  - id: S2.1
    title: "Every doc and in-code hint names /build or the kit command"
    as_a: "a reader of WAYS-OF-WORKING or SESSION-KICKOFFS in any project"
    i_want: "the kickoff command I copy to run"
    so_that: "the instruction works where I read it"
    risk: low
    status: done
  - id: S2.2
    title: "A guard keeps node skills/groom/ out; release"
    as_a: "the product owner"
    i_want: "CI to go red if a doc names the plugin-relative path again, and the kit published"
    so_that: "the fix can't regress and users actually get it"
    risk: low
    status: done
---
# Kickoff generators run from anywhere — Sprint 2: S2 Every doc names the kit command, guarded, released

**Status:** 🟦 In review — S2.1 `744577a`, S2.2 `d9160e7` (+ C7, check-release counts the kit skeleton), release 0.27.1 `fd58213`. Smoke walkthrough runs after the merge and the kit publish.

## Build contract (locked by the architect before the builder started, 2026-10-04)
Cite, don't restate: the epic README's **D4, D5, D7 as corrected by C5–C6** (§ Architecture lock): the guard is the
root spec `scripts/kickoff-doc-paths.test.mjs` (C6), and the kit already carries the commands from 0.27.0 (C5). Edit **sources only**: `WAYS-OF-WORKING.template.md` (then
`node scripts/render-ways-of-working.mjs`), the `skills/` sources and their byte-checked copies per `skills/RELEASING.md`.
Never hand-edit a generated file.

## Stories

### Story 2.1 — Every doc and in-code hint names `/build` or the kit command
**As a** reader of WAYS-OF-WORKING or SESSION-KICKOFFS in any project, **I want** the kickoff command I copy to run,
**so that** the instruction works where I read it.
**Acceptance:**
- The nine docs listed in the seed's Problem table say `/build <slug>`, else
  `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` (and `emit-kickoff … --sprint <N>` where the per-sprint
  path is named), worded like the kit-advert block.
- `emit-epic-kickoff.mjs`'s one-sprint stderr hint, and any other generator output string, names the kit command.
- `node scripts/render-ways-of-working.mjs --check` is green; skills-ci's byte checks are green.
**Risk:** low

### Story 2.2 — A guard keeps `node skills/groom/` out; release
**As the** product owner, **I want** CI to go red if a doc names the plugin-relative path again, and the kit published,
**so that** the fix can't regress and users actually get it.
**Acceptance:**
- A spec scans the D5 paths and fails on a fixture containing `node skills/groom/emit-epic-kickoff.mjs`. It passes on
  the fixed tree, and it does not fire on `../skills/groom/` in `hooks/build-view.mjs` or on shipped epic folders.
- Plugin `plugin.json` and `kit/package.json` are bumped in lockstep with a `CHANGELOG.md` section; `check-release.mjs`
  is green.
- After merge (with a merge commit, never a squash), `npm view @golden-frijoles/kit@<v> version` prints `<v>`.
**Risk:** low

## Sprint QA
- **specs:** the new doc-path guard (2.2), `render-ways-of-working --check`, `check-release.test.mjs`.
- **browser smoke owed:** no.
- **deterministic gate:** `npm run test:unit` + skills-ci green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: your terminal, after the merge and the release CI run.

1. `git grep -n "node skills/groom/" -- Roadmap skills/Roadmap skills/template`
   → no output (shipped epic folders excepted).
2. Open `Roadmap/WAYS-OF-WORKING.md`, *Epic-mode builds* item 5
   → it names `/build <slug>` and `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>`.
3. `npm view @golden-frijoles/kit version`
   → the new version.
4. In any other repo that has a scaffolded epic (or a scratch copy of this `Roadmap/`), run
   `npx -y @golden-frijoles/kit@<v> emit-epic-kickoff --epic <slug>`
   → the kickoff prints. This is the "works for every user" check.
5. In Claude Code here, after `/plugin` update + `/reload-plugins`, type `/build cli-think-skills-followups`
   → the prompt box fills, so the mod's offline path still works.

If any step fails, note the step number + what you saw — that's the bug report.
