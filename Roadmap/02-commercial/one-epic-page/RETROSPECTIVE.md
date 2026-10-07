# One epic page — Retrospective

_Closed: 2026-10-07_
_Intent: (owed — Daniel's one word after the walkthroughs)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$31.17 (−8% vs the quote's top; Claude only, 14 sessions;
codex and agy not measured)_

## What shipped
- **Sprint 1 — One page** (#295, merged `9ea3029`). Every card, Roadmap row, workspace card and ⌘K epic opens
  `/hub/<p>/epic/<e>`; old `?card=` links redirect there with the board's filters carried into Back (only the two
  allow-listed filters can reach the href). The Board's card view and its approved `hub-board-card` surface are gone.
  Chips replace tiles; a seven-step track runs Backlog → Read (Read lit only by a verdict on a shipped epic); the Now
  panel shows one plain-line command, the rest and the shorthand under More. Seeds get a page.
- **Sprint 2 — Why, progress, flag and spend** (#297, merged `9b83399`; kit + plugin 0.34.0). "Why we're building
  this" through `epicResult`; one SVG bar per sprint; the epic's flag read from **this project's registry only** with
  "Open in Ship"; spend against the quote band with a FinOps link to its row. `flag_key`/`flag_note` now travel seed →
  scaffold → contract → extract → push.
- Both live and checked signed out on the public demo; the paste-into-an-agent trial is recorded in #295.

## What went well
- **The lock disproved scope on live data before a line was written**: one roadmap tenant, zero flags in it, no project
  name column, a seed sketch the design gate cannot express. Each became a stated correction, not a surprise in QA —
  and the first one surfaced the product owner's bigger ask (one project, built in the open), decided the same day.
- **The agent trial earned its place.** One of eight plain lines ("Resume building the … epic") was read as a different
  step; reading the sentences was not enough to know.
- **Fresh reviewers found what green suites could not**: a seed's "No target yet" that only appeared when the fixture
  had no goal (9 of 13 real seeds have one), and a tenancy spec whose "not found" key existed in no project at all —
  so a cross-project read would have stayed green.

## What we learned
- **A "not found" spec proves tenancy only if the key exists next door.** The fixture now names a key that only a
  sibling project the viewer also owns holds; dropping the registry's project filter turns it red. (→ LEARNINGS)
- **Paste the plain line into an agent; don't infer the mapping.** A verb inside a phrase ("Resume building") can pull
  the agent to a different shorthand than the line's first word. (→ LEARNINGS)
- **A fixture with the field absent hides the branch that keys off it.** Same family as "a fixture with ONE of
  something": the seed spec passed because the fixture seed had no goal. (sharpened in LEARNINGS)
- Two prettier configs (root and `skills/`) must both accept a file the parity check needs byte-identical — format
  with the root's, then check it under `skills/`.

## Gaps / follow-ups
- **`one-product-project`** (seed, high risk, groomed next by Daniel's call): consolidate `golden-beans` +
  `golden-beans-demo` into one public `golden-frijoles` project. Until then every flag line on prod says "not found"
  and S2 smoke step 2 cannot pass.
- **Owed to Daniel:** the signed-in walkthroughs of both sprints; the `_Intent_` word; approving a picture of the new
  page for the design gate (D5 — the seed sketch's kinds are not in `surface.map.json`).
- SESSION-KICKOFFS has no row for a fixed-scope build, so "Build <seed> in <p>, fixed scope" reads as Build epic.
- Not done here: mobile layout was not looked at in a browser (the window would not resize); the `unreadable` flag
  branch has no spec.
