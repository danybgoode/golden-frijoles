---
title: "Grounded bets: every Why is a hypothesis traced from the North Star"
slug: grounded-bets
status: scaffolded
area: "09"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: low
epic: "09-platform-infra/grounded-bets"
build_order: 75
updated: 2026-10-09
intent_ask: proxy      # verbatim = the product owner's own words below · proxy = reconstructed after the fact
hypothesis: "We believe that a refine that writes every Why as a hypothesis traced from the North Star, and challenges an ask that names no input, for founders turning an idea into an epic, will raise grounded bets from 0% to 60% of the features funded by 30 November, because today nothing asks which input a bet moves and the strategy files sit unread at the gate. We'll know when a funded bet records grounded: true with a North Star input, a target and a read date."
target_metric: grounded_bets_share
target_from: 0
target_to: 0.6
read_date: 2026-11-30
flag_key: null         # no flag: plugin text and an additive push field; rollback is the previous plugin release (Stage 6b)
intent_match: 85
---

# Pitch — Grounded bets: every Why is a hypothesis traced from the North Star

Moves: grounded_bets_share · Tests: Value proposition

## The ask, as given

> Make the "Why we're building this" a hypothesis that cascades from the North Star, and have the agent challenge the
> founder when it doesn't.
> — Daniel, 2026-10-08, reconstructed from the launch-sweep brief's Why/hypothesis item (audit §6, which also names
> where the sentence goes: the epic's Why, the epic page, the band and the flag's description). Then, 2026-10-09: "ready to move
> on to grounded-bet hypothesis cascade".

### Claims
1. Every epic's Why is a hypothesis, not a description.
2. The hypothesis cascades from the North Star (which input it moves, for whom, by what mechanism).
3. The agent challenges the founder when an ask can't be traced, instead of letting it through.

**Teach-back:** yes — "You want refine to write every Why as a testable bet against one of the North Star's inputs,
and to push back with alternatives when an ask doesn't move any of them. Right?" (audit §6, agreed in the Decisions
section of `launch-sweep-2026-10-08.md`)

