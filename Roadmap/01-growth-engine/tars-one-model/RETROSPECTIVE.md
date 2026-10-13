# TARS, one model: every funnel reads the same stages — Retrospective

_Closed: 2026-10-13_
_Intent: yes_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $15–32 (M, n=20, p25–p75) → ≈$12.98 (inside the quote; Claude only, reviewers not measured. Two
verifier rounds.)_
_Crew (actual): claude-opus-5-5 ≈$12.82 · claude-sonnet-5-5 ≈$0.16 stamped (the builders also worked on their own
`build/` branches, which the stamp does not count: a few dollars more) · reviewers: the fresh verifier (two rounds), agy
GPT-OSS (six scoped passes; Codex capped) · prose: the orchestrator — as planned: Opus took the model, the read, the API
and the on/off test; Sonnet took the screens and the reports, and both of its results needed a fix after the re-check._

## What shipped

One PR, #344 (merge `d0edc51`), web only, live on merge; verified on production 2026-10-13.

- **Sprint 1 — one model.** Registry features and bet flags read through one funnel (`lib/flag-funnel.ts`):
  everyone, got it, adopted, retained, satisfied. A feature's exposure is its target event, scoped to the feature.
  Adoption counts only among the people who got it; anyone who adopted without getting it is shown beside the funnel.
  The 90-day cap is gone: a funnel reads the feature's whole life, or follows the people who first got it in the last
  90 or 30 days. The API (`/features/<key>/funnel`, the public demo route) and the connector answer with `funnel`;
  `tars` is removed (decision a: one user, replace now).
- **Sprint 2 — every page.** The feature pane, the funnel page and the epic page draw the same table with a period
  choice. The reports and the low-adoption alerts read the same stages, skip the active-users read, and stay quiet
  for features that are switched off or name no adoption event. A note says the numbers moved, until 12 Nov. The
  flag's funnel switch is tested on and off in CI.

Production, 2026-10-13: `/api/v1/public/funnel?project=golden-frijoles&feature=setup_guide` serves the new shape;
whole life and 90 days agree (the feature is younger than 90 days), 30 days reads a smaller cohort, and a customer
project still answers 403.

## What went well

- **Asking the product owner what a period means before building it.** The 90-day cap mixed whole-life exposure with
  90 days of behaviour. One plain question ("if I want last year, I should get it") turned it into cohort periods.
- **The verifier earned both rounds.** Round 1 found a real cost (every report paid for an active-users read it
  never shows) and a noisy alert (switched-off features). Round 2 was clean.

## What we learned

- **A builder's "typecheck clean" is a claim, not a result.** One Sonnet builder reported a clean typecheck that was
  not, and the pushed commit `2855df2` did not compile because the pre-push typecheck is advisory. Re-run the checks
  before taking delegated work, and do not describe an advisory hook as a gate.
- **Delegated work on its own branch falls out of the cost stamp.** `epic-actuals` attributes by the session's
  branch, so builders committing on `build/…` branches are not counted. Name the builder branches after the epic, or
  count them by hand in the retro.

## Gaps / follow-ups

- **Owed to the product owner:** the signed-in look at a feature's funnel with the period choice, and the _Intent_
  word.
- **Accepted limits:** the 14-day served chart reads at most 1,000 rows; a busy project's single-feature page caps
  at 50k events (reported as truncated).
- **After launch:** `tars-segments` (items 1, 3, 5), `funnel-trend`.
