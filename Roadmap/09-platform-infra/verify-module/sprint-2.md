---
epic: verify-module
sprint: 2
title: "Nightly and shadow"
risk: high   # re-tiered 2026-10-16: the first contents:write workflow here + a new secret (shared infra; #387)
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "The deep check runs nightly and files what it finds"
    as_a: "the product owner"
    i_want: "the exhaustive check every night, and a new violation turned into a seed PR with its trace"
    so_that: "bugs too deep for the per-PR check (F2 was 12 steps) still surface"
    risk: low
    status: planned
  - id: S2.2
    title: "Jev routes verify depth, in shadow"
    as_a: "the product owner"
    i_want: "Jev's verify-depth call logged for every merged PR beside the builder's"
    so_that: "we measure the router before anyone relies on it"
    risk: low
    status: planned
  - id: S2.3
    title: "At 30, I'm told"
    as_a: "the product owner"
    i_want: "one Telegram ping and an owed line the day the shadow log reaches 30 labelled PRs"
    so_that: "verify-for-projects gets refined when it can be, instead of going stale"
    risk: low
    status: planned
---
# Verify module — Sprint 2: Nightly and shadow

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites the README's D7–D11. S2.1 = D7 (+ D2's `outbox_timed_prefix` teeth row). S2.2 = D8 + D9. S2.3 = D10. Secrets
`TYPESAFE_API_KEY` (added 2026-10-16, approved) and `TELEGRAM_*` (existing); Actions may open PRs (approved
2026-10-16).

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S2.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 2.1 — The deep check runs nightly and files what it finds
**As** the product owner, **I want** the exhaustive check every night, and a new violation turned into a seed PR with
its trace, **so that** bugs too deep for the per-PR check (F2 was 12 steps) still surface.
**Acceptance:** a `verify-nightly.yml` workflow on `schedule` only (never on a PR), with its own timeout, runs
`verify/quint/check.sh` with Apalache cached. A violation not already filed opens one `claude/verify-<invariant>` PR
adding a raw seed with the trace and the `summarize-itf.mjs` summary; a repeat updates that PR instead of opening
another. Nothing is pushed to `main`. A green night writes nothing.
**Risk:** low

### Story 2.2 — Jev routes verify depth, in shadow
**As** the product owner, **I want** Jev's verify-depth call logged for every merged PR beside the builder's, **so that** we
measure the router before anyone relies on it.
**Acceptance:** the PR template gains a `Verify depth: off | light | standard | deep` line the builder fills (the
label). The nightly asks Jev the spike's one question (verify depth; not *obligation difficulty*) for every PR merged
since its last run and appends `{pr, jev, builder_label}` to `verify/jev-shadow.jsonl` in its `claude/` PR (a PR's own
CI can't write to the repo). It never gates and never comments. A PR with no label is logged as unlabelled and doesn't
count. `node verify/jev-triage/run.mjs --report` prints the labelled count and the agreement
(exact, within one level).
**Risk:** low

### Story 2.3 — At 30, I'm told
**As** the product owner, **I want** one Telegram ping and an owed line the day the shadow log reaches 30 labelled PRs,
**so that** verify-for-projects gets refined when it can be, instead of going stale.
**Acceptance:** the nightly reads the count. The first time it is ≥ 30, it sends one ping through
`scripts/telegram-notify.mjs` ("Jev's verify-depth log has 30 labelled PRs (N exact, M within one): verify-for-projects
can be refined") and adds an owed line (judgment) to this epic's `RETROSPECTIVE.md` in the same `claude/` PR pattern, so
the owed ledger and the board show it until it's acted on. A marker in `verify/` stops a repeat. A test drives the
count across 29 → 30 → 31 and sees exactly one ping.
**Risk:** low

## Sprint QA
- **specs:** the nightly's "already filed" logic and the one-ping rule as node tests; the shadow log's format.
- **browser smoke owed:** no.
- **deterministic gate:** `gate` green.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: GitHub, this repo.

1. Run `verify-nightly.yml` by hand (workflow_dispatch) on `main`.
   → it finishes green within its timeout and opens no `claude/verify-<invariant>` PR. (*Amended 2026-10-16:* the
   shadow log is the same run, so once a PR has merged since the log's start it does open or update
   `claude/verify-jev-shadow` — that is S2.2 working, not a finding.)
2. Run it with `depth: quick` on a branch whose model has a seeded violation.
   → one `claude/verify-…` PR appears with a seed and a trace; a second run updates it instead of opening another.
3. Merge a PR with `Verify depth: light` in its body, then run the nightly by hand.
   → its `claude/` PR adds a line to `verify/jev-shadow.jsonl` with Jev's call and `light`; no comment on the merged PR.
4. Run `node verify/jev-triage/run.mjs --report`.
   → the labelled count and the agreement.

If any step fails, note the step number + what you saw — that's the bug report.
