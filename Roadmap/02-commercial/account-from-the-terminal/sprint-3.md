---
epic: account-from-the-terminal
sprint: 3
title: "The Claude app can change things"
risk: high
phase: Shaping
stories_total: 2
stories:
  - id: S3.1
    title: "A connector URL that acts as you"
    as_a: "a founder"
    i_want: "the connector URL I make to act as me"
    so_that: "the Claude app can change things in my project"
    risk: high
    status: in-progress
  - id: S3.2
    title: "Setup › Connections: who and what is connected"
    as_a: "a founder"
    i_want: "one place that shows who and what is connected"
    so_that: "I can see it and stop it"
    risk: low
    status: in-progress
---
# Account from the terminal — Sprint 3: The Claude app can change things

**Status:** 🟦 In review

## Build contract (locked by the architect before the builder started — README § Architecture lock)
- S3.1 → **D11** (migration applied BEFORE merge; flag writes only — the task-write tools stay key-bound).
- S3.2 → **D12**.

## Stories
<!-- Keep the heading shape `### Story 3.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 3.1 — A connector URL that acts as you
**As** a founder, **I want** the connector URL I make to act as me, **so that** the Claude app can change things in my
project.
`connector_tokens` gains the person who made it (additive migration, nullable). A URL with a person resolves both the
project and that person; the route offers the write tools it already has (tasks, flags) when that person can still
write in the project, and records every write as them. URLs with no person stay read-only, exactly as today. The
token stays in the path, never a query string; the existing 60-a-minute rate limit holds.
**Acceptance:**
- In the Claude app, a new URL can turn a flag off; the flag's history shows the person who made the URL.
- A URL made before this sprint lists only read tools.
- A revoked URL, or one whose maker was removed from the project, lists only read tools (or 401 when revoked).
- With `isConnectorWritesEnabled` off, every URL is read-only.
**Risk:** high

### Story 3.2 — Setup › Connections: who and what is connected
**As** a founder, **I want** one place that shows who and what is connected, **so that** I can see it and stop it.
The "Who and what is connected" block of the canvas Setup-Connections frame, built on the existing connect and CLI
managers: your coding agent and gf (device label, connected date, last active, Disconnect revokes that CLI token);
the Claude app (three steps: copy the URL, open Claude's connector settings, paste and Add; turns green the first time
it's used; "It can read and change <project> as you. Treat it like a password."; Get a new URL stops the old one at
once); another coding agent (copy the setup prompt). "How epics ship" and the digest channels are not in this story.
**Acceptance:**
- Disconnect on the coding agent makes the next `gf whoami` fail with "sign in again".
- Get a new URL makes the old one stop answering at once.
- The Claude app row shows "Not added yet" until the URL is first used, then green with the time.
**Risk:** low

## Sprint QA
- **api spec(s):** S3.1 → connector specs: a person-bound URL lists and runs write tools; a project-only URL doesn't;
  revoked and removed-member cases; the writes switch off. S3.2 → an authed spec on Disconnect and Get a new URL; the
  visual gate.
- **browser smoke owed:** yes, to Daniel by name: the Claude app connector, end to end.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. High risk: Daniel
  merges. Migration applied before the deploy that reads it.

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed in, go to https://goldenfrijoles.com/app/setup/connect/<your-project>
   → Who and what is connected: your coding agent with its last activity, the Claude app "Not added yet".
2. (owed to Daniel) Copy the connector URL, add it in Claude's connector settings as Golden Frijoles
   → The connector shows up in Claude.
3. In a Claude chat, ask it to turn off a test flag
   → It does; back in the console the flag is off and its history names you. The Claude app row is now green.
4. Click Get a new URL, then ask Claude to turn the flag back on
   → Claude can't reach the project with the old URL.
5. Click Disconnect on your coding agent, then run `gf whoami`
   → It tells you to sign in again.

If any step fails, note the step number + what you saw — that's the bug report.
