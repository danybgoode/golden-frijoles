---
title: "Verify module: model checks and proofs in our own CI, with Jev routing in shadow"
slug: verify-module
status: scaffolded
area: "09"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: low
epic: "09-platform-infra/verify-module"
build_order: 97
updated: 2026-10-14
intent_ask: proxy
hypothesis: "Our riskiest code (the delivery outbox, the flag evaluator) is reviewed by people and models, and still hid three bugs a model checker found in one session. Running those checks on every PR that touches it, and nightly in depth, catches the next one before merge. We'll know when Jev's routing log reaches 30 labelled PRs."
persona: "The product owner, shipping agent-built code to real customers"
grounded: false
grounded_reason: "Engineering assurance on our own code; no North Star input counts it, and audit D7 forbids a landing claim until it is product."
target_metric: "PRs in Jev's verify-depth shadow log with a builder label"
target_from: 0
target_to: 30
read_date: null   # 60 days after shipping (decision b)
flag_key: null
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
intent_match: 89
---

# Pitch — verify module, dogfood first

Moves · Tests: not grounded (see `grounded_reason`). Tests: Competitive advantage, later and only once measured.

## The ask, as given

> Placeholder until the spike decides. If it recommends productizing, this becomes the plugin/kit side: the spec
> manifest + generators, CI checker jobs, the depth ladder in groom (off / light / standard / deep), Jev triage rails
> in shadow first, and evidence rendered in the Hub with its bounds stated.
> — the seed, from the unification audit §10 (seed 12), 2026-09-23

