# Outcome report v2 — Retrospective

_Closed: 2026-10-07_
_Intent: _
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: quote $22–34 (M, n=8, p25–p75) → actual ≈$14.59 (−57% vs the top)_

## What shipped
- **S1 · Is it paying off** (#299, `08386f0`): the report opens with one sentence on pace, built from the shipped epics'
  own targets (`lib/outcome-expected.ts`); a chart per North Star input, actual against expected, epics marked by their
  Bean; four figures each against expected (spend and cost per win team-only); the epics table (bet, metric expected →
  actual, result, spend vs quote, neutral overspend), every row linked to its epic page, team-only. One read path:
  `getPodReport` now reads the roadmap and the North Star; a failed read is `unavailable`, never "no targets".
- **S2 · How it got there** (#300, `075ff8e`): How fast with a subtitle and deltas against the latest version of each of
  the last two months; the Steps of AI Adoption with "you are here", the next step's count (with its not-instrumented
  count) and a Copy prompt for your agent; one line and a link per section, one bar for who did the work, benchmarks as
  "Read against".

## What went well
- The live-data query at the lock disproved "the North Star's actual" before a line was written: the metric has no
  recorded level, so the chart plots its inputs — said in the lock, not discovered at review.
- Two reviewers with different context found different, real defects: codex the uncaught rejection and the zero-length
  ramp; the fresh reviewer reproduced a crash from one bad date and the fraction-metric floor.
- Every new lens rule was mutation-checked; a signed-out spec caught a link I had missed wiring.

## What we learned
- A tolerance written as an absolute number in a lock is blind to the metric's scale (0.5 on a 0–1 rate is "always on
  pace"). Scale it to the metric and to the planned move.
- A lens is an audience, not a session: the `team` lens also serves the anonymous demo report. Links and actions that
  need a sign-in are gated on the session, not on the lens.
- A tenant-pushed date that passes a shape regex can still throw (`2026-13-01` → `toISOString()`), and one throw inside
  an un-guarded `Promise.all` arm takes down the whole page and every share link. Validate the calendar and give each
  optional half of a page its own try.

## Gaps / follow-ups
- **Owed to Daniel:** both sprints' signed-in walkthroughs; a client share link opened signed out (minting one is a
  prod credential); `_Intent:_` above.
- **Prod shows the "No targets yet" path** until epics carry targets (0 of 67 today) — the targeted chart is proven by
  specs only.
- **`mergedPrs: 0` since the public-monorepo move** leaves review latency and deploy frequency unmeasured in How fast —
  the pusher's computation, out of this epic (no new delivery metrics).
- **`scripts/review-config.json` `securityPaths`** covers neither `apps/web/app/s/**` nor `apps/web/lib/pod-report-lens*`,
  so a change to what a public share link renders doesn't trigger the security lens (fresh reviewer, #299). A small
  follow-up; not changed here because it is the review rail's config.
- Each share view reads every input's series (bounded at 200k events; past it the section says unavailable).
