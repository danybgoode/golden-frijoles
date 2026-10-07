# One header and one name per thing — Retrospective

_Closed: 2026-10-07_
_Intent: (owed — Daniel's one word after the walkthroughs)_
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$19.61 (−42% vs the quote's top; Claude only, reviewers not measured)_

## What shipped
- **Sprint 1 · One header**: PR #287, merge `850c98a`. The header reads **Today · Plan · Ship · Measure · Setup**.
  Roadmap, Board and Horizon are Plan's rail, and the Outcome report joins Measure. Every Hub page renders in the
  console shell: `HubFrame`, its "Back to the console", `Frame`'s `hub` variant and their CSS are gone, and no URL
  changed. A viewer who gets no rail (anonymous on the demo Hub, or a signed-in non-member) gets the Hub's four pages
  as a fallback row. The switcher offers **Board across all products** beside Portfolio. DD2's reversal is recorded.
- **Sprint 2 · One name per thing, and ⌘K**: PR #288, merge `e99019f`. ⌘K finds **epics** (the active project's,
  from a membership-gated `epic-index` route) and **products** (the switcher's own list). Decision 2's names come
  from one label module, `lib/screen-words.ts`. The board shows Backlog and Ready while every stored key stays.
  `RETIRED_SCREEN_WORDS` and a source scan keep the old names gone. `Roadmap/README.md` uses the same words and the
  Golden Frijoles title.
- Both sprints were deployed and checked live on production, signed out: the demo Hub's fallback row, board labels
  over unchanged `data-stage` keys, the Outcome report title, Horizon's "destinations", and the epic index
  redirecting an anonymous caller.

## What went well
- **The lock found the two traps before any code.**
  - The Hub's demo is anonymously readable, so deleting `HubFrame` naively would have stranded visitors with no
    tabs (D4).
  - Stage names are data keys, so the rename had to happen at display (D8).
  - Both held through review.
- **The fresh reviewer earned its place twice.**
  - In S1, the workspace board's shell could fall back to a project in *another* workspace when this one named
    none.
  - The no-rail fallback was tested only in the browser project, which CI never runs.
  - Both were fixed with CI-gated specs before merge.
- **Mutation checks were run, and one was caught lying.** The first "Pod report" mutation edited nothing, because
  prettier had reflowed the line, and the guard stayed green. Grepping the mutated file before trusting the result
  turned it into a real check.

## What we learned
- **`prettier --write` over a glob or over `git diff --name-only` reformats files you never meant to touch.**
  - Twice in S2 it pulled 22 unrelated e2e specs into the diff. The second time it re-formatted the very files that
    had just been restored, because a restore makes them "changed".
  - That pushed the PR past agy's input budget, so the first general pass returned nothing.
  - Format only the files you edited, by name.
- **A source-scanning word guard has a shape, and its blind spots should be pinned as tests.** Runtime-assembled
  text, attribute strings and template literals pass a regex over source. Recording each miss as an asserted null
  makes widening the rule a decision someone can see, instead of a gap someone discovers.
- **A fallback that only one viewer class sees needs a test in the blocking gate for each class.** "The browser
  suite covers it" meant "nothing that runs on a PR covers it".

## Gaps / follow-ups
- **Owed to Daniel:**
  - Both sprints' signed-in walkthroughs on production (sprint-1 steps 1–5, sprint-2 steps 1–6). Preview can't serve
    a signed-in page.
  - The retro's `_Intent_` word.
- **Owed to Daniel (D10):** re-approve `design-system/surfaces/hub-board*.surface` and `hub-roadmap-areas.surface`
  with the new words. Their text still reads "To groom … Ready to build". The gate measures structure, not words, so
  this doesn't block anything.
- **Follow-up list for Daniel: nouns outside decision 2's list that still say the old thing on renamed pages.**
  - "+ New destination", "No destinations yet" and "Create the destination" on Webhooks.
  - "+ New experiment" on A/B tests.
  - The Flag history page's h1, "History".
  - The flags page's per-environment "On in <env>" tile, deliberately kept.
- **Known guard limits** are recorded in `vocabulary.ts` (D9) and pinned as self-tests.
- Not measured: codex was capped (agy ran the general passes), and reviewer spend isn't in the actual.
