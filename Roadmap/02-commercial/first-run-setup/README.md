---
status: shipped     # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shipped         # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-07T23:19:00Z"
slug: first-run-setup
title: "First run: setup starts"
area: 02-commercial
risk: low
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
flag_key: null   # the epic's flag, decided at groom Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 69      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
actual_usd: 13.45
actual_mtok: 39.8
actual_basis: "this machine · 2026-10-08 · 1 session · prices 2026-10-02"
---

# Epic: First run: setup starts ✅

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/first-run-setup.md`](../../00-ideas/seeds/first-run-setup.md)
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
Setup asks its first questions cold, and an existing product with years of history starts with an empty `Roadmap/`:
nothing it shipped shows on the board and the Outcome report has nothing to read. This epic builds the last part of
the canvas First run flow (frames 7, 8a, 8b): after sign-in, setup says what happened and what it found before asking
anything; an existing project is read into the roadmap (shipped work, open pull requests, issues as ideas) with a dry
run first and nothing moved; a new idea starts with one sentence and a choice between strategy first and a first epic
now. Closes gap 4 of the First run review; gaps 1–3 are handled outside this epic. Re-landed 2026-10-07 (the
first groom commit missed its merge).
Moves: proving_workspaces · Tests: Value proposition.

**Signal:** setup on a real repo with history and issues; the board shows what shipped, what's building and the
backlog, and nothing in the repo moved.

## Platform-first note
Local only. The read writes plain Markdown into `Roadmap/` through the generators that already exist
(`scaffold-epic.mjs`, the seed template), so everything passes the roadmap contract and reaches the Hub only when the
founder pushes. Pull requests and issues come from `gh` when installed; otherwise git alone.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md` (Stage 1 detect, Stage 2 Q1/Q2/Q4, Stage 3 routing).
- `skills/plugins/golden-frijoles/skills/groom/scaffold-epic.mjs`, `templates/scope-seed.md`, `scripts/roadmap-backfill.mjs`,
  `scripts/lib/roadmap-contract.mjs`, `scripts/build-order.mjs`.
- The coaches: `pmf-narrative`, `north-star`, `risk-validation`.
- From launch epics 2, 4, 7: the sign-in result, "not grounded", the gate shape.
- Design source: the private canvas, page 2 · First run: frames 7, 8a, 8b.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Setup says what happened and what it found | low |
| 1 | S1.2 An existing project, read into the roadmap | low |
| 1 | S1.3 A new idea, in a sentence | low |

**No-gos:** persona, business model canvas or value proposition drafts · targets or verdicts for backfilled work ·
moving, renaming or deleting anything, and the folder layout move · issue trackers other than GitHub · console work.

**Rabbit holes** (detail in the seed): what counts as shipped work (merged PRs, else tags, else docs; capped, each
saying where it came from) · issues grouped into ideas, never touched on GitHub · no `gh` means git only, said out loud ·
dry run first · everything through the generators and the contract · nothing leaves the machine unless pushed.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Architecture lock (2026-10-07, verified against live code and live data)

Verified on `main` at `e764e4a`: setup is `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md` Stage 2;
the generators are groom's `scaffold-epic.mjs`, `fund.mjs`, `templates/scope-seed.md`; the branch reader is
`groom/vendor/lib/work-branch.mjs`; the contract is `groom/vendor/lib/roadmap-contract.mjs` (byte-identical to
`scripts/lib/roadmap-contract.mjs`). A fixture run on a fresh `gf-kit init` skeleton proved: `scaffold-epic.mjs` with
an explicit `--macro 01-product` creates the macro folder; `fund.mjs` funds an epic with no seed when given
`--appetite`; `build-order.mjs` then passes its "live bet must be funded" check and lists it.

