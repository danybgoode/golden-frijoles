# One plugin, one install — Golden Frijoles ships as a public plugin whose skills run in anyone's repo — Retrospective

_Closed: 2026-10-14_
_Intent: owed to Daniel (yes | mostly | no)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->

Both waves have their own retrospective, written at ship time: [wave 1](WAVE-1-RETROSPECTIVE.md) ("install", S1–S3)
and [wave 2](WAVE-2-RETROSPECTIVE.md) ("configure", S4–S5). This file closes the epic and does not repeat them.

## What shipped
- **Wave 1, 2026-09-23** (golden-frijoles/skills#44–#47, golden-beans#161–#163): the plugin under the product's name,
  Apache-2.0, with tagged releases cut by CI; `@golden-frijoles/kit` on npm with provenance, built from the skills'
  closure; every skill runs the project's own copy or the pinned kit; the umbrella skill and one install prompt,
  checked by running it.
- **Wave 2, 2026-09-24** (skills#49–#54, golden-beans#164–#166): one config file layered over the old ones, the
  `GF-NEEDS-SETTING` ask, setup questions, `config list/get/set`, doctor's module lines, Jev egress as an explicit
  choice; CLI 0.2.1.
- 21 of 23 stories done. The two not done are the clean-machine walkthroughs (S3.5, S5.5).

## What went well
- **The kit idea held.** A stranger's repo gets no `scripts/` folder: skills run the project's copy or `npx` the kit,
  and that is still how every release since (plugin 1.x, kit 1.8.0) ships.

## What we learned
- **An epic whose last stories are someone else's walkthrough stalls open.** This one sat "verifying" for three weeks
  while the plugin moved from 0.5 to 1.8. By the time it closed, its walkthrough steps named commands that no longer
  exist (`gf-kit init`, `groom`). The owed ledger now counts an open epic's sprint docs, so a stalled close-out shows.

## Gaps / follow-ups
- **Owed to Daniel: one stranger install on a clean machine** (S3.5 and S5.5, in today's commands): in an empty
  `git init` folder, paste the prompt from https://goldenfrijoles.com/install.md into Claude Code, let it install the
  plugin and run `setup`, then refine one idea. Pass = a seed lands in `Roadmap/00-ideas/seeds/` and there is no
  `scripts/` folder. An agent can run it with a pseudo-terminal on a machine with a fresh login.
- **Dropped as stale:** the signed-in onboarding smoke (S3.3): `/app/onboarding` was replaced by Connect
  (`connect-page`). The medusa-bonsai session check (S1.4) was not re-checked; that repo pins its own copies.
- Wave 1 and wave 2's other follow-ups (medusa-bonsai's lagging copies, the seeds named in wave 2) stand as written
  there.
