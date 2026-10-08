---
title: "Plugin 1.0: five plain skills, the frijoles CLI, and Refining"
slug: plugin-1-0
status: scaffolded
area: "09"
type: feature
appetite: L
underwritten_by: wave-2026-10
risk: high
epic: "09-platform-infra/plugin-1-0"
build_order: 73
updated: 2026-10-08
intent_ask: verbatim   # verbatim = the product owner's own words below · proxy = reconstructed after the fact
hypothesis: "We believe that a plugin with five plainly named skills and a CLI no shell alias can shadow, for founders installing Golden Frijoles for the first time, will let more of them reach a first approved plan, because today the first command silently runs git fetch on oh-my-zsh machines and the skill list reads like our own toolbox."
target_metric: proving_workspaces
target_from: null      # no value recorded yet: the input is pushed from outside and has never been pushed
target_to: null
read_date: null        # 30 days after shipping
flag_key: null         # none: carve-out below
intent_match: 88
---

# Pitch — Plugin 1.0: five plain skills, the frijoles CLI, and Refining

Moves: proving_workspaces · Tests: Value proposition

## The ask, as given

> lets review our skills as i dont even use many of them anymore myself and theyv grown too large, could be
> consolidated so the barrier for users to install it is lower.
> werent we supposed to retire the word grooming as part of the language used? […] Two places still use the old words
> and were out of scope: the question asked when a large epic reaches a wave boundary, and an older row in the root
> SESSION-KICKOFFS.md.
> One key thing ive found to be possibly a design oversight on my end is that gf is so very common to be aliased to
> git fetch, its even a default with many clients. So it makes cumbersome to use the cli.
> — Daniel, 2026-10-08. Decisions the same day: "yes retire for refining, but why dont we call the skill
> refinement?" (→ `refine`), "frijoles", "go ahead with plugin 1.0".

### Claims
1. Fewer skills, consolidated, so installing is a lower barrier; agents where they fit (like the PR reviewer).
2. Retire "grooming" from the words people see: "Refining" on screen, the skill named after it.
3. Fix the two places still worded the old way.
4. A CLI name that a shell alias can't shadow: `frijoles`.

**Teach-back:** yes — "You want one 1.0 release a stranger can install and understand: a handful of plainly named
skills, `refine` instead of groom, and a CLI that works on an oh-my-zsh machine. Right?" (agreed in the audit thread)

## Problem
- **15 skills and an agent, two of them used.** Above the baseline mention in each session's skill list, only `groom`
  and `pr-reviewer` show real use in 333 local transcripts. `groom` alone is 516 KB in 48 files. A stranger reads
  `babysit-pr`, `vercel-prune` and `doc-hygiene` before anything that plans a product.
- **`gf` is shadowed.** oh-my-zsh's default git plugin defines `alias gf='git fetch'`, and an alias beats a binary.
  On those machines `gf login`, onboarding's first command, runs `git fetch` instead.
- **"Grooming"** is the stage name on the board and the skill's name. Scrum replaced it with "refinement" in 2013, and
  in UK and Australian English it mostly means child abuse.

## Appetite
L: a breaking release of the plugin, the kit and the CLI together, with migration notes.
quote: $55–111 (L, n=4, p25–p75)

## Outcome & signal
A stranger installs the plugin and sees five skills whose names say what they do (`setup`, `refine`, `strategy`,
`report`, `smoke`), runs `frijoles login` successfully on a machine with oh-my-zsh, and sees "Refining" on the board.
**Target:** `proving_workspaces` has no recorded value yet (it is pushed from outside and never has been), so this
bet records "from: none" and its read is the stranger walkthrough, not a number. Instrumenting the input is the
grounded-bets epic's job.