- **D1 · One script, beside the generators.** `groom/read-repo.mjs`: pure, exported functions plus a CLI (shape of
  `strategy.mjs`). `--look` prints S1.1's "I looked first" block; no flag is the S1.2 dry run; `--write` writes. Git
  and `gh` are read with `execFileSync` (no shell), injected in tests. It never reads stdin and never runs a `gh`
  verb that writes (only `auth status`, `pr list`, `issue list`). Setup finds it the way groom finds its generators
  (groom SKILL.md → *Locate the generators*), referenced, not restated.
- **D2 · What sign-in did.** Setup's first block comes from `npx -y @golden-frijoles/cli@0.7.0 whoami --json`:
  "Signed in as <email>", "gf signed in on this machine, for the product <activeProject>". **Deviation:** "(new
  account)" is dropped: `whoami` reports no account age (live: `WhoamiBody` = account, credential, projects,
  workspaces), and setup never invents a fact. Exit 2 (not signed in) skips the block; a network failure says
  "could not look". The product is its slug: `whoami` carries no display name.
- **D3 · What it found.** `read-repo.mjs --look`: `Roadmap/` here or not (with its epic and idea counts); the stack
  from manifest files (package.json and its framework dependency, pyproject/requirements, go.mod, Cargo.toml,
  Gemfile, composer.json…); the commit count; open pull requests when `gh` is installed and signed in, else it says
  which of the two is missing. An empty folder says so.
