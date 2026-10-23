---
epic: verify-labels
sprint: 1
title: "Verify labels"
risk: high   # S1.4 adds a required CI check on every PR (shared infra); S1.1–S1.3 are low
phase: In review
stories_total: 4
stories:
  - id: S1.1
    title: "Rule labels: zero-spec PRs are off by rule"
    as_a: "the product owner"
    i_want: "every shadow-log row whose PR touches no spec path labelled off by rule, new and existing"
    so_that: "the 30 counts real data instead of waiting on a template line builders skip"
    risk: low
    status: done
  - id: S1.2
    title: "Historical backtest, hindsight labels signed off before Jev runs"
    as_a: "the product owner"
    i_want: "Jev scored on the ~12 spec-touching PRs from history, against labels I signed off first"
    so_that: "we know whether Jev ranks light/standard/deep right where it matters"
    risk: low
    status: in-progress
  - id: S1.3
    title: "The report and the ping say what they count"
    as_a: "the product owner"
    i_want: "agreement split by builder, rule and backtest, plus Jev's non-off rate on zero-spec PRs"
    so_that: "nobody reads 30 as 30 judgments"
    risk: low
    status: done
  - id: S1.4
    title: "The label where it matters: a path-scoped PR-body check"
    as_a: "the product owner"
    i_want: "a PR that touches a spec path to be unable to merge without a Verify depth label"
    so_that: "future judgments arrive labelled, with no friction on any other PR"
    risk: high
    status: done
---
# Verify labels — Sprint 1: Verify labels

**Status:** 🔄 in review — S1.2 waits on the product owner's sign-off of the backtest labels (PR body), then Jev is asked

Decisions D1–D3 are in the [epic README](README.md). Full acceptance and the sign-off table are in the
[seed](../../00-ideas/seeds/verify-labels.md).

## Stories

### Story 1.1 — Rule labels: zero-spec PRs are off by rule ✅ `4333f4e`
**As** the product owner, **I want** every shadow-log row whose PR touches no `PATHS` file labelled `rule_label: "off"`,
new rows by the nightly and existing ones by a one-shot `--backfill` on `claude/verify-jev-shadow`, **so that** the 30
counts real data.
**Acceptance:** the nightly writes `rule_label` on new zero-spec rows; `--backfill` fills the existing ones; neither
ever writes `builder_label`. Counted = `jev` set and (`builder_label` or `rule_label`) set, and builder wins when both
exist (D1). Node spec: a zero-spec PR, a spec PR, and a labelled zero-spec PR.
**Risk:** low

### Story 1.2 — Historical backtest, hindsight labels signed off before Jev runs 🔄 labels `ddc6076` · sign-off owed
**As** the product owner, **I want** `verify/jev-backtest.jsonl` (one row per spec-touching PR merged before
2026-10-17: `{pr, merged_at, hindsight_label, hindsight_reason, hindsight_evidence, jev}`), **so that** Jev is scored
where light/standard/deep matter.
**Acceptance:** two commits, in order. (1) The labels and the sign-off table in the PR body, with **no `jev` column**.
The product owner marks each row ✅, a corrected label, or `?` (dropped and reported as dropped), then writes
"Backtest labels signed off, <date>". (2) After the sign-off, Jev is asked with D9's exact state and the `jev` column
is added. The table's columns, the question each row answers, and why the product owner signs: the seed's S1.2 →
"The sign-off" (D2).
**Risk:** low

### Story 1.3 — The report and the ping say what they count ✅ `4333f4e` · `1060879`
**As** the product owner, **I want** `run.mjs --report` to print counted, exact and within one for each source
(builder · rule · backtest), plus Jev's non-off rate on zero-spec PRs, and the 30 ping to name the rule-label share,
**so that** nobody reads 30 as 30 judgments.
**Acceptance:** the report on today's log shows 10 builder rows, 32 rule rows, and the non-off rate (17/41 as of
2026-10-23, recomputed rather than hardcoded). `pingText` includes the share. verify-module README D9 and D10 are
amended in the same PR to point at this epic's D1.
**Risk:** low

