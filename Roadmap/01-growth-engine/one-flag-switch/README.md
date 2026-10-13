---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: In review       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-13T21:22:39Z"
slug: one-flag-switch
title: "One flag switch: on or off, the same in the CLI, the SDK, MCP and the page"
area: 01-growth-engine
risk: high
type: bug
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=21, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, switching a feature on or off, often through an agent"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 80      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One flag switch: on or off, the same in the CLI, the SDK, MCP and the page

> **Area:** 01-growth-engine · **Risk:** high · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/one-flag-switch.md`](../../00-ideas/seeds/one-flag-switch.md)
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
On 2026-10-13 the CLI turned drills off in production and the flags page still said On. The product owner: one switch,
on or off; whatever an agent changes through the CLI, SDK or MCP is exactly what the page shows, and the reverse. No
"activated" state anywhere.

## What already exists (reuse, don't rebuild)
- `lib/cli-flag-write.ts` → `executeCliFlagWrite`: the CLI's and MCP's one write core (`set`, `kill`).
- `lib/flag-list-view.ts` (`resolveActivationState`, `projectFlagRows`), `lib/flag-environment-view.ts`, `lib/cli-flag-view.ts`.
- `app/app/flags/[projectSlug]/` — `flag-console.tsx`, `[flagKey]/flag-switch.tsx`, `actions.ts`.

## Architecture lock (D1–D4)
- **D1 — On means the app gets `true`.** One pure rule decides On / Off for a boolean flag in an environment, from the
  version it serves. Activation stays in the database, never on a screen or in a command.
- **D2 — One write path.** The page's switch calls `executeCliFlagWrite` (on = `set` to the true variant, off =
  `kill`), the same core as the CLI and MCP. The page loses its deactivate control.
- **D3 — Non-boolean flags** show the value they serve and have no switch.
- **D4 — The gates seam is unchanged** (it already reads deactivated as off); the SDK snapshot is unchanged.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One rule for on and off | high |
| 1 | S1.2 The page switch writes what the CLI writes | high |
| 1 | S1.3 The CLI says on or off by the same rule; a parity spec | high |

## Deploy order
No migration. Merge = deploy.

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
