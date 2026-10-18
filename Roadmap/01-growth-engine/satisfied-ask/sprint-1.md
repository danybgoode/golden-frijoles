---
epic: satisfied-ask
sprint: 1
title: "The send, the bar, the read"
risk: high
phase: Shaping
stories_total: 5
stories:
  - id: S1.1
    title: "The SDK sends a rating"
    as_a: "a founder instrumenting a bet"
    i_want: "one SDK call that sends a 1–5 rating for a flag"
    so_that: "every bet's satisfaction arrives in one shape the funnel can read"
    risk: low
    status: planned
  - id: S1.2
    title: "Each bet sets its bar"
    as_a: "a founder placing a bet"
    i_want: "to write satisfied_min_score beside satisfied_event"
    so_that: "I decide what score counts as satisfied for this bet"
    risk: high
    status: planned
  - id: S1.3
    title: "The funnel reads the score"
    as_a: "a founder reading a bet"
    i_want: "Satisfied to count only retained people whose latest score meets the bar"
    so_that: "unhappy answers never count as satisfied"
    risk: low
    status: planned
  - id: S1.4
    title: "We ask our own members about funnel trends"
    as_a: "the Golden Frijoles team"
    i_want: "the console to ask members to rate the funnel trend, once"
    so_that: "our own bet proves the path before customers rely on it"
    risk: low
    status: planned
  - id: S1.5
    title: "The SDK README recipe"
    as_a: "a founder adding a rating"
    i_want: "a short recipe: when to ask, the prompt I draw, the call, the bet fields"
    so_that: "I can add it in minutes without a component"
    risk: low
    status: planned
---
# The Satisfied ask — Sprint 1: The send, the bar, the read

**Status:** ⬜ not started

## Stories

### Story 1.1 — The SDK sends a rating
**As a** founder instrumenting a bet, **I want** one SDK call that sends a 1–5 rating for a flag, **so that** every
bet's satisfaction arrives in one shape the funnel can read.
**Acceptance:** `rateSatisfaction({ flagKey, userId, score })` sends `satisfaction_rated` with `featureId` = the flag
key and `tags.score`; a score that is not an integer 1–5 (or a bad flag key) is refused client-side with a typed result,
never thrown; `SATISFACTION_RATED_EVENT` is exported; `surface-freeze.test.ts` still passes (add-only).
**Spec:** SDK unit tests (`packages/sdk/src/satisfaction.test.ts`).
**Risk:** low

### Story 1.2 — Each bet sets its bar
**As a** founder placing a bet, **I want** to write `satisfied_min_score` beside `satisfied_event`, **so that** I decide
what score counts as satisfied for this bet.
**Acceptance:** an integer 1–5 or null; accepted by `roadmap-artifact-schema.ts` (out of range refused with a clear
message; a push without it stays valid), carried by `hub-board.ts` into the card's measure, emitted by the kit's
contract + extractor, copied by `scaffold-epic.mjs`, and present in both templates. The kit change is a plugin release
(`skills/RELEASING.md`).
**Spec:** schema cases, `scaffold-epic.test.mjs`, the contract's own tests.
**Risk:** high (the push contract is shared infra between the kit and the app)

### Story 1.3 — The funnel reads the score
**As a** founder reading a bet, **I want** Satisfied to count only retained people whose latest score meets the bar,
**so that** unhappy answers never count as satisfied.
**Acceptance:** when `satisfied_event` is `satisfaction_rated`, a retained person counts if their latest score after
adoption is ≥ the bar (null = 4); no score = not counted. A custom satisfied event counts any answer, as today, and
ignores the bar. `readMeasureEvents` selects `tags->>score`; no migration.
**Spec:** pure cases in `apps/web/lib/flag-funnel.test.ts` (5, 2, 2-then-4, 4-then-2, bar 3, bar 5, custom event, no
score).
**Risk:** low

### Story 1.4 — We ask our own members about funnel trends
**As** the Golden Frijoles team, **I want** the console to ask members to rate the funnel trend, once, **so that** our
own bet proves the path before customers rely on it.
**Acceptance:** under a measured flag's funnel trend, a 1–5 prompt with "Not now" shows behind the gate
`bets.satisfaction_ask_enabled` (a `GATES` row); an answer goes through the real SDK client (never a direct insert) and
the prompt then hides for that member; "Not now" hides it too. `funnel-truth`'s bet sets
`satisfied_event: satisfaction_rated`.
**Spec:** pure spec for the show/hide decision; browser smoke owed by Daniel (signed in).
**Risk:** low

### Story 1.5 — The SDK README recipe
**As a** founder adding a rating, **I want** a short recipe, **so that** I can add it in minutes without a component.
**Acceptance:** the SDK README says when to ask (after the person retained), shows a plain-HTML prompt, the call, and the
two bet fields (`satisfied_event`, `satisfied_min_score`).
**Risk:** low

## Sprint QA
- **specs:** SDK `satisfaction.test.ts`; `flag-funnel.test.ts` score cases; schema cases for `satisfied_min_score`;
  kit `scaffold-epic.test.mjs` + contract tests; the S1.4 show/hide pure spec.
- **browser smoke owed:** yes, to Daniel — the signed-in console prompt (S1.4).
- **deterministic gate:** the full local CI gate (typecheck, build, Playwright `api`) green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Run `frijoles flags get bets.satisfaction_ask_enabled`
   → each environment prints `on vN` or `off vN`, never a bare `off`.
2. (signed in — owed to Daniel) Go to https://goldenfrijoles.com/app/flags/bets.funnel_trend_enabled
   → under the funnel trend, "Did the funnel trend help you judge this bet?" with 1–5 and "Not now".
3. Click 4.
   → the prompt disappears; reloading the page does not bring it back.
4. Run `frijoles events ls --event satisfaction_rated --limit 1` (or the console's event catalog)
   → one `satisfaction_rated` event with `feature_id` `bets.funnel_trend_enabled` and score 4.
5. Open the bet's funnel on the same page
   → Satisfied shows a count (no longer "not measured") once a retained member has answered 4 or 5.

If any step fails, note the step number + what you saw — that's the bug report.
