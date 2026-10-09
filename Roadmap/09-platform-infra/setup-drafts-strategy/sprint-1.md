---
epic: setup-drafts-strategy
sprint: 1
title: "Read and draft"
risk: low
phase: Building
stories_total: 2
stories:
  - id: S1.1
    title: "read-product.mjs: the product facts with their files, bounded, no secrets"
    as_a: "a founder running setup on an existing repo"
    i_want: "the agent to read what my product says and already measures"
    so_that: "the draft cites my product, not the agent's impression"
    risk: low
    status: planned
  - id: S1.2
    title: "The question first; the cited draft with two North Star candidates, on both routes"
    as_a: "a founder starting setup"
    i_want: "to say what the product is for before I see any draft, then get a draft with two North Stars to choose from"
    so_that: "the draft cannot anchor me, and I choose rather than accept"
    risk: low
    status: planned
---
# Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review — Sprint 1: Read and draft

**Status:** ⬜ not started

## Stories

### Story 1.1 — read-product.mjs: the product facts with their files, bounded, no secrets
**As** a founder running setup on an existing repo, **I want** the agent to read what my product says and already measures, **so that** the draft cites my product, not the agent's impression.
**Acceptance:** `node "$REFINE/read-product.mjs"` prints the README, package, landing copy, routes, analytics calls (with event names) and flags, each with `path:line`; `--json` for the agent; bounded (skipped dirs and caps stated); never opens `.env*`/keys or prints a key-shaped line.
**Risk:** low

### Story 1.2 — The question first; the cited draft with two North Star candidates, on both routes
**As** a founder starting setup, **I want** to say what the product is for before I see any draft, then get a draft with two North Stars to choose from, **so that** the draft cannot anchor me, and I choose rather than accept.
**Acceptance:** both routes ask the one-sentence question first; the draft's claim lines each end with a source (a printed path, read-repo, your words, assumed); `north-star.md` holds `## Candidates` A and B that differ in game or unit, and its payload stays unfilled until one is chosen; route 2 offers "Draft it now" first.
**Risk:** low

## Sprint QA
- **unit:** `read-product.test.mjs` (each source on fixtures, event names from string literals only, bounds, secret files never opened and key-shaped lines never printed, `--json`)
- **browser smoke owed:** no (terminal behaviour; Daniel's interactive setup walkthrough, step 2)
- **deterministic gate:** the Skills CI replay (every check, `cmp` pair and inline budget) + `npm run test:unit`

## Sprint 1 — Smoke walkthrough (do these in order)
Env: any repo with a README and some analytics calls (this repo works), a terminal.

1. Run `node skills/plugins/golden-frijoles/skills/refine/read-product.mjs`
   → the README title and first paragraph, the landing copy, routes, analytics calls with event names and flags, each with `path:line`, and what was skipped.
2. (owed to Daniel — interactive) In a scratch copy of a real product repo with no `Roadmap/`, run setup and pick "This repo"
   → the one-sentence question comes before any draft; the three files are written with a source on each line and two North Star candidates.

If any step fails, note the step number + what you saw — that's the bug report.
