---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-09T19:00:17Z"
slug: setup-drafts-strategy
title: "Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 2
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=18, p25–p75"
hypothesis: "We believe that a setup which reads the product, drafts the strategy with two North Star candidates citing their evidence, and ends with a first bet already grounded, for founders setting up Golden Frijoles on an existing repo or a new idea, will turn new workspaces into proving workspaces (from 0 to 2 by 15 December), because a 45-minute workshop before any value is the step founders skip, and an ungrounded first bet can never be proven. We'll know when a new workspace's first funded bet records grounded: true and reaches a verdict by its read date."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "proving_workspaces"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 2       # to what, a number
read_date: 2026-12-15       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, setting up Golden Frijoles for the first time"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: true   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
build_order: 76      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/setup-drafts-strategy.md`](../../00-ideas/seeds/setup-drafts-strategy.md)
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
We believe that a setup which reads the product, drafts the strategy with two North Star candidates citing their
evidence, and ends with a first bet already grounded, for founders setting up Golden Frijoles on an existing repo or a
new idea, will turn new workspaces into proving workspaces (from 0 to 2 by 15 December), because a 45-minute workshop
before any value is the step founders skip, and an ungrounded first bet can never be proven. We'll know when a new
workspace's first funded bet records `grounded: true` and reaches a verdict by its read date.

## Platform-first note
Nothing new in the engine. Setup's routes, the Strategy gate, the three coaches and their templates, `read-repo.mjs` and
the grounded bet sentence exist; this epic adds a product read, a cited two-candidate draft and two review blocks. The
target is read by hand on 2026-12-15 (an operator count): an automatic `proving_workspaces` reading is a cross-workspace
count, which the tenancy invariant forbids, so it is its own seed (`proving-workspaces-reading`), Daniel's decision.

## What already exists (reuse, don't rebuild)
- `skills/setup/SKILL.md` Stage 2 (routes 1 and 2), refine's Strategy gate (`references/gates.md`)
- `refine/read-repo.mjs` (`readStack`, `--look`, the bounded and refusing style this follows), `strategy.mjs`
- the coaches (`strategy/references/{pmf-narrative,north-star,risk-validation}.md`) and their templates
- the bet sentence and grounding (`refine/references/result-record.md`, `templates/scope-seed.md`)

## Architecture lock (D1–D9)
- **D1 · The product read.** `refine/read-product.mjs`, beside `read-repo.mjs` (it imports `readStack`). Read-only, no
  network, never reads stdin, zero deps. Prints facts, each with its `path:line`; `--json` for the agent.
- **D2 · What it reads.** The README (title, first paragraph, headings); `package.json` name, description, keywords;
  the landing copy (`<title>`, `h1`/`h2`, metadata description in the root page: Next `app/page.*` or `pages/index.*`,
  `index.html`); the routes or pages (Next `app/**/page.*` and `pages/**`, in `apps/*` too); analytics calls already in
  the code (PostHog `capture`, Segment `analytics.track`, gtag `event`, Mixpanel `track`, Amplitude `track`/`logEvent`,
  Plausible, our SDK's `track`), with the event name when it is a string literal; flags in the code (LaunchDarkly
  `variation`, PostHog `isFeatureEnabled`/`getFeatureFlag`, Unleash `isEnabled`, GrowthBook `isOn`, our provider).
- **D3 · Bounds and secrets.** Skips `node_modules`, `.git`, `dist`, `build`, `.next`, `vendor`, `coverage`; at most
  4,000 files and 256 KB per file, largest-first is never needed (it says what it skipped). Never opens `.env*`,
  `*.pem`, `*.key` or a path naming a secret, and never prints a line that looks like a key (the plugin-leaks patterns).
- **D4 · The question first.** Both routes ask *"In one sentence, what is this for and who is it for?"* before any draft;
  the answer is quoted in the draft as the founder's words. Route 2 already asks it; route 1 gains it before step 4.
- **D5 · The draft.** The agent writes the three files by their coaches' templates with `status: draft`. Every claim
  line ends with its source: `(README.md:3)`, `(read-repo)`, `(your words)` or `(assumed)`; never a path the reads did
  not print. `north-star.md` gains a `## Candidates` section holding **A** and **B** (each: the game, the metric, 3–4
  inputs, what it would make you build differently); its North Star sections and the sync payload keep the template's
  placeholders until one is chosen, so `strategy.mjs` reports no inputs from a draft. The two must differ in game or unit.
- **D6 · One review.** The Strategy gate grows to five blocks: **Product & persona** (decided from the repo) ·
  **North Star: A or B** · **Measurement plan** (the event each input of the chosen candidate needs; which are already
  tracked, from D2) · **Roadmap** (what read-repo found, one line) · **First bet** (the sentence on the chosen input,
  with a target the founder confirms). The three-decision limit counts A-or-B and the first bet's target.
- **D7 · Approve.** Writes the chosen candidate into `north-star.md`'s sections and sync payload and removes
  `## Candidates`; sets `status: agreed` on all three files (Daniel, decision a: Approve is agreement); writes the first
  bet as a seed from `templates/scope-seed.md` (`status: raw`, `hypothesis`, `persona`, `grounded: true`, the target).
  A target the founder could not give leaves the bet `grounded: false — no baseline yet`, never an invented number.
- **D8 · Route 2 drafts too.** *"1 Draft it now (about 5 minutes) · 2 Coach me through it (about 45) · 3 A first epic
  now"*; a draft from the sentence alone cites `(your words)` or `(assumed)` and ends at the same review.
- **D9 · The coaches go deeper.** A coach opened on an existing file revises it section by section in place, keeps the
  citations it does not change, replaces `(assumed)` with the founder's answer, and never restarts from the template.
  Plugin 1.2.0 (additive); the kit is unchanged (read-product lives in refine, as read-repo does).

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `read-product.mjs`: the product's facts with their files, bounded, no secrets | low |
| 1 | S1.2 The question first; the cited draft with two North Star candidates, on both routes | low |
| 2 | S2.1 The five-block Strategy gate; Approve writes the choice, agrees the files and seeds a grounded first bet | low |
| 2 | S2.2 The coaches go deeper over a draft | low |
| 2 | S2.3 Plugin 1.2.0 | low |

## Deploy order
One PR, both sprints. Plugin release with the merge (no kit change, so no npm step unless the kit closure changes).

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
