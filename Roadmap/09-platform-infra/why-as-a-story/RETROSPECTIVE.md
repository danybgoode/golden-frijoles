# The Why reads as a story, in full, and the plan names its crew — Retrospective

_Closed: 2026-10-10_
_Intent: PENDING_
_Quote vs actual: $15–32 (M, n=20, p25–p75) → ≈$9.72 (under the quote's bottom by about a third; Claude only, reviewers
not measured. Two verifier rounds.)_
_Crew (actual): claude-opus-5-5 ≈$8.90 · claude-sonnet-5-5 ≈$0.83 · reviewers: the fresh verifier (two rounds), agy
GPT-OSS (four scoped passes; Codex capped) · prose: Codex, after the prose rail's guard rejected Devin's and agy's
drafts; release notes by the orchestrator — Sonnet built four of seven stories as planned; the Devin plan did not hold._

## What shipped
- **One PR, both sprints** (#343, merge `d70de64`; plugin + kit 1.6.0 on npm, live on production).
  - **The Why as a story.** Refine drafts a feature's Why from the strategy already written (the persona, the value
    proposition, the business model): what is wrong today and for whom, what changes, why it matters, how we will
    know. A worked before and after shows the difference.
  - **The Why guard.** `why-check` (kit) and scaffolding refuse a Why that will not show in full or reads as code. It
    shares one wrap with the build view, so passing means showing in full. Brand names such as iPhone and Next.js stay
    prose.
  - **The Why in full.** The build view wraps the whole Why, up to five lines, never cut mid-sentence.
  - **The story question.** Intent match asks Jev, advisory and outside the total, whether the Why reads as a story.
  - **The crew.** The Plan gate shows who is planned to plan, build, review and write; the kickoff's dispatch rule
    sends well-specified stories to a Sonnet-class builder and takes one back after a failed attempt; the
    retrospective stamps who actually worked (`actual_models`).
  - **The checkpoint shape** is a written reference (`refine/references/checkpoint.md`).

## What went well
- **The dispatch rule was used to build itself.** Sonnet builders did S1.1, S2.1's docs, S2.2 and S2.3 in their own
  worktrees for ≈$0.83; every result was re-derived before it was taken, and two needed a follow-up (a word list that
  did not match the guard; an edit to a generated file instead of its source).
- **Under the quote**, with both review rounds spent on real defects.
- **The view and the guard share one function**, so the promise "passes means shows in full" is a property of the code,
  not of two numbers kept in step.

## What we learned
- **A limit stated at a gate needs its arithmetic checked before the gate.** The Plan gate promised four lines for 320
  characters; at the view's 69 columns, 273 already need five. The fix was to make the limit the view's own wrap.
- **A guard for plain words must be tested on plain words.** The first patterns refused iPhone, eBay, Next.js and
  "reader/writer/editor"; round 1 found it by running a prose corpus, not by reading the regex.
- **agy on GPT-OSS reported the same false "duplicate declaration" finding in three of four passes**: it is handed the
  diff and the whole changed file and reads new lines twice. And the prose rail's guard let a draft claim a flag "off
  until flipped" on an epic with no flag. Both tools need the fix, not the reviewer's patience.
- **Delegation needs a source map.** The builder edited `WAYS-OF-WORKING.md`, which is rendered from `fill-ins.yml`;
  a builder brief should name each file's source when it has one.

## Gaps / follow-ups
- **Accepted limits:** width is counted in characters, not terminal columns, so CJK or emoji text can overflow;
  unrooted multi-segment paths and all-lowercase dotted names pass the guard on purpose.
- **The cross-review tool:** stop attaching whole files beside the diff for GPT-OSS, or mark the diff's lines inside
  them, so it stops inventing duplicates.
- **Owed to the product owner:** the refine walkthrough on a new idea (the Why drafted as a story, the guard, the build
  view showing it in full) and a Plan gate with the Crew block.
