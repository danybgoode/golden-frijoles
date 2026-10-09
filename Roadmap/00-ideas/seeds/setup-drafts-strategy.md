---
title: "Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review"
slug: setup-drafts-strategy
status: ready
area: "09"
type: feature
appetite: M
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-09
intent_ask: proxy      # reconstructed from the launch-sweep brief and audit §9; Daniel's go: "continue with setup drafts the strategy"
hypothesis: "We believe that a setup which reads the product, drafts the strategy with two North Star candidates citing their evidence, and ends with a first bet already grounded, for founders setting up Golden Frijoles on an existing repo or a new idea, will turn new workspaces into proving workspaces (from 0 to 2 by 15 December), because a 45-minute workshop before any value is the step founders skip, and an ungrounded first bet can never be proven. We'll know when a new workspace's first funded bet records grounded: true and reaches a verdict by its read date."
persona: "a founder who owns the product, solo to mid-size, setting up Golden Frijoles for the first time"
grounded: true
grounded_reason: null
target_metric: proving_workspaces
target_from: 0
target_to: 2
read_date: 2026-12-15
flag_key: null         # no flag: plugin text and two kit scripts; rollback is the previous plugin release (Stage 6b)
intent_match: 89
---

# Pitch — Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review

Moves: proving_workspaces · Tests: Value proposition

## The ask, as given

> The North Star / onboarding end state: infer, then confirm; one review, not twenty questions; the coaches become "go
> deeper" over a draft, not a blank page.
> — Daniel, 2026-10-08, reconstructed from the launch-sweep brief's onboarding item (audit §9, steps 2–5, scored #7 in
> the launch order). Then, 2026-10-09: "continue with setup drafts the strategy".

### Claims
1. Setup infers the strategy from the product instead of starting from a blank page.
2. The founder confirms it in one review, not a series of questions.
3. The coaches become a way to go deeper over the draft.

**Teach-back:** yes — "You want setup to read the product, draft a strategy you can correct in one sitting, and leave
the coaches for when you want to go deeper. Right?" (audit §9, agreed in its Decisions section)

## Problem
Setup's "this repo" route already ends in a **Strategy gate**: it writes the three strategy files "from the conversation
and the repo", shows what it decided, asks up to three decisions, and Approve marks them agreed. What it lacks:
- **Nothing to cite.** `read-repo.mjs` reads history (pull requests, issues), not the product: the README, the landing
  copy, the routes, the analytics calls and flags already in the code. The draft is the agent's impression, uncited.
- **One North Star, shown first.** The draft anchors the founder on a single metric before they've said what the
  product is for (audit §9: "watch out for anchoring").
- **No measurement plan and no first bet.** The gate ends at a strategy; the founder still has to refine a first epic
  and work out which events the inputs need.
- **The new-idea route has no draft at all**: it offers the 45-minute coaching or an ungrounded first epic.
Our own grounded-bets baseline shows the cost: 0 of 12 bets grounded in August–September, before refine asked.

## Appetite
M. Plugin text (setup, refine's Strategy gate, the strategy coaches' "go deeper" entry) and one new kit script.
quote: $15–32 (M, n=18, p25–p75)

## Outcome & signal
Setup, on either route, asks the one-sentence question first, reads the product, drafts the three strategy files with
**two** North Star candidates (three or four inputs each), each line citing its evidence, and shows one review: the
Strategy gate grown to five blocks (Product & persona · North Star: A or B · Measurement plan · Roadmap · First bet).
Approve writes the chosen North Star, marks the files agreed, and writes the first bet as a grounded seed.
**Target:** `proving_workspaces` 0 → 2 by 2026-12-15, counted by hand from the console until the bet-verdict record
exists (it is a pushed-from-outside input today).

## Stage-2.5 bucket
**Light enhancement.** The Strategy gate, the three coaches and their templates, `read-repo.mjs --look`, the grounded
bet sentence and `strategy.mjs` exist. New: a product read, two candidates with citations, the question first, two
review blocks, and a draft on the new-idea route.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `read-product.mjs` (kit): README and landing copy, routes or pages, analytics calls already in the code (PostHog, Segment, gtag, GA, Mixpanel, Amplitude, our SDK), flags in the code; each fact with its file | the draft cites evidence instead of impressions |
| Setup asks "In one sentence, what is this for and who is it for?" **before** drafting, on both routes | the founder's words come before the draft can anchor them |
| The draft: persona and job, one-line narrative, the game, **two** North Star candidates (3–4 inputs each), the riskiest assumption; each line cites a fact or says "assumed" | infer, then confirm; anchoring halved |
| The Strategy gate grows to five blocks: Product & persona · North Star **A or B** · Measurement plan (the event each input needs; what is already tracked) · Roadmap (what read-repo found) · First bet (the sentence, grounded on the chosen input) | one review, not twenty questions |
| Approve: the chosen candidate written, files `agreed`, the first bet written as a seed with `grounded: true` | setup ends with a bet that can be proven |
| New-idea route: "Draft it now (about 5 minutes)" before "Coach me (about 45)" | no blank page on either route |
| The coaches open on an existing draft as "go deeper": they revise in place, never restart | the workshop becomes optional depth |

