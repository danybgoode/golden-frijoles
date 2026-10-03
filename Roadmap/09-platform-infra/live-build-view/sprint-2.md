---
epic: live-build-view
sprint: 2
title: "Statuses from facts no agent writes"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S2.1
    title: "A feat/fix commit on an epic branch names exactly one story"
    as_a: "the product owner"
    i_want: "the story in flight to be a fact git guarantees"
    so_that: "the band never depends on how an agent worded a commit"
    risk: high
    status: planned
  - id: S2.2
    title: "Progress counts stories done, not position"
    as_a: "the product owner"
    i_want: "the band's progress to say how many stories have commits"
    so_that: "Story 1 of 7 at the end of a sprint can never happen again"
    risk: low
    status: planned
  - id: S2.3
    title: "The architecture lock is a command"
    as_a: "the product owner"
    i_want: "Locking → Building to flip when a script stamps it"
    so_that: "from the lock on, every status comes from a trigger, not a judgment"
    risk: low
    status: planned
  - id: S2.4
    title: "/build <slug> — the kickoff's one home"
    as_a: "the product owner"
    i_want: "to start a build with one command that loads the generated kickoff"
    so_that: "no kickoff is ever saved to references/ or Claude outputs/ again"
    risk: low
    status: planned
---
# Live build view — Sprint 2: Statuses from facts no agent writes

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started — README § Architecture lock)
Cite, don't restate: D7–D14, C4–C6.
- **Files:** `skills/template/scripts/build-state.mjs` (+ root copy + `render-hook-vendor` bundle), new
  `skills/template/scripts/{story-check,epic-phase}.mjs` (+ specs, + root copies), `.githooks/commit-msg`,
  `skills/template/.githooks/commit-msg`, `lib/roadmap-contract.mjs` (all copies), `lib/epic-kickoff.mjs` (all copies)
  + `emit-epic-kickoff.mjs --list`, the mod's `/build`, groom `SKILL.md` Stage 8, `SESSION-KICKOFFS.md` §2 (root +
  template), 0.26.0 release.
- **Measured inputs:** 15/179 historical feat/fix subjects name a story; 2 name two in the continuation form.
- **Teeth:** the story-check spec covers zero ids, `S1.1/1.2`, `S2.2-2.4`, another sprint's id on `-sN`, an id the epic
  does not list, every exempt type, merges/reverts/fixups, a non-epic branch and the bypass — and is mutation-checked
  by dropping the continuation form. The hook's < 2 s budget is measured on a real commit in this repo.

## Stories

### Story 2.1 — A feat/fix commit on an epic branch names exactly one story
**As** the product owner, **I want** the story in flight to be a fact git guarantees, **so that** the band never
depends on how an agent worded a commit.
**Acceptance:**
- A `commit-msg` hook (`.githooks/commit-msg`, mirrored to `skills/template/.githooks/`) runs the bundled check: on a
  branch that resolves to an epic (the resolver's own `branchCandidates`/`resolveTarget` — no second parser), a
  `feat`/`fix`/`perf`/`refactor` commit must name exactly ONE story id the epic (or that sprint, on `-sN`) lists.
- Refused commits print the valid ids for this branch and the bypass. `docs`/`chore`/`test`/`ci`/`build`/`style`,
  merges, reverts, fixups and non-epic branches pass untouched.
- `GF_SKIP_STORY_CHECK=1` bypasses; the commit is still allowed and nothing else changes.
- The check reuses `storyIdsIn()`; a spec covers: zero ids, two ids (`S1.1/1.2`), an id of another sprint, the exempt
  types, and the bypass.
**Risk:** high — shared infra: it runs on every commit in every kit repo.

### Story 2.2 — Progress counts stories done, not position
**As** the product owner, **I want** the band's progress to say how many stories have commits, **so that** Story 1
of 7 at the end of a sprint can never happen again.
**Acceptance:**
- `build-state.mjs` reports `stories_with_commits` (distinct accepted ids across `base..HEAD`, every id in a subject
  counted, so pre-S2.1 bundles still count) next to the existing ordinal; the Progress row reads
  `3 of 7 stories have commits · in flight S1.4 · Sprint 1 of 2`.
- The JSON keeps every existing field (the Hub and the kit sinks read it); the template copy stays byte-identical.
**Risk:** low

### Story 2.3 — The architecture lock is a command
**As** the product owner, **I want** Locking → Building to flip when a script stamps it, **so that** from the lock on
every status comes from a trigger, not a judgment.
**Acceptance:**
- `node scripts/epic-phase.mjs lock --epic <slug>` sets the epic README's `phase: Building` and `locked_at: <ISO>`, and
  sprint 1's `phase: Building`; it refuses when `D1…` decisions are absent from the README (a lock with nothing locked).
- `lib/roadmap-contract.mjs` accepts `locked_at`; `doc-format.mjs` stays green across the corpus.
- On an epic branch with no `locked_at`, the resolver's status reads `Locking architecture (from git: branch pushed)`.
- The kickoff generator's non-negotiable #1 names the command instead of describing the step.
**Risk:** low

### Story 2.4 — /build <slug> — the kickoff's one home
**As** the product owner, **I want** to start a build with one command that loads the generated kickoff, **so that**
no kickoff is ever saved to `references/` or `Claude outputs/` again.
**Acceptance:**
- The mod registers `/build` in `session.start`; `/build <slug>` runs the BUNDLED `emit-epic-kickoff.mjs --epic <slug>`
  and puts its output in the prompt with `$.prompt.fill` (the person presses enter). Unknown slug → the list of
  scaffolded epics.
- Branch switching stays in the kickoff's own first line (it already says `git switch -c feat/<slug> …`) — `/build`
  does not touch git itself.
- groom Stage 8 ends with one line: `Build it: /build <slug>` (plus the generator command for hosts without the mod);
  `SESSION-KICKOFFS.md` §2 points at `/build`. No skill or doc tells an agent to save a kickoff to a file.
- The kickoff text loses any sentence that restates a doc it already points at (checked by its existing test).
**Risk:** low

## Sprint QA
- **specs:** a `commit-msg` check spec (node:test, injected git); `build-state` progress spec; `epic-phase.mjs` spec;
  `emit-epic-kickoff.test.mjs` for the new #1 line; `claude plugin test` for `/build`.
- **browser smoke owed:** no — a terminal walkthrough, owed to the product owner (below).
- **deterministic gate:** skills-ci + root `node --test` + `check-script-parity` + `check-release` + `doc-format`.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: your machine, this repo, the plugin release this sprint ships.

1. `git switch -c feat/scenarios-pm-operable-smoke` then `git commit --allow-empty -m "feat(x): no story"`.
   → Refused, listing the valid story ids for scenarios-pm-operable.
2. `git commit --allow-empty -m "feat(x): S1.1/1.2 two stories"`.
   → Refused (two ids).
3. `git commit --allow-empty -m "docs(x): notes"`.
   → Accepted.
4. `git commit --allow-empty -m "feat(x): S1.1 one story"`.
   → Accepted; the band's Progress row says "1 of 10 stories have commits · in flight S1.1".
5. In a session, type `/build scenarios-pm-operable`.
   → The prompt fills with the generated kickoff; nothing is sent until you press enter.
6. Clean up: `git switch main && git branch -D feat/scenarios-pm-operable-smoke`.

If any step fails, note the step number + what you saw — that's the bug report.
