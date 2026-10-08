---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-08T19:39:18Z"
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
target_metric: null    # no target: proving_workspaces has no recorded value yet; read by the stranger walkthrough
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

## Architecture lock (2026-10-08, verified against live code)

- **D1 — Only the typed command changes.** `gf_pat_` tokens (`apps/web/lib/cli-tokens.ts:26`, server-issued), `GF_*`
  env vars (`GF_SKIP_STORY_CHECK`), the `GF-NEEDS-SETTING` marker, the credentials path
  (`~/.config/golden-frijoles/credentials.json`, `packages/cli/src/credentials.ts:57`) and `golden-frijoles.config.json`
  stay. Renaming a token prefix would invalidate every issued token.
- **D2 — One executable, two names.** `packages/cli/package.json` `bin` maps both `frijoles` and `gf` to
  `dist/bin.js`; `bin.ts` (the only file that reads `process.argv`) checks the invoked basename and, for `gf`, writes one
  notice line to **stderr** (never stdout, so `--json` output is unchanged): `gf is now frijoles. gf stops working on
  2026-12-31 (or in CLI 1.1.0).` Same for the kit: `frijoles-kit` + `gf-kit` → `bin.mjs`.
- **D3 — The alias expires.** `scripts/check-deprecations.mjs` (+ test) holds one table: `{ bin, package, removeBy:
  '2026-12-31', orVersion: '1.1.0' }` for `gf` and `gf-kit`. Red when the date has passed or the package version reaches
  `orVersion` while the alias is still in `bin`. Runs in CI's static steps, the precedent `check-quarantine.mjs` set
  (a dated red on every PR is the point: it forces the removal).
- **D4 — The console names the binary in one place:** `CLI_BIN` (`apps/web/lib/cli-install.ts:19`) → `'frijoles'`.
- **D5 — Text scope:** a command a person or agent types (`gf <verb>`, `gf-kit <verb>`, the CLI called "gf") in shipped
  text: skills, template, install.md, console copy, package READMEs, AGENTS.md rule 6. Roadmap history is not rewritten.
  `check-deprecations.mjs` also fails on a `gf <verb>` in shipped text outside the notice and the CHANGELOG.
- **D6 — Stage keys stay** (`'To groom'`, `'Grooming'` in `scripts/lib/stage.mjs`, `apps/web/lib/hub-areas.ts:34`);
  labels change through the existing `stageLabel()`. The board already says "Backlog" for `To groom`
  (production, 2026-10-08); "Grooming" → "Refining" is the change.
- **D7 — One break, one sitting.** `check-release.mjs` requires a version bump in every PR that touches `plugins/**`,
  and strangers track `main`, so each sprint merge is live. The four PRs are stacked and **merged in one sitting**
  after Sprint 4's walkthrough: 0.44–0.46 are tagged minutes apart and 1.0.0 lands with them. The CLI publish is
  Daniel's 2FA step; the kit publishes itself (OIDC trusted publishing, `release.yml`). **The CLI 1.0 publish comes
  BEFORE the merge** (verifier, #324): the console's install page, Connect screens and finops copy teach `frijoles`
  the moment they deploy, and `npm i -g @golden-frijoles/cli` must already give a CLI that has that bin.
- **D8 — Every PR is HIGH** (shared infra, a breaking release): Daniel merges; the verifier (today `pr-reviewer`) plus
  the routed external passes on each.

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