The spike decided on 2026-09-29 ([`DECISION.md`](../../09-platform-infra/verify-spike/DECISION.md), "What
`verify-module` should be"):

> 1. Path-filtered per-PR jobs: Quint simulation on outbox paths, and Lean build + differential test on `flags.ts`.
> 2. A nightly exhaustive job running `quint/check.sh` in full. A new violation opens a seed with the trace attached.
> 3. Jev as the router, in shadow first: ask _verify depth_ on every PR and log it next to the builder's call … until a
>    threshold is measured on ≥ 30 labelled PRs.
> 4. One rule for every proof tier: no proof ships without a differential test against the real code.
> 5. Out of scope until asked: trace validation, TLA+, Veil, and any landing claim (audit D7 still holds).

### Claims
1. Model checks run on every PR that touches the outbox.
2. Proofs plus a differential test run on every PR that touches the flag evaluator.
3. An exhaustive check runs nightly, and a violation becomes a seed.
4. Jev routes verify depth, in shadow, until measured.
5. No proof without a differential test.

**Teach-back:** <yes | partly | no> — "You want the checks that found three hidden delivery bugs to run by themselves
on the code they protect, and Jev's routing measured before anyone trusts it."

## Problem

The spike's models live in a docs folder (`Roadmap/09-platform-infra/verify-spike/{quint,lean,diff-test,jev-triage}`)
and run only by hand. In one session they found **F1–F3**, three bugs that 24+ review rounds missed (F2 is epic #87;
F3 is guarded by #194). Nothing re-runs them, so the next outbox change can reintroduce F2's class, and the models
drift from the SQL they mirror: #87 changes `claim_deliveries`, and the model must follow it.

**Reshaped from the seed (decision a):** the seed planned a product for every project (manifest, generators, a depth
ladder in refine, evidence in the Hub). The spike's evidence is all on *our* code, and its own rule 3 says Jev's
routing must be measured on ≥ 30 labelled PRs first. So this epic is the dogfood: our CI, our nightly, Jev in
shadow. The product for other projects is a later idea, re-seeded as `verify-for-projects`, shaped once the shadow log
has its 30.

## Appetite

M: two sprints (down from the seed's L; the product half moved out).
quote: $15–34 (M, n=24, p25–p75)

## Outcome & signal

A PR touching the outbox SQL or `delivery-dispatch.ts` runs the Quint simulation (~2–3 CI minutes); a PR touching
`lib/flags.ts` runs the Lean build and the differential test (~1–2 minutes). A nightly job runs the exhaustive table,
and a new violation opens a seed PR with the trace. Every PR gets a Jev verify-depth call logged beside the builder's.
Signal: the shadow log's labelled count.

## Stage-2.5 bucket

Light enhancement: the models, the checks and the Jev questions exist and reproduce (`REPRODUCE.md`). This moves them
into CI and keeps them true.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| move the models to `verify/` | they are code now, not spike notes |
| model follows #87 (`outbox_timed_fixed` becomes the model) | CI proves the shipped fix |
| a drift guard: outbox SQL hash pinned beside the model | an SQL change without a model change fails |
| per-PR Quint job, path-filtered | ~2–3 minutes, only when the outbox changes |
| per-PR Lean + differential test, path-filtered | rule 4: no proof without it |
| nightly Apalache; a violation opens a seed PR | the depth simulation can't reach (F2 was 12 steps) |
| Jev verify-depth in shadow, logged per PR | measured before trusted (≥ 30) |

## Scope

**In v1:** the above, in this repo's CI (`ci.yml`'s `changes` job decides the paths). The nightly writes a seed through
a `claude/` PR, never to `main` directly.
**Out of v1 (no-gos):** the product for other projects (the manifest, generators, a refine depth ladder, Hub evidence)
→ `verify-for-projects`; trace validation; TLA+, Veil; any landing claim (audit D7); gating a merge on Jev's call (shadow
only).

## Rabbit holes

- **Model drift is the real risk.** The model mirrors SQL by hand (abstractions A1–A7). Pin a hash of the mirrored SQL
  functions next to the model, as the prototypes' `tokens.test.ts` pins tokens: changing one without the other fails
  with "update the model or re-approve the hash".
- **CI minutes.** The repo is public now (free runners), but the nightly is ~65 minutes; it runs on `schedule` only,
  with its own timeout, never on a PR.
- **Toolchains.** Java for Apalache and elan for Lean: cache both, or the per-PR jobs pay 30–60 s of setup each time.
- **A nightly that writes.** It opens a PR with a seed and the trace; it never pushes to `main`, and a repeated
  violation updates the same PR instead of opening another.

## What already exists (reuse, don't rebuild)

- `Roadmap/09-platform-infra/verify-spike/`: `quint/outbox.qnt`, `quint/check.sh`, `quint/summarize-itf.mjs`,
  `lean/` (Flageval, 4 theorems), `diff-test/run.mjs`, `jev-triage/run.mjs` + `answers.json`, `REPRODUCE.md`.
- `.github/workflows/ci.yml` (`changes`, the `gate` required check), `browser-nightly.yml` (a nightly's shape).
- The review rail's Jev logging (`semantic-lint`, `jev-semantic-guards`), the `claude/` PR pattern
  (`build-order-sync.mjs`).

## Kill-switch / runtime gate

**None: carve-out.** CI only; no product surface. A job is removed with `git revert`.

## Acceptance criteria

**Sprint 1: per PR**
- **S1.1** (low): the models move to `verify/`, the Quint model becomes #87's fixed variant, and `REPRODUCE.md`'s
  commands still reproduce from the new paths.
- **S1.2** (low): a drift guard fails when the mirrored SQL functions or `flags.ts`'s evaluator change without the
  model's pinned hash; mutation-checked.
- **S1.3** (low): the Quint simulation runs on PRs touching the outbox paths and fails on an invariant violation (a
  seeded violating model in a fixture proves it can fail).
- **S1.4** (low): the Lean build + differential test run on PRs touching `lib/flags.ts`; the whitespace mutant fails
  it.

**Sprint 2: nightly and shadow**
- **S2.1** (low): a nightly job runs `check.sh`; a new violation opens (or updates) one `claude/` PR with a seed and
  its trace.
- **S2.2** (low): Jev's verify-depth question runs on every PR in shadow and appends its call beside the builder's
  label to a log; `jev-triage` reports the labelled count.
- **S2.3** (low): when the labelled count first reaches 30, the nightly sends one Telegram ping through
  `scripts/telegram-notify.mjs` ("Jev's verify-depth log has 30 labelled PRs: verify-for-projects can be refined"),
  and writes an owed line (judgment) into this epic's retro so the ledger and the board show it until it is acted on.
  Once only: a marker stops a repeat ping (Daniel, 2026-10-14: "lets not let it go stale and automatically notify").

## Decisions (Daniel, 2026-10-14)

- a. Dogfood first: this epic is our CI only; the product for other projects is `verify-for-projects`.
- b. Target 0 → 30 labelled PRs, read 60 days after shipping; reaching it pings automatically (S2.3).

## Open risks / research

- **F7** (the delivery cron isn't registered in production; delivery is off with 320 pending, read 2026-10-08) is
  outside this epic and is a production decision for the product owner.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/verify-module.md
  coverage in   0.96  (5 claims)
  coverage out  0.83  (6 criteria)
  clarity       0.88  (6 criteria)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.24  (advisory, not in the total: rewrite the Why as a story)
Total 89 / 100 — uncalibrated · signals: coverage in, coverage out, clarity
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.956,"coverage_out":0.825,"clarity":0.884,"teach_back":null,"total":89} -->
