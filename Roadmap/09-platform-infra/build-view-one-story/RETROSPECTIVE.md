# The build view tells one story — Retrospective

_Closed: 2026-10-17_
_Intent: owed to Daniel (yes | mostly | no)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: quote $15–34 (M, n=24, p25–p75) → not measured (—)_
<!-- `epic-actuals --write` stamped ≈$1.70 and was reverted: see "What we learned". -->
_Crew (actual): claude-opus-5-5 built and orchestrated (≈$ not measured) · reviewers codex gpt-5.6-terra (general, 2
rounds), agy gpt-oss-120b-medium (security, scoped to the hook files, 3 runs: one out of context, then a finding round
and a clean one), the fresh verifier (2 rounds) · prose Claude — as planned. No builders were fanned out: the three
hot files are one renderer._

## What shipped
One sprint, one PR: **#396** (merge `9b78a7e`), plugin + kit **1.11.0** (tag, npm, mirror), production deploy success.
- **S1.1** One renderer for the whole view (`44ce141`). The header has the repo, the state symbol, the sprint, the
  title, the size and `▲ risk`, with the stories bar right-aligned at column 100, or on its own line before a title is
  cut down to a stub. Then the track, then the link. The glyphs and every bar now live in the resolver, so the CLI text
  reads like the band. The band only colours them, and clips the title, never the bar.
- **S1.2** `disagreement()` (`da73e0a`, `cc0499f`, and the review fix). A shipped epic reads ✓, N of N and
  `shipped <day> · verdict due <day>`. Evidence lifts a docs-only board. An unknown stage reads `◌`.
- **S1.3** Why and Target: the target, else `none yet: <grounded_reason>`, then the intent match (`ebaedb2`).
- **S1.4** Now: the story, between stories (a clean tree), or the refining words. It never says "session journal"
  (`e3d7a8b`, `780e1b0`).
- **S1.5** The Spend bar in the approved words. Around replaces Worktree/Open/Also/Board. Next appears when nothing is
  in flight (`6e20641`).
- **S1.6** The 5-hour meter, to the minute: `resets 9:20 pm (in 1h 29m)` where it used to say `(-1h)` (`a5a558a`, plus
  a floor fix).
- **S1.7** Every colour is pinned in the mod spec, golden lines pin each design state, and a spec fails on any wide or
  emoji glyph (`01001ae`).

## What went well
- **The approved design was the spec.** Golden `renderLines` lines were rendered from resolver-shaped states, then read
  against the seed's drawings before being pinned. Only one difference turned up, and it was the design's: a stray
  sixth cell in a five-story bar.
- **Dogfooding the view on its own branch found two real bugs before any reviewer did.** The track said Ready over
  seven story commits. Now said S1.7 was in flight after every story had a commit.
- **The verifier earned its keep.** It reproduced the `⚑` line contradicting the track on this very branch. It found
  an unreachable PR→QA lift that could only ever disagree with the board, and two mutants no spec could kill. The fix
  for the lift was deleting it.
- Codex found the one cross-family bug: the Ready symbol drawn over "stage unknown".

## What we learned
- **A session's checkout can be moved under it by another session, and two things follow.**
  - At about 13:48 another session switched the shared checkout to `main` and pulled. The lock commit, made a moment
    later, landed on that session's local branch, and its push failed. Recovery was a worktree plus a cherry-pick of the
    dangling commit.
  - FinOps attributes spend by the session checkout's branch, so `epic-actuals` stamped **≈$1.70** for the whole epic,
    the first two minutes. A wrong actual feeds every future quote, so it was reverted to "not measured". Take your own
    worktree **before** the first commit whenever the checkout might be shared, and treat an actual far below the
    quote as an attribution failure until shown otherwise.
- **To render the NEW code against another branch, run a copy of it from outside the tree.** `git switch` swaps the
  script under you: two smoke attempts "showed" main's old view this way. The fix was a copy of `hooks/vendor/` in the
  scratchpad, run with `--repo-root`.
- **A per-story commit rule meets one-function work.** The renderer served five stories, so the code went into S1.1
  and each later story's commit pinned its rule with specs. The intermediate versions were built straight into the
  index (`hash-object` + `update-index`), and the first one was verified in isolation.
- **"Disagreement" must compare what the view draws, not what it stores.** One field (the board stage) fed the
  sentence while another (the lifted stage) fed the track. Any check that explains the screen should read the
  screen's own value.

## Gaps / follow-ups
- **Owed to Daniel, interactive:** smoke steps 4–6, and seeing steps 1–3 drawn in colour in the band. Step 5 is the
  only check that the reset reads in local time: the live probe was refused twice in the build session.
- **Owed to Daniel:** the `_Intent:_` word above.
- **Known limitation, accepted:** a title carrying an emoji shifts its header one column per emoji.
- **Smaller limitations, also accepted:** a repo folder name with a space draws the header as a dim note, and under
  about 50 columns the header's truncation can reach the risk.
