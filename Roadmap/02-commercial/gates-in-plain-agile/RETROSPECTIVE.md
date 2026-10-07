# Gates in plain agile — Retrospective

_Closed: 2026-10-07_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$14.63 (−57% vs the quote's top)_

## What shipped
- **S1 · The Plan and Build gates** (#302, merge `a4a4118`, plugin + kit 0.35.0). Groom's new `references/gates.md` is
  the one home of every gate: the shape (read it · decided for you · two or three decisions · numbered options), the
  screen-word table and the Was | Now table. The Plan gate says "We bet that …", then Moves · Target · Read date · Size ·
  Sprints · Flag · Measured by, then **Approve the plan · Park it · Change something** and "What this pushes back".
  Park it is the old "approve, don't fund", with the same behaviour. The Build gate says what was created, gives
  `/build <slug>`, and lists only the optional setup that is missing. `strategy.mjs` now prints a North Star input's
  event, so "Measured by" is never invented.
- **S2 · The Strategy gate, and the words** (#303, merge `d409acf`, 0.36.0). Setup's idea path writes the three
  strategy files, then shows one Strategy gate: **Approve the strategy · Change something · Coach me through it**.
  Approve sets `status: agreed`, and the coaches no longer ask anyone to mark a file agreed. `check-gate-words.mjs`
  runs in both CIs and reads its lists from gates.md. It fails when a gate block shows a bookkeeping word, when any
  copy names a retired option, or when one gate is worded two ways.
- Records unchanged: `fund.mjs`, `scaffold-epic.mjs`, every key and value, folders, script names. No product change.

## What went well
- **Reading the design source before locking.** The private canvas held the three gates verbatim. Reading it turned
  "render the canvas PlanGate" into exact lines, and showed where the canvas promised things the system doesn't do: a
  flag created at grooming, an email digest, one-pagers, `Roadmap/strategy/`. Each was corrected in the lock, not found
  at review.
- **The prose budget forced the right shape.** Groom `SKILL.md` was at exactly 210 lines, so the gates could only live in
  a reference. That is what D1 wanted anyway: one home, pointers everywhere else.
- **Fixture walks in a scratch repo** exercised the real `fund.mjs`/`scaffold-epic.mjs` path behind Park it and Approve.
  That caught nothing wrong in behaviour, which is the claim the epic had to keep.

## What we learned
- **A gate's text is an interface: review it the way you'd review an API.** Four review rounds on #302 found real
  ambiguities, not style: the flag's on/off was hard-coded (false for a kill switch), "not installed" was shown for a
  signed-out gh, a block with no "nothing missing" variant, and decisions and options both numbered (a reply of "1"
  meant two things).
- **A guard that blanks placeholders must not blank alternatives.** `<on | off>` is literal screen text; only a
  `<placeholder>` is not. The first version of the check passed `Fund it first` inside an alternative.
- **Write the lock's claims about copies as facts, not counts.** "The three SESSION-KICKOFFS copies change" drew the
  same false finding twice, because the root copy names no option at all. "The copies that name the options" would
  not have.

## Gaps / follow-ups
- **Owed to Daniel:** both sprints' interactive walkthroughs, in a scratch repo with the plugin installed from `main`
  (setup → Strategy gate → Plan gate → Build gate), and this retro's `_Intent_` answer.
- **Accepted residual:** setup and the coaches point to groom's `references/gates.md`. In Cowork, where each skill
  installs from its own `.skill` archive, a coach installed without groom can't read it. The coaches already depended
  on groom (its `strategy.mjs` reads their templates; they hand off to it).
- **Not in scope, still worded the old way:** the L-bet re-bet question ("fund the next wave of …? what does it
  displace?") in WAYS-OF-WORKING and the epic kickoff; the root `Roadmap/SESSION-KICKOFFS.md` shaped-bet row, which
  predates fund-at-approval.
