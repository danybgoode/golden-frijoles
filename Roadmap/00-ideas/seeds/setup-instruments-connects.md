---
title: "Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen"
slug: setup-instruments-connects
status: scaffolded
area: "09"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: high
epic: "09-platform-infra/setup-instruments-connects"
build_order: 77
updated: 2026-10-09
intent_ask: proxy      # reconstructed from the launch-sweep brief and audit §9 steps 6–8; Daniel's go: "go ahead with setup instruments and connects"
hypothesis: "We believe that a setup which adds the events the chosen North Star's inputs need in a pull request, connects the project with one command, and shows the first event arriving, for founders who just agreed a strategy at setup, will turn new workspaces into proving workspaces (from 0 to 2 by 15 December, with setup drafts the strategy), because a bet can only be proven by a number that is measured, and today setup stops before any event is sent. We'll know when a new project's first event arrives in the same session as its setup."
persona: "a founder who owns the product, solo to mid-size, who just agreed a strategy at setup"
grounded: true
grounded_reason: null
target_metric: proving_workspaces
target_from: 0
target_to: 2
read_date: 2026-12-15
flag_key: onboarding.first_event_band_enabled
intent_match: 89
---

# Pitch — Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen

Moves: proving_workspaces · Tests: Value proposition

## The ask, as given

> The onboarding end state: infer, then confirm; the agent does the legwork through commands; everything reversible
> and labelled until the founder agrees; nothing leaves the machine until pushed.
> — Daniel, 2026-10-08, reconstructed from the launch-sweep brief's onboarding item (audit §9 steps 6–8: instrument,
> connect, done). Then, 2026-10-09: "go ahead with setup instruments and connects".

### Claims
1. The agent instruments the product itself: the SDK, the events the North Star's inputs need, error capture.
2. The change is reversible and reviewable: a pull request, nothing merged for the founder.
3. Connecting is one step, and the founder sees their first event arrive.

**Teach-back:** yes — "You want setup to finish the job: put the measuring code in a pull request the founder can
review, connect the project, and show the first event landing. Right?" (audit §9, agreed in its Decisions section)

## Problem
Setup now ends with an agreed strategy, a measurement plan and a first idea, but nothing measures anything:
- **No code changes.** The measurement plan lists inputs that "need an event", and nobody adds them. The SDK's
  quickstart lives on `/install` and the Connect page, for a person to copy.
- **No ingest key.** `frijoles init` creates the project and writes a **flag-read** key into `.env.local`; tracking
  needs an **ingest** key, which only `frijoles keys create --type ingest` mints, and setup never runs it.
- **No signal.** Nothing tells the founder, or the agent, that an event arrived. Today shows tasks and reads; Connect
  says "if it reads zero after the event fired, check the key".
- **No ending.** Setup does not say what was done, what is waiting, or where the console is.

## Appetite
M. One CLI change (an ingest key from `init`, and one read: has the project received an event), setup text for
instrument and connect, and one band on Today.
quote: $15–31 (M, n=19, p25–p75)

## Outcome & signal
After the Strategy gate, setup offers to instrument: on a branch, it installs the SDK, writes one client module,
adds a `track` for each input that needs an event (each at the code point it cites), turns on error capture, and opens
a pull request listing every change. Then it connects: `frijoles login` → `frijoles init --ingest` (project, keys,
`.env.local`) → the North Star synced → the roadmap pushed → a link to Today, which shows "Waiting for your first
event" until one lands, then the event and its time. `frijoles status` tells an agent the same. Setup ends with a
three-line summary.
**Target:** shared with setup-drafts-strategy: `proving_workspaces` 0 → 2 by 2026-12-15 (read by hand).

## Stage-2.5 bucket
**Genuinely new**, on existing parts: the SDK 1.0 one-line client, `frijoles login`/`init`/`keys`/`north-star set`,
`roadmap-push`, Today, the read-product facts.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `setup/references/instrument.md`: branch, SDK install, one client module by stack, one `track` per input that needs an event, error capture, flags only if the product has them, a PR (or the branch when `gh` is not signed in) | the agent does the legwork, and the founder reviews it |
| `frijoles init --ingest`: also mints an **ingest** key into `.env.local` as `GROWTH_ENGINE_API_KEY`, same gitignore guard, idempotent | one command connects; the name the SDK snippet and the plugin hooks read |
| `frijoles status`: the project, whether its first event has arrived, the latest event and when (a member-gated CLI route reading one project) | the agent can see the event land (CLI-first) |
| Setup's connect step: login → `init --ingest` → `north-star set` → `node --env-file=.env.local …roadmap-push` → the Today link | nothing leaves the machine until this step, and it is one step |
| Today's first-event band: "Waiting for your first event" with the snippet and key names, then the first event and its time | the founder sees it work |
| Setup's ending: what was done, what is waiting (the PR to merge, the first idea), the console link | a clear end |

## Scope
**Sprint 1 · Connect and see it land** (S1.1 `frijoles init --ingest` · S1.2 `frijoles status` and its route · S1.3
Today's first-event band) · **Sprint 2 · Instrument** (S2.1 `instrument.md` and setup's instrument step · S2.2 setup's
connect step and its ending · S2.3 CLI 1.1.0, plugin + kit 1.3.0).

