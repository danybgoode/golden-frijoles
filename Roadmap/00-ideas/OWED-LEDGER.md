# Owed ledger — manual verification still outstanding

> **GENERATED — do not hand-edit.** `node scripts/owed-ledger.mjs`.
> Re-derived from the spec tree and the epic docs on every run, never from a maintained list.
> To clear an item, tick (`✅`) or strike (`~~…~~`) its line where it was written, then regenerate.

_Generated: 2026-10-14_

**122 check(s) owed across 69 file(s)** · 3 cleared.

| Who can clear it | Count | What it means |
|---|---|---|
| publish | 3 | A package publish (npm 2FA): the product owner today, a CI job once trusted publishing is on |
| credential | 7 | Mints or uses a production credential: only the product owner, named every time |
| ops | 7 | On the product owner's own accounts or machine |
| judgment | 29 | An answer only the product owner can give: an _Intent_, an approval, a decision |
| signed-in | 24 | A signed-in production walkthrough: an agent can run it once a smoke account exists |
| interactive | 27 | An interactive plugin or terminal walkthrough: an agent can script it in a scratch repo |
| unsorted | 25 | Nothing above matched — **not a bin, a to-triage list** |

| Category | Count | What it means |
|---|---|---|
| money-path | 2 | Touches checkout, payment or order state — run these first |
| auth-path | 31 | Needs a real signed-in session a script cannot mint against production |
| admin-only | 0 | Behind an admin surface |
| other | 89 | Everything the rules could not confidently place — **not a bin, a to-triage list** |

## publish (3)

- `Roadmap/02-commercial/many-products/RETROSPECTIVE.md:46` · other — **Owed to the product owner:** `npm publish` of `@golden-frijoles/cli@1.6.0` (2FA) — the CLI steps of S1 and S2's walkthroughs wait on it; the signed-in walkthroughs (approve page, New product, console delete on Setup › CLI, /connect, the aomx horizon); the hypothesis read (`bet…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:185` · other — Acceptance:** `.github/workflows/release.yml`: on a version bump merged to `main` (*lock X3/D5: CI creates the tag, it doesn't react to one*), verify = `plugin.json` version = `kit/package.json` version (D4), build the kit, `npm publish --provenance --access public` via **truste…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:210` · other — **Bootstrap the package (owed to Daniel; npm account with 2FA).** In an empty folder:

## credential (7)

- `Roadmap/01-growth-engine/growth-engine-v1/RETROSPECTIVE.md:74` · auth-path — **Owed to Daniel: Sprint 4's real-production smoke** (an authenticated round-trip against the Vercel deployment host (now `goldenfrijoles.com`) proving bucketing → exposure → comparison end-to-end with real data). No session held a plaintext production API key to run this as the…
- `Roadmap/02-commercial/console-ia-overhaul/RETROSPECTIVE.md:78` · auth-path — **Owed to Daniel by name:** the signed-in production walkthrough (`sprint-3.md`), whose two writing steps — turning a live flag off and creating a real definition version — are his by construction; and **minting a connector URL** (`Setup › Connect`), outstanding from Sprint 2, b…
- `Roadmap/02-commercial/design-system-rails/RETROSPECTIVE.md:92` · auth-path — ⚠️ **Owed to Daniel, by name — the auth-path production smoke.** Signing up and signing in as a brand-new user, and opening a real share link while signed out. No automated smoke covers either; `sprint-6.md`'s walkthrough has both with what "wrong" looks like at each step.
- `Roadmap/02-commercial/frijoles-rebrand-closeout/RETROSPECTIVE.md:53` · auth-path — The signals-loop production write smoke and the first real pod-report share links remain owed to Daniel. Both require credentials or tokens only Daniel can mint; this session did not attempt either.
- `Roadmap/02-commercial/outcome-report-v2/RETROSPECTIVE.md:38` · auth-path — **Owed to Daniel:** both sprints' signed-in walkthroughs; a client share link opened signed out (minting one is a prod credential); `_Intent:_` above.
- `Roadmap/02-commercial/pod-report/RETROSPECTIVE.md:72` · auth-path — **Owed to Daniel — the one launch step an agent should not take alone:** minting the first real share credentials in production, and deciding which tenant's report goes to which audience. The mechanism is proven (mint → open → revoke → dead, spec'd against a real revoked row), b…
- `Roadmap/09-platform-infra/golden-flags-by-default/RETROSPECTIVE.md:141` · auth-path — **Owed to the product owner: one live `gf login` + `gf init`.** Completing `gf init` needs a CLI token minted from the Golden console by a signed-in human — a production credential this build did not take unasked. Step 1 of the walkthrough (fails with the exact command) ran for…

## ops (7)

- `Roadmap/02-commercial/board-sinks-and-scrumban/RETROSPECTIVE.md:50` · other — Owed to Daniel: the `Stage` select on the Notion roadmap DB (S3.3's live column); the board and card view against the approved picture in a browser; the workspace board signed in (S4 smoke).
- `Roadmap/09-platform-infra/jev-semantic-guards/RETROSPECTIVE.md:82` · other — **Owed to the product owner: repair golden-beans' local `.git`.** It was damaged by the fixture leak, and the auto-mode classifier blocked the repair. The commands are in the epic README. Nothing was pushed.
- `Roadmap/09-platform-infra/jev-semantic-guards/RETROSPECTIVE.md:84` · other — **Owed to the product owner: the routine key.** The routines' shared environment (`env_01PeaBUebiXBSnn8L169k7aM`) needs `TYPESAFE_API_KEY` and `api.typesafe.ai` on its allow-list when the routines are re-enabled. All four were disabled on 2026-09-18. Until then, cloud runs fall…
- `Roadmap/09-platform-infra/plugin-1-0/RETROSPECTIVE.md:43` · other — **Owed to Daniel:** the `_Intent_` word above; Sprint 4's interactive walkthrough steps 2–5; your live routines that name a removed skill (sprint-3 step 7); and two decisions: rename the Notion `Stage` select option (it stores the key "Grooming"), and whether to re-approve the c…
- `Roadmap/09-platform-infra/public-monorepo/RETROSPECTIVE.md:46` · other — **S4.4 is owed to Daniel:** the folder, Claude-memory and report-runner commands are in sprint-4.md. The runner already showed exit `1` before the move.
- `Roadmap/09-platform-infra/public-monorepo/sprint-4.md:59` · auth-path — Story 4.4 — Local folder and Claude memory (owed to Daniel) **As the product owner**, **I want** exact commands to rename ~/dobby/golden-beans and move Claude Code's per-project history, **so that** my sessions keep their memory after the move. **Acceptance:** The sprint doc lis…
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:55` · other — Remove the three account copies of the coaches.

