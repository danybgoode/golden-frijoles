---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: In review             # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-10T13:25:51Z"
slug: why-as-a-story
title: "The Why reads as a story, in full, and the plan names its crew"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 88   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 32
quote_basis: "M, n=20, p25–p75"
hypothesis: "Today the Why lists the parts being built and is cut off on screen, so a founder approves bets they cannot easily explain. Written as a short story from the strategy we already agreed, and shown in full, it becomes a bet they can defend. We'll know when every new Why is read in full and approved without a rewrite."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "a founder who owns the product, solo to mid-size, approving and following bets their agent builds"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "no North Star input measures how readable a Why is; it serves grounded_bets_share only indirectly"   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 78      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: The Why reads as a story, in full, and the plan names its crew

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/why-as-a-story.md`](../../00-ideas/seeds/why-as-a-story.md)
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
Today the Why lists the parts being built and is cut off on screen, so a founder approves bets they cannot easily
explain. Written as a short story from the strategy we already agreed, and shown in full, it becomes a bet they can
defend. The plan also says who does the work, and cheaper builders really get it.

## Architecture lock (D1–D9)
- **D1 · The story rule** (`refine/references/result-record.md`, the bet sentence). Before drafting, read what exists
  of `Roadmap/00-strategy/` (`pmf-narrative.md` for the persona and value proposition, `brand-platform.md`, the
  business model). Then write two or three plain sentences in this order: what is wrong today and for whom → what
  changes → why it matters to them (the value proposition) → "We'll know when …". What the view shows in full: five
  lines, about 320 characters (D2, D4). A worked
  before/after: one-bet-wired's parts list, and the story version. A Bug or Chore keeps `Why: keeps <X> working`.
- **D2 · The Why guard**, deterministic, `whyProblems(text)` in `scripts/lib/roadmap-contract.mjs` (and its copies):
  more lines than the view shows (D4) or one word wider than a line; a file with a code extension or a rooted path; a
  backtick; a snake_case or camelCase code name (`flag_key`, `getWorkspaceProjects`; brand names such as iPhone, eBay
  and macOS are prose); a word from a short internal list (wiring, wired, seam, endpoint, frontmatter, schema, payload,
  middleware, refactor). Refine runs it at the bet step through the kit (`why-check "<text>"`, exit 1 with the
  problems); `scaffold-epic.mjs` refuses a Feature hypothesis that fails it. Shipped epics are never re-checked.
  *(Amended at build: the limit is the view's own wrap, not 320 characters; route and hook left the list because
  ordinary product prose uses them; verifier #343 narrowed the code-name and path rules.)*
- **D3 · The story question**, advisory: `intent-match` asks Jev one more question about the hypothesis ("would a
  stranger follow this as a short story: who has the problem, what changes, why it matters?"). Its own report line,
  outside the total, so the calibration does not move. A wording in `lib/jev-questions/intent.json`.
- *(Amended at build, 2026-10-10: a 320-character Why takes **five** lines at the view's 69 columns, not four as the
  Plan gate said; 273 characters already needed five. The view shows up to five, and the guard's limit is "fits five
  lines" through the view's own wrap (`wrapWords`), not a character count. One constant, `WHY_LINES_MAX`.)*
- **D4 · The Why in full** (`whyLines` in `scripts/build-state.mjs` and the hooks' vendor copy): the hypothesis wraps
  at word boundaries to the view's width, up to **five** lines; only a Why longer than that (a shipped one) ends in "…".
- **D5 · The planned crew** at the Plan gate (`refine/references/gates.md`): a **Crew (planned, may change)** block
  with four roles: plans · orchestrates, builds (which stories), reviews, writes prose. Filled from WAYS-OF-WORKING's
  routing table and D7's dispatch rule; check-gate-words stays clean.
- **D6 · The actual crew** (Daniel, b): `epic-actuals.mjs --write` also stamps `actual_models` (each model and its
  ≈$, from the transcripts it already reads, subagents included). The retrospective template gets a *Crew (actual)*
  line: the models from `actual_models`, the reviewers from the PR's review records, who wrote the prose, and the
  orchestrator's one-line note.
- **D7 · The dispatch rule** (the kickoff: `refine/vendor/templates/kickoff.md` and `references/per-sprint-kickoff.md`;
  WAYS-OF-WORKING points to it). A story goes to a Sonnet-class builder when it has a clear acceptance check, touches
  no shared surface, is risk low or medium, and is not money, auth, migrations or tenancy. The builder works in its
  own worktree; the orchestrator re-derives the state (diff, tests) and never trusts the final message. One failed
  attempt → the orchestrator takes it back. Everything else stays with the orchestrator.
- **D8 · The checkpoint shape** (`refine/references/checkpoint.md`): the plan as a table with states; what stands
  between us and the goal; the seeds to fold in; one recommendation and one question. Refine and the kickoff point to it.
- **D9 · Release**: plugin + kit **1.6.0**. No CLI release (no CLI behaviour changes).

## Platform-first note
<!-- Does the platform's own system of record already model this? Which primitive backs it?
     (This project's AGENTS.md data-ownership rule.) -->

## What already exists (reuse, don't rebuild)
<!-- Concrete files / routes / primitives the platform-first reframe surfaced. -->
-

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 · The Why | S1.1 The Why is a short story (Sonnet) · S1.2 The Why guard and the story question (Opus) · S1.3 The Why shows in full (Opus) | low |
| 2 · The crew | S2.1 The crew, planned and actual (Sonnet) · S2.2 Cheaper builders, really used (Sonnet) · S2.3 The checkpoint shape (Sonnet) · S2.4 Release (Opus) | low |

## Deploy order
<!-- Backend-first? Frontend degrade gracefully? Preview vs prod. -->

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
