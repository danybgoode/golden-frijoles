# Launch trust sweep: every public surface says Golden Frijoles, on goldenfrijoles.com — Retrospective

_Closed: 2026-10-08_
_Intent: owed to Daniel (yes | mostly | no)_
_Quote vs actual: not quoted → ≈$8.01 (Claude only, from the branch's first commit; the audit before it and the
reviewers are not measured)_

## What shipped
- **Sprint 1** (#322, merge `f9898c1`).
  - S1.1 the public text speaks Golden Frijoles (`6c134b3`, review fix `4e8e457`): a user README with the quickstart
    and a screenshot of the live board, a new `CONTRIBUTING.md`, the poster's licence section stating the real
    per-folder licences, the CLI's browser login, one set of SDK env names, and the footer's GitHub link on the repo.
  - S1.2 no Vercel deployment host left (`afe3377`, review fix `d3399ee`): two workflow fallbacks, the READMEs and
    about 50 docs; `scripts/check-brand-host.mjs` in CI's static steps, mutation-checked.
  - S1.3 the loader opens on a random phrase, never the previous one (`7b98466`, review fix `567112a`); the phrase is
    hidden from assistive tech and the status text fills after mount so it is announced.

## What went well
- **The fresh reviewer caught what the builder's own sweep could not see.** A text replacement that keeps every URL
  working still changed the record: July smoke results came to claim a domain that did not exist until August.
- **Evidence beat a Blocking finding.** Codex said the guard never runs; CI's own step log showed its output, and a
  one-line script showed Node makes `argv[1]` absolute. Answered on the PR with both, no code churn.

## What we learned
- **Rewriting history docs: split instructions from evidence.** A step, an `Env:` line or a curl is an instruction and
  takes the new address. "→ 200", "is live at", "Daniel opened" are evidence of a past moment and keep where they were
  observed ("the Vercel deployment host (now goldenfrijoles.com)"). A blanket replace gets the first right and
  falsifies the second.
- **In zsh, `$files` is one argument.** `sed -i '' … $files` failed with "File name too long" and changed nothing;
  zsh does not word-split unquoted variables. Pipe `git grep -lz` into `xargs -0`, or use a script.
- **agy has no usable model this week.** Gemini's weekly quota is spent until about 2026-10-14, and GPT-OSS returned
  an empty or header-only reply even on a 67 KB code-only diff from a clean worktree. Vibe ran the security lens.

## Gaps / follow-ups
- **Owed to Daniel:** the `_Intent_` word above; the two account settings outside the PR: the GitHub description and
  homepage of `danybgoode/golden-frijoles` and `golden-frijoles/skills` (the agent runs `gh repo edit` on a go), and
  the Vercel domain redirect from the old `golden-beans-gamma` host to `goldenfrijoles.com` (308); walkthrough step 4
  checks it.
- **Retake the README screenshot** after the Refining rename: the board still shows "Grooming" and the dropped
  scenarios-freeze card.
- **Not checked:** the loader with a real screen reader.
- The PR template still lists `npm run format:check`, which does not exist (CI runs `format:changed`).
