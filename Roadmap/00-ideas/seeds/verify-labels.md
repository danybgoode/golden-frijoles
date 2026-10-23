---
title: "Verify labels: backfill the shadow log, backtest Jev on the history, and keep labels coming"
slug: verify-labels
status: scaffolded
area: "09"
type: chore
appetite: S
underwritten_by: wave-2026-10
risk: high
epic: "09-platform-infra/verify-labels"
build_order: 102
updated: 2026-10-23
intent_ask: verbatim   # verbatim = the product owner's own words below · proxy = reconstructed after the fact
hypothesis: null       # the bet (Stage 1.5): We believe that … for … will … because … We'll know when … (one sentence)
persona: null          # for whom, doing which job (from strategy.mjs's persona/job lines, narrowed to this ask)
grounded: null         # true = traced to a North Star input with a target · false = funded anyway (say why below) · null = Bug/Chore
grounded_reason: null  # required with grounded: false — one sentence (references/result-record.md → The challenge)
target_metric: "PRs in Jev's verify-depth shadow log with a label (builder or rule)"
target_from: 10
target_to: 30
read_date: null        # when we read it, YYYY-MM-DD; null = 30 days after shipping
flag_key: null         # the flag, if Stage 6b decided one (`<domain>.<feature>_enabled`); the scaffold copies it
target_segment: null   # the bet's TARS target segment: `everyone`, or a key the project defines (`frijoles segments define power-users --event <e> --min <n> --days <d>`) · null = not measured
adopted_event: null    # the event that means "adopted" (Stage 6b, Measure) · null = not measured
retained_event: null   # the repeat that means "retained" · null = the adoption event again
retention_days: null   # the retention window in days (1–90) · null = 7
satisfied_event: null  # optional: the event that means "satisfied" (a rating) · null = not measured
satisfied_min_score: null  # with satisfied_event: satisfaction_rated, the score (1–5) that counts as satisfied · null = 4
intent_match: 96
---

# Pitch — Verify labels: backfill the shadow log, backtest Jev on the history, and keep labels coming

Moves · Tests: neither — a chore that unblocks refining [`verify-for-projects`](verify-for-projects.md), which is gated
on this measurement (verify-spike `DECISION.md` rule 3).

## The ask, as given

> can we do any backtracking on those merged prs plus fix labelling?

