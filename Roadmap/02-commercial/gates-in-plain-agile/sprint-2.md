---
epic: gates-in-plain-agile
sprint: 2
title: "The Strategy gate, and the words"
risk: low
phase: Shaping
stories_total: 2
stories:
  - id: S2.1
    title: "The Strategy gate"
    as_a: "a founder"
    i_want: "the strategy coaches to end in one decision"
    so_that: "I approve my strategy once"
    risk: low
    status: done
  - id: S2.2
    title: "The bookkeeping words stay off the screen"
    as_a: "a founder"
    i_want: "the bookkeeping words gone from what the agent shows me"
    so_that: "I only meet plain agile"
    risk: low
    status: done
---
# Gates in plain agile — Sprint 2: The Strategy gate, and the words

**Status:** 🟡 in review — #303

## Build contract (locked by the architect before the builder started)
Cites README D1, D6–D10, D12–D13; it restates none of them.
- `gates.md` gains the `gate strategy` block (D6). Setup's `golden-frijoles/SKILL.md` Stage 2 routes the idea path
  through it; the three coaches' *Status* lines and `risk-validation`'s hand-off follow D7.
- New `skills/scripts/check-gate-words.mjs` + `check-gate-words.test.mjs` (D9): a failing fixture (a gate block with
  "approve (fund + scaffold)") and a passing one; wired into `skills/.github/workflows/ci.yml` (re-rendered with
  `node scripts/render-skills-ci.mjs`) and the root `ci.yml` static gate with `--also` for the root copies.
- Release 0.36.0 (D12). Done = skills CI + root CI green, the D13 walk (fixture strategy files) in the PR.

<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — The Strategy gate ✅ 11f9dc8
**As** a founder, **I want** the strategy coaches to end in one decision, **so that** I approve my strategy once.
In setup's routing, after the coaches draft: the canvas StrategyGate. Where to read the drafts (`Roadmap/00-strategy/`,
and the one-pagers when they exist); what was decided from the repo; up to three decisions only you can make (who
first, the North Star, the riskiest assumption); then "1 Approve the strategy · 2 Change something · 3 Coach me through
it, one piece at a time". Approve sets `status: agreed` on each file, as each coach does today; Change leaves `draft`;
Coach me runs the coaches one at a time.
**Acceptance:**
- A setup run on a fixture repo ends the strategy step with this gate; Approve marks each file agreed.
- No agreed or draft on screen.
**Risk:** low

### Story 2.2 — The bookkeeping words stay off the screen ✅ 55ce261
**As** a founder, **I want** the bookkeeping words gone from what the agent shows me, **so that** I only meet plain
agile.
A check over the gate text the skills print (the reference's screen-word table is its list) fails on fund, scaffold,
underwritten, displaced, cycle, kickoff, epic mode, agreed and draft in printed text, and never on file values, keys
or paths. Every copy (plugin, template, kit skeleton, this repo's `WAYS-OF-WORKING` and `SESSION-KICKOFFS`) carries the
same gate text.
**Acceptance:**
- Putting "approve (fund + scaffold)" back into a gate fails the check.
- `check-template-drift.mjs` and the parity checks are green.
**Risk:** low

## Sprint QA
- **api spec(s):** the new check's own test (a failing and a passing fixture); the skills' checks; a setup run on a
  fixture repo recorded in the PR.
- **browser smoke owed:** no; the walkthrough below is in the terminal, owed to Daniel.
- **deterministic gate:** the checks above green before merge. Low risk: merge on green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: an empty scratch repo with the plugin installed from this branch

1. Run setup and ask to start from an idea
   → The coaches draft the strategy and end with the Strategy gate: where to read, what's decided, three decisions.
2. Choose Coach me through it
   → One coach at a time, then back to the gate.
3. Choose Approve the strategy
   → Each strategy file is marked agreed; the screen never said "agreed".
4. Carry on to the first plan and approve it
   → The Plan gate, then the Build gate, in the same shape.

If any step fails, note the step number + what you saw — that's the bug report.
