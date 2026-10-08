# Coaches v2: a cold read first, then coaches that read each other, save as they go and leave one-pagers — Retrospective

_Closed: 2026-10-08_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$24.61 (−28% vs the quote's top)_

## What shipped
- **S1 · Cold read and compare** (#314, `d266917`, 0.41.0). The `cold-read` skill and `gf-kit cold-read`: one brief
  file (`cold-read.prompt.md`) with the exclusion list and eleven mandatory sections; `run` on Codex in the project
  root, exit 3 to the same-family route; `seal` refuses an unfinished read and never replaces a seal; `compare
  --expect <hash>` checks the hash the maker was shown, says UNVERIFIED without it, and lists coach-written sections as
  facilitator-authored.
- **S2 · Shared coach behaviours** (#315, `5dfc455`, 0.42.0). `groom/references/coaching.md`, read by all three
  coaches: play-back, `Step N of X` (8 · 7 · 6, pinned to the counted steps), save after every step, options with
  sources, the options brief and `_Proposed by the coach, not decided yet._`, `(true today)` / `(aspirational)`, the
  ladder-up. `gf-kit strategy-private ensure` keeps `Roadmap/00-strategy/` out of a public (or unreadable) repo and never
  undoes an opt-in. The Strategy gate lists every proposal and offers the compare before Approve removes the markers.
- **S3 · Per-coach fixes and the one-pagers** (#316, `188edf7`, 0.43.0). Distil-and-test, one person before the
  problem, a scenario table inside the North Star's Step 4, the risk coach reading the North Star. `gf-kit one-pagers`:
  canvas, value proposition sheet and persona poster, derived from the files, labelled per line, one A4 page in print.
  Brands only on the Sources lines; the skills' CLI version derived from `packages/cli` (0.3.0 / 0.7.0 → 0.8.0).

## What went well
- **The lock caught the two premises that had died since grooming**: bet A's names never shipped, and `agreed` had
  moved to the Strategy gate. Building on today's names and moving the one-pager trigger to the gate cost nothing.
- **Three worktrees let review run on one sprint while the next was built**, without a reviewer reading files that
  changed under it.
- **Every guard was mutation-checked**, and the one-pager template spec (render the bare template, find no placeholder)
  is what a later reviewer's leak had to get past.

## What we learned
- **A guard on a sidecar file protects nothing against whoever can write the file beside it.** The seal lived next to
  the read, so deleting and resealing passed; only the hash the maker was shown at sealing time closes it. Same shape
  as any "lock file beside the thing it locks".
- **Strip placeholders after you test for them, never before.** `fill()` removed `<…>` first, so `<benefit> (true today
  | aspirational)` survived as a benefit named "(true today | aspirational)". The bare-template spec looked for `<`, so it
  could not see it; the fix also asserts the label hint is gone.
- **A responsive breakpoint applies on paper too.** `@media (max-width:820px)` matched A4 landscape in Chromium print,
  so every "one-pager" printed on two pages; `@media screen and …` fixed it. Nothing on screen showed it, only a PDF.
- **Codex review converged the usual way**: #314 took seven rounds, the first five finding behaviour gaps and the last
  two only guard edges and one doc line. That convergence, not a round count, was the stop signal (as on design-system-rails).

## Gaps / follow-ups
- **Owed to the PO:** interactive walkthroughs: `/golden-frijoles:cold-read` in a real repo, `/golden-frijoles:pmf-narrative`
  (Step 1 of 8, options, a draft after step 3), `/golden-frijoles:north-star` to the scenario table; the one-pagers opened
  and printed in a browser; retire the claude.ai duplicates (`pmf-narrative-facilitator`, `deliberate-risk-validation`);
  the Strategyzer VPC permission ask; `_Intent_`.
- **Residual (D12):** the skills' CLI pin follows `packages/cli`, not npm; a CLI bump merged before its npm publish
  would quote an unpublished version until the publish lands. Today's order (Daniel publishes before merge, #310)
  avoids it.
- **Not verified live:** whether Codex's read-only review sandbox can search the web for a cold read (`codexExecArgs` has
  no `--search`); the brief tells the agent to say so when it can't.
- The coaches are prose: their behaviour is pinned by text specs and the deterministic scripts, not by a model run in
  CI (lock deviation).