(Answer to: "verify-for-projects is gated on ≥ 30 labelled PRs; the log has 42 rows, 10 labelled, Jev matched 3. How
should I proceed?", 2026-10-23.)

### Claims
1. Label the PRs already merged into the shadow log after the fact ("backtracking on those merged PRs").
2. Fix labelling so new PRs arrive labelled.

**Teach-back:** yes (approved at the Plan gate, 2026-10-23) — "You want the 32 unlabelled merged PRs labelled after the fact, and future PRs
labelled reliably, so the verify-for-projects gate can be read on real data instead of waiting weeks. Right?"

## Problem

`verify-for-projects` waits for Jev's verify-depth shadow log to reach 30 **counted** PRs (D9: `jev` and
`builder_label` both set). On 2026-10-23 the log (`claude/verify-jev-shadow`, PR #406) has 42 rows and **10 counted**.
Only 11 of the 43 PRs merged since 2026-10-17 filled in the template's `Verify depth:` line, so builders mostly skip it.

Counting the files each logged PR touched turned up a bigger problem:

- **41 of the 42 PRs touch no spec path** (`verify/jev-triage/questions.mjs → PATHS`). By the template's own rubric
  ("off = can't affect the outbox or the flag evaluator") they are `off` by rule.
- **Jev called 17 of those 41 something other than `off`**, 9 of them `deep` (e.g. #399, #403, #414, #420). It
  over-calls, as the spike saw on 3 of 4 misses.
- **Only 1 logged PR touches the spec** (#405). (A first count said 2, #405 and #407, with a loose regex that also
  matched Roadmap folders named `delivery-…`; measured against each merge's first parent with the real pathspecs, as
  the nightly does, #407 touches none. Corrected 2026-10-23 during S1.1.)
- **Across all of history, only about 12 first-parent commits on main touch a spec path** (from #15 on 2026-07-21 to
  #405), roughly one every one to two weeks.

So "30 labelled PRs" as written mostly counts trivial `off` PRs. The cases verify-for-projects actually needs Jev for,
light vs standard vs deep on spec-touching code, would take months to reach 30.

## Appetite
S. One sprint. It is data and a small check, and nothing in the product changes.
quote: $8–19 (S, n=13, p25–p75)

## Outcome & signal

- The shadow log has ≥ 30 counted rows, and the 30 ping fires on the next nightly.
- `run.mjs --report` splits agreement into three parts: builder labels, rule labels (no spec path), and the historical
  backtest of spec-touching PRs.
- The report states Jev's **false non-off rate on zero-spec PRs**. That number shapes verify-for-projects' ladder:
  probably a path filter first, and Jev only on PRs that touch the spec.
- A new PR that touches a spec path cannot merge without a `Verify depth:` label. Every other PR is labelled `off`
  by rule, with no friction for its builder.

## Stage-2.5 bucket
light-enhancement: the log, the label parser, the nightly and the report all exist. This adds one label source, one
backtest file and one PR-body check.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `rule_label: "off"` on rows whose PR touches no spec path (nightly + one-shot backfill) | The rubric already defines it, so it is unbiased and needs no human |
| `builder_label` left untouched | A hindsight label must never pose as the builder's own call |
| Historical backtest: Jev asked on the ~12 spec-touching PRs before `since`, plus a blind hindsight label → `verify/jev-backtest.jsonl` | The only cases where light/standard/deep matter; hindsight knows F2 shipped in #16 |
| Report split by source (builder · rule · backtest) | One number would hide that Jev over-calls trivial PRs |
| PR-body check: fails only when a non-`claude/` PR touches a spec path with no single depth | Forces the label exactly where judgment is needed, and nowhere else |

## Scope
**In v1:** the rule label (nightly + backfill of the existing rows); the historical backtest file and its blind labels;
the report split; the path-scoped PR-body check; D9 amended so a rule label counts.
**Out of v1 (no-gos):** editing past PR bodies (the nightly skips rows already logged, so it would change nothing);
changing Jev's question or `SPECS`; tuning a threshold (that is verify-for-projects' job); any product surface or
landing claim (audit D7); a plugin/kit release (the kickoff rails stay as they are).

## Rabbit holes
- **The blind hindsight labeller.** Whoever labels the backtest must not see Jev's answer. It sees the same state Jev
  saw (title, file stat, spec-path diff, D9) plus what happened after the merge (a later fix seed, a finding). Jev
  runs **after** the labels are committed. The product owner reviews every backtest label in one table (about 12
  rows).
- **What counts as a spec path.** `PATHS` is the one list. A PR that touches `lib/flags.ts` (the gate seam, not the
  evaluator) is `off` by rule. Widening `PATHS` is out of scope; flag it in the report if a case looks wrong.
- **Merge commits vs squash.** Older PRs were squashed, so their state is computed against the commit's first parent,
  as D9 does. Reuse that code and don't write a second diff builder.
- **The ping firing on rule labels.** That is intended: the ping's text must say how many counted rows are rule
  labels, so nobody reads "30" as 30 judgments.

## What already exists (reuse, don't rebuild)
- `scripts/verify-shadow.mjs`: `parseLabel`, `THRESHOLD`, `LOG_PATH`, the counted/exact/within-one report, and the Jev
  state builder.
- `scripts/verify-nightly.mjs`: lists merged PRs, appends rows, `decidePing`, `pingText`, and keeps the shadow branch
  and PR #406.
- `verify/jev-triage/questions.mjs`: `PATHS`, `SPECS`, `DIFF_BUDGET`. `verify/jev-triage/run.mjs --report` is the
  reader.
- `scripts/jev-backtest.mjs`: the pattern for a historical replay, and its "the corpus is biased, and the report says
  so" stance.
- `scripts/ci-changes.mjs`: the path filter the verify jobs already use (the same glob semantics for the PR-body check).
- `.github/PULL_REQUEST_TEMPLATE.md` § Verify depth: the rubric, with its wording updated to "required when the PR
  touches a spec path".
- verify-module README D8–D10: the definitions this amends (D9 "counted").

## UX heuristics & rails check
- **CI guards covering this surface:** `verify-pins` (static), the `verify-outbox`/`verify-flags` jobs (path-filtered),
  `ci-gate`. The new check must be path-scoped, and it must re-run on a PR **edit** (the `edited` event), or fixing
  the body would not clear it.
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** none (no UI).

## Kill-switch / runtime gate
none: CI and repo files only, with no runtime path. A bad check is rolled back with `git revert` (verify-module D11).

## Acceptance criteria

**S1.1 — Rule labels (risk low).** The nightly writes `rule_label: "off"` on each new row whose PR touches no
`PATHS` file, and a one-shot `--backfill` does the same for existing rows on the shadow branch. `builder_label` is
never written by either. Counted = `jev` set and (`builder_label` or `rule_label`) set, and builder wins when both
exist. Spec: rows for a zero-spec PR, a spec PR, and a labelled zero-spec PR.

**S1.2 — Historical backtest (risk low).** `verify/jev-backtest.jsonl` holds one row per spec-touching PR merged before
`since`: `{pr, merged_at, hindsight_label, hindsight_reason, hindsight_evidence, jev}`. The labels are committed in one
commit **before** Jev is asked (git history proves the order). The product owner signs off on the label table (below)
before Jev runs.

**The sign-off (decision b): exactly what, and why.**

*What the product owner signs.* One table in the PR body, one row per spec-touching PR merged before 2026-10-17
(about 12). It has **no Jev column**: Jev is asked only after sign-off.

| Column | What it holds | Example |
|---|---|---|
| PR | number + title, linked | #16 event-destination-router S2 + S3.3 |
| Spec files touched | the `PATHS` matches, by name | `lib/delivery-dispatch.ts`, `…_delivery_retry.sql` |
| Hindsight label | one of off · light · standard · deep | deep |
| Why (one line) | the rubric clause it meets | changed the claim/settle protocol the outbox model specifies |
| Evidence after merge | what later showed it, or "none" | F2 (verify-spike) lived in this code; fixed by #373 |

*The question each row answers.* "Knowing what we know now, is this the depth this PR **should** have been verified
at, by the template's rubric?" (off = can't affect the outbox or the flag evaluator; light = re-running the existing
model checks/proofs is enough; standard = the spec needs updating + a bounded check or diff test; deep = exhaustive
check / new proofs). It does not ask whether the label was what the builder would have said at the time, and it does
not ask whether Jev will agree.

*How to sign.* For each row: ✅, or a corrected label with one word of why. Then one line: "Backtest labels signed off,
<date>". A row you can't judge gets `?` and is dropped from the backtest score (reported as dropped, never guessed).

*Why the product owner, and why before Jev.* These ~12 labels become the **ground truth Jev's routing is scored
against** on the only PRs where light/standard/deep matter. verify-for-projects will set its depth ladder, and possibly
a threshold, from that score, and will then offer it to other projects. A wrong label here quietly makes Jev look better
or worse than it is, and every project that adopts the ladder inherits the error. The labeller (the orchestrator) has
the same incentive to agree with a model that every reviewer has, so a human who owns the decision checks the labels
while Jev's answers are still unseen. Git history proves the order: the sign-off commit precedes the commit that adds
the `jev` column.

**S1.3 — The report and the ping say what they count (risk low).** `run.mjs --report` prints counted, exact and
within one for each source (builder · rule · backtest), plus Jev's non-off rate on zero-spec PRs. The ping text names
the rule-label share. D9 and D10 in the verify-module README are amended to match.

**S1.4 — The label where it matters (risk high: a new CI check on every PR).** A check reads the PR body on
`opened/edited/synchronize/reopened`. It fails only when the head is not `claude/`, the PR touches a `PATHS` file, and
`parseLabel` returns null. The failure prints the fix in one line. It needs no checkout, no install and no secret.
Spec: the decision function, driven for zero-spec / spec-labelled / spec-unlabelled / `claude/` head.

**Smoke (product owner):** open the shadow PR #406 after the next nightly and see ≥ 30 counted rows, the split report
and the one ping. Open a scratch PR touching `apps/web/lib/retry-policy.ts` with the template unfilled: the check is
red. Fill in `Verify depth: light`: it turns green without a push.

## Decisions (product owner, 2026-10-23, at the Plan gate)
- **a: rule labels count toward the 30.** The ping names their share. It is expected to fire on the first nightly
  after S1.1 + S1.3 merge, which unblocks refining verify-for-projects.
- **b: the product owner signs off on the backtest's hindsight labels** before Jev is asked: the table and the reason
  are in S1.2.
- **c: the PR-body check blocks merging.** It is part of the required `gate`, path-scoped to `PATHS`, and re-run on
  PR edits.

## Open risks / research
- Data as of 2026-10-23, from `origin/claude/verify-jev-shadow` and `git diff --name-only <merge>^1 <merge> -- PATHS` per row
  (41/42 zero-spec; Jev non-off on 17 of them).
- If the backtest shows Jev also misranks spec-touching PRs, verify-for-projects' depth ladder may drop Jev for a
  deterministic router. That is the point of measuring first.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/verify-labels.md
  coverage in   0.95  (2 claims)
  coverage out  —     (no acceptance list)
  clarity       —     (no acceptance list)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
Total 96 / 100 — uncalibrated · signals: coverage in
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.955,"coverage_out":null,"clarity":null,"teach_back":null,"total":96} -->