## Stage-2.5 bucket
**Light enhancement, wide:** no new capability; renames, merges and one release. Wide because names are load-bearing
across the plugin, kit, CLI, template, console copy and docs.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| CLI bin `frijoles` (+ `gf` kept until CLI 1.1.0 or 2026-12-31, printing a one-line notice; a CI check goes red after the date) | `gf` is shadowed by the most common shell alias; the expiry stops the alias living forever |
| Kit bin `frijoles-kit` (+ `gf-kit` kept the same way) | one name family |
| `groom` → `refine` | the skill moves an idea through Refining to Ready, so it carries the stage's name |
| "Grooming" → "Refining", "To groom" → "Backlog" labels (keys unchanged) | the word, on every screen |
| `pmf-narrative` + `north-star` + `risk-validation` + `cold-read` → `strategy` | one coach with four chapters: they share `coaching.md`, write the same folder and hand off in a chain |
| `standup-post` + `weekly-recap` + `pmo-report` → `report` | one skill, `--cadence daily\|weekly\|monthly`; scripts unchanged |
| `golden-frijoles` → `setup` | the front door says what it does (`/golden-frijoles:setup`) |
| `build-order-sync`, `doc-hygiene`, `vercel-prune`, `babysit-pr`, `prose-draft` out of the plugin | our own operations; the routines call the kit's scripts directly |
| Routine prompts call scripts, not skill names | they named the skills that leave |
| `check-gate-words` bans the retired words on screen | the word can't come back |
| Agent `pr-reviewer` → **`verifier`**, with a `lens: security` mode | says the job (verify every claim against evidence); a security fallback when no other family is reachable |
| The two leftovers (L-bet re-bet question; root SESSION-KICKOFFS shaped-bet row) | the last old words |
| 1.0.0 for plugin and kit, CLI 1.0.0, a migration table in the CHANGELOG | one breaking change, said once |

## Scope
**Sprint 1 · The CLI is `frijoles`** · **Sprint 2 · Refine and Refining** · **Sprint 3 · Five skills** ·
**Sprint 4 · Release 1.0**. Stories under *Acceptance criteria*.

**No-gos:** engine lifecycle values or stage keys (plain-outcome-rename S1) · env-var renames (its S3) · the
folder-layout move (its S4) · changing what any skill *does* (the hypothesis cascade is the next epic, grounded bets)
· SDK changes (SDK 1.0 is its own epic) · night garden.

## Rabbit holes
- **Agents don't travel.** Plugin agents load only in Claude Code; `npx skills` and Cowork's `.skill` archives carry
  skills, no agents (`golden-frijoles/SKILL.md:113`). `live-smoke` is "the default way to check … for any coding
  agent, not just Claude Code", and `cold-read`'s point is a *different model family*, which a Claude subagent is not.
  Hence five skills + `pr-reviewer`, not the audit's four + three (decision **a** below).
- **Installed paths.** Every skill locates its generators with a block that names `skills/groom` (the `GROOM=` block,
  references, hooks): all move to `refine` in one sprint, or a user's agent hunts a dead path.
- **Cowork archives** are one `.skill` per skill (`pack-skills.mjs`): merged skills mean new archive names, and
  `check-release` counts them.
- **The CLI pins an exact kit**, so a kit rename needs a CLI release in the same wave (memory: first-run-setup).
- **Subtree mirror:** a PR touching `skills/` merges with a merge commit, never a squash (public-monorepo D1).

## What already exists (reuse, don't rebuild)
- `skills/scripts/render-skill-adverts.mjs` (skill table, marketplace and plugin descriptions, generated) ·
  `pack-skills.mjs` · `check-release.mjs` · `check-gate-words.mjs` · `check-onboarding-parity.mjs` ·
  `render-hook-vendor.mjs` · `skills/RELEASING.md`
- `apps/web/lib/epic-page.ts`, `hub-areas.ts` (`stageLabel()`, keys untouched) · `scripts/lib/stage.mjs`
- `packages/cli/package.json` `bin`, `skills/kit/package.json` `bin` · `apps/web/lib/install-prompt.ts`
- The routines in `skills/template/scripts/routines/*.prompt.md`
- Superseded here: `plain-outcome-rename` **S2.1** (skills answer to new names) and the screen-word part of **S3.3**.