## judgment (29)

- `Roadmap/01-growth-engine/north-star-multi-metric-read/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_
- `Roadmap/01-growth-engine/north-star-multi-metric-read/RETROSPECTIVE.md:28` · other — **Owed to Daniel:** the signed-in look at https://goldenfrijoles.com/app/north-star/golden-frijoles (sprint-1 step 2), and the `_Intent_` word above.
- `Roadmap/02-commercial/account-from-the-terminal/RETROSPECTIVE.md:12` · other — > _Intent_ is provisional ("mostly"), owed to Daniel: GitHub and the email link were cut at the lock, and the Google > round trip worked end to end only after he fixed Supabase's URL settings. His own answer replaces this word.
- `Roadmap/02-commercial/agentic-pm-public-surface/RETROSPECTIVE.md:78` · other — **Story 1.4 is owed to Daniel by name.** Running the workshop end-to-end in a fresh Claude and a fresh ChatGPT, on a real product. No automated smoke can judge whether a facilitation script facilitates. It must be run against **production**, not a preview — see A13.
- `Roadmap/02-commercial/app-component-kit-adoption/RETROSPECTIVE.md:78` · other — **Owed to the product owner:** the **consequence copy**. Whether each sentence tells a PM what they're about to lose is the one judgement in this epic no spec makes — walkthrough step 7 in `sprint-3.md`. Also the signed-in visual parity pass across the six converted routes.
- `Roadmap/02-commercial/brand-reveal-error-pages/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_
- `Roadmap/02-commercial/brand-reveal-error-pages/RETROSPECTIVE.md:30` · other — **Owed to Daniel:** the interactive setup reveal in a real terminal (sprint-1 steps 1–2, scriptable by an agent with a pseudo-terminal), and the `_Intent_` word above.
- `Roadmap/02-commercial/build-view-upgrade/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: $8–19 (S, n=5, p25–p75) → ≈$13.82 (inside the quote; Claude only, reviewers not measured)_
- `Roadmap/02-commercial/build-view-upgrade/RETROSPECTIVE.md:37` · other — **Owed to Daniel:** the walkthrough in `sprint-1.md` (Claude Code with plugin 0.40.0), and the `_Intent_` answer above.
- `Roadmap/02-commercial/connect-page/RETROSPECTIVE.md:12` · other — > _Intent_ is provisional ("mostly"), owed to Daniel. The two-card grouping (D6) was accepted by him on 2026-10-06 > ("design is fine").
- `Roadmap/02-commercial/first-run-setup/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$13.45 (−60% vs the quote's top; Claude only, reviewers not measured)_
- `Roadmap/02-commercial/first-run-setup/RETROSPECTIVE.md:36` · auth-path — **Owed to Daniel:** the terminal walkthrough in `sprint-1.md` (setup in a real session, steps 1–5), and the `_Intent_` answer above.
- `Roadmap/02-commercial/gates-in-plain-agile/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** both sprints' interactive walkthroughs, in a scratch repo with the plugin installed from `main` (setup → Strategy gate → Plan gate → Build gate), and this retro's `_Intent_` answer.
- `Roadmap/02-commercial/launch-trust-sweep/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: not quoted → ≈$8.01 (Claude only, from the branch's first commit; the audit before it and the reviewers are not measured)_
- `Roadmap/02-commercial/launch-trust-sweep/RETROSPECTIVE.md:35` · other — **Owed to Daniel:** the `_Intent_` word above; the two account settings outside the PR: the GitHub description and homepage of `danybgoode/golden-frijoles` and `golden-frijoles/skills` (the agent runs `gh repo edit` on a go), and the Vercel domain redirect from the old `golden-b…
- `Roadmap/02-commercial/one-epic-page/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** the signed-in walkthroughs of both sprints; the `_Intent_` word; approving a picture of the new page for the design gate (D5 — the seed sketch's kinds are not in `surface.map.json`).
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:53` · other — The retro's `_Intent_` word.
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:54` · other — **Owed to Daniel (D10):** re-approve `design-system/surfaces/hub-board*.surface` and `hub-roadmap-areas.surface` with the new words. Their text still reads "To groom … Ready to build". The gate measures structure, not words, so this doesn't block anything.
- `Roadmap/02-commercial/portfolio-view/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** the signed-in walkthroughs (sprint-1 step 3, sprint-2 steps 1–4), placing his products on the loop, and the retro's `_Intent:_` answer.
- `Roadmap/02-commercial/result-record/RETROSPECTIVE.md:75` · auth-path — **Owed to Daniel:** sprint 1's grooming walkthrough (steps 1–2) and sprint 2's end-to-end read (ship a tiny epic with today's read date → session line → Today → `epic-read` → approve → push → bean). Then the `_Intent_` word.
- `Roadmap/09-platform-infra/ci-diet/RETROSPECTIVE.md:59` · other — **Owed to Daniel:** the `_Intent:_` answer above.
- `Roadmap/09-platform-infra/coaches-v2/RETROSPECTIVE.md:47` · other — **Owed to the PO:** interactive walkthroughs: `/golden-frijoles:cold-read` in a real repo, `/golden-frijoles:pmf-narrative` (Step 1 of 8, options, a draft after step 3), `/golden-frijoles:north-star` to the scenario table; the one-pagers opened and printed in a browser; retire t…
- `Roadmap/09-platform-infra/finops/RETROSPECTIVE.md:60` · auth-path — **Owed to Daniel (by name):** S1 steps 3–4 and S2 steps 2–4 (the band and groom in a live session on the released plugin); S3 steps 1–4 (`spend.telemetry on` + the prod ingest key, the signed-in `/app/finops`, the Hub line, the non-member 404); the `_Intent:` answer above.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:101` · other — that point. The `console-prototype.html` edit + `APPROVED.md` line are a design approval **owed to Daniel in one focused question**. Never edit the prototype and leave the hash alone.
- `Roadmap/09-platform-infra/intent-match/RETROSPECTIVE.md:52` · other — **Owed to Daniel:** the one-word `_Intent:` answer for the 23 backfilled epics and this one (about fifteen minutes; `intent-outcomes` counts them toward 20); groom one real idea in Cowork to see the new seed and Stage 3.5/4.6 end to end; read this epic's scored pitch and its rea…
- `Roadmap/09-platform-infra/kickoff-generator-path/RETROSPECTIVE.md:49` · other — **Owed to Daniel:** this retro's `_Intent:_` answer.
- `Roadmap/09-platform-infra/semantic-lint/RETROSPECTIVE.md:57` · other — **Owed to Daniel on 2026-10-14:** read `node scripts/jev-report.mjs` and decide promote / tune / drop for `lint:rule-1`. `scripts-guard` goes red that day by design.
- `Roadmap/09-platform-infra/sketch-specs/RETROSPECTIVE.md:80` · other — Owed to Daniel: did we build what was meant?** Answer on its own line as `_Intent: yes_`, `_mostly_` or `_no_`. The builder does not answer this for the product owner. This epic has no `intent_match:` score, so `epic-dod` does not require it.
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:52` · other — Run the North Star coach on Golden Frijoles and judge the file (S1 smoke step 2).

## signed-in (24)

- `apps/web/e2e/app-auth.spec.ts:121` · auth-path — authed member-vs-owner HTTP path needs a real session (browser smoke owed to Daniel), so the
- `apps/web/e2e/delivery-replay.spec.ts:18` · auth-path — The authenticated /app replay + delivery-history UI is a real-session BROWSER smoke owed to Daniel.
- `apps/web/e2e/delivery-replay.spec.ts:229` · other — browser smoke owed to Daniel; this pins the delivery-level property it depends on.)
- `apps/web/e2e/destinations.spec.ts:30` · auth-path — /app/destinations) is a real-session BROWSER smoke owed to Daniel — the same boundary
- `apps/web/e2e/funnel.spec.ts:77` · other — assertions this test used to make) is the browser smoke owed to Daniel. The JSON endpoint above
- `apps/web/e2e/hub.authed.spec.ts:10` · auth-path — by hand. That is precisely the "browser smoke owed to the product owner" WAYS-OF-WORKING says a
- `Roadmap/01-growth-engine/flags-console-parity/RETROSPECTIVE.md:130` · money-path — **Owed to the product owner: the signed-in walkthroughs for all three sprints.** Every surface is credential-gated, so nothing in this repo reaches past the login redirect. Sprint 2's includes the money-path confirm on preview **and** production (cancel both).
- `Roadmap/01-growth-engine/one-bet-wired/RETROSPECTIVE.md:50` · other — **Owed to the product owner:** a signed-in look at a measured epic's funnel once a bet reports evaluations, and the interactive refine walkthrough of Stage 6b.
- `Roadmap/01-growth-engine/tars-one-model/RETROSPECTIVE.md:52` · other — **Owed to the product owner:** the signed-in look at a feature's funnel with the period choice, ~~and the _Intent_ word~~ (answered: yes).
- `Roadmap/02-commercial/account-from-the-terminal/RETROSPECTIVE.md:57` · auth-path — **Owed to Daniel:** the sprint walkthroughs on production — S1 steps 4–5 (an agent reading install.md and waiting), S2 steps 2 and 4–6 (Google with a fresh account, `gf login` on a clean machine, expiry), S3 steps 2–5 (the Claude app turning a flag off, Get a new URL, Disconnect…
- `Roadmap/02-commercial/app-shell-and-agent-rail/RETROSPECTIVE.md:112` · auth-path — **The SIGNED-IN production walkthrough has not been run.** The anonymous half was verified in production against `102f494` on 2026-08-07: all routes healthy, `/app` 307s to login, the rail markers are **absent** from both anonymously-readable demo dashboards (the dark spec's pro…
- `Roadmap/02-commercial/landing-frijoles-rebrand/RETROSPECTIVE.md:79` · auth-path — **The authed mobile sweep** — still owed to Daniel from `landing-redesign-v2` and untouched here. The `browser` project is anonymous by construction, so a signed-in route would be measured against its login redirect. `assertMobileClean` is exported and ready for an `*.authed.spe…
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:51` · other — Both sprints' signed-in walkthroughs on production (sprint-1 steps 1–5, sprint-2 steps 1–6). Preview can't serve a signed-in page.
- `Roadmap/02-commercial/workspaces/RETROSPECTIVE.md:69` · other — **Owed to Daniel by name:** the signed-in prod walkthroughs (S1 steps 1–3 and 5, S2 step 1), and ~~`npm publish` of `@golden-frijoles/cli@0.4.0` (2FA)~~ (published; checked 2026-10-14), then S2 step 2. S2 step 3 is n/a in prod; CI replaces it.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:105` · other — A browser smoke on `/` and `/install`. The signed-in onboarding smoke is owed to Daniel.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:154` · other — QA:** api spec that each route serves the exact string; **browser smoke** on `/` and `/install`; the signed-in onboarding smoke **owed to Daniel** **Risk:** low
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:183` · other — Sign in and open https://goldenfrijoles.com/app/onboarding/<your-project-slug> (owed to Daniel: signed-in) → The same prompt appears on the onboarding page.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:251` · other — **Owed to Daniel:** step 3 (signed-in onboarding) and stranger walkthroughs A and B on a clean machine.
- `Roadmap/09-platform-infra/one-product-project/sprint-1.md:87` · auth-path — (signed in, owed to Daniel) Open https://goldenfrijoles.com/app → the switcher lists golden-frijoles, and its flags list shows auth.terminal_sign_in_enabled
- `Roadmap/09-platform-infra/one-product-project/sprint-2.md:75` · other — (signed in, owed to Daniel) Open https://goldenfrijoles.com/app → the agent rail is on the right
- `Roadmap/09-platform-infra/one-product-project/sprint-3.md:78` · other — (signed in, owed to Daniel) `npx -y @golden-frijoles/cli flags kill console.agent_rail_enabled --env production`, then reload https://goldenfrijoles.com/app → within a minute, the agent rail is gone
- `Roadmap/09-platform-infra/public-monorepo/sprint-2.md:78` · other — The isolated-home install of the mirrored release is the gate (golden-frijoles-plugin S5's recipe). Browser smoke: none. **Owed to Daniel:** step 3 of the walkthrough (install in a scratch repo).
- `Roadmap/09-platform-infra/setup-instruments-connects/RETROSPECTIVE.md:42` · other — **Owed to Daniel:** the interactive setup walkthrough (sprint 2) on a scratch copy of a real product repo, and the signed-in Today check on a fresh project (sprint 1 step 3).
- `Roadmap/09-platform-infra/sketch-specs/RETROSPECTIVE.md:66` · auth-path — **Owed to Daniel:** open one rendered wireframe and say whether it reads; and check the signed-in `/app/flags` look (S2 step 4, with the authed gate as a green proxy).

## interactive (27)

- `Roadmap/01-growth-engine/sdk-1-0/RETROSPECTIVE.md:33` · other — **Owed to Daniel:** walkthrough step 3 (a real `identify` + `track` seen in the catalog).
- `Roadmap/01-growth-engine/signals-loop/sprint-2.md:144` · auth-path — (Owed to Daniel by name — needs a real Claude session.)*
- `Roadmap/02-commercial/commercial-shell/RETROSPECTIVE.md:93` · auth-path — The live browser/session smokes owed to Daniel per Sprint 2/3's QA sections (the connector round-trip, the "paste into a chat app" unfurl check) are still outstanding — unchanged by this session, tracked in their respective sprint docs.
- `Roadmap/02-commercial/connect-page/RETROSPECTIVE.md:42` · other — **Owed to Daniel:** the walkthrough (a fresh Google signup lands on Connect with no key; the Claude app turns a flag off with the URL it was given).
- `Roadmap/02-commercial/result-record/RETROSPECTIVE.md:43` · other — The interactive walkthroughs are owed to Daniel (see the sprint files).
- `Roadmap/09-platform-infra/build-visualization-claude-mods/RETROSPECTIVE.md:65` · auth-path — **Owed to the product owner:** the interactive-TUI half of the Sprint 4 smoke (watching Progress advance and the status become `In review` across turns, with a status row that a headless `-p` session does not have). The mechanics under it are tested; the pixels are not.
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:52` · other — the clean-machine stranger install (S2 steps 1–2);
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:53` · other — a Telegram test send from your own bot (S3 steps 2–4);
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:54` · other — standing up one routine at https://claude.ai/code/routines (S4 step 3).
- `Roadmap/09-platform-infra/fund-at-approval/RETROSPECTIVE.md:45` · other — **Owed to the product owner:** the interactive gate (sprint-1 walkthrough steps 2–3), groomed live from a throwaway idea. The scratch end-to-end run covered the scripts, not the conversation.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-1.md:17` · other — title: "Create the org and transfer the repo (owed to Daniel)" as_a: "Daniel" i_want: "the `golden-frijoles` org to own the repo as `golden-frijoles/skills`" so_that: "the install line names the product, not a person" risk: high status: done
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-1.md:135` · money-path — Story 1.2 — Create the org and transfer the repo (owed to Daniel) **As** Daniel, **I want** the `golden-frijoles` org to own the repo as `golden-frijoles/skills`, **so that** the install line names the product, not a person. **Acceptance:** Daniel creates the `golden-frijoles` G…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-1.md:150` · auth-path — QA:** golden-beans session check by the builder; **medusa-bonsai session check owed to Daniel** (private repo) **Risk:** high
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-1.md:179` · other — Same in `~/dobby/medusa-bonsai` (**owed to Daniel**) → Same result: `golden-frijoles:groom` is available.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:186` · other — Stranger walkthrough A — Claude Code (owed to Daniel: the real, interactive run)
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:218` · auth-path — device session and is owed to Daniel below. It does confirm the negative property that matters most for a dry run of an untrusted prompt: nothing in the scrubbed sandbox touched the operator's real Claude Code config.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:221` · other — Stranger walkthrough B — Codex via `npx skills` (owed to Daniel: the real, interactive run)
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:47` · other — Status:** 🟦 verifying: S5.1–S5.4 are merged and deployed (golden-frijoles/skills#50 `00f5ce4`, release `v0.5.0`; danybgoode/golden-beans#164 `2e2ae50` and #166 `d37ce20`; CLI **0.2.1** hand-published by Daniel, on kit 0.5.2). S5.5, the walkthrough on a clean machine, is owed to…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:184` · other — `gf setup` on a pseudo-terminal: down arrow + Enter, Esc for the default, Enter. Off a terminal without `--yes` it exits 1 and writes nothing.
- `Roadmap/09-platform-infra/grounded-bets/RETROSPECTIVE.md:38` · other — **Owed to Daniel:** Sprint 1's interactive refine walkthrough (step 2).
- `Roadmap/09-platform-infra/kickoff-generator-path/RETROSPECTIVE.md:46` · other — **Owed to Daniel:** S2 smoke step 5. After `/plugin` update and `/reload-plugins`, `/build cli-think-skills-followups` fills the prompt from `groom/vendor/`. `claude plugin test` covers it 7/7, but an interactive run is the real check.
- `Roadmap/09-platform-infra/live-build-view/RETROSPECTIVE.md:57` · auth-path — **Owed to the product owner (interactive session):** sprint 1 walkthrough steps 1–5 (the band moving mid-turn, a doc edit within 30 s, QA without typing, the Plugin row) and sprint 2 step 5 (`/build`). **`autoUpdate`** reaching 0.26.0 on this machine: headless runs do not trigge…
- `Roadmap/09-platform-infra/public-monorepo/sprint-4.md:40` · auth-path — Status:** 🚧 S4.1–S4.3 shipped. S4.4 is owed to Daniel (commands below), and he'll run it after this session.
- `Roadmap/09-platform-infra/session-budget/RETROSPECTIVE.md:47` · auth-path — **Owed to Daniel:** walkthrough steps 2–4 (the line in a real session, the checkpoint flip, a Cowork gate). Only the engine raises `session.measure`, so no repo test can show the line drawing.
- `Roadmap/09-platform-infra/setup-drafts-strategy/RETROSPECTIVE.md:35` · other — **Owed to Daniel:** the interactive setup walkthrough (sprint 1 step 2, sprint 2 steps 1–4) on a scratch copy of a real product repo.
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:54` · other — The interactive coach runs (S1 smoke steps 1 and 3; S2 smoke step 1).
- `Roadmap/09-platform-infra/why-as-a-story/RETROSPECTIVE.md:50` · other — **Owed to the product owner:** the refine walkthrough on a new idea (the Why drafted as a story, the guard, the build view showing it in full) and a Plan gate with the Crew block.

## unsorted (25)

- `apps/web/e2e/app-auth.spec.ts:7` · auth-path — owed to Daniel; here we pin the api-testable negatives that make the boundary real:
- `Roadmap/01-growth-engine/signals-loop/sprint-1.md:145` · other — throw a real error in the demo app → watch the signal appear (**owed to Daniel by name**)._
- `Roadmap/01-growth-engine/signals-loop/sprint-2.md:96` · other — `list_tasks` → evidence sanity), **owed to Daniel by name**
- `Roadmap/01-growth-engine/signals-loop/sprint-3.md:122` · other — resolve → revoke → confirm dead) + the production flip, **owed to Daniel by name**
- `Roadmap/09-platform-infra/cli-think-skills-followups/RETROSPECTIVE.md:36` · other — **Owed to Daniel by name:** ~~`cd packages/cli && npm publish` (npm 2FA) for `@golden-frijoles/cli@0.4.1`~~ (published; checked 2026-10-14), then smoke steps 4–5 in `sprint-1.md`.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-1.md:161` · other — **owed to Daniel:** Story 1.2, Story 1.4
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:119` · other — In an empty temp dir, publish a README-only `@golden-frijoles/kit@0.0.0` by hand.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:120` · other — `npm deprecate @golden-frijoles/kit@0.0.0 "bootstrap placeholder — use ≥0.2.0"`.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:121` · other — On npmjs.com → the package → Settings → Trusted publisher: GitHub Actions, org `golden-frijoles`, repo `skills`, workflow `release.yml`, no environment.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:203` · other — **owed to Daniel:** Story 2.3
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:207` · other — Env: production (npm, GitHub). Steps 1–3 are **owed to Daniel** before the S2 PR merges (a new external publish). The rest runs after it merges.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-2.md:220` · other — **Attach the trusted publisher (owed to Daniel).** npmjs.com → the package → **Settings** → *Trusted Publisher* → GitHub Actions: organization `golden-frijoles`, repository `skills`, workflow `release.yml`, environment blank → Save. → The settings page lists the GitHub Actions p…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:47` · other — Status:** 🟦 in review: S3.1–S3.4 are merged and deployed (golden-frijoles/skills#47 `3a06aa0`, release `v0.3.0` + kit 0.3.0 with provenance; danybgoode/golden-beans#163 `d32fde9`, Vercel production). S3.5, both stranger walkthroughs, is owed to Daniel, so the sprint isn't close…
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:132` · other — reports exactly where it stopped. The runs on a clean machine are owed to Daniel.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:166` · other — QA:** **owed to Daniel**: running both walkthroughs **Risk:** low
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-3.md:171` · other — **owed to Daniel:** Story 3.3, Story 3.5
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:103` · other — The review-scope variant runs in a template-spawned repo. **Owed to Daniel**: running it on a clean machine.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:138` · other — QA:** **owed to Daniel**: running it **Risk:** low
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:143` · other — **owed to Daniel:** Story 5.5
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:181` · other — Steps 2, 3 and 6's `config set` against the built CLI 0.2.0, in a temp repo: the file, the module lines and a subdirectory resolving to the same root.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:183` · other — Steps 4 and 5 in a copy of `template/`: null → the ask and `egress not answered`; false; true without a key.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/sprint-5.md:186` · auth-path — `check-onboarding-parity --exec` against CLI 0.2.0: `gf config list --json` exits 0 with JSON, with no credential.
- `Roadmap/09-platform-infra/public-monorepo/sprint-4.md:31` · auth-path — title: "Local folder and Claude memory (owed to Daniel)" as_a: "the product owner" i_want: "exact commands to rename ~/dobby/golden-beans and move Claude Code's per-project history" so_that: "my sessions keep their memory after the move" risk: high status: planned ---
- `Roadmap/09-platform-infra/public-monorepo/sprint-4.md:82` · other — The deploy proof (S4.3) is the gate. **Owed to Daniel:** S4.4's local moves.
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:53` · other — The live `--yes` against `golden-beans` with that file, then check the North Star surface (S3 smoke steps 2–3).

