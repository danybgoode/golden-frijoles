# A golden welcome and recovery pages — Retrospective

_Closed: 2026-10-14_
_Intent: yes_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $15–32 (M, n=20, p25–p75) → not measured (no Claude session on this machine covers the branch, so
`epic-actuals` wrote nothing)_

## What shipped
- **One PR for both sprints** (#340, merge `f0cadd1`, 2026-10-10; CLI 1.2.0 and plugin + kit 1.4.0 on npm).
  - **S1.1, the terminal welcome** (`5a353d0`): interactive `frijoles setup` shows a green bean ripening to gold, then a
    gold sweep that reveals FRIJOLES before the first question. `FRIJOLES_NO_MOTION=1` shows a still mark. JSON,
    `--yes`, non-TTY, CI and narrow or dumb terminals get no animation escapes.
  - **S2.1, recovery pages** (`1d6ab59`): a branded 404 with a way home, a route error page and a root error page with a
    retry, and no error detail. Shared-link failures stay generic, and API and auth statuses are unchanged.

## What went well
- **Each new spec was first run against the live page before the change and failed there.** That is the proof a
  recovery spec can fail.
- **Checked live on 2026-10-14:** an unknown page answers HTTP 404 with the branded copy for desktop and mobile user
  agents, and a bad share link still answers 404 with the generic "Whoever shared it can make you a new one".

## What we learned
- Nothing new for LEARNINGS. The PR's own note stands: when one external reviewer has to run both the general and the
  security prompt, family independence is short, and the fresh verifier is the separate check.

## Gaps / follow-ups
- **Owed to Daniel:** the interactive setup reveal in a real terminal (sprint-1 steps 1–2, scriptable by an agent with a
  pseudo-terminal). ~~The `_Intent_` word~~: answered yes on 2026-10-14.
- The 500 page can't be checked in production without a route that throws, which would ship a crash on purpose. It was
  checked on a production build with a temporary route that was removed before the merge.
- **Not measured:** the actual cost. The build ran outside this machine's Claude transcripts.
