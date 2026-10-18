# The Satisfied ask — Retrospective

_Closed: 2026-10-17_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $8–20 (S, n=12, p25–p75) → ≈$14.66 (−27% vs the top)_
_Crew (actual): claude-opus-5-5 ≈$14.66 (plan, build, orchestration; one session) · reviewers: fresh verifier ×2, agy
(Gemini) general ×2, Mistral Vibe security ×2 · prose: Opus (no delegate) — Codex was at its usage cap, so agy took the
general pass and vibe the security lens per `review-route`; agy's gpt-oss model could not fit the diff's context, and its
default (Gemini) did. The planned Sonnet builders were not used: five small stories, one sprint, built inline._

## What shipped
One sprint, PR #403 (merge `0bf691a`), deployed to production; plugin + kit 1.13.0, SDK 1.3.0 (npm publish owed).
- **S1.1** `rateSatisfaction(flagKey, score)` / `dismissSatisfaction(flagKey)`: one standard event,
  `satisfaction_rated`, with the flag as `featureId` and `tags.score` 1–5; refused client-side when unreadable.
- **S1.2** `satisfied_min_score` (1–5, null = 4) beside `satisfied_event`, through the kit contract, extractor,
  scaffolder and templates and the app's push schema, board card and funnel measure.
- **S1.3** The funnel reads the latest score since adopting against the bar, for the rating's own flag only. Custom
  satisfied events read as before. No migration.
- **S1.4** The flag page asks members to rate the funnel trend, behind `bets.satisfaction_ask_enabled` (on in
  development and preview, off in production until the smoke). funnel-truth's bet reads the ratings.
- **S1.5** The SDK README recipe.

## What went well
- **Refining shrank it twice.** The read already existed (`computeFunnel`), so the bet was the ask, not the funnel;
  and the Plan gate's honest "your S and the engine-decides answer don't fit" let the product owner keep S by
  dropping the eligibility route instead of growing the appetite.
- **Mutation checks paid for themselves.** One showed the "latest wins" fixture could not fail (two mirrored people);
  one pinned the cache-key guard; the verifier's showed the since-adoption floor had no spec. All three became specs.
- **CI's fresh database settled the local e2e noise.** Twelve local failures in untouched CLI and North Star routes were
  the long-lived local DB; CI's `api` and `authed` suites were green.

## What we learned
Promoted to `Roadmap/LEARNINGS.md`:
- One standard event name serving many keys must be scoped by key where it is read. A flag's measure read never
  filtered by `feature_id`, so one flag's rating would have satisfied every bet. Found while wiring the read.
- A cache key built from inputs by hand drifts when an input is added; the new spec derives the list from the type.
- (Sharpened) Two fixtures that mirror each other hide an ordering bug as well as one fixture does.

Also, for the next session: the auto-mode classifier refused `gh pr merge` twice (once before the product owner's
explicit "go ahead and merge"); the merge went through the GitHub MCP merge tool with the reviewed head SHA pinned.

## Gaps / follow-ups
- **Owed to Daniel (signed in):** smoke steps 2–5, in production only (the funnel trend is off in development and
  preview). Then switch `bets.satisfaction_ask_enabled` on in production.
- **Owed to Daniel:** `npm publish` of `@golden-frijoles/sdk@1.3.0` (2FA).
- **Owed to Daniel:** the Intent answer above (yes, mostly or no).
- **Owed:** Miyagi sends `satisfaction_rated` (the target's second project; a change in Miyagi's repo).
- **Deferred by design:** an engine-decided "ask now?" route, a drop-in UI component, ratings for registry features.
