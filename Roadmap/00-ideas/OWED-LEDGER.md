# Owed ledger — manual verification still outstanding

> **GENERATED — do not hand-edit.** `node scripts/owed-ledger.mjs`.
> Re-derived from the spec tree and the epic docs on every run, never from a maintained list.
> To clear an item, tick (`✅`) or strike (`~~…~~`) its line where it was written, then regenerate.

_Generated: 2026-10-20_

**110 check(s) owed across 76 file(s)** · 7 cleared.

| Who can clear it | Count | What it means |
|---|---|---|
| publish | 2 | A package publish (npm 2FA): the product owner today, a CI job once trusted publishing is on |
| credential | 10 | Mints or uses a production credential: only the product owner, named every time |
| ops | 5 | On the product owner's own accounts or machine |
| judgment | 32 | An answer only the product owner can give: an _Intent_, an approval, a decision |
| signed-in | 26 | A signed-in production walkthrough: an agent can run it once a smoke account exists |
| interactive | 20 | An interactive plugin or terminal walkthrough: an agent can script it in a scratch repo |
| unsorted | 15 | Nothing above matched — **not a bin, a to-triage list** |

| Category | Count | What it means |
|---|---|---|
| money-path | 2 | Touches checkout, payment or order state — run these first |
| auth-path | 30 | Needs a real signed-in session a script cannot mint against production |
| admin-only | 0 | Behind an admin surface |
| other | 78 | Everything the rules could not confidently place — **not a bin, a to-triage list** |

## publish (2)

- `Roadmap/01-growth-engine/funnel-truth/RETROSPECTIVE.md:46` · other — Owed to the product owner: `npm publish` CLI 1.8.0 and 1.9.0 (the skills already pin 1.9.0 / kit 1.10.3); `frijoles flags set bets.funnel_trend_enabled --value true --env production` when the trend should go live; the signed-in smoke steps (sprint-1 3–5, sprint-2 4 and 6) and th…
- `Roadmap/01-growth-engine/satisfied-ask/RETROSPECTIVE.md:48` · other — **Owed to Daniel:** `npm publish` of `@golden-frijoles/sdk@1.3.0` (2FA).

## credential (10)

- `Roadmap/01-growth-engine/delivery-back-on/sprint-1.md:69` · other — Risk:** high (production writes, owed to Daniel by name)
- `Roadmap/01-growth-engine/delivery-back-on/sprint-1.md:71` · auth-path — The switch-on runbook (owed to Daniel: production writes, one sitting) Run SQL from `apps/web` with `supabase db query --linked "<sql>"` (or `-f <file>`). It uses the CLI's own auth, so no key goes in the shell. **No secret value is ever typed on a command line:** the bearer goe…
- `Roadmap/01-growth-engine/delivery-back-on/sprint-1.md:125` · other — Run the switch-on runbook above, steps 1–8 (owed to Daniel: production writes). → step 8 shows two `succeeded` ticks returning `"enabled":true`.
- `Roadmap/01-growth-engine/growth-engine-v1/RETROSPECTIVE.md:74` · auth-path — **Owed to Daniel: Sprint 4's real-production smoke** (an authenticated round-trip against the Vercel deployment host (now `goldenfrijoles.com`) proving bucketing → exposure → comparison end-to-end with real data). No session held a plaintext production API key to run this as the…
- `Roadmap/02-commercial/console-ia-overhaul/RETROSPECTIVE.md:78` · auth-path — **Owed to Daniel by name:** the signed-in production walkthrough (`sprint-3.md`), whose two writing steps — turning a live flag off and creating a real definition version — are his by construction; and **minting a connector URL** (`Setup › Connect`), outstanding from Sprint 2, b…
- `Roadmap/02-commercial/design-system-rails/RETROSPECTIVE.md:92` · auth-path — ⚠️ **Owed to Daniel, by name — the auth-path production smoke.** Signing up and signing in as a brand-new user, and opening a real share link while signed out. No automated smoke covers either; `sprint-6.md`'s walkthrough has both with what "wrong" looks like at each step.
- `Roadmap/02-commercial/frijoles-rebrand-closeout/RETROSPECTIVE.md:53` · auth-path — The signals-loop production write smoke and the first real pod-report share links remain owed to Daniel. Both require credentials or tokens only Daniel can mint; this session did not attempt either.
- `Roadmap/02-commercial/outcome-report-v2/RETROSPECTIVE.md:38` · auth-path — **Owed to Daniel:** both sprints' signed-in walkthroughs; a client share link opened signed out (minting one is a prod credential); `_Intent:_` above.
- `Roadmap/02-commercial/pod-report/RETROSPECTIVE.md:72` · auth-path — **Owed to Daniel — the one launch step an agent should not take alone:** minting the first real share credentials in production, and deciding which tenant's report goes to which audience. The mechanism is proven (mint → open → revoke → dead, spec'd against a real revoked row), b…
- `Roadmap/09-platform-infra/golden-flags-by-default/RETROSPECTIVE.md:141` · auth-path — **Owed to the product owner: one live `gf login` + `gf init`.** Completing `gf init` needs a CLI token minted from the Golden console by a signed-in human — a production credential this build did not take unasked. Step 1 of the walkthrough (fails with the exact command) ran for…

