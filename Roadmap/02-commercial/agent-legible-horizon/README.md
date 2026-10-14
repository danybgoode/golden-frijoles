---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-14T18:22:27Z"
slug: agent-legible-horizon
title: "Agent-legible horizon and docs"
area: 02-commercial
risk: high
type: feature
sprints_total: 1
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: null    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: null
quote_basis: null
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder's coding agent (Claude Code, Codex) setting up or debugging a product without a browser."   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 85      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Agent-legible horizon and docs

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/agent-legible-horizon.md`](../../00-ideas/seeds/agent-legible-horizon.md)
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
A founder's coding agent can read a product's horizon, connect Codex and debug a setup without a browser, and
`frijoles login` says where its product came from. Today the horizon is visible only on a signed-in page, the Codex
connector step exists only on that page too, and an agent testing the product stopped because nothing documented a
headless path (the product owner's report, 2026-10-14).

## Platform-first note
No new data. The horizon is already the latest roadmap artifact's optional `horizon` key (many-products D14);
`getHubRoadmapByProjectId` + `deriveHorizon` already compute it. This epic exposes that read through the two existing
member/credential seams (the CLI route seam `lib/cli-auth.ts`, the MCP connector's resolved project) and documents
what already exists.

## What already exists (reuse, don't rebuild)
- `lib/hub-query.ts → getHubRoadmap / getHubRoadmapByProjectId` (filters deleted products) + `lib/horizon-destinations.ts → deriveHorizon`.
- `lib/cli-auth.ts → requireCliMember` (one seam for every `/api/v1/cli/*` route); `packages/cli/src/commands/*` + goldens.
- `app/api/v1/public/mcp/c/[token]/route.ts` (tools registered on the token's resolved project; `lib/public-connector-scrub.ts`).
- `skills/template/scripts/roadmap-push.mjs --dry-run` — ALREADY prints the envelope, `horizon` included, sending nothing.
- `app/install.md`, `app/llms.txt` (what agents fetch); the Codex command on the signed-in Connect page (`codex mcp add golden-frijoles --url …`).

## Architecture lock (2026-10-14, the architect, verified against live code)
- **D1 · `GET /api/v1/cli/horizon?project=<slug>`** through `requireCliMember` (member read, like `cli/status`):
  `getHubRoadmap(slug)` → `{ destinations: deriveHorizon(horizon, epics)[] with id, title, description, status,
  litBy[{slug,name,shipped}] , generatedAt, sourceCommit }`; no artifact → `{ destinations: [], pushed: false }`; a
  pushed roadmap with no horizon → `{ destinations: [], pushed: true }` (the empty state, said, not an error).
- **D2 · `frijoles horizon [--project] [--json]`** prints one line per destination (status word, title, epics) or the
  empty-state sentence naming `Roadmap/horizon.md`, `destination:` and `roadmap-push --dry-run`. Help golden changes on purpose.
- **D3 · `get_horizon` MCP tool** on the connector's resolved project (no input), the same payload as D1; read-only, so
  it follows the connector's existing gates (rule #3) and is in the public demo's tool list (no person ids — the scrub
  needs no new field). The exhaustive tools/list spec gains it on purpose.
- **D4 · No new dry run**: `roadmap-push --dry-run` exists; the docs name it as the pre-push check.
- **D5 · Codex MCP setup** in `install.md` (beside the Claude app step) and `llms.txt`: `codex mcp add golden-frijoles
  --url <your connector URL>` and where to get the URL (Setup › Connect, or `frijoles` …). Never a real URL in a doc.
- **D6 · One agent page `/agents.md`** (a static file like `install.md`, linked from `llms.txt`): per feature, the
  headless read / change / check path (CLI command, MCP tool, API route) and the common errors with their meaning. A
  guard test holds it to the code: every `frijoles <verb>` it names exists in the CLI's command table, every MCP tool it
  names is registered, and every CLI command + MCP tool that exists is named (no drift either way).
- **D7 · Login wording**: when the product was kept from the credentials file, login says `Product: <slug> (remembered
  on this machine; a repo's golden-frijoles.config.json overrides it)`; when it is the account's only product, `(your
  only product)`; with none chosen it keeps the existing "N products … init" line.

**Routing.** The architect builds D1–D3 (an auth seam route and a connector tool); a Sonnet builder takes D5–D7 docs +
wording against this lock; the architect diffs it. Reviews: routed (`--exclude codex` unless codex is used — then
`CODEX_MODEL=gpt-5.6-luna CODEX_REASONING_EFFORT=xhigh`, the product owner's call), fresh verifier (risk high).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | 1.1 `frijoles horizon` reads it headless | high |
| 1 | 1.2 The connector has `get_horizon` | high |
| 1 | 1.3 Codex MCP setup in the docs agents read | low |
| 1 | 1.4 One page for agents debugging | low |
| 1 | 1.5 Login says where the product came from | low |

## Deploy order
No migration. Merge = deploy for the route, tool and docs; the CLI command ships in CLI 1.7.0 (npm publish is the product owner's 2FA step).

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
