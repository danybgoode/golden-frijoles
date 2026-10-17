# A reading for proving_workspaces — Retrospective

_Closed: 2026-10-17_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $5–17 (S, n=7, p25–p75) → ≈$12.12 (−29% vs the top)_
<!-- The actual is STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_* into
     the README (finops S2.5); copy its numbers here. -->
_Crew (actual): claude-opus-5-5 ≈$12.12 · reviewers agy gpt-oss-120b (security, scoped), agy (general, Codex capped; r1 + r2), fresh verifier (r1 + r2) · prose Claude (the builder) — planned Codex for the general pass; it was capped, so one family ran both lenses_
<!-- The models are STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_models
     into the README (why-as-a-story D6). Codex, agy, Devin and other outside tools are not in the transcripts; name
     them from the PR's review records. -->

## What shipped
- **S1.1** (`b12c8b2`, `94e1ec8`): a roadmap push that first records an epic `proven` sends **one**
  `workspace_proved_bet` per push to Golden Frijoles' own project, after the store and inside `after()`. Its subject is
  `HMAC-SHA256(SELF_SUBJECT_SECRET, workspace_id)`. The only read is the pushing project's own `workspace_id`. No
  tags. No secret means nothing is sent, and if the previous artifact couldn't be read, nothing is sent either.
- **S1.2** (`5a68b12`): migration `20261019100000` adds `leading_inputs.aggregate` (`count` | `distinct_monthly`, with
  a CHECK that allows `distinct_monthly` on telemetry inputs only), applied before the merge. `computeDistinctMonthlySeries` adds a 0 reset on each later month's 1st. The
  sync allows `external_push → telemetry_event` while nothing was pushed. Both Every-reading tables summarise
  through `readingsSummary()`.
- **S1.3** (`fa740eb`): `proving_workspaces` is synced live as `telemetry_event · workspace_proved_bet ·
  distinct_monthly`. The CLI and the public connector both read it.
- PR #401, merge `55758fe`, deploy success.

## What went well
- **The lock disproved four pieces of scope before any code**: there is no `north_star_inputs` table, the sync
  refused the very switch S1.3 needed, `/api/v1/public/north-star` is feature-scoped, and a running monthly count
  read "latest on or before" returns last month's number. Each one would have shipped broken.
- **Querying live data first made the D7 switch safe to allow**: `proving_workspaces` had 0 pushed values in
  production, and the database already refuses values on a telemetry input.
- **Mutation checks on everything**: 6 unit mutants and 2 e2e mutants all went red.

## What didn't go well
- **The verifier found two real defects that every other read passed.** First, one event per epic (up to 10) let a
  tenant spend the self key's shared rate and quota, which the platform's own funnels use. Second, both Every-reading
  tables **summed** a running distinct count (1, 2, 3 read as "totalling 6"). D9 said "surfaces carry `aggregate`",
  but no summary read it.
- **I wrote two tests that read a private file.** `Roadmap/00-strategy/` is excluded (`.git/info/exclude`,
  coaches-v2 D9), so both would have failed in CI. The commit failed first, on the ignored path, which is how I found it.
- **Codex was capped**, so agy ran both lenses, and the security lens was scoped to 6 of 19 files. The fresh
  verifier was the only full read.
- **The CLI's dry run still labels the D7 switch `refused`.** Changing it would move the setup skill's pinned
  version, which is a plugin release. That's owed with the CLI's next release.

## What we learned
- **A new aggregate is a new meaning for every summary of the series, not only for its computation.** Grep every
  `reduce` and `sum` over `series` when a series changes what its points are.
- **A request path that writes into the platform's own project spends a shared budget.** Send the minimum that
  answers the reading, here one event per push.
- **Before a test reads a repo path, check `git check-ignore`.** Private strategy is never in CI.

## Gaps / follow-ups
- Daniel: smoke step 2 (the signed-in page label) and step 3 (a real proven verdict; its first event also proves the
  production secret).
- The CLI's `planSync` learns the D7 switch and `aggregate` with its next release.
- The read on 2026-12-15 (target 0 → 2).
- _Intent_ (Daniel's word).
