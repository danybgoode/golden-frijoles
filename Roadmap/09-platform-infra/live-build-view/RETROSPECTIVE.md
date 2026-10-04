# Live build view: the band moves while the agent works, from facts no agent writes — Retrospective

_Closed: 2026-10-03_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $23–34 (M, n=5, p25–p75) → ≈$36.63 (+8% over the top)_
<!-- Stamped by `node scripts/epic-actuals.mjs --epic live-build-view --write`: 105.3M tokens over 5 sessions on this
     machine — the orchestrator plus its fresh-reviewer subagents (three rounds on #241) and two headless `claude -p`
     measurement runs. The S2 worktree's spend is attributed through the session checkout's branch. Codex/Agy/Vibe passes
     are not measured. Two things the quote did not price: a session rate limit mid-review, and two extra review rounds. -->

## What shipped
One orchestrated session, two stacked PRs, each merged and released to the plugin marketplace and npm.

- **Sprint 1 — the band goes live** (#240, `16aaf73`, plugin/kit **0.25.0**). One check (`createViewer`) runs on
  `turn.start`, after every Bash call and on a 30 s tick, and re-resolves only when the key moves: this checkout's root,
  every worktree's HEAD and branch, and the newest `Roadmap/` file. A check that resolves nothing costs 48 ms over 535
  Roadmap entries, measured in a real headless session. PR facts refresh online on their own timer (60 s, then every
  5 min) and once after a `git push`/`gh pr …`, never on a turn's path. A `Plugin` row appears when the install is
  behind the marketplace clone; `autoUpdate` is on; CI checks the mod on Claude Code 2.1.288 with `claude plugin test`.
- **Sprint 2 — statuses from facts no agent writes** (#241, `afc7689`, **0.26.0**). A `commit-msg` hook refuses a
  feat/fix/perf/refactor commit on an epic branch unless it names exactly one of that epic's stories. Progress counts
  stories with commits (`4 of 7 stories have commits · in flight S2.1`). `scripts/epic-phase.mjs lock` stamps the
  architecture lock, and until then the band reads Locking architecture. `/build <slug>` puts the generated kickoff in
  the prompt box.

## What went well
- **The lock disproved six pieces of scope before any code** (C1–C6): there is no "In review" on the band (the stage
  vocabulary says QA, and a draft PR is Building); CI's 2.1.278 pin could not run the mod at all; `S1.1/1.2` was one id
  to the existing parser; the template never carried the function-hooks flag.
- **Measuring in a real session found what the specs could not.** The first headless run walked 12 Roadmap entries,
  not 535: `$.fs.list` says `kind: 'dir'`, the spec's fixture said `'directory'`, and every spec was green.
- **The hook was dogfooded on its own branch.** Every S2 feat commit went through the real `commit-msg`; the first
  story-less message was refused, listing S2.1–S2.4.
- **The fresh reviewer earned its mandatory slot.** Round 1 on #240 found a shared `$.store` slot that let two sessions
  in two worktrees serve each other's view; round 1 on #241 found a spec that only passed in the monorepo layout, and
  version numbers read as second stories (`S1.3, 2.1.288`). None of the external passes found these.

## What we learned
- **A fixture written from memory of an API is a second, wrong API.** `kind: 'directory'` vs the engine's `'dir'`, and
  `{ value }` vs a bare `{ isFilled }` for an event's answer, both passed every spec. Only a run against the engine
  (`claude plugin test`, a `--debug-file` session) showed it.
- **A spec that reads the repo's own Roadmap breaks in the mirror.** skills-ci runs `skills/` alone; "every step green
  locally" meant the monorepo layout only. Run skills-ci from a copy of `skills/` before claiming it.
- **Fixing a guard is writing a new guard.** The version-number fix (`(?![.\d])`) refused `… S2.1.` — a sentence's
  full stop — and the reviewer's next round found it. The same lookahead had to be argued case by case.
- **`format:changed -- --write` reformats modified files, not only added ones**, which breaks byte-parity with the
  template and the vendored copies. The gate checks added files; format only those, then mirror them.
- **A fail-open path can hide a broken test.** The first real-hook fixture let a story-less commit through because
  `story-check.mjs` was not copied, and the hook's "script missing → pass" did exactly what it should. The opposite
  failure was worse: an incomplete closure crashed node and refused every commit, chore included, until the import
  moved inside a try.

## Gaps / follow-ups
- **Owed to the product owner (interactive session):** sprint 1 walkthrough steps 1–5 (the band moving mid-turn, a doc
  edit within 30 s, QA without typing, the Plugin row) and sprint 2 step 5 (`/build`). **`autoUpdate`** reaching 0.26.0
  on this machine: headless runs do not trigger the marketplace update, so the install is still 0.24.0.
- **"Mods on by default from 2.1.287" is unproven in a real session:** this machine's user settings set
  `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, so no session here exercised the no-flag path (`plugin test`/`validate` did).
- **`skills/scripts/` ↔ `skills/template/scripts/` has no parity check** (the reviewer found three stale copies);
  `check-script-parity` covers `scripts/` ↔ template only.
- **Per-root `$.store` slots are never evicted.** About 1–2 KB per checkout root against the store's 4 MiB cap; a failed
  cache write now only logs.
- **This repo's `core.hooksPath` is absolute** to the main checkout's `.githooks`, so a linked worktree runs the main
  checkout's hooks, not its own branch's.
- **External review was thin:** Codex was capped all epic, so gemini (via agy) ran both general passes on #240, and the
  general passes attached 12–18 of 28–53 files.