- **D4 · Q1 in plain words.** "What are we working on? 1 This repo: it already has a product · 2 A new idea: nothing
  built yet · 3 Just planning: don't change my repo" → `project.mode` `existing` · `new` · `planning-only`, written
  exactly as today. **Q2 is no longer asked**; `project.startPoint` is written from the route (This repo →
  `building`; a new idea → `idea` for strategy first, `plan` for a first epic now; Just planning → not written).
  The registry's `project.mode` question takes the same words, in every copy. **Amended at review (#307):** "nothing
  reads `startPoint`" was wrong (the grep missed `packages/cli`). `gf config`'s own terminal setup reads the registry
  from the kit, so it still asks Q2 (`askWhen: 'setup'`, unchanged here) and its `nextSteps()` sends `building` to
  `live-smoke`. **Known gap, follow-up:** retire Q2 in the registry and point `nextSteps()` at the golden-frijoles skill's
  read, in one CLI release (npm publish is Daniel's step). The skill path, which this epic is about, is right today.
- **D5 · Shipped work.** Merged, non-bot pull requests (`gh`), grouped into epics by their head branch: the
  `work-branch.mjs` reading (`feat/x-s2` → `x`), else the longest proper prefix that is another branch's slug
  (`docs/x-close` → `x`), else the branch slugified, else the title. Without `gh`: first-parent merge commits
  (`Merge pull request #N from o/branch`, `Merge branch 'b'`) and squash subjects ending `(#N)`. None of those →
  release tags (one epic per tag). None → top-level docs (`docs/*.md`, one epic per file, titled by its H1). Window:
  the last 12 months; cap: the 20 largest (lines changed; tags by commits); the left-out note counts older groups,
  smaller groups and bot pull requests. Each epic says where it came from (PR numbers, tag or file) and "backfilled,
  no target". Live: this repo has 281 merged PRs on branches like `feat/one-epic-page`, `-s2`, `docs/…-close`.
- **D6 · Building.** Open, non-bot pull requests, grouped the same way. **The epic slug is the branch's group key**,
  so the live stage resolver (`lib/stage.mjs`) attributes the branch to the epic: Building or QA on `--live` and the
  Hub. The committed `BUILD-ORDER.md` shows it in Ready to build, because Building is live-only by design
  (board-sinks C3). A key that is both shipped and open is one Building epic citing both (an open `docs/x-close` joins
  a merged `feat/x`). **Limit (review #307):** a branch whose reading changes when slugified (capitals, `_`, `.`, over 60
  characters) gets a slug the live resolver will not match, so that epic shows Ready to build, not Building.
- **D7 · Ideas.** Open issues (`gh`, at most 500; more is said), clustered: by the issue's first label
  (alphabetical); unlabelled issues by a shared title word (stop words out, at least 2 per cluster); the rest one
  idea each. Each idea is a `raw` seed (To groom) from `templates/scope-seed.md`'s frontmatter, `appetite: null`,
  with the issue titles quoted under *The ask, as given* (`intent_ask: verbatim`: they are the reporters' words) and
  its issue numbers listed. Nothing on GitHub is touched.
- **D8 · Written through the generators.** Each epic: `scaffold-epic.mjs` (`--area 01 --macro 01-product`, or the
  one existing `Roadmap/NN-*` folder; `--sprints "<title>"`). Shipped: then `status: shipped`, `phase: Shipped` (README
  and sprint), its story `done`, `risk: low` (nothing left to review), a "Backfilled, no target" line and its sources.
  Building: `risk: high` (unsure means high), then `fund.mjs --cycle backfill --appetite <S|M|L from lines changed:
  ≤300 · ≤1500 · more> --displaced "nothing: already being built when the roadmap was read"`, then `status:
  in-progress`, `phase: Building`. **Deviation:** an appetite was never chosen for this work; it is derived from the
  pull request's size and the cycle row says so, because `build-order.mjs` refuses a live epic with no funding.
- **D9 · First run only, nothing else moves.** `--write` refuses when `Roadmap/` already holds an epic or a seed (the
  dry run says so). After writing it checks that every written epic and sprint passes `validateEpicFrontmatter` /
  `validateSprintFrontmatter`, and that `git status --porcelain` lists nothing new outside `Roadmap/`; either failing
  exits non-zero and names the file.
- **D10 · Dry run, approval, then the next step.** The dry run prints counts, the left-out note and the first few
  entries of each kind. Then one question: "1 Write it into Roadmap/ · 2 Don't write anything". **Deviation:** the
  canvas folds approval into the two closing options; a separate yes keeps "nothing written until you approve"
  literal. After writing: `build-order.mjs`, then `build-order.mjs --live` shown, then "1 Yes, review the strategy
  (about 10 minutes) · 2 Later: help me plan a first epic now" (the strategy step and its gate, or `groom`).
- **D11 · A new idea.** One question: "A new idea. In a sentence or two: what is it, and who is it for?", then
  "1 Strategy first (…) · 2 A first epic now (…)". Strategy first runs the three coaches in turn from the sentence
  (the canvas's "about 45 minutes with the coaches… saved as you go"), ending at the Strategy gate. **Deviation
  (review #307):** the drafting step (`gates.md`: write all three files from the repo, then the gate) has nothing to draft
  from in an empty repo, so this route is the gate's *Coach me through it*, starting with no file; `gates.md` says so. A first epic now runs `groom` with the sentence as the verbatim ask. **Not grounded** is shown in two
  places, both written by groom: the seed's line `Moves · Tests: not grounded — no strategy yet`, and the Plan gate's
  Moves line (`gates.md`: "not grounded: no strategy yet" when `strategy.mjs` prints nothing). `strategy.mjs` stays
  silent with no strategy (think-skills D5: no nag). "Until a strategy exists" is the Plan gate's reading at the
  time; the seed line is history, not a live flag.
- **D12 · Release.** Plugin and kit 0.37.0 with a CHANGELOG section, `SHA256SUMS`, re-rendered adverts, and
  `render-skills-ci.mjs` naming `read-repo.test.mjs`. No flag, no migration, no web code.
- **D13 · Routing.** One builder: the architect, in place (the only session in this checkout). Review by
  `review-route.mjs --builder claude`.

## Deploy order
One PR, merge on green; ships in the plugin release after launch epic 7, whose gate shape it uses.

## Definition of Done (epic)
- [x] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [x] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [x] This README marked ✅; every sprint status ticked with commit refs
- [x] `RETROSPECTIVE.md` written
- [x] Product poster (`Roadmap/README.md`) updated
- [x] Team memory + `MEMORY.md` index updated
- [x] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [x] **Kill-switch (none planned: risk low, no flag) (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [x] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
