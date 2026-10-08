# First run: setup starts — Retrospective

_Closed: 2026-10-07_
_Intent: owed to Daniel (yes | mostly | no)_
_Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$13.45 (−60% vs the quote's top; Claude only, reviewers not measured)_

## What shipped
- **Sprint 1 · Setup starts** (#307, merge `66cffd6`; plugin + kit 0.37.0 on npm, tag `v0.37.0`; `install.md` serves
  the new checksums). S1.1 setup opens with who is signed in and what it found (`b9583a8`). S1.2 `groom/read-repo.mjs`
  reads an existing project into the roadmap: a dry run, then a write through `scaffold-epic.mjs`, `fund.mjs` and the
  seed template, with the contract and `git status` checked (`f7d60d8`, `1da4e4b`, `afd33a6`). S1.3 a new idea in one
  sentence, and "not grounded" wherever there is no strategy (`c88ce8b`).

## What went well
- **Locking on a throwaway skeleton.** Running `gf-kit init` → `scaffold-epic` → `fund` → `build-order` in a scratch
  repo before writing D8 showed the board refuses an unfunded live epic. That turned "open PRs as Building" into a
  funded `backfill` cycle in the lock, instead of a red board after the build.
- **A real outside repo before review.** `sindresorhus/ky` found two defects that every fixture passed: Express
  reported as the stack (it is only ky's test server) and an epic header linking a seed that never existed (which
  `doc-format` enforces). The fixtures were written by the same hands as the code.
- **Mutation on every guard.** Two first-round survivors (the cluster minimum, and the outside-Roadmap check, which a
  well-behaved write never reaches) became a sharper spec and an extracted pure function.

## What we learned
- **A lock's "nothing reads X" needs a grep across every package, not just skills/.** D4 said nothing reads
  `project.startPoint`; `packages/cli` does, through the kit's registry. The fresh reviewer caught it.
- **"Could not read" applies to every list, not just the first one you think of.** Issues had the limit + 1 check;
  pull requests didn't (Codex), and a failed `gh` call read as zero (fresh review). Fixing the class: every list goes
  through one reader that names what it could not read, and `--write` refuses.
- **Regenerate checksums last.** `SHA256SUMS` was made before the final fixes and CI went red. Any edit to a plugin
  file after the release step needs `plugin-checksums.mjs` again.
- **agy on this machine:** the Gemini model is signed out, and GPT-OSS's context overflows on a mid-size diff even
  when scoped. Vibe ran the security lens, and needed `VIBE_MAX_TURNS=60`.

## Gaps / follow-ups
- **Owed to Daniel:** the terminal walkthrough in `sprint-1.md` (setup in a real session, steps 1–5), and the
  `_Intent_` answer above.
- ~~**CLI follow-up**~~ **done 2026-10-08** (#309 kit 0.38.0, #310 CLI 0.8.0 + plugin/kit 0.39.0): `gf setup` asks
  Q1 and the account question only and sends This repo to the skill's read; the skill's setup also runs on an empty
  skeleton. Verified live: `npx @golden-frijoles/cli@0.8.0 setup --yes` and `/install` naming 0.8.0.
- **Limit (D6):** an open PR on a branch with capitals, `_` or `.` gets an epic the live board won't match, so it
  shows Ready to build, not Building.
- **Not verified:** `build-order --live` turning a backfilled open-PR epic into Building against a real origin. The
  real repo had no open PRs, and the fixtures have no remote.
- **agy sign-in:** run `agy` login for the Gemini models, or the security lens keeps falling through to vibe.
