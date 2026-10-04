# Kickoff generators run from anywhere — Retrospective

_Closed: 2026-10-04_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $23–36 (M, n=6, p25–p75) → ≈$11.65 (under; −68% vs the quote's top)_

## What shipped
- **S1: the kit carries the kickoff generators** (#262, `326d08e`, plugin/kit **0.27.0**).
  `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` (and `--list`) and `… emit-kickoff --epic <slug>
  --sprint <N>` print the kickoff from any project root on any host. This was verified against the published 0.27.0
  from a project holding only a `Roadmap/`.
  - One source in `template/scripts/` (the two generators, `lib/kickoff-cli.mjs`, `templates/kickoff.md`).
  - Groom's copies are vendored bytes in `groom/vendor/`, so `/build` runs `groom/vendor/emit-epic-kickoff.mjs`.
  - A packed-tarball spec proves the kit's output is byte-identical to groom's copy.
- **S2: every doc names the kit command, guarded** (#263, `2c1cef7`, **0.27.1**).
  - The nine WAYS-OF-WORKING / SESSION-KICKOFFS docs name `/build <slug>`, or the kit command anywhere else.
  - `scripts/kickoff-doc-paths.test.mjs` goes red on `node skills/groom/` in anything a reader copies from.
  - `check-release` now counts the Roadmap skeleton `gf-kit init` ships (C7).

## What went well
- **The lock caught two premises that would have broken the build** before any code existed:
  - Groom's copies could not live at `groom/emit-*.mjs`, because `writeVendor` empties its directory and the
    `./lib/` imports must resolve, so they live in `groom/vendor/` (C1).
  - `projectRoot()` alone answers `groom/` for the plugin's copy (C2).
- **The tarball spec earned its keep at once.** Dropping the hand-declared `templates/kickoff.md` turned it red,
  while `check-skill-scripts` stayed green: an import-closure check cannot see a file that is read, not imported.
- **Releasing in S1 removed the doc window.** The seed worried the docs would name a kit version npm didn't have yet.
  Bumping in S1 meant 0.27.0 was live before any process doc pointed at it.

## What we learned
- **A release guard has to know everything the package ships, not only its code.** The skeleton `gf-kit init`
  writes was outside `check-release`'s shipped surface, so a WAYS-OF-WORKING edit could merge without a release.
  This was found while asking "does S2 need a bump?". check-release said no, and the honest answer was yes.
- **A prose budget is a gate, and a local replay must include it.** S1's self-QA replayed the Scaffolder smoke but
  not the step holding groom's 210-line budget. Three lines of rewording turned skills-ci red.
- **The external review layer can go fully dark on one day.** Codex was capped and agy was out of quota on two
  models. vibe passed the general prompt on #263 but stopped between turns 3× on the security prompt for #262, even
  scoped to 13 files. Daniel chose to merge with the lens DARK, recorded in the PR. The fresh reviewer was the layer
  that found the real defects (the prose budget, the over-wide exemption). agy's general pass filed a hallucinated
  Blocking finding again.

## Gaps / follow-ups
- **Owed to Daniel:** S2 smoke step 5. After `/plugin` update and `/reload-plugins`, `/build cli-think-skills-followups`
  fills the prompt from `groom/vendor/`. `claude plugin test` covers it 7/7, but an interactive run is the real
  check.
- **Owed to Daniel:** this retro's `_Intent:_` answer.
- **The security lens on #262 never ran.** If vibe's failure on the security prompt recurs, it needs diagnosing with a
  `!` probe.
- The Hub board's dropped "Regenerate the kickoff" command (the original #226 finding) can now name the kit command.
  It was not in scope, and it isn't seeded yet.
