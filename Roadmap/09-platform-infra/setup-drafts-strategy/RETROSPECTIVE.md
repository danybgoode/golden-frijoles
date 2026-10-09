# Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review — Retrospective

_Closed: 2026-10-09_
_Intent: yes_
_Quote vs actual: $15–32 (M, n=18, p25–p75) → ≈$15.50 (at the low end; Claude only, reviewers not measured)_

## What shipped
- **One PR, both sprints** (#336, merge `0428149`; plugin + kit 1.2.0 on npm).
  - `refine/read-product.mjs` reads what the product says and already measures, each fact with its `path:line`.
  - Setup asks the one-sentence question first, then drafts the three strategy files with a source on every line and
    two North Star candidates (`setup/references/draft.md`); the new-idea route offers *Write it now*.
  - The Strategy gate shows the candidates alike, then a first idea whose target the founder gives ("not known yet" is
    an answer). Approve agrees the files and writes the first idea as a seed, grounded when it has a target.
  - The coaches go deeper over an existing draft instead of starting from the template.
- **Target:** `proving_workspaces` 0 → 2 by 2026-12-15, read by hand (an operator count). The automatic reading is
  the raw spike `proving-workspaces-reading`, because a count across workspaces needs Daniel's tenancy decision.

## What went well
- **The verifier tested the instructions, not just the code.** It wrote a seed exactly as Approve's text said and
  ran the board on it: it broke. Prose that an agent will execute is code; run it.
- **Convergence was visible:** round 1 had blocking findings, round 2 should-fixes born in the fixes, round 3 one
  regression of a fix, round 4 clean.

## What we learned
- **A fix to a pattern list can be wider than the bug.** Three of round 2's and 3's findings were my own fixes
  over-reaching: a secret-folder list that swallowed this repo's `/app/keys` routes, a key filter with no word boundary
  that ate `task_completed`, and a comment exemption for JS that broke Python. Each was caught only because the
  verifier re-ran its earlier fixtures against the fix. Re-run the old probes after every pattern change.
- **A reviewer can trip our own secret guard.** Codex quoted a fake key from a test fixture back in its review, and the
  rail withheld the whole review. Fixture secrets are now assembled at runtime.
- **Anchoring lives in the layout too.** Two candidates do nothing if the screen gives one of them the measurement
  plan, the first idea and the target; they are now shown alike, and the idea follows the choice.

## Gaps / follow-ups
- **Owed to Daniel:** the interactive setup walkthrough (sprint 1 step 2, sprint 2 steps 1–4) on a scratch copy of a
  real product repo.
- **The product read is line-based:** HTML comments in `.vue`, `.svelte`, `.astro` and `.html`, trailing comments,
  Python docstrings and Ruby `=begin` blocks are read as code; `capture(user.id, 'event')` with a non-literal id gives
  no name. Each entry cites its file and line, so a person can check.
- **`proving-workspaces-reading`** (raw, high-risk spike) needs Daniel's tenancy decision before any automatic reading.
- **The security lens** still runs on GPT-OSS over one file at a time; this machine is not signed into Antigravity.