## Scope
**Sprint 1 · Read and draft** (S1.1 `read-product.mjs` · S1.2 the question first, then the cited draft with two
candidates, on both routes) · **Sprint 2 · One review** (S2.1 the five-block Strategy gate and Approve, first bet
included · S2.2 the coaches go deeper over a draft · S2.3 plugin + kit release).

**No-gos:** no instrumentation, SDK install or pull request (that is "setup instruments and connects", next) · nothing
synced to the engine (the North Star reaches Golden Frijoles only when the founder pushes, as today) · no local web page
for the review (`frijoles view` is after launch; the gate renders in the terminal and the files read in any Markdown
viewer) · no network reads of the product (no crawling the live site): the repo's files only · no re-run "drift" mode
(re-running setup on an agreed strategy shows what would change and asks, as the coaches already do).

## Rabbit holes
- **Fake evidence.** A line citing a file that doesn't say it is worse than "assumed". Each citation is a path the
  read printed; anything else is marked assumed, and the gate counts the assumptions.
- **Two candidates that are the same metric twice.** They must differ in the game or the unit (for example "weekly
  active teams" vs "proven bets"); the gate shows what each would make you build differently.
- **Reading a big monorepo.** The product read is bounded (file count and bytes, the largest pages first) and says what
  it skipped, like read-repo does.
- **Secrets in what we read.** `.env*`, keys and tokens are never read or printed; the read takes source and copy only.

## What already exists (reuse, don't rebuild)
- setup's Stage 2 routes and the Strategy gate (`refine/references/gates.md`), `read-repo.mjs --look`
- the three coaches and their templates (`strategy/references/*`, `strategy/templates/*`), `strategy.mjs`
- the bet sentence and grounding (grounded-bets: `result-record.md`, `scope-seed.md`)
- `lib/strategy-files.mjs`, `one-pagers.mjs`, the cold-read seal (anchoring guard for those who want it)

## Visuals

```
 setup ─▶ "In one sentence, what is this for and who is it for?"
       ─▶ read-repo --look  +  read-product (README · pages · analytics calls · flags, each with its file)
       ─▶ draft: persona & job · narrative · game · North Star A | B (3–4 inputs each) · riskiest assumption
                 every line: (README.md:12) or (assumed)
       ─▶ Strategy gate, five blocks:
            Product & persona · North Star: A or B · Measurement plan · Roadmap · First bet (grounded)
            1 Approve   2 Change something   3 Coach me through it (go deeper)
       ─▶ files agreed · first bet seeded · refine takes it from Ready
```

## UX heuristics & rails check
One question before any draft; one review after it. The gate keeps `gates.md`'s plain words (`check-gate-words`), shows
"decided from the repo" separately from "decisions only you can make", and names each assumption.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
Not required (risk: low). No flag: plugin text and a kit script; rollback is the previous plugin release.

## Acceptance criteria
- S1.1 `read-product.mjs` prints the product's facts, each with its file, bounded, and never reads a secret (high)
- S1.2 Setup asks the one-sentence question before drafting, then writes a draft with two North Star candidates whose every line cites a fact or says assumed (high)
- S2.1 The Strategy gate shows five blocks and Approve writes the chosen North Star, marks the files agreed and seeds a grounded first bet (high)
- S2.2 A coach opened on a draft revises it in place as "go deeper" and never starts from a blank page (high)
- S2.3 Plugin and kit release with the new script in the kit and a CHANGELOG entry (low)

## Open risks / research
- What each analytics library's call looks like in code (PostHog `capture`, Segment `analytics.track`, gtag `event`,
  Mixpanel `track`, Amplitude `track`, our SDK `track`): S1.1 starts from a small table and its tests.
- `proving_workspaces` has no readings and no pusher; the target is read by hand on 2026-12-15.

## Decisions for the Plan gate
- **a.** Does Approve at the setup review count as **agreed** (so bets against it are grounded), or should the draft
  stay `draft` until a coach has gone deeper? Recommendation: Approve = agreed, as the Strategy gate does today; the
  coaches stay optional depth.
- **b.** The target: `proving_workspaces` 0 → 2 by 2026-12-15, counted by hand. Or fund it ungrounded ("no
  cross-workspace reading exists yet") until the bet-verdict record lands?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/setup-drafts-strategy.md
  coverage in   0.96  (3 claims)
  coverage out  0.78  (5 criteria)
  clarity       0.84  (5 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 89 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
Untraced (trace it to the ask or cut it):
  criterion 5 (0.42): "S2.3 Plugin and kit release with the new script in the kit and a CHANGELOG entry (low)"
```

<!-- intent-match: {"coverage_in":0.96,"coverage_out":0.778,"clarity":0.837,"teach_back":1,"total":89} -->
