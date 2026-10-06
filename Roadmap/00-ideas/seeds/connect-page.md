---
title: "Connect: start where you are"
slug: connect-page
status: scaffolded
area: "02-commercial"
type: feature
appetite: M
risk: high
updated: 2026-10-06
intent_ask: verbatim   # verbatim = the product owner's own words below · proxy = reconstructed after the fact
intent_match: null
underwritten_by: wave-2026-10
build_order: 61
epic: "02-commercial/connect-page"
---

# Pitch — Connect: start where you are

Moves: proving_workspaces · Tests: Value proposition — the first screen after signup is where a new founder either
starts or stalls. Follow-up to [`account-from-the-terminal`](../../02-commercial/account-from-the-terminal/README.md).

## The ask, as given

Daniel, 2026-10-06, verbatim:

> After signup users land on /app/onboarding/ (where btw im shown as the top element an api key i believe and a
> warning to copy as its the only time its shown. Do we need this at all at this step? If not we can start with the
> path of least resistance which in my opinion is the general installation prompt. this because having that there
> with the sense of urgency could be counterproducing for newly signed up users)
>
> I think its a bit confusing when comparing it to the /app/setup/connect/
>
> I think that in /app/setup/connect/ we should show the sdk snippet.
>
> Also, after signup users should land on /app/setup/connect/
>
> Then lets structure the options we show in there because they are a bit disconnected and dont believe are
> sorted/organized intentionally.
>
> In my opinion, the order should be (but would like your evaluation and consolidation …):
> - General installation prompt
> - Do it yourself: from Claude Code (`claude plugin marketplace add golden-frijoles/skills` then `claude plugin
>   install golden-frijoles@golden-frijoles`); from any other agent (`npx skills add golden-frijoles/skills --skill '*'`)
> - MCP for Claude: connector url — when i created this new account it showed some text saying the url was read
>   only, if i wanted read and write i should generate a new one, users shouldnt have to take this extra step and the
>   connector url minted should already be crud as per specs. The three steps.
> - Should we offer instructions MCP for codex? they do support it now.
> - SDK snippet: lets improve the language and communication about it so its clearer.

Decided 2026-10-06: one epic (option B), and the page is titled **Connect** (the section is already "Set up").

### Claims
1. A new account's connector URL can already change things as its owner — no Get a new URL first.
2. After signup the founder lands on Connect, not on a page that shows a one-time key with a warning.
3. Connect is ordered by path of least resistance: the install prompt, do it yourself, the Claude app, Codex, the
   SDK, then signed-in machines.
4. Codex gets its own one-command MCP setup.
5. The SDK block says plainly what it is for and where its key comes from.

**Teach-back:** yes (option B, title "Connect").

## Problem
Signup ends on `/app/onboarding`, whose first element is a one-time API key with "copy this now" — urgency about a
credential the founder does not need yet (the agent path mints its own with `gf init`). Connect, the page they need,
is a different screen with a different order, and its connector URL is read-only for every new account because the
signup provisioning mints it without a maker (a defect against account-from-the-terminal D11).

## Appetite
**M**, one run, two sprints: the credential fix and the landing first (high risk), then the page (low risk).
quote: $25–60 (M, architect estimate)

## Outcome & signal
A new founder signs up with Google, lands on Connect, copies the first prompt into their agent, and — if they want
the Claude app or Codex — pastes one URL or one command, which can already turn a flag off as them.

## Scope
- Provisioning stamps the owner on the connector URL it mints (never the demo project).
- Signup (callback, `/app/provision`) lands on `/app/setup/connect/<slug>`; `/app/onboarding/<slug>` redirects there.
- No one-time API key at signup; Connect's SDK block says where a key comes from (`gf init`, Setup › Keys).
- Connect reordered into six blocks; Codex MCP command; SDK copy rewritten.
- **No-gos:** new MCP tools, OAuth for the connector, changes to `/install`, the landing.

## Rabbit holes
- Setup › Connect is an approved design state (`setup-connect`); a new structure needs a new approved picture — the
  build ships it with a dated deferral and the approval is Daniel's.
- The signup-minted ingest key also registers a starter feature; stopping the mint must not strand that.
- Existing signup-minted URLs stay read-only until Get a new URL (no credential backfill without a decision).
