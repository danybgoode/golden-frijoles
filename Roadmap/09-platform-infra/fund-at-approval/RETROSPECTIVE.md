# Fund at approval: the approval gate is the betting table — Retrospective

_Closed: 2026-10-04_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $7–16 (S, n=4, p25–p75) → ≈$20.74 (over; +30% vs the quote's top)_

## What shipped
- **One sprint, six stories, one PR** (#271, merge `d9f9328`, plugin + kit 0.28.0):
  - `groom/fund.mjs` places a bet. It writes the cycle row (the month's file is created on first use),
    `underwritten_by` and the build position. It has three modes: fund, re-bet and reorder. Only the queue renumbers.
  - Stage 7 of the gate closes with a Bet block and one question: approve (fund, then scaffold, in one commit),
    approve but don't fund, or change something.
  - `build-order.mjs` fails a live bet with no funding record. The backfill funded 45 bets honestly, normalised 10
    legacy values, and stripped `priority:` from 71 seeds.
  - F33: `scaffold-epic --slug <seed>` turns a fixed-scope seed into a one-sprint epic. Its acceptance criteria become
    the stories. Both kickoff generators now name a seed that has no epic yet.
  - An L epic's kickoff carries the one-line re-bet question for each wave boundary.

## What went well
- **This bet was scaffolded by the detour it removes.** Building the F33 fix right after hitting F33 by hand meant
  the spec for `scaffold-epic --slug` was written against a real seed's shape, not an imagined one.
- **The dry run on live data found the first bug before any test did.** A `ready` seed's leftover #14 would have
  dropped the queue into the gaps in the shipped history.
- **Five review rounds and they converged.** Rounds 1–2 found real product defects. Rounds 3–4 found consistency
  gaps that no live doc triggers. Round 5 was clean from all three readers.

## What we learned
- **A new mode switch needs the matrix, not the happy path.** Every round-1 to round-4 finding in `fund.mjs` came
  from one decision, which mode to run. The checks were "in the queue", then "funded", then which doc to read "funded"
  from. That one decision had a case nobody listed until the fresh reviewer ran a 25-case
  {seed, epic+seed, seedless} × {funded, unfunded} × {placed, legacy} × {flag, none} matrix. Write the matrix first.
- **A tool that writes what the board reads must read it the way the board does.** `fund.mjs` read
  `build_order`/`underwritten_by`/`appetite` from one doc while the extractor read README-first. That is a
  double-funding path, found in round 3.
- **`String.replace` with a string replacement expands `$&`, `$'` and `` $` ``.** Every frontmatter or markdown
  rewrite takes a function replacer. The spec for it fell into the same trap the first time.
- **agy's security lens contradicted itself between adjacent heads.** It was clean on `1fc08d2`, then reported six
  "Blocking" on `e70d149`, a commit that touched none of them. Every finding was checked against the file and
  answered with line references. One later finding was real and cheap (a cycle name turned into a path).

## Gaps / follow-ups
- **Owed to the product owner:** the interactive gate (sprint-1 walkthrough steps 2–3), groomed live from a
  throwaway idea. The scratch end-to-end run covered the scripts, not the conversation.
- The Notion `Priority` column is no longer written. Deleting it is the product owner's call.
- `design-system-rails` and `golden-flags-by-default` have Acceptance sections with no list items. Scaffolding
  either one warns and gives a placeholder story.
- An epic with two seeds funds through the first seed alphabetically. This was answered in review, and no live epic
  is affected.
- Over quote by 30%: four extra review rounds on the mode logic, plus the backfill's breadth (80+ docs).
