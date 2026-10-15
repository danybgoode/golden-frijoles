---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: verify-module
title: "Verify module"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "Our riskiest code (the delivery outbox, the flag evaluator) is reviewed by people and models, and still hid three bugs a model checker found in one session. Running those checks on every PR that touches it, and nightly in depth, catches the next one before merge. We'll know when Jev's routing log reaches 30 labelled PRs."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "PRs in Jev's verify-depth shadow log with a builder label"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 30       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "The product owner, shipping agent-built code to real customers"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "Engineering assurance on our own code; no North Star input counts it, and audit D7 forbids a landing claim until it is product."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 97      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Verify module

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/verify-module.md`](../../00-ideas/seeds/verify-module.md)
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
Our riskiest code (the delivery outbox, the flag evaluator) still hid three bugs a model checker found in one
session. This runs those checks on every PR that touches it and nightly in depth, keeps the models from drifting, and
measures Jev's verify-depth routing in shadow. When the shadow log reaches 30 labelled PRs, the product owner is
pinged to refine `verify-for-projects` (Daniel, 2026-10-14).


## Platform-first note
No product surface and no landing claim (audit D7). Everything exists and reproduces in the spike
(`verify-spike/REPRODUCE.md`); this moves it into CI. Rules #1–#6 untouched.


## What already exists (reuse, don't rebuild)
- `Roadmap/09-platform-infra/verify-spike/` (`quint/`, `lean/`, `diff-test/`, `jev-triage/`, `DECISION.md`, `REPRODUCE.md`).
- `.github/workflows/ci.yml` (`changes`, `gate`), `browser-nightly.yml` (a nightly's shape), `scripts/telegram-notify.mjs`,
  `scripts/build-order-sync.mjs` (the `claude/` PR pattern), `scripts/owed-ledger.mjs`.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Models in verify/ · S1.2 Drift guard · S1.3 Outbox model check · S1.4 Proofs + differential test | low |
| 2 | S2.1 Nightly deep check · S2.2 Jev in shadow · S2.3 Ping at 30 | low |

## Deploy order
S1.1's model update waits for #87 (`delivery-stale-reclaim-uncounted`) to merge. CI only otherwise; nothing to
deploy. The Telegram ping uses the existing `TELEGRAM_*` secrets.


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
