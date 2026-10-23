---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: verify-labels
title: "Verify labels: backfill the shadow log, backtest Jev on the history, and keep labels coming"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 1
stories_total: 4   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 96   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 8    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 19
quote_basis: "S, n=13, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "PRs in Jev's verify-depth shadow log with a label (builder or rule)"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 10   # from what, a number
target_to: 30       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: null   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null   # the score (1–5) a satisfaction_rated answer needs to count as satisfied · null = 4
build_order: 102     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Verify labels: backfill the shadow log, backtest Jev on the history, and keep labels coming

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/verify-labels.md`](../../00-ideas/seeds/verify-labels.md)
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
verify-for-projects (the verification depth ladder offered to every project) waits for Jev's verify-depth shadow log to
reach 30 labelled PRs. On 2026-10-23 it had 10, because builders mostly skip the `Verify depth:` line, and the count
was measuring the wrong sample: 40 of the 42 logged PRs touch no spec path and are `off` by the template's own rubric,
yet Jev called 17 of them something else. This epic labels those automatically, backtests Jev on the ~12 historical PRs
that touch the spec (the only ones where light/standard/deep matter, with hindsight labels the product owner signs
off), and requires the builder's label exactly where judgment is needed. The product owner then refines
verify-for-projects on a measured router, in days instead of months.

## Platform-first note
CI and repo files only (verify-module D11 holds): no migration, no flag, no product surface, rules #1–#6 untouched.
The shadow log, its nightly writer and its reader already exist; this adds one label source, one backtest file and
one path-scoped PR-body check.

## Decisions (product owner, 2026-10-23, Plan gate)
- **D1 — rule labels count toward the 30** (amends verify-module D9: counted = `jev` set and (`builder_label` or
  `rule_label`) set; builder wins when both exist). The ping names the rule-label share (amends D10's text).
- **D2 — the product owner signs off the backtest's hindsight labels before Jev is asked.** What is signed and why:
  the seed's S1.2 → "The sign-off". The sign-off commit precedes the commit that adds the `jev` column.
- **D3 — the PR-body check blocks merging**: part of the required `gate`, path-scoped to `PATHS`, re-run on PR edits,
  skipped for `claude/` heads.

## What already exists (reuse, don't rebuild)
- `scripts/verify-shadow.mjs` — `parseLabel`, `THRESHOLD`, `LOG_PATH`, the counted/exact/within-one report, the Jev state builder (D9's first-parent diff).
- `scripts/verify-nightly.mjs` — lists merged PRs, appends rows, `decidePing`/`pingText`, keeps `claude/verify-jev-shadow` (PR #406).
- `verify/jev-triage/questions.mjs` — `PATHS`, `SPECS`, `DIFF_BUDGET`; `verify/jev-triage/run.mjs --report` is the reader.
- `scripts/jev-backtest.mjs` — the pattern for a historical replay and its "the corpus is biased, and the report says so" stance.
- `scripts/ci-changes.mjs` — the path-filter glob semantics the verify jobs use; `ci-gate` — the required check.
- `.github/PULL_REQUEST_TEMPLATE.md` § Verify depth — the rubric (wording becomes "required when the PR touches a spec path").
- verify-module README D8–D10 — the definitions D1 amends.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Rule labels: zero-spec PRs are `off` by rule (nightly + backfill) | low |
| 1 | S1.2 Historical backtest, hindsight labels signed off before Jev runs | low |
| 1 | S1.3 The report and the ping say what they count | low |
| 1 | S1.4 The label where it matters: a path-scoped PR-body check in the gate | high |

## Deploy order
No runtime deploy: every change is CI or repo data. S1.1 + S1.3 merge first (the next nightly backfills and pings);
S1.2 waits on the product owner's sign-off between its two commits; S1.4 last. Roll back with `git revert`.

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