## ops (5)

- `Roadmap/02-commercial/board-sinks-and-scrumban/RETROSPECTIVE.md:50` · other — Owed to Daniel: the `Stage` select on the Notion roadmap DB (S3.3's live column); the board and card view against the approved picture in a browser; the workspace board signed in (S4 smoke).
- `Roadmap/09-platform-infra/jev-semantic-guards/RETROSPECTIVE.md:82` · other — **Owed to the product owner: repair golden-beans' local `.git`.** It was damaged by the fixture leak, and the auto-mode classifier blocked the repair. The commands are in the epic README. Nothing was pushed.
- `Roadmap/09-platform-infra/jev-semantic-guards/RETROSPECTIVE.md:84` · other — **Owed to the product owner: the routine key.** The routines' shared environment (`env_01PeaBUebiXBSnn8L169k7aM`) needs `TYPESAFE_API_KEY` and `api.typesafe.ai` on its allow-list when the routines are re-enabled. All four were disabled on 2026-09-18. Until then, cloud runs fall…
- `Roadmap/09-platform-infra/plugin-1-0/RETROSPECTIVE.md:43` · other — **Owed to Daniel:** the `_Intent_` word above; Sprint 4's interactive walkthrough steps 2–5; your live routines that name a removed skill (sprint-3 step 7); and two decisions: rename the Notion `Stage` select option (it stores the key "Grooming"), and whether to re-approve the c…
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:55` · other — Remove the three account copies of the coaches.

## judgment (32)

- `Roadmap/01-growth-engine/delivery-stale-reclaim-uncounted/RETROSPECTIVE.md:58` · other — Did we build what was meant? (owed to Daniel: one word)
- `Roadmap/01-growth-engine/drill-impact-for-agents/RETROSPECTIVE.md:54` · other — **Owed to the product owner (Daniel):** build an experiment on `site.drill_fault` in the console (none exists in golden-frijoles) and **start** it — a draft experiment has no analysis, so a capture answers `lifecycle_unavailable`; publish **CLI 1.10.0** to npm (kit 1.10.4 pins i…
- `Roadmap/01-growth-engine/satisfied-ask/RETROSPECTIVE.md:49` · other — **Owed to Daniel:** the Intent answer above (yes, mostly or no).
- `Roadmap/02-commercial/account-from-the-terminal/RETROSPECTIVE.md:12` · other — > _Intent_ is provisional ("mostly"), owed to Daniel: GitHub and the email link were cut at the lock, and the Google > round trip worked end to end only after he fixed Supabase's URL settings. His own answer replaces this word.
- `Roadmap/02-commercial/agentic-pm-public-surface/RETROSPECTIVE.md:78` · other — **Story 1.4 is owed to Daniel by name.** Running the workshop end-to-end in a fresh Claude and a fresh ChatGPT, on a real product. No automated smoke can judge whether a facilitation script facilitates. It must be run against **production**, not a preview — see A13.
- `Roadmap/02-commercial/app-component-kit-adoption/RETROSPECTIVE.md:78` · other — **Owed to the product owner:** the **consequence copy**. Whether each sentence tells a PM what they're about to lose is the one judgement in this epic no spec makes — walkthrough step 7 in `sprint-3.md`. Also the signed-in visual parity pass across the six converted routes.
- `Roadmap/02-commercial/build-view-upgrade/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: $8–19 (S, n=5, p25–p75) → ≈$13.82 (inside the quote; Claude only, reviewers not measured)_
- `Roadmap/02-commercial/build-view-upgrade/RETROSPECTIVE.md:37` · other — **Owed to Daniel:** the walkthrough in `sprint-1.md` (Claude Code with plugin 0.40.0), and the `_Intent_` answer above.
- `Roadmap/02-commercial/connect-page/RETROSPECTIVE.md:12` · other — > _Intent_ is provisional ("mostly"), owed to Daniel. The two-card grouping (D6) was accepted by him on 2026-10-06 > ("design is fine").
- `Roadmap/02-commercial/first-run-setup/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: $22–34 (M, n=8, p25–p75) → ≈$13.45 (−60% vs the quote's top; Claude only, reviewers not measured)_
- `Roadmap/02-commercial/first-run-setup/RETROSPECTIVE.md:36` · auth-path — **Owed to Daniel:** the terminal walkthrough in `sprint-1.md` (setup in a real session, steps 1–5), and the `_Intent_` answer above.
- `Roadmap/02-commercial/gates-in-plain-agile/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** both sprints' interactive walkthroughs, in a scratch repo with the plugin installed from `main` (setup → Strategy gate → Plan gate → Build gate), and this retro's `_Intent_` answer.
- `Roadmap/02-commercial/launch-trust-sweep/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_ _Quote vs actual: not quoted → ≈$8.01 (Claude only, from the branch's first commit; the audit before it and the reviewers are not measured)_
- `Roadmap/02-commercial/launch-trust-sweep/RETROSPECTIVE.md:35` · other — **Owed to Daniel:** the `_Intent_` word above; the two account settings outside the PR: the GitHub description and homepage of `danybgoode/golden-frijoles` and `golden-frijoles/skills` (the agent runs `gh repo edit` on a go), and the Vercel domain redirect from the old `golden-b…
- `Roadmap/02-commercial/many-products/RETROSPECTIVE.md:46` · other — **Owed to the product owner:** ~~`npm publish` of `@golden-frijoles/cli@1.6.0` (2FA) — the CLI steps of S1 and S2's walkthroughs wait on it~~ (published; 1.7.0 on npm 2026-10-14); the signed-in walkthroughs (approve page, New product, console delete on Setup › CLI, /connect, the…
- `Roadmap/02-commercial/one-epic-page/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** the signed-in walkthroughs of both sprints; the `_Intent_` word; approving a picture of the new page for the design gate (D5 — the seed sketch's kinds are not in `surface.map.json`).
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:53` · other — The retro's `_Intent_` word.
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:54` · other — **Owed to Daniel (D10):** re-approve `design-system/surfaces/hub-board*.surface` and `hub-roadmap-areas.surface` with the new words. Their text still reads "To groom … Ready to build". The gate measures structure, not words, so this doesn't block anything.
- `Roadmap/02-commercial/portfolio-view/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** the signed-in walkthroughs (sprint-1 step 3, sprint-2 steps 1–4), placing his products on the loop, and the retro's `_Intent:_` answer.
- `Roadmap/02-commercial/result-record/RETROSPECTIVE.md:75` · auth-path — **Owed to Daniel:** sprint 1's grooming walkthrough (steps 1–2) and sprint 2's end-to-end read (ship a tiny epic with today's read date → session line → Today → `epic-read` → approve → push → bean). Then the `_Intent_` word.
- `Roadmap/09-platform-infra/build-view-one-story/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_
- `Roadmap/09-platform-infra/build-view-one-story/RETROSPECTIVE.md:66` · other — **Owed to Daniel:** the `_Intent:_` word above.
- `Roadmap/09-platform-infra/ci-diet/RETROSPECTIVE.md:59` · other — **Owed to Daniel:** the `_Intent:_` answer above.
- `Roadmap/09-platform-infra/coaches-v2/RETROSPECTIVE.md:47` · other — **Owed to the PO:** interactive walkthroughs: `/golden-frijoles:cold-read` in a real repo, `/golden-frijoles:pmf-narrative` (Step 1 of 8, options, a draft after step 3), `/golden-frijoles:north-star` to the scenario table; the one-pagers opened and printed in a browser; retire t…
- `Roadmap/09-platform-infra/finops/RETROSPECTIVE.md:60` · auth-path — **Owed to Daniel (by name):** S1 steps 3–4 and S2 steps 2–4 (the band and groom in a live session on the released plugin); S3 steps 1–4 (`spend.telemetry on` + the prod ingest key, the signed-in `/app/finops`, the Hub line, the non-member 404); the `_Intent:` answer above.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_
- `Roadmap/09-platform-infra/intent-match/RETROSPECTIVE.md:52` · other — **Owed to Daniel:** the one-word `_Intent:` answer for the 23 backfilled epics and this one (about fifteen minutes; `intent-outcomes` counts them toward 20); groom one real idea in Cowork to see the new seed and Stage 3.5/4.6 end to end; read this epic's scored pitch and its rea…
- `Roadmap/09-platform-infra/kickoff-generator-path/RETROSPECTIVE.md:49` · other — **Owed to Daniel:** this retro's `_Intent:_` answer.
- `Roadmap/09-platform-infra/sketch-specs/RETROSPECTIVE.md:80` · other — Owed to Daniel: did we build what was meant?** Answer on its own line as `_Intent: yes_`, `_mostly_` or `_no_`. The builder does not answer this for the product owner. This epic has no `intent_match:` score, so `epic-dod` does not require it.
- `Roadmap/09-platform-infra/template-scripts-consumer-gates/RETROSPECTIVE.md:4` · other — _Intent: owed to Daniel (yes | mostly | no)_
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:52` · other — Run the North Star coach on Golden Frijoles and judge the file (S1 smoke step 2).
- `Roadmap/09-platform-infra/verify-spike/RETROSPECTIVE.md:48` · other — **F7, owed to the product owner:** the delivery cron may not be registered in production (DECISION § 4). Re-checked 2026-10-14: `vercel crons ls` finds no cron jobs, and `delivery.destinations_enabled` is off in production (320 pending on 2026-10-08). Decide whether delivery com…

## signed-in (26)

- `apps/web/e2e/app-auth.spec.ts:121` · auth-path — authed member-vs-owner HTTP path needs a real session (browser smoke owed to Daniel), so the
- `apps/web/e2e/delivery-replay.spec.ts:20` · auth-path — The authenticated /app replay + delivery-history UI is a real-session BROWSER smoke owed to Daniel.
- `apps/web/e2e/delivery-replay.spec.ts:231` · other — browser smoke owed to Daniel; this pins the delivery-level property it depends on.)
- `apps/web/e2e/destinations.spec.ts:30` · auth-path — /app/destinations) is a real-session BROWSER smoke owed to Daniel — the same boundary
- `apps/web/e2e/funnel.spec.ts:77` · other — assertions this test used to make) is the browser smoke owed to Daniel. The JSON endpoint above
- `apps/web/e2e/hub.authed.spec.ts:10` · auth-path — by hand. That is precisely the "browser smoke owed to the product owner" WAYS-OF-WORKING says a
- `Roadmap/01-growth-engine/delivery-back-on/sprint-1.md:127` · other — Go to https://goldenfrijoles.com/app, open **miyagisanchez**, then its destinations (owed to Daniel: signed in). → the `miyagi-merchant-lifecycle` destination shows a *last attempt* less than 5 minutes old.
- `Roadmap/01-growth-engine/delivery-stale-reclaim-uncounted/RETROSPECTIVE.md:47` · other — **Owed to Daniel:** the signed-in look at `/app/destinations/golden-frijoles` (sprint-1 smoke step 6).
- `Roadmap/01-growth-engine/flags-console-parity/RETROSPECTIVE.md:130` · money-path — **Owed to the product owner: the signed-in walkthroughs for all three sprints.** Every surface is credential-gated, so nothing in this repo reaches past the login redirect. Sprint 2's includes the money-path confirm on preview **and** production (cancel both).
- `Roadmap/01-growth-engine/north-star-multi-metric-read/RETROSPECTIVE.md:28` · other — **Owed to Daniel:** the signed-in look at https://goldenfrijoles.com/app/north-star/golden-frijoles (sprint-1 step 2). ~~The `_Intent_` word~~: answered yes on 2026-10-14.
- `Roadmap/01-growth-engine/one-bet-wired/RETROSPECTIVE.md:50` · other — **Owed to the product owner:** a signed-in look at a measured epic's funnel once a bet reports evaluations, and the interactive refine walkthrough of Stage 6b.
- `Roadmap/01-growth-engine/satisfied-ask/RETROSPECTIVE.md:46` · other — **Owed to Daniel (signed in):** smoke steps 2–5, in production only (the funnel trend is off in development and preview). Then switch `bets.satisfaction_ask_enabled` on in production.
- `Roadmap/01-growth-engine/tars-one-model/RETROSPECTIVE.md:52` · other — **Owed to the product owner:** the signed-in look at a feature's funnel with the period choice, ~~and the _Intent_ word~~ (answered: yes).
- `Roadmap/02-commercial/account-from-the-terminal/RETROSPECTIVE.md:57` · auth-path — **Owed to Daniel:** the sprint walkthroughs on production — S1 steps 4–5 (an agent reading install.md and waiting), S2 steps 2 and 4–6 (Google with a fresh account, `gf login` on a clean machine, expiry), S3 steps 2–5 (the Claude app turning a flag off, Get a new URL, Disconnect…
- `Roadmap/02-commercial/app-shell-and-agent-rail/RETROSPECTIVE.md:112` · auth-path — **The SIGNED-IN production walkthrough has not been run.** The anonymous half was verified in production against `102f494` on 2026-08-07: all routes healthy, `/app` 307s to login, the rail markers are **absent** from both anonymously-readable demo dashboards (the dark spec's pro…
- `Roadmap/02-commercial/landing-frijoles-rebrand/RETROSPECTIVE.md:79` · auth-path — **The authed mobile sweep** — still owed to Daniel from `landing-redesign-v2` and untouched here. The `browser` project is anonymous by construction, so a signed-in route would be measured against its login redirect. `assertMobileClean` is exported and ready for an `*.authed.spe…
- `Roadmap/02-commercial/landing-launch-experiment/sprint-4.md:91` · money-path — (money — owed to Daniel) Signed in to a test workspace, https://goldenfrijoles.com/#pricing → Get Growth → Stripe Checkout opens for $49/month
- `Roadmap/02-commercial/one-header-one-name/RETROSPECTIVE.md:51` · other — Both sprints' signed-in walkthroughs on production (sprint-1 steps 1–5, sprint-2 steps 1–6). Preview can't serve a signed-in page.
- `Roadmap/02-commercial/outcome-report-any-product/RETROSPECTIVE.md:24` · other — **Owed to the product owner:** the first aomx push and its signed-in report; re-push medusa-bonsai's report (median 7 → 3.4 days, with the caveat); ~~`npm publish` of CLI 1.7.0 (from agent-legible-horizon)~~ (published 2026-10-14).
- `Roadmap/02-commercial/owed-on-screen/RETROSPECTIVE.md:44` · other — Switching `hub.owed_enabled` on in production and the Sprint 2 signed-in walkthrough (steps 2–5 of `sprint-2.md`).
- `Roadmap/02-commercial/workspaces/RETROSPECTIVE.md:69` · other — **Owed to Daniel by name:** the signed-in prod walkthroughs (S1 steps 1–3 and 5, S2 step 1), and ~~`npm publish` of `@golden-frijoles/cli@0.4.0` (2FA)~~ (published; checked 2026-10-14), then S2 step 2. S2 step 3 is n/a in prod; CI replaces it.
- `Roadmap/09-platform-infra/one-product-project/sprint-1.md:87` · auth-path — (signed in, owed to Daniel) Open https://goldenfrijoles.com/app → the switcher lists golden-frijoles, and its flags list shows auth.terminal_sign_in_enabled
- `Roadmap/09-platform-infra/one-product-project/sprint-2.md:75` · other — (signed in, owed to Daniel) Open https://goldenfrijoles.com/app → the agent rail is on the right
- `Roadmap/09-platform-infra/one-product-project/sprint-3.md:78` · other — (signed in, owed to Daniel) `npx -y @golden-frijoles/cli flags kill console.agent_rail_enabled --env production`, then reload https://goldenfrijoles.com/app → within a minute, the agent rail is gone
- `Roadmap/09-platform-infra/setup-instruments-connects/RETROSPECTIVE.md:42` · other — **Owed to Daniel:** the interactive setup walkthrough (sprint 2) on a scratch copy of a real product repo, and the signed-in Today check on a fresh project (sprint 1 step 3).
- `Roadmap/09-platform-infra/sketch-specs/RETROSPECTIVE.md:66` · auth-path — **Owed to Daniel:** open one rendered wireframe and say whether it reads; and check the signed-in `/app/flags` look (S2 step 4, with the authed gate as a green proxy).

## interactive (20)

- `Roadmap/01-growth-engine/sdk-1-0/RETROSPECTIVE.md:33` · other — **Owed to Daniel:** walkthrough step 3 (a real `identify` + `track` seen in the catalog).
- `Roadmap/01-growth-engine/signals-loop/sprint-2.md:144` · auth-path — (Owed to Daniel by name — needs a real Claude session.)*
- `Roadmap/02-commercial/brand-reveal-error-pages/RETROSPECTIVE.md:33` · other — **Owed to Daniel:** the interactive setup reveal in a real terminal (sprint-1 steps 1–2, scriptable by an agent with a pseudo-terminal). ~~The `_Intent_` word~~: answered yes on 2026-10-14.
- `Roadmap/02-commercial/commercial-shell/RETROSPECTIVE.md:93` · auth-path — The live browser/session smokes owed to Daniel per Sprint 2/3's QA sections (the connector round-trip, the "paste into a chat app" unfurl check) are still outstanding — unchanged by this session, tracked in their respective sprint docs.
- `Roadmap/02-commercial/connect-page/RETROSPECTIVE.md:42` · other — **Owed to Daniel:** the walkthrough (a fresh Google signup lands on Connect with no key; the Claude app turns a flag off with the URL it was given).
- `Roadmap/02-commercial/result-record/RETROSPECTIVE.md:43` · other — The interactive walkthroughs are owed to Daniel (see the sprint files).
- `Roadmap/09-platform-infra/build-view-one-story/RETROSPECTIVE.md:64` · auth-path — **Owed to Daniel, interactive:** smoke steps 4–6, and seeing steps 1–3 drawn in colour in the band. Step 5 is the only check that the reset reads in local time: the live probe was refused twice in the build session.
- `Roadmap/09-platform-infra/build-visualization-claude-mods/RETROSPECTIVE.md:65` · auth-path — **Owed to the product owner:** the interactive-TUI half of the Sprint 4 smoke (watching Progress advance and the status become `In review` across turns, with a status row that a headless `-p` session does not have). The mechanics under it are tested; the pixels are not.
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:52` · other — the clean-machine stranger install (S2 steps 1–2);
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:53` · other — a Telegram test send from your own bot (S3 steps 2–4);
- `Roadmap/09-platform-infra/distribute-what-we-use/RETROSPECTIVE.md:54` · other — standing up one routine at https://claude.ai/code/routines (S4 step 3).
- `Roadmap/09-platform-infra/fund-at-approval/RETROSPECTIVE.md:45` · other — **Owed to the product owner:** the interactive gate (sprint-1 walkthrough steps 2–3), groomed live from a throwaway idea. The scratch end-to-end run covered the scripts, not the conversation.
- `Roadmap/09-platform-infra/golden-frijoles-plugin/RETROSPECTIVE.md:32` · auth-path — **Owed to Daniel: one stranger install on a clean machine** (S3.5 and S5.5, in today's commands): in an empty `git init` folder, paste the prompt from https://goldenfrijoles.com/install.md into Claude Code, let it install the plugin and run `setup`, then refine one idea. Pass =…
- `Roadmap/09-platform-infra/grounded-bets/RETROSPECTIVE.md:38` · other — **Owed to Daniel:** Sprint 1's interactive refine walkthrough (step 2).
- `Roadmap/09-platform-infra/kickoff-generator-path/RETROSPECTIVE.md:46` · other — **Owed to Daniel:** S2 smoke step 5. After `/plugin` update and `/reload-plugins`, `/build cli-think-skills-followups` fills the prompt from `groom/vendor/`. `claude plugin test` covers it 7/7, but an interactive run is the real check.
- `Roadmap/09-platform-infra/live-build-view/RETROSPECTIVE.md:57` · auth-path — **Owed to the product owner (interactive session):** sprint 1 walkthrough steps 1–5 (the band moving mid-turn, a doc edit within 30 s, QA without typing, the Plugin row) and sprint 2 step 5 (`/build`). **`autoUpdate`** reaching 0.26.0 on this machine: headless runs do not trigge…
- `Roadmap/09-platform-infra/session-budget/RETROSPECTIVE.md:47` · auth-path — **Owed to Daniel:** walkthrough steps 2–4 (the line in a real session, the checkpoint flip, a Cowork gate). Only the engine raises `session.measure`, so no repo test can show the line drawing.
- `Roadmap/09-platform-infra/setup-drafts-strategy/RETROSPECTIVE.md:35` · other — **Owed to Daniel:** the interactive setup walkthrough (sprint 1 step 2, sprint 2 steps 1–4) on a scratch copy of a real product repo.
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:54` · other — The interactive coach runs (S1 smoke steps 1 and 3; S2 smoke step 1).
- `Roadmap/09-platform-infra/why-as-a-story/RETROSPECTIVE.md:50` · other — **Owed to the product owner:** the refine walkthrough on a new idea (the Why drafted as a story, the guard, the build view showing it in full) and a Plan gate with the Crew block.

## unsorted (15)

- `apps/web/e2e/app-auth.spec.ts:7` · auth-path — owed to Daniel; here we pin the api-testable negatives that make the boundary real:
- `Roadmap/01-growth-engine/delivery-back-on/sprint-1.md:33` · other — Status:** 🔍 in review — S1.1 + S1.2 built; S1.3 (switch-on) owed to Daniel after the migrations are pushed
- `Roadmap/01-growth-engine/delivery-stale-reclaim-uncounted/RETROSPECTIVE.md:55` · other — (F7, still owed to Daniel).
- `Roadmap/01-growth-engine/signals-loop/sprint-1.md:145` · other — throw a real error in the demo app → watch the signal appear (**owed to Daniel by name**)._
- `Roadmap/01-growth-engine/signals-loop/sprint-2.md:96` · other — `list_tasks` → evidence sanity), **owed to Daniel by name**
- `Roadmap/01-growth-engine/signals-loop/sprint-3.md:122` · other — resolve → revoke → confirm dead) + the production flip, **owed to Daniel by name**
- `Roadmap/02-commercial/agent-legible-horizon/RETROSPECTIVE.md:25` · auth-path — **Owed to the product owner:** ~~`npm publish` of `@golden-frijoles/cli@1.7.0`~~ (published 2026-10-14; from npm, `frijoles horizon --project <slug>` and `whoami`'s "remembered on this machine" work); then `frijoles horizon` in a bound repo and the login line on a machine that r…
- `Roadmap/02-commercial/landing-launch-experiment/sprint-1.md:36` · other — status: in-progress   # rate raised + Clarity MCP live; GA4/Clarity visit check owed to Daniel ---
- `Roadmap/02-commercial/landing-launch-experiment/sprint-1.md:115` · auth-path — (auth — owed to Daniel) Copy the hero prompt, sign up a fresh account from that window → the landing funnel shows visit → copy → signup for one visitor
- `Roadmap/02-commercial/landing-launch-experiment/sprint-1.md:129` · other — Steps 1–6 (consent in a real browser, GA4 realtime, Clarity recording, a real signup) are **owed to Daniel**.
- `Roadmap/02-commercial/owed-on-screen/RETROSPECTIVE.md:45` · other — The result read on the target (open owed checks 96 → 40), due ~2026-11-14: `node scripts/epic-read.mjs --epic owed-on-screen`.
- `Roadmap/09-platform-infra/cli-think-skills-followups/RETROSPECTIVE.md:36` · other — **Owed to Daniel by name:** ~~`cd packages/cli && npm publish` (npm 2FA) for `@golden-frijoles/cli@0.4.1`~~ (published; checked 2026-10-14), then smoke steps 4–5 in `sprint-1.md`.
- `Roadmap/09-platform-infra/screensavers/sprint-1.md:34` · other — Status:** 🔨 building — S1.1 and S1.2 built on `feat/screensavers`; S1.3 (the post and the read) owed to the product owner
- `Roadmap/09-platform-infra/screensavers/sprint-1.md:47` · other — Owed to the product owner: post the screenshot with the line; on 2026-11-30 read `gh api repos/golden-frijoles/skills/traffic/clones --jq .uniques` and stamp the verdict.
- `Roadmap/09-platform-infra/think-skills/RETROSPECTIVE.md:53` · other — The live `--yes` against `golden-beans` with that file, then check the North Star surface (S3 smoke steps 2–3).

