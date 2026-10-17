---
epic: verify-module
sprint: 1
title: "Per PR"
risk: low
phase: Building
stories_total: 4
stories:
  - id: S1.1
    title: "The models live with the code"
    as_a: "a builder changing the outbox or the flag evaluator"
    i_want: "the spike's models in verify/, the outbox model matching the shipped fix"
    so_that: "the checks prove the code that actually runs"
    risk: low
    status: planned
  - id: S1.2
    title: "A model can't drift from the code it mirrors"
    as_a: "the product owner"
    i_want: "CI to fail when the mirrored SQL or evaluator changes without the model"
    so_that: "a passing check never describes code that no longer exists"
    risk: low
    status: planned
  - id: S1.3
    title: "Outbox PRs run the model check"
    as_a: "a builder changing the delivery outbox"
    i_want: "the Quint simulation on my PR, only when I touch the outbox"
    so_that: "an F1/F3-class bug fails before review, for a couple of CI minutes"
    risk: low
    status: planned
  - id: S1.4
    title: "Evaluator PRs run the proofs and the differential test"
    as_a: "a builder changing the flag evaluator"
    i_want: "the Lean build and the differential test on my PR, only when I touch lib/flags.ts"
    so_that: "a proof never passes on a model that disagrees with the code"
    risk: low
    status: planned
---
# Verify module — Sprint 1: Per PR

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites the README's D1–D6, D11. S1.1 = D1 + D2. S1.2 = D3. S1.3 = D4 (outbox) + D5 (`verify-outbox`, teeth mutant).
S1.4 = D4 (flags) + D5 (`verify-flags`) + D6 rule 4. The evaluator path is `packages/sdk/src/flags.ts` (README
correction); the story titles' `lib/flags.ts` means that file. Smoke step 4 edits `packages/sdk/src/flags.ts`.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The models live with the code
**As** a builder changing the outbox or the flag evaluator, **I want** the spike's models in `verify/`, the outbox
model matching the shipped fix, **so that** the checks prove the code that actually runs.
**Acceptance:** `quint/`, `lean/`, `diff-test/` and `jev-triage/` move from `Roadmap/09-platform-infra/verify-spike/`
to `verify/` (the spike folder keeps `DECISION.md`, `REPRODUCE.md` and a pointer). `outbox.qnt` becomes the
`outbox_timed_fixed` variant once #87 (`delivery-stale-reclaim-uncounted`) has merged; if it hasn't, this story waits
for it. `REPRODUCE.md`'s commands reproduce from the new paths.
**Risk:** low

### Story 1.2 — A model can't drift from the code it mirrors
**As** the product owner, **I want** CI to fail when the mirrored SQL or evaluator changes without the model, **so
that** a passing check never describes code that no longer exists.
**Acceptance:** `verify/pins.json` holds a hash of each mirrored function body (`claim_deliveries`, `settle_delivery`
from the latest migration defining them; the evaluator in `lib/flags.ts`) and of the model file. A static-gate check
fails with "update the model, or re-pin if the change doesn't affect it" when one side moves alone. Mutation-checked:
editing either side alone fails it.
**Risk:** low

### Story 1.3 — Outbox PRs run the model check
**As** a builder changing the delivery outbox, **I want** the Quint simulation on my PR, only when I touch the outbox,
**so that** an F1/F3-class bug fails before review, for a couple of CI minutes.
**Acceptance:** `ci.yml`'s `changes` job gains a `verify-outbox` path filter (the delivery migrations,
`lib/delivery-dispatch.ts`, `lib/retry-policy.ts`, the dispatch route, `verify/quint/`). The job runs `quint run` over
the 7 invariants in both timing modes. A fixture model that violates one invariant makes it fail. Part of the required
`gate` only when the filter matches.
**Risk:** low

### Story 1.4 — Evaluator PRs run the proofs and the differential test
**As** a builder changing the flag evaluator, **I want** the Lean build and the differential test on my PR, only when
I touch `lib/flags.ts`, **so that** a proof never passes on a model that disagrees with the code.
**Acceptance:** a `verify-flags` path filter runs `lake build`, the axioms check and `diff-test/run.mjs` on 3 seeds,
with the Lean toolchain cached. The whitespace mutant (Lean whitespace in place of JS `trim()`) fails it. Rule 4 in
`verify/README.md`: no proof tier without a differential test.
**Risk:** low

## Sprint QA
- **specs:** the fixture violation (S1.3), the mutant (S1.4), the drift mutation (S1.2), all run in CI.
- **browser smoke owed:** no.
- **deterministic gate:** `gate` green, with and without the path filters matching.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: GitHub, this repo (an agent can run this).

1. Open a draft PR that only edits `Roadmap/` docs.
   → no `verify-outbox` or `verify-flags` job runs.
2. Open a draft PR that adds a comment to `apps/web/lib/delivery-dispatch.ts`.
   → `verify-outbox` runs and passes in a few minutes.
3. In that PR, change `claim_deliveries`' stale branch in a new migration without touching `verify/`.
   → the static gate fails, naming the drift.
4. Open a draft PR that adds a comment to `apps/web/lib/flags.ts`.
   → `verify-flags` runs the Lean build and the differential test and passes.

Close the draft PRs afterwards.

If any step fails, note the step number + what you saw — that's the bug report.

