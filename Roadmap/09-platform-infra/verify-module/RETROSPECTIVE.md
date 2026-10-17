# Verify module — Retrospective

_Closed: 2026-10-17_
_Intent: yes_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $15–34 (M, n=24, p25–p75) → ≈$30.38 (−11% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$30.38 (architect built both sprints, D12) · reviewers: Codex gpt-5.6-luna xhigh (#386, two rounds; capped before #387), agy gemini-3.8-flash-high (#387 general, the Codex fallback), agy gpt-oss-120b-medium (security lens, both PRs), the fresh `verifier` (two rounds on #386, three on #387) · prose: the retro draft came from the prose rail (Devin) and was rewritten from the record — it said Sprint 2 had not started — differed from the plan only in Codex capping mid-epic_

## What shipped

**Sprint 1 — Per PR** (#386, merge `77c5dcc`, 2026-10-17). The spike's Quint, Lean, differential-test and Jev-triage
tooling moved to `verify/`, and the outbox model became the shipped code: #373's stale-reclaim charge is the model's
`FIX_STALE_COUNT`, and the pre-fix code survives as `outbox_timed_prefix`, which only the nightly runs as a teeth row.
`verify/pins.json` + `scripts/verify-pins.mjs` (static gate) pin 6 SQL functions and 6 TS declarations for the outbox
and 11 evaluator declarations in `packages/sdk/src/flags.ts`, normalised so comments don't count. `verify-outbox` (Quint
simulation, 14 rows, plus a mutant it must catch) and `verify-flags` (Lean build, all 10 theorems on the standard axioms,
the differential test on 3 seeds, the whitespace mutant) run only when `scripts/ci-changes.mjs` says their paths
changed; `ci-gate.mjs --filtered` accepts their skip only on that say-so.

**Sprint 2 — Nightly and shadow** (#387, merge `b761885`, 2026-10-17). `verify-nightly.yml` (schedule + dispatch,
never a PR) runs the exhaustive table and `scripts/verify-nightly.mjs` files each violated invariant as one
`claude/verify-<invariant>` PR (a raw seed plus every trace), updates it on a repeat, files nothing once the seed is on
`main`, and goes red (with a ping) when the check itself breaks. The same run asks Jev the spike's verify-depth question
for every newly merged PR and logs it beside the builder's `Verify depth:` template line on `claude/verify-jev-shadow`;
at 30 labelled PRs it pings once and adds an owed line here. First real log: #386 and #387, builder `light`, Jev `deep`.

## What went well

- **The lock earned its keep.** Reading live code disproved two premises before a line was built: the evaluator is the
  SDK file, not `apps/web/lib/flags.ts`, and the outbox model mirrors ten functions, not two. Re-measuring the model on
  the shipped fix changed the expected table (the exhaustion witness is now reached by simulation).
- **Every guard was mutation-checked, and twice that changed the guard.** The first outbox teeth mutant (settle's budget
  check removed) was *not* caught in 25 random steps, so it proved nothing and was replaced; the axioms check's
  "exactly three axioms" would have failed on a real lemma that needs two.
- **Smoke ran end to end on GitHub**, both sprints: skips, a run, a drift failure naming `claim_deliveries`,
  a seeded violation filed once and updated once, the shadow log written with no comment on the merged PRs.

## What we learned

- **A guard has a vacuous state, and a reviewer will find it.** Codex's Blocking on #386 was an emptied `targets`
  passing green; the verifier's on #387 was a merged finding re-filed every night because merged branches survive here.
  Both were "what does this do when the thing it guards is absent or already done", and both were fixed as a class
  (required groups; on-main checked first).
- **A pure function with teeth is not a call site with teeth.** The first S2 suite tested `decidePing` and friends
  while the lines that used them (the exit code, the shadow's force push, the marker-after-delivery rule) could be
  deleted with every test green. Pulling each decision into a named function AND pinning its call site closed it.
- **A silent fallback changes who reviewed.** Codex capped mid-epic and the rail fell back to agy-gemini, whose two
  Blocking findings on #387 were both false (action versions that exist; a GHA idiom that works). The comment header
  named the model, which is the only reason it was caught.

## Gaps / follow-ups
<!-- Smoke gaps owed to the product owner, deferred slices, known limitations. -->
- ~~**Owed to the product owner (Daniel):** decide when the open shadow PR merges.~~ Done 2026-10-17: Daniel said merge it; the rows landed via #394 (rebuilt on main), and #392 was closed. A shadow PR is data with no decision in it; merge it whenever it's green.
- The exhaustive nightly takes **84 min** on a GitHub runner (39 of them for `sendsBounded` to depth 14), inside its
  150-minute timeout but with less headroom than the spike's ~50 min local estimate suggested. If a model change
  deepens it, the depth-14 row is the one to split out or move to a weekly run.
- PR caches are written under PR refs, so every new verify PR starts cold (37 s Lean, about 2 min Quint). Accepted.
- A rebase merge would give Jev only the last commit's diff for that PR's shadow row (`allow_rebase_merge` is on;
  this repo uses merge and squash). Accepted for a shadow measurement.
