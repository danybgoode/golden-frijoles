# Plugin 1.0: five plain skills, the frijoles CLI, and Refining — Retrospective

_Closed: 2026-10-08_
_Intent: owed to Daniel (yes | mostly | no)_
_Quote vs actual: $55–111 (L, n=4, p25–p75) → ≈$56.54 (inside the quote; Claude only, reviewers not measured)_

## What shipped
- **Sprint 1 · the CLI is frijoles** (#324, merge `f05bc81`; plugin + kit 0.44.0). `frijoles` and `frijoles-kit`;
  `gf` and `gf-kit` keep working with a stderr notice until 2026-12-31 or 1.1.0, and `check-deprecations.mjs` turns CI
  red after that and on any `gf <verb>` in shipped text.
- **Sprints 2–4** (#325–#327, landed in `main` through #328, merge `f20076a`; v1.0.0). `refine` and Backlog · Refining
  · Ready (keys unchanged); five skills (`setup`, `refine`, `strategy`, `report`, `smoke`) and the `verifier` agent
  with a security lens; the ops skills in this repo's `.claude/skills/`; one CHANGELOG table from every old command to
  the new one. CLI 1.0.0 (pinned to kit 0.43.0, D9) and kit 1.0.0 on npm.

## What went well
- **The verifier earned its place on every sprint.** It found a renamed localStorage key that would have reset every
  reader's methodology progress, a hand-edited generated workflow, the skills repo's own script copies left behind,
  e2e and plugin tests outside the builder's runs, and a guard still looking for the old skill name. Each was invisible
  to the gates the builder had run.
- **Tests caught what the plan didn't foresee:** the kit-tarball test (the kit is built from the skills' closure, so
  moving the ops skills out dropped their scripts) and routine-bootstrap (an unknown placeholder token).
- **Proving with a real install before the merge:** `check-onboarding-parity --exec` installs the plugin into an
  isolated config, and confirmed `setup` and all five skills ahead of release.

## What we learned
- **A stacked series merges into its bases, not `main`.** Daniel merged #324–#327 in order as instructed; only #324
  reached `main`, because GitHub retargets a stacked PR to `main` only when its base branch is deleted at merge. One
  extra PR (#328, base `main`, head = the top of the stack) carried the rest. Release instructions for a stack must say
  it: merge the top branch into `main` once, or retarget each PR before merging it.
- **A bulk rename has to separate identifiers from words, every time.** Every rename sweep here touched something
  stored or generated: a localStorage key, a token-shaped string, generated workflow output, an approved design file,
  a history attribution. Grep the old word, then classify each hit (typed command, label, path, stored identifier,
  history quote, generated output) before replacing.
- **The local gate must be the CI gate.** The root `test:unit` skips `skills/plugins/**` tests, the skills repo's
  `cmp` pairs, the networked `--exec` step and the e2e specs. A replay script of Skills CI (every `cmp`, every test
  glob, every check, `--exec`) ran before each push after the second review, and the reds stopped.
- **Codex capped, agy out of quota, vibe's 256 KB cap:** on rename-heavy diffs the cross-family pass saw 11–19 of
  100–260 files. It is worth running scoped to the code, and its coverage must be said on the PR; the verifier carried
  the rest.

## Gaps / follow-ups
- **Owed to Daniel:** the `_Intent_` word above; Sprint 4's interactive walkthrough steps 2–5; your live routines that
  name a removed skill (sprint-3 step 7); and two decisions: rename the Notion `Stage` select option (it stores the key
  "Grooming"), and whether to re-approve the console prototype whose sentence still says "a fresh groom".
- **CLI 1.0.x** should move its kit pin from 0.43.0 to 1.0.x (D9) with its next release.
- **Windows:** the `gf` notice cannot fire through npm's shims (stated in the code); Windows `gf` users learn the
  rename from the CHANGELOG only.
- **Local e2e** fails on the CLI and North Star routes against this machine's local database (500s) while CI passes;
  worth a `supabase db reset` before trusting the next local run.
- `scenarios-freeze` is archived (Daniel reversed D6); the scenarios light-up is next on the launch list after SDK 1.0.
