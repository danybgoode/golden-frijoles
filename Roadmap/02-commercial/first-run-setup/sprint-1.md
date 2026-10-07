---
epic: first-run-setup
sprint: 1
title: "Setup starts"
risk: low
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "Setup says what happened and what it found"
    as_a: "a founder who just signed in"
    i_want: "setup to say what happened and what it found before asking anything"
    so_that: "the first question makes sense"
    risk: low
    status: planned
  - id: S1.2
    title: "An existing project, read into the roadmap"
    as_a: "a founder with an existing product"
    i_want: "my history, pull requests and issues read into my roadmap"
    so_that: "the board starts with my real product"
    risk: low
    status: planned
  - id: S1.3
    title: "A new idea, in a sentence"
    as_a: "a founder with a new idea"
    i_want: "to say it in a sentence and choose strategy first or a first epic now"
    so_that: "I know what being grounded means"
    risk: low
    status: planned
---
# First run: setup starts — Sprint 1: Setup starts

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites the epic README's D1–D13; nothing here restates them.
- **S1.1** — setup SKILL.md Stage 2 opens with D2 then D3 (`read-repo.mjs --look`), then D4's Q1. Q2 retires (D4).
- **S1.2** — `groom/read-repo.mjs` (D1, D5–D9) + `read-repo.test.mjs`, and setup's This-repo route (D10).
- **S1.3** — setup's new-idea route (D11); groom SKILL.md's not-grounded seed line; `gates.md` Plan gate Moves rule.
- Release (D12) in the same PR. Specs observed failing once by mutation before merge.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — Setup says what happened and what it found
**As** a founder who just signed in, **I want** setup to say what happened and what it found before asking anything,
**so that** the first question makes sense.
Canvas frame 7. After `gf login`: "Signed in as <email> (new account)", "gf signed in on this machine, for the product
<name>". Then "I looked first": whether `Roadmap/` is here, what the repo is (stack, commit count, open pull requests
when `gh` is installed). Then Q1 in plain words: "What are we working on? 1 This repo: it already has a product · 2 A
new idea: nothing built yet · 3 Just planning: don't change my repo", writing `project.mode` as today. Without an
account, the first block is skipped.
**Acceptance:**
- A setup run after sign-in shows who and which product, what it found, then the three choices.
- `project.mode` is written exactly as today.
**Risk:** low

### Story 1.2 — An existing project, read into the roadmap
**As** a founder with an existing product, **I want** my history, pull requests and issues read into my roadmap,
**so that** the board starts with my real product.
Canvas frame 8a. A read script (dry run by default, `--write` on approval) reads the README, `docs/`, the manifest,
git history, and with `gh` the open pull requests and issues. It proposes: shipped work as shipped epics (grouped by
merged pull requests, else release tags, else top-level docs; capped at the last 12 months or the 20 largest, saying
what was left out; each marked "backfilled, no target" with its sources), open pull requests as Building, open issues
grouped into Backlog ideas (each listing its issue numbers). It writes through `scaffold-epic.mjs` and the seed
template, then regenerates the board. Nothing in the repo is moved, renamed or deleted, and nothing on GitHub is
touched. Then: "Review the strategy (about 10 minutes) · Later: help me plan a first epic now".
**Acceptance:**
- The dry run shows counts and the first few entries and writes nothing.
- On approval, everything written passes `roadmap-contract.mjs`; `git status` shows only new files under `Roadmap/`.
- Without `gh`, it reads git only and says pull requests and issues were skipped.
**Risk:** low

### Story 1.3 — A new idea, in a sentence
**As** a founder with a new idea, **I want** to say it in a sentence and choose strategy first or a first epic now,
**so that** I know what being grounded means.
Canvas frame 8b. "A new idea. In a sentence or two: what is it, and who is it for?", then "1 Strategy first (about 45
minutes with the coaches: your narrative, a North Star and the riskiest assumption; saved as you go) · 2 A first epic
now (strategy can come later; until then the epic is marked as not grounded)". Strategy first runs the coaches and
ends at the Strategy gate; a first epic now runs groom with the sentence as the ask.
**Acceptance:**
- An empty repo reaches this choice in one question; each choice lands where it says.
- A first epic made this way shows "not grounded" until a strategy exists.
**Risk:** low

## Sprint QA
- **api spec(s):** S1.2 → pure-logic specs on grouping, caps and the "left out" note; fixture repos with and without
  `gh`; the contract check on everything written. S1.1 and S1.3 → setup runs on a fixture repo and an empty one,
  recorded in the PR.
- **browser smoke owed:** no; the walkthrough below is in the terminal, owed to Daniel.
- **deterministic gate:** the skill checks, `roadmap-contract.test.mjs` and `check-template-drift.mjs` green before
  merge. Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: Claude Code with the plugin from this branch

1. In a real repo with history and issues, sign in and run setup
   → Who you are and which product, what it found, then "What are we working on?".
2. Choose This repo
   → A dry run: shipped work, open pull requests and issue groups, with counts. Nothing written yet.
3. Approve it
   → New files under Roadmap/ only; the board shows what shipped, what's building and the backlog.
4. In an empty folder, run setup and choose A new idea
   → One sentence, then Strategy first or A first epic now.
5. Choose A first epic now
   → Groom starts with your sentence; the epic is marked not grounded.

If any step fails, note the step number + what you saw — that's the bug report.
