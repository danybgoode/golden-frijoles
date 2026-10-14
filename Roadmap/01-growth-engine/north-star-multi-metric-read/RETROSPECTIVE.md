# Several North Star metrics, one reading rule — Retrospective

_Closed: 2026-10-14_
_Intent: owed to Daniel (yes | mostly | no)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $11–17 (S, n=3, p25–p75) → ≈$3.89 (−77% vs the quote's top; Claude only, reviewers not measured)_

## What shipped
- **S1.1** (#321, merge `9bf9e5c`, 2026-10-08): one helper, `currentNorthStar` in `lib/north-star-query.ts`. It picks the
  newest metric by `created_at`, ties broken by `key`, with `order` + `limit 1` instead of `.maybeSingle()`. The North
  Star page and the Pod Report both use it, and each reads or counts only that metric's inputs.
- The spec inserts two metrics in the opposite order to their `created_at`, so the insertion order can't make it pass.

## What went well
- **The queued fix was ready when the bug went live.** The epic was scaffolded on 2026-10-04 as a latent bug.
  one-product-project's cutover then put `proven_bets` beside the synthetic `payable_sellers`, which couldn't be deleted
  because inputs are append-only. The page broke, and the decided rule was applied the same day.
- **Verified live, not only in CI.** On 2026-10-14 the public Pod Report for `golden-frijoles`, which still holds both
  metrics, reads "North Star — proven_bets".

## What we learned
- **A fixture with ONE of something cannot catch a bug that needs two.** Every North Star spec seeded exactly one
  metric, so `.maybeSingle()` on a non-unique filter passed for weeks. Promoted to LEARNINGS.

## Gaps / follow-ups
- **Owed to Daniel:** the signed-in look at https://goldenfrijoles.com/app/north-star/golden-frijoles (sprint-1 step 2),
  and the `_Intent_` word above.
- The epic was never closed at the time: it sat at "in review" for six days after its merge. The owed ledger now counts
  an open epic's sprint docs, so a stalled close-out shows up.
