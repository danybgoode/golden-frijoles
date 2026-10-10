# One bet, wired: the flag knows its epic, its funnel and its read — Retrospective

_Closed: 2026-10-10_
_Intent: yes_
_Quote vs actual: $56–79 (L, n=5, p25–p75) → ≈$42.87 (under the quote's bottom by about a quarter; Claude only,
reviewers not measured. Three verifier rounds.)_

## What shipped
- **One PR, both sprints** (#341, merge `9f5c816`; CLI 1.3.0, plugin + kit 1.5.0 on npm).
  - **The TARS model the product owner validated** (`lib/flag-funnel.ts`, pure): active users → Targeted (the bet's
    segment; `everyone` until `tars-segments`) → got the flag on → Adopted (at or after first exposure) → Retained
    (within the window) → Satisfied (optional, else "not measured"). Adopters without exposure are counted beside the
    funnel, never in its rates.
  - **The read** (`lib/flag-funnel-read.ts`, `getFlagFunnel`): three bounded reads (exposures all-time through the
    feature index; only the bet's own events; a people-only base), cached 5 minutes per project and bet. The person
    is a `user` subject, else the event's user. A capped read says which numbers it skews and which way.
  - **Where it shows:** the epic page and Journeys, decided by one tested rule (`funnelBetOf`), behind the kill switch
    `bets.flag_funnels_enabled` (on in all three environments).
  - **The bet travels:** `target_segment`, `adopted_event`, `retained_event`, `retention_days`, `satisfied_event` from
    the seed through the scaffold, the roadmap contract and the push to the board card.
  - **`frijoles bet sync <README>`** creates the bet's Measure flag (enablement, off until rolled out), leaving an
    existing one alone.
  - **Refine's Stage 6b is "Flags: Measure, then Safety"**: Measure suggested for every Feature epic; the app must
    report each evaluation with the person's id; sign-in suggested there, once per project (kit setting
    `measure.signIn`), with Later always offered; yes to both is one flag.

## What went well
- **The model came from the conversation, not the code.** Walking TARS through with the product owner (Targeted is a
  strategy segment, not exposure) set the funnel's shape before a line was written; no review round questioned it.
- **Under the quote**, with the review budget spent where it found real defects.

## What we learned
- **Review round 1 found the core value did not work as documented.** Every unit test passed, yet a founder following
  refine's guidance would have seen an empty funnel forever: nothing told the app to report evaluations, and the read
  keyed exposures on the server's own user. A feature that reads data another party must send needs one test that
  sends it the way that party will, written from the instructions, not from the read.
- **A fix created the next blocker.** Round 2's blocker (`measure` not a config section, so "ask once" could never be
  saved) came from round 1's fix; nothing tied a registry key to the sections `config set` accepts. A new guard now
  does. Same lesson as before: a fix deserves the suspicion of the code it replaced.
- **"Once per project" is state.** Instructions that say "ask once" need a named place to keep the answer, decided at
  the lock, not discovered in review.

## Gaps / follow-ups
- **The epic does not measure itself.** Nothing emits an adoption event for viewing a funnel, so it stays funded, not
  grounded, and its own read waits.
- **No rendered gate-on/off spec**: it needs an authed-fixture epic with an `adopted_event`.
- **`tars-segments`** (raw seed): named segments, the older TAR funnels moved to this model, Satisfied.
- **`skills/scripts/lib/config.mjs`** (the plugin repo's own copy) lags the shipped one (no `lint`, no `measure`);
  pre-existing, not shipped to projects.
- **Owed to the product owner:** a signed-in look at a measured epic's funnel once a bet reports evaluations, and the
  interactive refine walkthrough of Stage 6b.