## Problem
Our North Star is *Proven bets*, and its depth input is `grounded_bets_share`: the share of bets placed against an
agreed North Star input, with a target and a read date. **Today it is 0 of 14**: no bet funded in `wave-2026-10`
(this month's whole launch order included) names a North Star input as its target. The tooling makes that the easy path:
- refine's Stage 1.5 asks "which number?" once, and `null` is accepted silently; the Plan gate then drops the Moves,
  Target and Read date lines.
- With no strategy, `references/strategy.md` says "not grounded" and **"never ask for a strategy because of it"**.
- A bet that is deliberately ungrounded looks the same as one nobody thought about, so the share cannot be counted.
- The hypothesis is free text: "what this should change, in one sentence". Nothing gives it the bet's shape (who,
  which input, by how much, why we think so, what we'll see).

## Appetite
M. Text and two small scripts in the plugin, one additive field in the roadmap push, one line on the epic page.
quote: $17–32 (M, n=17, p25–p75)

## Outcome & signal
At refine's Stage 1.5 the agent writes the bet sentence, traced to an input the strategy names, or challenges with
reframes; the founder picks or overrides, and the choice is recorded as `grounded: true | false — <reason>`. The Plan
gate shows the sentence and the grounding, and `grounded_bets_share` is computed from the bets ledger, not pushed by hand.
**Target:** `grounded_bets_share` 0 → 0.6 of the features funded by 2026-11-30 (Bugs and Chores are not counted).

## Stage-2.5 bucket
**Light enhancement.** The hypothesis field, the band's Why line, the epic page's "Why we're building this", the
Outcome report's hypothesis column and the strategy reader all exist; what's missing is the cascade, the challenge, the
recorded grounding and the count.

## The sentence (North Star Playbook's bet shape, in product prose)

> **We believe that** <the change> **for** <persona, doing their job> **will** <move input X from a to b by the read
> date>, **because** <the insight: their pain or behaviour, with the evidence>. **We'll know when** <the signal: the
> event the target counts>.

## The cascade at Stage 1.5 (replaces the single "which number?" question)
1. **Trace.** Which input does this move (`strategy.mjs`'s keys)? For which persona and job (`pmf-narrative`)? By what
   mechanism, on what evidence? Draft the sentence from the answers; the founder edits it.
2. **Challenge** when no input has a credible mechanism: two or three reframes taken from the strategy (the same ask
   aimed at another input; a smaller cut that tests the highest domino; "this is a chore: no hypothesis needed").
3. **Pick or override.** An override is allowed and recorded as `grounded: false` with `grounded_reason`; that is what
   the share counts. The agent challenges once per seed, never nags.
4. **Bug and Chore** skip it: "Why: keeps <X> working", `grounded: n/a`, not counted.
5. **No strategy yet:** one offer to run `strategy`'s North Star chapter now (the drafted North Star arrives with
   "setup drafts the strategy", next in the launch order); a decline records `grounded: false — no strategy yet`.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| Stage 1.5 cascade + challenge in `refine` (SKILL.md, `references/result-record.md`, `strategy.md`, `question-bank.md`) | the agent traces and challenges instead of accepting `null` |
| `strategy.mjs` prints the persona and job from `pmf-narrative` | the sentence's **for** comes from the agreed strategy, not invention |
| Seed + epic frontmatter `grounded`, `grounded_reason`, `persona`; `scaffold-epic` copies them | grounded-by-choice is distinguishable from never-asked |
| Plan gate: the sentence + `Grounded .. yes \| no — <reason>` (`gates.md`, `check-gate-words`) | the founder approves the bet, not only the plan |
| Roadmap push and schema carry `grounded` (nullish, additive) | the board and the share read the same field |
| `bets-grounded.mjs`: the share per month from `Roadmap/bets/` + each bet's README | `grounded_bets_share` computed, not hand-pushed |
| Stage 6b's `frijoles flags create` line carries `--description "<hypothesis> (epic <slug>)"` | the console says why a flag exists |

## Scope
**Sprint 1 · The cascade in refine** (S1.1 the sentence and the trace at Stage 1.5 · S1.2 the challenge, the override
and Bug/Chore · S1.3 the Plan gate shows the bet and its grounding; no-strategy offers the North Star chapter once) ·
**Sprint 2 · Recorded and counted** (S2.1 `grounded` through scaffold, push and schema · S2.2 `bets-grounded.mjs`
computes the share · S2.3 the flag description carries the hypothesis; plugin + kit release).

**No-gos:** no inferred North Star from the repo (that is "setup drafts the strategy", next) · no blocking: an
ungrounded bet can always be funded · no rewrite of existing epics' hypotheses (they stay as written; only new bets are
counted) · no new console screen (the epic page and band already show the Why) · the flag ↔ TARS wiring ("one bet,
wired", later) · no engine route or migration.

## Rabbit holes
- **Nagging.** A challenge on every seed turns into noise. One challenge per seed, with an explicit override that is
  recorded and respected; the gate shows the grounding as a fact.
- **Fake precision.** "From 0.2 to 0.6" invented to pass the trace is worse than `grounded: false`. The trace asks for
  the evidence behind the number, and "no baseline yet" is a valid from with a read that establishes it.
- **The share's denominator.** Features funded in the month, from the bets ledger (`Roadmap/bets/wave-YYYY-MM*.md`);
  Bugs, Chores and the backfill wave are excluded. Pinned by a test so the input keeps one meaning.
- **Old plugin readers.** `grounded` is additive and nullish everywhere; an older pusher stays valid (as result-record did).

## What already exists (reuse, don't rebuild)
- `refine/strategy.mjs` (inputs, highest domino), `references/{result-record,strategy,gates}.md`, `templates/scope-seed.md`
- `scaffold-epic.mjs` (copies the result record), `fund.mjs` and `Roadmap/bets/`
- `apps/web/lib/roadmap-artifact-schema.ts` (`hypothesis` and the target already declared), `outcome-figures.ts`
- The band's Why line (`hooks/vendor/build-state.mjs`), the epic page's "Why we're building this" (`epic-components.tsx`)
- `frijoles flags create --description` (CLI, already supported)

## Visuals

```
 North Star: Proven bets
   └─ input: grounded_bets_share ── strategy.mjs prints the inputs, persona, highest domino
         │
 refine Stage 1.5:  trace ─▶ sentence ──┐
                    no input? challenge ─▶ reframe A | B | chore | override (grounded: false — reason)
                                         ▼
 Plan gate:  We believe that … for … will … because … We'll know when …
             Grounded .. yes (grounded_bets_share 0 → 0.6 by 2026-11-30)
                                         ▼
 scaffold ─▶ epic README ─▶ push (grounded) ─▶ epic page · band · Outcome report
 bets-grounded.mjs ─▶ grounded_bets_share for the month
```

## UX heuristics & rails check
The challenge reads like a partner, not a form: one question, two or three concrete reframes, and an "override" that
costs one sentence. The gate words follow `gates.md`'s plain-agile rules (`check-gate-words` CI).

## Kill-switch / runtime gate (risk:high only — Stage 6b)
Not required (risk: low). No flag: plugin text and an additive field; rollback is the previous plugin release.

## Acceptance criteria
- S1.1 Refine's Stage 1.5 drafts the bet sentence from the strategy's inputs, persona and job, and the seed records it (high)
- S1.2 An ask that names no input gets two or three reframes, and an override is recorded as `grounded: false` with its reason (high)
- S1.3 The Plan gate shows the sentence and "Grounded: yes | no — reason"; with no strategy, refine offers the North Star chapter once (high)
- S2.1 Every new epic README's Why opens with the bet sentence, and `grounded` travels from the seed through scaffold and the roadmap push to the board without breaking an older pusher (high)
- S2.2 `bets-grounded.mjs` prints the month's grounded share from the bets ledger, with Bugs and Chores excluded (high)
- S2.3 The Why reaches the flag too: a flag created at Stage 6b carries the epic's hypothesis as its description, so the console says why it exists (low)

## Open risks / research
- `strategy.mjs` today does not print the persona; S1.1 reads it from `pmf-narrative.md`'s Target audience section.
- Pushing the share into the engine (as an input value) needs an ingest key on the pusher's machine; S2.2 prints it and
  the push is a decision below.

## Decisions for the Plan gate
- **a.** Push the computed share into the `golden-frijoles` project as the `grounded_bets_share` input value (SDK 1.0's
  `pushInputValues`, from the same hook machine that pushes the roadmap) — or print it only for now?
- **b.** Count from this month (October reads 0 of 14, the baseline) — or start the count at November so the launch
  epics, shaped before the cascade existed, don't sit in the denominator?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/grounded-bets.md
  coverage in   0.83  (3 claims)
  coverage out  0.77  (6 criteria)
  clarity       0.80  (6 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 85 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.83,"coverage_out":0.768,"clarity":0.802,"teach_back":1,"total":85} -->

## Decisions at the Plan gate (Daniel, 2026-10-09)
- **Approved.**
- **a.** Push the computed share into `golden-frijoles` as the `grounded_bets_share` input value (SDK 1.0's
  `pushInputValues`, from the machine that already pushes the roadmap).
- **b.** Count from October: 0 of 14 is the baseline, shown honestly.
