---
epic: connect-page
sprint: 2
title: "The Connect page, in order"
risk: low
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Connect, in order"
    as_a: "a founder setting up"
    i_want: "Connect to offer one path at a time, easiest first"
    so_that: "I know what to do next"
    risk: low
    status: in-progress
  - id: S2.2
    title: "Connect Codex"
    as_a: "a founder using Codex"
    i_want: "one command that connects Codex to my project"
    so_that: "Codex can read and change it too"
    risk: low
    status: in-progress
  - id: S2.3
    title: "The SDK, said plainly"
    as_a: "a founder wiring my product"
    i_want: "to understand what the SDK is for and where its key comes from"
    so_that: "I can send my product's events"
    risk: low
    status: in-progress
---
# Connect: start where you are — Sprint 2: The Connect page, in order

**Status:** 🟦 In review

## Build contract (locked by the architect before the builder started — README § Architecture lock)
- S2.1 → **D4** + **D6**. S2.2 → **D5**. S2.3 → **D4** (the SDK block; the key's sources per **D3**).

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — Connect, in order
**As** a founder setting up, **I want** Connect to offer one path at a time, easiest first, **so that** I know what to
do next.
Titled **Connect** (the section is Set up). In order: (1) Set up with your agent — the install prompt; (2) Or do it
yourself — the Claude Code commands and `npx skills add` for any other agent, from the same constants `install.md`
uses; (3) Connect the Claude app — the URL, its first-use status, Get a new URL, the three steps; (4) Connect Codex;
(5) Send your product's events — the SDK; (6) Your signed-in machines — Disconnect. Owner-only parts stay owner-only.
**Acceptance:** the page reads top to bottom in that order; nothing on it says the URL is read-only for a new account.
**Risk:** low

### Story 2.2 — Connect Codex
**As** a founder using Codex, **I want** one command that connects Codex to my project, **so that** Codex can read and
change it too.
`codex mcp add golden-frijoles --url <your connector URL>` (Codex supports streamable-HTTP MCP servers; checked against
codex-cli 0.160.0), with the URL filled in for owners, plus how to check it (`codex mcp list`).
**Acceptance:** the command on the page, pasted into a terminal with Codex installed, adds the server.
**Risk:** low

### Story 2.3 — The SDK, said plainly
**As** a founder wiring my product, **I want** to understand what the SDK is for and where its key comes from, **so
that** I can send my product's events.
One sentence on what it does (your product reports what users do; your agent reads it back as funnels and your North
Star), `npm install @golden-frijoles/sdk`, the snippet reading the key from the environment, and where the key comes
from (`gf init` writes it to `.env.local`, or mint one under Setup › Keys).
**Acceptance:** a founder can follow the block without leaving the page except to mint a key.
**Risk:** low

## Sprint QA
- **authed:** Connect's six blocks in order; the Codex command carries the owner's URL and a member sees none.
- **design:** `setup-connect` is an approved state; the new order needs a new approved picture — the row carries a
  dated deferral until Daniel approves it.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` + `authed` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Signed in, open https://goldenfrijoles.com/app/setup/connect/<your-project>
   → Title "Connect"; the install prompt first, then do-it-yourself, the Claude app, Codex, the SDK, your machines.
2. Copy the Codex command into a terminal with Codex
   → `codex mcp list` shows golden-frijoles.
3. Read the SDK block
   → It says what it is for and where the key comes from.

If any step fails, note the step number + what you saw — that's the bug report.
