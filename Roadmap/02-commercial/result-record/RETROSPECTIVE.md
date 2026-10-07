# The result record — Retrospective

_Closed: 2026-10-07_
_Intent: (owed — Daniel's one word after the walkthroughs)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$42.44 (+25% vs the quote's top: S1–S2 ≈$26.78 inside it; S3 was added after the close by Daniel's amendment; Claude only, reviewers not measured)_

## What shipped
- **Sprint 1 · The target, set at grooming:** PR #290, merge `d33772b`, plugin + kit 0.31.0.
  - Every epic can carry `hypothesis`, `target_metric`, `target_from`, `target_to` and `read_date`, plus the verdict
    fields `verdict`, `verdict_actual`, `verdict_evidence` and `verdict_at`.
  - The contract validates them. A target is metric, from and to together; dates are real days. Proven or disproven
    needs a number and a pointer: an `https://` link, `north-star:<input>@day` or `ab:<experiment>`.
  - Groom's Stage 1.5 asks once, offering the North Star input keys `strategy.mjs` prints on its `Target:` line.
  - `scaffold-epic` copies the target from the seed into the README.
  - The extract derives the default read date (shipped + 30, only for an epic with a target) and the late mark
    (more than 90 days after shipping). The day rule lives in `lib/result-dates.mjs`.
  - The push schema declares the fields as nullish, and `lib/roadmap-result.ts` is the Hub's single reader of them.
- **Sprint 2 · The read:** PR #291, merge `30743f2`, plugin + kit 0.32.0.
  - `epic-read.mjs` drafts the verdict and writes it only with `--write`, which is the owner's approval. It re-runs
    the contract on what it writes, marks late reads, and accepts an owner verdict on an epic with no target. It ships
    in the kit.
  - `session-resume` leads with one `[read-due]` line per due read.
  - Today lists due reads under *Waiting on you*. They are derived from the pushed roadmap, not tasks.
  - The **Bean** was built here to night-garden S2.1's spec (Daniel's call). It shows on shipped board cards with a
    target, next to its word and `from → actual (target)`.
- **Sprint 3 · The agent fetches the number:** PR #293, merge `08316f0`, kit + plugin 0.33.0, CLI 0.6.0 (publish owed).
  Added after the close at Daniel's word: fetching the number is the value proposition, and the CLI is the agent's
  surface.
  - Two member-gated reads, `GET /api/v1/cli/north-star/readings` and `/api/v1/cli/experiments/decision` (the second on
    the existing governance gate), `gf north-star readings` / `gf experiments decision`, and two connector tools.
  - `epic-read` fetches through `gf` and drafts with the pointer filled in; the owner only approves. The owner's own
    flags still win, and every failure falls back with its reason.
  - Found on the way: the telemetry series read stopped at PostgREST's 1,000-row cap with no order; it now pages in
    order and refuses past a bound rather than return a partial series (this also fixes the North Star page).
  - Verified end to end on production: the published kit fetched a real reading, drafted Proven and stamped it.
- All three sprints are deployed to production and checked there:
  - Both production roadmap pushes were accepted with the new fields.
  - The published kit runs `epic-read`.
  - The board returns 200 signed out.
  - The interactive walkthroughs are owed to Daniel (see the sprint files).

## What went well
- **The lock disproved two premises before any code was written.**
  - "Epic 1's Bean" didn't exist: night-garden was unbuilt. One question to Daniel got the answer "build it here".
  - "`gf` fetches the evidence" was false: no route reads North Star values or A/B decisions, and a new API is a
    no-go. So `epic-read` takes the actual from the owner, and the lock says so.
- **The live data shaped a rule.** 54 shipped epics already have a `shipped_at`. Defaulting a read date for all of
  them would have produced 54 "read due" lines on day one, which is the backfill the no-gos forbid. So a derived
  date applies only to an epic with a target.
- **Mutation checks caught a guard that couldn't fail.** The card bean's `decorative` prop survived its first
  mutation, so the spec now asserts `aria-hidden`. A protocol/host check after `new URL()` was dead code; it was
  removed rather than left looking protective.

## What we learned
- **A zero-dependency file must stay zero-dependency, even for a sibling import.** `roadmap-contract.mjs` importing
  `result-dates.mjs` broke every consumer that copies the contract alone (the pre-commit fixture, copy-once
  projects). The fix inverted the import: `isDay` lives in the contract, and the dates module imports it.
- **Review rounds converged, and the last one was cheap.** On #290, codex found real product edges in rounds 1–3:
  impossible days, `Number(' ')`, `https:///` and then `HTTPS:///`, and a partial target. Round 4 found only a doc
  line. The fresh reviewer found the deepest issue: a half-written target that never comes due.
- **A reviewer that repeats a false positive is best answered with a spec, not a second comment.** Codex twice read
  `decideReadsDue` as never seeing the derived date. A spec that builds the row through the extract's own
  `resultFields` settled it.
- **Prettier's changed-files gate checks *new* files, and a new file can slip past a local run that only checks
  modified files.** `result-dates.mjs` and a test file each turned CI red once.

- **The no-go that cost a sprint.** "No new API" was written at grooming and the lock treated it as fixed, so S1–S2
  shipped with the owner typing the actual — the opposite of the value proposition. When a lock finds that a no-go
  blocks the feature's core claim, put it to the product owner as a question, not a scope correction.

## Gaps / follow-ups
- **Owed to Daniel:** sprint 1's grooming walkthrough (steps 1–2) and sprint 2's end-to-end read (ship a tiny epic
  with today's read date → session line → Today → `epic-read` → approve → push → bean). Then the `_Intent_` word.
- **CLI 0.6.0 npm publish** (Daniel's 2FA) — the fetch needs it on strangers' machines.
- Today's "Read due" line could show the drafted verdict (fetched) — not built.
- **night-garden S2.1** now re-skins the existing Bean and adds the specimen (the note is in its README).
- The visual gate has no fixture epic with a target, so no route renders a bean in CI; the render spec covers the
  markup. A fixture with one would close that.
- The bad-verdict 400 was not exercised against production; the schema spec covers it.
- The retro was written by the architect, not the prose writer (Devin), to keep the close in one session.
