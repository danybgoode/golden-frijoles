---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: plugin-1-0
title: "Plugin 1.0: five plain skills, the frijoles CLI, and Refining"
area: 09-platform-infra
risk: high
type: feature
sprints_total: 4
stories_total: 12   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 55    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 111
quote_basis: "L, n=4, p25–p75"
hypothesis: "We believe that a plugin with five plainly named skills and a CLI no shell alias can shadow, for founders installing Golden Frijoles for the first time, will let more of them reach a first approved plan, because today the first command silently runs git fetch on oh-my-zsh machines and the skill list reads like our own toolbox."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at groom Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 73      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Plugin 1.0: five plain skills, the frijoles CLI, and Refining

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/plugin-1-0.md`](../../00-ideas/seeds/plugin-1-0.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
We believe that a plugin with five plainly named skills and a CLI no shell alias can shadow, for founders installing Golden Frijoles for the first time, will let more of them reach a first approved plan, because today the first command silently runs `git fetch` on oh-my-zsh machines and the skill list reads like our own toolbox. One breaking release, 1.0, carries every rename at once. Pitch and gate decisions: `00-ideas/seeds/plugin-1-0.md`.
Moves: proving_workspaces · Tests: Value proposition.

## Platform-first note
No engine change beyond console labels through the existing `stageLabel()`; keys, routes, env vars and the folder layout stay (plain-outcome-rename keeps those). Generated surfaces stay generated: skill adverts (`render-skill-adverts.mjs`), archives (`pack-skills.mjs`), hook vendor copies (`render-hook-vendor.mjs`). Supersedes plain-outcome-rename S2.1 and the screen-word half of S3.3.

## What already exists (reuse, don't rebuild)
- `skills/scripts/{render-skill-adverts,pack-skills,check-release,check-gate-words,check-onboarding-parity,render-hook-vendor}.mjs`, `skills/RELEASING.md`
- `apps/web/lib/{epic-page,hub-areas,stage-commands}.ts`, `scripts/lib/stage.mjs`, `scripts/check-quarantine.mjs` (the expiry pattern)
- `packages/cli/package.json`, `skills/kit/package.json`, `apps/web/lib/install-prompt.ts`, the routines in `skills/template/scripts/routines/`

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 · The CLI is frijoles | S1.1 frijoles is the CLI's command · S1.2 The kit answers to frijoles-kit · S1.3 Every surface says frijoles | high |
| 2 · Refine and Refining | S2.1 The skill is refine · S2.2 The screens say Refining and Backlog · S2.3 The retired words stay retired | high |
| 3 · Five skills and the verifier | S3.1 strategy · S3.2 report · S3.3 setup; the ops skills leave · S3.4 The verifier | high |
| 4 · Release 1.0 | S4.1 Plugin, kit and CLI 1.0.0 · S4.2 A stranger installs 1.0 | high |

## Deploy order
One PR per sprint, merged with a merge commit (a `skills/` subtree PR is never squashed). Console labels deploy on merge. The plugin, kit and CLI release once, in Sprint 4, after the walkthrough; npm publish is Daniel's 2FA step. Every PR is HIGH: Daniel merges.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