## Visuals

```
 stranger's agent ──install──▶ plugin 1.0 ─┬─ setup ──▶ reads repo, routes
                                           ├─ refine ─▶ Roadmap/ (idea → Refining → Ready)
                                           ├─ strategy ▶ Roadmap/00-strategy/ (cold read, PMF, North Star, risk)
                                           ├─ report ─▶ chat destination (daily · weekly · monthly)
                                           ├─ smoke ──▶ a real browser on any URL
                                           └─ agent: pr-reviewer (Claude Code)
 terminal ──frijoles login / flags / north-star──▶ goldenfrijoles.com   (gf: a notice, one minor)
```

## UX heuristics & rails check
Names say the job (setup, refine, strategy, report, smoke). One break, said once (CHANGELOG table: old → new). The
console keeps its routes; only labels change, and the design contract's approved states re-render once.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
**No flag.** The plugin, kit and CLI are versioned packages: rollback is pinning 0.43.0 / CLI 0.8.0, and `gf` keeps
working for one minor. The console change is label copy. (Daniel, 2026-08-31: ship enabled, not dark.)

## Acceptance criteria
- S1.1 `frijoles` is the CLI's command; `gf` still works and prints one line naming `frijoles`, with an expiry check (high)
- S1.2 The kit answers to `frijoles-kit`, `gf-kit` still works the same way (high)
- S1.3 Every doc, skill, install page and AGENTS rule says `frijoles` (low)
- S2.1 The skill is `refine`; every generator locator finds it (high)
- S2.2 The board, the epic page and the build view say Refining and Backlog; keys unchanged (low)
- S2.3 The retired words are banned on screen by `check-gate-words`, and the two leftovers are reworded (low)
- S3.1 `strategy` holds the cold read, the PMF narrative, the North Star and risk validation (low)
- S3.2 `report` posts daily, weekly or monthly (low)
- S3.3 `setup` is the front door, and the ops skills leave the plugin; routines call the scripts (high)
- S3.4 The agent is `verifier`, with a security lens; every doc and script that names it follows (low)
- S4.1 Plugin and kit 1.0.0, CLI 1.0.0, with the CHANGELOG's old → new table (high)
- S4.2 A stranger installs from `main` in a scratch repo, and every name works (low)

## Open risks / research
- oh-my-zsh's git plugin defines `alias gf='git fetch'` (verified in its `plugins/git/git.plugin.zsh`; the starter
  `.zshrc` enables `plugins=(git)`). `npm view frijoles` → 404 (free).
- Daniel's routines on his own machine and in the cloud name skills that leave: S3.3 updates the template's prompts;
  his live routines need the same edit (owed, named in the walkthrough).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/plugin-1-0.md
  coverage in   0.94  (4 claims)
  coverage out  0.83  (11 criteria)
  clarity       0.74  (11 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 88 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.942,"coverage_out":0.835,"clarity":0.741,"teach_back":1,"total":88} -->

## Decisions at the Plan gate (Daniel, 2026-10-08)
- **Approved.**
- **a.** Five skills (`setup`, `refine`, `strategy`, `report`, `smoke`) plus one agent, because agents do not travel to
  `npx skills` or Cowork. The agent is renamed **`verifier`** for the target (it verifies every claim the builder's
  agent makes, against the evidence) and gains a `lens: security` mode: a same-family fallback when no other family
  is reachable, never a substitute for the cross-family pass. **Scenarios and drills get their own agent later**
  (scenarios light-up): it acts on a running system and holds a kill switch, and the verifier stays read-only.
- **b.** `gf` and `gf-kit` keep working with a notice until CLI 1.1.0 or 2026-12-31, whichever comes first; a CI check
  goes red after the date until they are removed.
