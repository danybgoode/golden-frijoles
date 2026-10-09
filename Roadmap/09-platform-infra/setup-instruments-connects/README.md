---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-09T20:17:01Z"
slug: setup-instruments-connects
title: "Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen"
area: 09-platform-infra
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 31
quote_basis: "M, n=19, p25–p75"
hypothesis: "We believe that a setup which adds the events the chosen North Star's inputs need in a pull request, connects the project with one command, and shows the first event arriving, for founders who just agreed a strategy at setup, will turn new workspaces into proving workspaces (from 0 to 2 by 15 December, with setup drafts the strategy), because a bet can only be proven by a number that is measured, and today setup stops before any event is sent. We'll know when a new project's first event arrives in the same session as its setup."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: 2026-12-15       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, who just agreed a strategy at setup"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: onboarding.first_event_band_enabled   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 77      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Setup instruments and connects: the events the North Star needs, in a pull request, and the first one seen

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/setup-instruments-connects.md`](../../00-ideas/seeds/setup-instruments-connects.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
We believe that a setup which adds the events the chosen North Star's inputs need in a pull request, connects the
project with one command, and shows the first event arriving, for founders who just agreed a strategy at setup, will
turn new workspaces into proving workspaces (from 0 to 2 by 15 December, with setup drafts the strategy), because a bet
can only be proven by a number that is measured, and today setup stops before any event is sent. We'll know when a new
project's first event arrives in the same session as its setup.

## Platform-first note
Every event goes through `POST /api/v1/track` via the SDK (AGENTS rule 1); no new event table or ingest route. The one
new read ("has this project received an event, and which was the latest") lives in the canonical event module,
`lib/event-catalog-query.ts`, scoped to one project resolved by the CLI's member check or the console's session. The
gate is a Golden Frijoles catalog flag (rule 6).

## What already exists (reuse, don't rebuild)
- `packages/sdk` 1.0; `packages/cli` `init` (project, flag-read key, `.env.local`, gitignore refusal, `upsertEnvValue`),
  `keys create --type ingest`, `north-star set`, `login`; `lib/cli-auth.ts` (`requireCliMember`)
- `lib/event-catalog-query.ts` / `event-catalog.ts` (`RESERVED_EVENTS`), Today (`components/product/CommandCenter.tsx`,
  `design-system/bands`), `lib/gates.ts` + `gates-decision.ts` (`GATES`), `lib/sdk-snippet.ts`
- `scripts/roadmap-push.mjs` (`GROWTH_ENGINE_URL`, `GROWTH_ENGINE_API_KEY`), Node's `--env-file`
- setup's Strategy gate and `read-product.mjs` (each input's event, or "needs an event")

## Architecture lock (D1–D10)
- **D1 · `frijoles init --ingest`.** After the flag-read key, `init` (only with `--ingest`) mints an **ingest** key
  through the existing keys route and writes `GROWTH_ENGINE_API_KEY` and `GROWTH_ENGINE_URL` (the site URL) into
  `.env.local`: the names the SDK snippet, `roadmap-push` and the plugin hooks read. Same order as today: the gitignore
  and writability checks come before anything is minted. Idempotent: a present `GROWTH_ENGINE_API_KEY` is kept and said
  so (to replace it, delete the line), never minted twice. Prints names, never values.
- **D2 · The first-event read.** `getProductEventMarks(projectId)` in `lib/event-catalog-query.ts`: the earliest and
  the latest event of ONE project that is not in `RESERVED_EVENTS` (the SDK's own `flag_evaluated` and friends), each
  `{ event, at }` or null. Two one-row queries (`order … limit 1`), no scan, no other project.
- **D3 · `frijoles status`.** `GET /api/v1/cli/status?project=` (`requireCliMember`, then the D2 read) → `{ project,
  firstEvent, latestEvent }`; behind the gate (D5: off → 404, as gated routes do). `frijoles status [--project]
  [--json]` prints "Waiting for the first event" or "First event: <event>, <when> · Latest: <event>, <when>".
- **D4 · Today's first-event message.** *(Amended at build: a `Callout`, not a fourth band. Today's three bands are
  the approved design, DD1, pinned by `command-center.authed.spec.ts`; this is a one-time setup message, not a queue.)*
  `CommandCenter` shows it when the project has
  no product event ("Waiting for your first event", with the key names and a link to Connect's snippet), or when its
  first one arrived in the last 7 days ("Your first event arrived: <event>, <when>"); otherwise nothing. Updates on
  refresh (Daniel, c). The approved-states design contract is updated by its own procedure if it measures the band.
- **D5 · The gate.** `onboarding.first_event_band_enabled`: a `GATES` row (`envVar: 'FIRST_EVENT_BAND_ENABLED'`, off
  Vercel only; `fallback: true`, a kill switch), in `ci/gates.on.env`/`off.env`; created in the catalog with
  `--kill-switch --all-envs` and the hypothesis as its description. It gates the band and the status route.
- **D6 · The instrument step.** `setup/references/instrument.md`, offered after the Strategy gate's Approve ("Add the
  measuring code now? It comes as a pull request you review."). On a new branch: install `@golden-frijoles/sdk`; one
  client module by stack (`createGrowthEngineClient({ apiKey: process.env.GROWTH_ENGINE_API_KEY })`, server-side);
  one `track` per chosen-candidate input marked "needs an event", at the code point it cites (or a `TODO` with the
  reason, never a guess); `captureGlobalErrors` where the stack has a server entry; flags only if the product has a flag
  read. Never a key in code; `.env.local` never committed.
- **D7 · The pull request** (Daniel, a): pushed and opened with `gh pr create` when `gh` is signed in, else the branch
  pushed and the link printed; the body lists every file and why. Never committed to the default branch, never merged
  by the agent.
- **D8 · The connect step** (Daniel, b): "Connect to Golden Frijoles? It opens your browser once." → `frijoles login` →
  `frijoles init --ingest` → `frijoles north-star set` from the agreed file → `node --env-file=.env.local` +
  `roadmap-push` → the Today link → `frijoles status`. Each step says what it did; a failure stops and names the fix.
- **D9 · The ending.** Three lines: the North Star, the first idea in the backlog, the PR to review (or "no code
  changed"), and the console link.
- **D10 · Releases.** CLI 1.1.0 (`init --ingest`, `status`; pins kit 1.3.0, retiring the 0.43.0 pin, plugin-1-0 D9);
  plugin + kit 1.3.0. npm publishes are Daniel's, after the gate and reviews.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `frijoles init --ingest` | high |
| 1 | S1.2 The first-event read and `frijoles status` | high |
| 1 | S1.3 Today's first-event band behind its kill switch | high |
| 2 | S2.1 `instrument.md` and setup's instrument step | high |
| 2 | S2.2 Setup's connect step and its ending | high |
| 2 | S2.3 CLI 1.1.0, plugin + kit 1.3.0 | low |

## Deploy order
One PR, both sprints. The flag is created and activated in every environment before the merge (the merge deploys the
band). Kit 1.3.0 and CLI 1.1.0 are published by Daniel after the gate is green and the reviews are answered, then the
merge.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `frijoles flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
