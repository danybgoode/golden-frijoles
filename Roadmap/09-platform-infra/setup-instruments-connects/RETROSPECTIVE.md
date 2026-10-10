# Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen — Retrospective

_Closed: 2026-10-10_
_Intent: yes_
_Quote vs actual: $15–31 (M, n=19, p25–p75) → ≈$39.86 (OVER the quote by about a third; Claude only, reviewers not
measured. Five verifier rounds, four of them on one section of agent instructions.)_

## What shipped
- **One PR, both sprints** (#338, merge `37bb5e0`; CLI 1.1.0, plugin + kit 1.3.0 on npm).
  - `frijoles init --ingest` writes an ingest key into the ignored `.env.local`, verifying an existing one first
    through a member-gated, one-bit `POST /api/v1/cli/keys/verify`.
  - `frijoles status` and Today say whether the project's first product event has arrived, behind the kill switch
    `onboarding.first_event_band_enabled` (on everywhere). Today uses a bounded read.
  - Setup offers the measuring code as a pull request (`setup/references/instrument.md`) and connects in one step
    (`references/connect.md`), ending with three lines.
  - The `gf` CLI alias is retired, as plugin 1.0 promised.
- **Verified on production after the merge:** the status route answers 401 without a credential (gate on, auth
  checked); CLI 1.1.0 from npm reports `golden-frijoles`: first event `setup_guide_viewed` 86 days ago, latest a day ago.

## What went well
- **The verifier caught what both external reviewers called clean:** a failing authed spec, a read that sorted every
  row of a project on each Today render, and server error capture that did nothing.
- **Probing the instructions found real failures:** the verifier ran each error-capture snippet against the installed
  Node, Express, Hono and Next sources, and every over-claim surfaced as a reproduction, not an opinion.
- **A side bug fixed by keeping a promise:** `npx @golden-frijoles/cli@1.0.0` launched as `gf` and printed the rename
  notice to setup's own users; retiring `gf` in 1.1.0 removed it.

## What we learned
- **Instructions an agent will paste into a stranger's codebase need the same probes as code.** Four rounds went to
  one paragraph about error capture: a listener that changes how the app crashes, a monitor that exits before the
  send, a Hono handler that rewrote auth errors, a claim about which Next errors are awaited. Each was obvious once
  run against the real framework, and none was caught by reading. Probe each snippet against the installed framework
  before the first review, not after the fourth.
- **The overrun came from that paragraph, not from the build:** the code stories each took one round. Scope a
  "here's how to wire X into any framework" story as its own story with its own probes.
- **An unpublished package cannot be in the lockfile.** The CLI pins an exact published kit, so a release that bumps
  both pins the CLI to the last published kit (D10 amended).
- **A shared server client with `identify()` attributes one person's events to another.** The setup guidance makes a
  client per request; that belongs in the SDK's own README too.

## Gaps / follow-ups
- **Owed to Daniel:** the interactive setup walkthrough (sprint 2) on a scratch copy of a real product repo, and the
  signed-in Today check on a fresh project (sprint 1 step 3).
- **The SDK README** should say "a client per request on a server" (from D6).
- **The CLI's kit pin** is 1.2.0; its next release moves it to the then-published kit.
- **Fastify's** error-hook snippet is checked against its documentation only (not installed here).