### Story 1.4 — The label where it matters: a path-scoped PR-body check ✅ `a9b4111` · ruleset owed after merge (D4)
**As** the product owner, **I want** a check on `pull_request` `opened/edited/synchronize/reopened` that fails only
when the head is not `claude/`, the PR touches a `PATHS` file, and `parseLabel` returns null, **so that** future
judgments arrive labelled with no friction elsewhere.
**Acceptance:** a pure decision function, driven for zero-spec / spec-labelled / spec-unlabelled / `claude/` head. The
failure prints the fix in one line. The BASE branch's copy of the check runs; the PR's head is only fetched and diffed,
so a PR cannot exempt itself in its own diff. No install, no secret. It is its own required check beside `gate` (D3,
D4), and editing the body re-runs it. The template line reads "required when the PR touches a spec path".
**Risk:** high: a new required check on every PR (shared infra). Orchestrator-built, with the security lens on review
(`pull_request` event, no `pull_request_target`).

## Build notes (deviations from the plan, stated)
- **No separate `--backfill` flag (S1.1):** the nightly backfills any logged row without a `rule_label` key, from the
  same diff a fresh row uses. It is idempotent, and the first nightly after merge does the one-shot. Dry run on the real log:
  42 rows backfilled, 41 `off` by rule, only #405 touches the spec.
- **The count was 41/42, not 40/42:** the first count used a loose regex that matched Roadmap folders named
  `delivery-…`. Corrected in the seed and README.
- **S1.4 is its own workflow plus a second required check (D4, product owner 2026-10-23),** not a job inside `gate`,
  because adding `edited` to ci.yml would restart the whole suite on every body edit.
- **One PR, not three:** the README's deploy order (S1.1 + S1.3 first, S1.4 last) is kept by timing instead: the label
  check only becomes required after merge (D4), so S1.4 blocks nothing until the rule labels are live.
- **From the verifier (#435), fixed:** the check runs the base branch's copy (it ran the PR's own code at first); a
  main row the open shadow branch already labelled is not re-backfilled each night; `?` backtest rows are not sent to Jev.
  **Left as is, answered on the PR:** the `claude/` exemption goes by branch name (the D9 convention, unchanged), and
  rows older than the newest 100 merged PRs can't be backfilled (today all 42 are inside it; the report's
  `unlabelled` count shows any that aren't).
- **Crew:** the orchestrator built all four. S1.1–S1.3 share one module (`verify-shadow.mjs`), so a separate builder
  would have been a second writer on the same file.

## Sprint QA
- **specs:** node tests for the rule-label writer + backfill (S1.1), the per-source report and `pingText` (S1.3), and
  the PR-body decision function (S1.4). S1.2 is data, checked by the sign-off.
- **browser smoke owed:** no.
- **deterministic gate:** the static job (`verify-pins`, lint, node tests) + `ci-gate` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: GitHub · https://github.com/danybgoode/golden-frijoles

1. Open https://github.com/danybgoode/golden-frijoles/pull/406 the morning after S1.1 + S1.3 merge.
   → `verify/jev-shadow.jsonl` has `rule_label` on the zero-spec rows, and the PR body's report shows ≥ 30 counted, split by source.
2. Check Telegram.
   → exactly one "30 labelled PRs" ping, naming the rule-label share.
3. On the S1.2 PR, read the sign-off table (owed to the product owner by name: the sign-off is yours).
   → no Jev column. Mark each row and write the sign-off line. The next commit adds Jev's answers.
4. Open a scratch PR that changes one comment in `apps/web/lib/retry-policy.ts`, with the template's `Verify depth:` line unfilled.
   → the `verify-label` check is red and the merge box is blocked by it (`gate` stays green: they are separate
     required checks, D4).
5. Edit the PR body to `Verify depth: light` (no push).
   → the check re-runs and turns green. Close the scratch PR unmerged.
6. Open a scratch PR touching only a README, template unfilled.
   → the check passes. Close it.

If any step fails, note the step number + what you saw — that's the bug report.