**No-gos:** the agent never merges the pull request, and never commits a key (`.env.local` stays ignored; `init`
refuses otherwise, as today) · no instrumentation without the founder's go at setup · no new event table or route:
events go through `/api/v1/track` (AGENTS rule 1) · no framework plugins or codemods: the agent edits with its own
tools, guided by `instrument.md` · no cross-workspace reads (the band and `status` read one project) · the flag ↔ TARS
wiring is "one bet, wired", next.

## Rabbit holes
- **Where the event goes.** The agent must find the real code point (the button handler, the API route) for each
  input; `instrument.md` says to cite it in the PR and to add a `TODO` with the reason when there is none, never to
  guess.
- **Server vs browser.** An ingest key in browser code is visible to anyone. `instrument.md` puts `track` calls on the
  server (API routes, server actions) by default and says so in the PR; browser tracking needs a public-key design the
  engine does not have yet (out of scope).
- **The first-event read** must be one project's, through the membership seam (`lib/membership.ts`), never a scan.
- **A credential on disk.** `init --ingest` writes it at 0600 into an ignored file and prints only its name.

## What already exists (reuse, don't rebuild)
- `packages/sdk` 1.0 (`createGrowthEngineClient({ apiKey })`, `track`, `captureGlobalErrors`, the flag provider)
- `packages/cli`: `login` (device flow), `init` (project, flag-read key, `.env.local`, gitignore refusal), `keys create
  --type ingest`, `north-star set`, `doctor`
- `scripts/roadmap-push.mjs` (reads `GROWTH_ENGINE_API_KEY`), Node's `--env-file`
- Today (`apps/web/app/app/page.tsx`, `CommandCenter`), `lib/membership.ts`, `lib/sdk-snippet.ts`
- setup's Strategy gate and `read-product.mjs` (the inputs and their events)

## Visuals

```
 Strategy gate approved
   └─ "Add the measuring code now? (a pull request you review)"   1 Yes · 2 Later
        branch → npm i @golden-frijoles/sdk → lib/golden-frijoles.ts → track('<event>') at each cited point
        → captureGlobalErrors → PR "Measure <North Star>" (every change listed)
   └─ "Connect to Golden Frijoles?"   1 Yes (opens the browser once) · 2 Later
        frijoles login → frijoles init --ingest → frijoles north-star set → roadmap push
        → https://goldenfrijoles.com/app  [Waiting for your first event … ] ──(first track)──▶ [order_placed · 2 min ago]
   └─ Done: North Star <X> · first idea <Y> in the backlog · PR #<n> to review · console <link>
```

## UX heuristics & rails check
Two plain questions, each with "Later". The PR is the review surface; nothing is merged for the founder. The band says
what it is waiting for and how to send it; it never shows a wall of zeroes.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
**Flag:** `onboarding.first_event_band_enabled`, a kill switch (on, so it can be switched off), created in Golden
Frijoles in every environment (`frijoles flags create onboarding.first_event_band_enabled --kill-switch --all-envs
--description "<the hypothesis> (epic setup-instruments-connects)"`). It gates Today's band and the `status` route.
The CLI change and the setup text roll back with a release.

## Acceptance criteria
- S1.1 `frijoles init --ingest` writes an ingest key into the ignored `.env.local` as GROWTH_ENGINE_API_KEY, once, and prints only its name (high)
- S1.2 `frijoles status` says whether the project's first event has arrived, and the latest event and its time, for a member only (high)
- S1.3 Today shows "Waiting for your first event" until the project has one, then the event and its time, behind its kill switch (high)
- S2.1 After the Strategy gate, setup can add the SDK, a track call per input that needs an event and error capture on a branch, and open a pull request listing every change (high)
- S2.2 Setup's connect step signs in, writes the keys, syncs the North Star, pushes the roadmap and ends with the console link and a three-line summary (high)
- S2.3 CLI 1.1.0 and plugin + kit 1.3.0 released with CHANGELOG entries (low)

## Open risks / research
- Whether an existing member-gated route can answer "has this project received an event" (the event catalog query is
  project-scoped), or `status` needs its own CLI route: decided at the lock.
- The CLI pins an exact kit version (0.43.0 today; plugin-1-0 D9): this release moves it to 1.3.0.

## Decisions for the Plan gate
- **a.** The instrumentation lands as a **pull request** (when `gh` is signed in; otherwise a pushed branch and the
  link to open one), never committed to the default branch. Or a local branch only, nothing pushed?
- **b.** `frijoles init --ingest` mints the ingest key as part of setup's connect step (one command, said on screen),
  or setup asks separately before minting it?
- **c.** Today's band updates on refresh (simple, no polling), or polls every few seconds until the first event lands?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/setup-instruments-connects.md
  coverage in   0.97  (3 claims)
  coverage out  0.78  (6 criteria)
  clarity       0.81  (6 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 89 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
Untraced (trace it to the ask or cut it):
  criterion 6 (0.33): "S2.3 CLI 1.1.0 and plugin + kit 1.3.0 released with CHANGELOG entries (low)"
```

<!-- intent-match: {"coverage_in":0.967,"coverage_out":0.777,"clarity":0.812,"teach_back":1,"total":89} -->

## Decisions at the Plan gate (Daniel, 2026-10-09)
- **Approved**, all three as recommended:
- **a.** The instrumentation lands as a **pull request** (a pushed branch and the link to open one when `gh` is not
  signed in), never committed to the default branch.
- **b.** `frijoles init --ingest` mints the ingest key inside setup's connect step: one command, said on screen.
- **c.** Today's band updates on **refresh**; no polling (`frijoles status` tells the agent when the event lands).
