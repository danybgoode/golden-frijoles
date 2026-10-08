# Audit: launch sweep (2026-10-08)

**Status:** findings and proposals; the PO's decisions of 2026-10-08 are recorded at the end and override the body where they differ.
**Continues:** [`ux-ui-audit-2026-10.md`](ux-ui-audit-2026-10.md) (decisions of 2026-10-05) and
[`dogfood-launch-2026-10.md`](dogfood-launch-2026-10.md). The previous session's share link needs a login, so it was
not read; that session's decisions are in these two files and this sweep starts from them.

Every finding below was checked against the repo on 2026-10-08. The file and line are given where they matter.

---

## 1. Skills: 15 + 1 agent → 4 skills + 3 agents

**Today.** The plugin ships 15 skills and one agent: about 24,000 words of `SKILL.md`, and `groom` alone is 516 KB in 48
files (204 KB of it is `vendor/`). The transcripts on this machine (333 sessions) show real use above the baseline
(each session's skill list mentions every skill about 234 times) for only two: `groom` (714) and the
`pr-reviewer` agent (8,937). The three coaches sit below the baseline because they were added later. The ops skills
have no use above the baseline. Their routines call the scripts directly.

**Proposal: the plugin a stranger installs.**

| Kind | Name | Built from | Why |
|---|---|---|---|
| Skill | `setup` | `golden-frijoles` | The front door and the onboarding (§9) |
| Skill | `refine` | `groom` | Idea → Ready, with the gates. Named for the stage it moves work through (decided 2026-10-08) |
| Skill | `strategy` | `pmf-narrative` + `north-star` + `risk-validation` | They already share `coaching.md`, write to the same folder and hand off in a chain. One skill, three chapters |
| Skill | `report` | `standup-post` + `weekly-recap` + `pmo-report` | One skill, `--cadence daily\|weekly\|monthly` |
| Agent | `pr-reviewer` | exists | — |
| Agent | `cold-reader` | `cold-read` | It is already "a separate agent reads the repo under an exclusion list". The sha256 seal stays a script |
| Agent | `smoke-tester` | `live-smoke` | Independent verification of a rendered page. Same pattern as the PR reviewer: its own context, returns a verdict and screenshots |

**Out of the distributed plugin** (to this repo's `.claude/skills/`, or an opt-in `golden-frijoles-ops` plugin):
`build-order-sync`, `doc-hygiene`, `vercel-prune` (assumes Vercel), `babysit-pr`, `prose-draft`. These are our own
operations. A routine's prompt can run the script without a skill.

**Also:** dedupe `vendor/` (`config-registry.mjs` is vendored into both `groom/vendor/lib/` and `hooks/vendor/lib/`), and keep
tests out of the installed archive when `pack-skills.mjs` allows it.

**Release shape:** one plugin 1.0 that carries every rename in this document at once (§2, §10), so a user sees one
breaking change and not four.

## 2. "Grooming": kept on purpose, and worth retiring anyway

**What happened.** Plain Outcome (`naming-spec-plain-outcome-2026-10-04.md:124`) retired `groom` and `grooming` (→
"shape"). Two days later the UX audit's decision 1 replaced Plain Outcome's screen words with plain agile, and that
decision **kept "Grooming" as a stage** (Backlog → Grooming → Ready → Building → QA → Shipped). `gates-in-plain-agile`
D8 repeats it. So the word was kept by decision; it was not missed. `plain-outcome-rename` sprints 1–4 are parked
until they are re-groomed.

**Recommendation: retire it before launch, for a different reason.** The Scrum Guide replaced "backlog grooming" with
**refinement** in 2013, and in UK and Australian English "grooming" mostly means child sexual abuse. Many teams avoid the
word for that reason. That costs us with strangers on a public launch. "Refinement" is still the plain-agile word, so
decision 1's aim (words an agile user already knows) holds.

- Stages on screen: Backlog → **Refining** → Ready → Building → QA → Shipped. Keys stay (`'To groom'`, `'Grooming'` in
  `scripts/lib/stage.mjs` and `apps/web/lib/hub-areas.ts:34`), and only the labels change through the existing
  `stageLabel()`. Same rule as one-header-one-name ("keys untouched").
- Skill: `groom` → `refine` (§1; decided 2026-10-08).
- Footprint: 54 places in `apps/web` and `packages`, plus about 200 in the plugin and template (`groom/SKILL.md` 18,
  `gates.md` 13, `backlog-cadence.md` 12, `SESSION-KICKOFFS.md` 12, …). Extend `check-gate-words.mjs` so the word
  can't come back.
- **The two leftovers you named** (from `gates-in-plain-agile/RETROSPECTIVE.md:52`): (a) the L-bet re-bet question
  ("fund the next wave of …? what does it displace?") in `WAYS-OF-WORKING` and the epic kickoff; (b) the shaped-bet row
  in the root `Roadmap/SESSION-KICKOFFS.md`, which predates fund-at-approval. Both use the words gates-in-plain-agile
  banned (fund, displace), not "grooming". They go in the same chore.

## 3. Owed to Daniel: the sweep

**The script doesn't work here.** `owed-ledger.mjs` is in `skills/template/scripts/` only. It was never copied into
this repo's `scripts/`, so `Roadmap/00-ideas/OWED-LEDGER.json` doesn't exist and `standup.mjs:91` and
`weekly-recap.mjs:445` report "owed ledger not available". It also scans only e2e spec folders, and most owed items
live in retrospectives. Fix: copy it here, add `Roadmap/**/RETROSPECTIVE.md` and `sprint-*.md` to `specDirs`, add the
owner name `Daniel`, add a `kind` per item (below), and run `--check` in CI.

**The count (by hand, today):** 402 owed lines in 218 files. Retros alone have about 45 distinct entries across 38 epics.

| Kind | What | Who | Items (examples) |
|---|---|---|---|
| **Stale, close now** | Already done | agent | npm publishes for CLI 0.3.0 / 0.4.0 / 0.4.1 / 0.6.0 (npm has `@golden-frijoles/cli@0.8.0`); `north-star-multi-metric-read` is merged (#321) but its README says 0/1 in progress; `scenarios-pm-operable` is 10/10 but in progress |
| **Agent, after one setup step** | Signed-in production walkthroughs | agent | console-ia-overhaul, flags-console-parity, workspaces, portfolio-view, one-epic-page, outcome-report-v2, one-header-one-name, connect-page, account-from-the-terminal, result-record, app-shell, design-system-rails' auth path. **Setup, once, by Daniel:** a dedicated production smoke account (member of `golden-frijoles` only) and its saved session for `live-smoke`'s authed mode |
| **Agent, scripted** | Interactive plugin walkthroughs | agent | gates-in-plain-agile, first-run-setup, fund-at-approval, kickoff-generator-path, session-budget, build-view-upgrade, live-build-view, coaches-v2. Skill flows run as `claude -p` in a scratch repo with the plugin from `main`; the band and status line as a tmux `capture-pane`. Daniel gets the screenshots, not the steps |
| **Automate once** | npm publish | GitHub Action | npm trusted publishing (OIDC) on a version tag removes the 2FA step for the CLI, the SDK and the kit |
| **Only Daniel: judgment** | `_Intent_` answers | Daniel | about 25 (the 23 backfilled epics + about a dozen recent retros). Batch them into one ten-minute form: one row per epic, yes / mostly / no |
| **Only Daniel: judgment** | Approvals | Daniel | semantic-lint promote / tune / drop (**due 2026-10-14**), the hub-board surface re-approval (one-header D10), consequence copy, one wireframe read |
| **Only Daniel: authority** | Production credentials | Daniel | the first real share link (pod-report), the signals-loop production write smoke, a connector mint. Policy: named every time |
| **Only Daniel: his accounts and machine** | Ops | Daniel | the Notion `Stage` select, the S4.4 local folder move, the routine key, the golden-beans `.git` repair (check whether it still applies) |

**Before launch, not owed but flagged:** memory records "there is no password-reset flow" (design-system-rails). With
Google sign-in this may not matter. Check it once.

## 4. Public surfaces

| Surface | Today | Fix |
|---|---|---|
| GitHub `danybgoode/golden-frijoles`, description and homepage | "Golden Beans — Unified Growth Engine (standalone), spawned from dobby-foundation's project template" · `golden-beans-gamma.vercel.app` | Pitch line · `https://goldenfrijoles.com` · topics |
| GitHub `golden-frijoles/skills`, description | "…portable ways-of-work for sibling ~/dobby/ projects" | Pitch line + homepage |
| Root `README.md` | Titled `golden-beans`, the Vercel URL, "Two epics shipped", dobby-foundation lore, the template-drift guard | A user README: one-line pitch, the 30-second quickstart (the paste-this prompt from `skills/README.md`), a screenshot (the Outcome report or `/app` Today), what you get in three lines, links (install.md, methodology, docs), the licence table, Contributing. Maintainer material moves to `CONTRIBUTING.md` / `AGENTS.md` |
| `Roadmap/README.md:964-966` | "Private / internal. Not open-source; all rights reserved." | Point to `LICENSE`. **This is the only licence contradiction**: `LICENSE`, `NOTICE`, the package.json files and `Roadmap/README.md:464` already agree (Apache-2.0 for `skills/`, the CLI and the SDK; FSL-1.1-ALv2 for `apps/web/` and the rest; trademark in NOTICE) |
| Landing footer | `apps/web/components/landing/Footer.tsx:20` → `https://github.com/danybgoode` | → the repo |
| `packages/sdk/README.md` | "golden-beans" ×4 | Rename |
| `packages/cli/README.md` | "paste a token from /app/setup/cli" | The device-flow `login` (CLI 0.5.0+) |

**Vercel URLs.** Product code is clean: `getSiteUrl()` and its tests guard it, and the tests that use `vercel.app`
(`site-url-resolve.test.ts`, `safe-redirect.test.ts`) test that rule and stay. Still to retire:
- **Live:** `.github/workflows/roadmap-push.yml:84` and `pod-report-push.yml:44` fall back to the Vercel host when
  `vars.SITE_URL` is unset → `https://goldenfrijoles.com`.
- **Public docs:** root `README.md:13`; `Roadmap/README.md:74, 444, 447, 958`; the GitHub homepage field.
- **History:** about 50 sprint and retro docs. `https://golden-beans-gamma.vercel.app` → `https://goldenfrijoles.com`
  is a safe replacement (same deployment). Preview URLs (`…-danybgoodes-projects.vercel.app`) → `<preview URL>`, which
  also stops publishing the Vercel team name.
- **Platform:** redirect `golden-beans-gamma.vercel.app` to `goldenfrijoles.com` (308) in the Vercel project's domains,
  so old links don't serve a second copy. Dashboard step, Daniel.
- **Guard:** a CI grep for `vercel.app` outside the test allow-list.

## 5. The loader always says "Percolating…"

**Cause.** `NavigationLoader` mounts `GoldenFrijolesLoader` only when a navigation starts. Each mount starts at index 0
(`Loader.tsx:7`, "Percolating…") and moves on every 1,500 ms. Most navigations finish in under 1.5 s, so the first
phrase is all anyone sees.

**Fix (S, about 10 lines + a test).** Start at a random index on mount. That's safe here: the loader never renders on
the server, because `visible` is false at hydration. Keep the last index in module scope so two navigations in a row
don't show the same word. Also: `aria-live="polite"` sits on the rotating phrase, so a screen reader reads out a
stream of nonsense words. Move the live region to the "Loading" text and hide the phrase from assistive tech.

## 6. "Why we're building this" = the hypothesis, cascading from the North Star

**Today.** The Plan gate prints `We bet that <the seed's hypothesis, or the problem in one sentence>`, plus Moves, Target and
Read date. The pitch's `Moves · Tests` line accepts `neither — <why>`. With no strategy, `groom/references/strategy.md`
says "not grounded" and **"never ask for a strategy because of it"**. That's the opposite of the challenge you want.

**This is our own North Star.** Ours is *Proven bets*. The input `grounded_bets_share` is literally "share of bets placed
against an agreed North Star input, with a target and a read date". The greenfield test in `00-strategy/north-star.md`
already lists "`groom` asks which input, by how much, by when" and "the agreed North Star fed straight into
`groom`" as its levers. This work moves our own number.

**The sentence** (North Star Playbook's bet shape, in product prose):

> **We believe that** <the change> **for** <persona, doing their job> **will** <move input X from a to b by the read date>,
> **because** <the insight: their pain or behaviour, with the evidence>. **We'll know when** <the signal: the event the
> target counts>.

Example: "We believe that drafting a North Star from the repo for founders who skip the workshop will raise grounded
bets from 20% to 60% by 30 November, because most founders never run a 90-minute workshop before their first epic.
We'll know when new projects reach an agreed North Star within their first session."

**The cascade in `plan`, before slicing:**
1. Which North Star input does this move? For which persona and job (`pmf-narrative`)? By what mechanism (the
   *because*)? What evidence?
2. If the ask can't name an input with a credible mechanism, the agent **challenges**: two or three reframes taken from
   the strategy. Examples: the same ask aimed at a different input; a smaller cut that tests the riskiest assumption
   (`risk-validation`'s highest domino); or "this is a chore: no hypothesis needed".
3. The founder picks one or overrides. An override is allowed and recorded as `grounded: false — <reason>`, which is
   exactly what `grounded_bets_share` counts.
4. Bug and Chore (Stage 2 class) skip the hypothesis: "Why: keeps <X> working".
5. No strategy at all: offer the inferred North Star (§9), instead of a silent "not grounded".

**Where the sentence goes:** the epic README's first `## Why` line plus frontmatter (`hypothesis`, `moves`, `persona`,
the target and read date result-record already added), the epic page's "Why we're building this", the build band's Why
line, the Outcome report's hypothesis column, and **the flag's description**, so the console says why a flag exists.

## 7. One bet, wired end to end

**What is linked today (checked):**
- epic → `flag_key` (one way; `lib/epic-flag.ts` reads it for the epic page);
- epic → target metric and read date (result-record);
- the feature registry (`/api/v1/features/sync`) carries optional `targetEvent` / `adoptedEvent` / `retainedEvent` →
  TARS (`lib/tars.ts`);
- the served flag registry (`gf flags create`, the console) carries none of those. The SDK emits `flag_evaluated` on
  every evaluation (`event-catalog.ts:26`), and **TARS never reads it**;
- journeys (`lib/journey-definition.ts`) are entity-level stage funnels with no link to flags;
- North Star inputs take `external_push` through `/api/v1/inputs/[key]`, and the SDK has no method for it.

So a flag doesn't know its epic, its hypothesis, its input or its adoption event, and its TARS funnel stays empty
unless someone separately syncs a "feature" with the same key.

**End state.** Approving a plan writes a **bet block** into the epic README (generated, like the Bet block today):
flag key, purpose, hypothesis, input, adopted event, retained event and window, read date. One command (`frijoles bet
sync`, which is CLI-first and something an agent can run) then creates or updates:
- the flag, with the hypothesis as its description and a link to the epic;
- its TARS mapping: **Targeted = users who evaluated it ON** (`flag_evaluated`), Adopted = the declared event,
  Retained = the repeat within the window;
- its link to the North Star input.

The story's acceptance criteria get "the adopted event fires", and the event catalog checks it arrives on preview. On
the read date, `epic-read` already fetches the number and the agent drafts the verdict.

**Journeys, your question.** A flag's TARS *is* a three-stage journey.
- `/app/journeys` gets a generated, read-only section, **"From your flags"**: one funnel per measured flag, named by its
  epic. These are views and not definitions, so nothing can drift.
- **"New journey" stays, for journeys that cross features** (activation, checkout). Creating a journey **does not create
  a flag**. A journey measures an outcome, and a flag is one lever on it. Coupling them would create flags that switch
  nothing. What links them is the bet: a journey can *be* a North Star input ("activation conversion"), and an epic's bet
  can name the journey stage it expects to move.

**Flags as a growth tool (your point).** Change the question from "is this risky?" to "do you want to know if this worked?"
Two purposes, said on screen:
- **Measure:** the default for every Feature epic. An enablement flag, rolled out you → 10% → 50% → everyone. That's what
  makes the read fair and fills TARS.
- **Safety:** a kill switch. Offered by risk, as `kill-switch.md` does today, for chores and fixes too.

The UX audit's decision 7 (the project setting, "the agent suggests per epic") was after launch. The proposal is to bring forward
**only the default suggestion with the Measure purpose**, because it's the lever for the *Efficiency* input. Still open
from the audit: per-user targeting (a flag ON for one signed-in person), which QA in production assumes.

## 8. Scenarios and drills: built, flagged off, and decided to leave

- **Built:** `scenarios-pm-operable`, 10/10 stories (frontmatter still says in progress).
- **Behind three catalog flags, fallback off:** `ops.resilience_scenarios_enabled`,
  `ops.security_simulations_enabled` and `ops.scenario_authoring_enabled` (`lib/gates-decision.ts:79-97`). Production
  values not checked in this sweep; run `flags get` for each.
- **Decided to move to Mutiny** (unification audit D6, 2026-09-23). The chore that does it, `scenarios-freeze` (#36,
  raw), archives the epic, corrects the landing's SecOps claim and deprecates the SDK scenario API. It was never groomed.
- **Contradiction:** the UX audit (2026-10-05) still lists "Scenarios & drills" under Measure. If D6 stands, the nav
  entry goes with the freeze, before launch.

## 9. Onboarding end state: one paste, the whole pipeline

**Principles (from the user's side):** value before account; infer, then confirm (show, don't ask); one review, not
twenty questions; the agent does the legwork through commands; everything reversible and labelled "draft" until the
founder agrees; nothing leaves the machine until pushed.

**The flow (about ten minutes, most of it the agent working):**

| # | Step | The user sees | Exists? |
|---|---|---|---|
| 0 | Paste the prompt | The agent reads `install.md`, says what it installs, waits for a go | yes |
| 1 | Read the repo | "I found 14 shipped things, 2 open pull requests, 9 issues" | yes (`read-repo.mjs`) |
| 2 | Read the product | README, landing copy, routes, existing analytics calls (PostHog, Segment, gtag…), existing flags | **new** |
| 3 | One question | "In one sentence, what is this for and who is it for?" | yes (S1.3) |
| 4 | Draft the strategy | Persona and job, a one-line narrative, the game, **two** North Star candidates with three or four inputs each, each line citing its evidence (a file, an issue). Status `inferred` | **new** (first-run-setup's no-go today) |
| 5 | **One review** | A single summary of five blocks (Product & persona · North Star & inputs · Roadmap · Measurement plan · First bet with its hypothesis), each Keep / Edit / Skip. Rendered in the terminal and as a local page | **new** |
| 6 | Instrument | The agent installs the SDK, adds the events the inputs need, the flag provider and error capture, and opens a **pull request** | **new** |
| 7 | Connect, optional | `frijoles login` → project created → roadmap pushed, North Star synced → **link to `/app/<project>`**, where Today shows "waiting for the first event" and flips when it lands | partly (login, push) |
| 8 | Done | "Your North Star: X (a draft: refine it with `strategy` anytime). First bet ready to plan: Y. Your console: <link>" | **new** |

- **Not signed up:** everything lives in `Roadmap/`. Rather than each agent building its own viewer, ship one:
  `frijoles view`, a static local render of the board and epic pages from the files (the Hub's renderer already reads
  the same contract). After launch; at launch the Markdown reads fine in GitHub or an editor.
- **Re-running setup** refreshes: new history, drift, an inferred strategy that was never agreed.
- **The coaches become "go deeper"** over a draft, not a blank page. That removes the biggest barrier, a 90-minute
  workshop before any value.
- **Watch out for anchoring.** An inferred North Star shapes the founder's answer; that's the reason `cold-read` is
  sealed. Mitigation: two candidates, not one; ask the one-sentence question *before* showing the draft; label it a
  draft everywhere until agreed.

## 10. The CLI name

`gf` collides with oh-my-zsh's git plugin (`alias gf='git fetch'`), which is on by default in its starter config. An
alias wins over a binary, so `gf login` silently runs `git fetch` on a large share of developer machines, the first
command of onboarding included. Memory records it on your machine too.

**Recommendation: `frijoles`.** It's the brand word, reads clearly in docs and agent transcripts, and is free on npm
(`npm view frijoles` → 404; `goldenf` is free too). `goldenf` reads like a typo. Two- or three-letter names will collide
with someone's alias again. Kit: `gf-kit` → `frijoles-kit`. Keep `gf` in `bin` for one deprecation window, printing a
one-line notice. Footprint: about 430 mentions in 108 files, plus AGENTS rule 6. Do it **before** launch, inside the
plugin 1.0 release (§1): a rename after launch breaks users' scripts.

## 11. The SDK

**State:** `@golden-frijoles/sdk` 0.6.0 on npm (2026-09-26). Last source change was 2026-09-24 (experiments-for-humans). 7,600
lines with tests. Surface: `track`, `trackAdoption`, `syncFeatures`, `bucket`, `trackExposure`, `trackFlagEvaluation`,
`trackScenarioExecution`, `captureError`, `captureGlobalErrors`, the snapshot flag provider with local evaluation, and
the flag commands and sync.

**Gaps, by launch weight:**
1. `baseUrl` is required with no default, so every quickstart needs `GROWTH_ENGINE_URL`. Default it to
   `https://goldenfrijoles.com`.
2. `userId` is fixed when the client is built. There's no `identify()` and no anonymous → known, which a browser app needs.
3. No method for North Star inputs (`/api/v1/inputs/[key]` exists): add `input(key, value)`.
4. Flag ↔ TARS (§7): an engine change, plus `adopt(flagKey)` naming in the SDK.
5. The scenario API: deprecate (§8).
6. CJS-only build (both `require` and `default` point to CJS). Add an ESM build.
7. No React/Next helper (`useFlag`). Nice to have at launch.
8. The README says "golden-beans" four times.

**Proposal:** SDK **1.0 at launch** with the surface we promise to keep: `createClient({ apiKey })` with defaults,
`identify`, `flag()`, `track`, `adopt`, `input`, `captureError`. Scenarios deprecated, everything else kept.

## 12. Prioritization for launch: a calculation, not a list

**Today** `build_order` is a hand-set integer, and `BUILD-ORDER.md` sorts by it. Nothing computes it.

**Proposal: a launch score**, WSJF-shaped (cost of delay ÷ size), stored in seed frontmatter and computed by
`build-order.mjs --rank`. A hand override stays allowed, with a written reason.

```
score = (trust + first_run + one_way + unlock) / size          each factor 0 · 1 · 2 · 3 · 5
  trust      would a newcomer bounce or stop trusting us without it?
  first_run  does it shorten a new user's time to a first grounded bet?
  one_way    does it get much more expensive once users exist? (names, public API, vocabulary)
  unlock     how much else waits on it?
  size       appetite S = 1 · M = 3 · L = 8   (or the FinOps quote's midpoint)
```

A mode in config (`prioritization.mode: launch | growth`) switches the factors. **Growth** mode replaces `trust` and `one_way`
with *input leverage × confidence*, which reads the North Star input each bet names (§6). That's the RICE idea, in our
own terms.

**Applied (the factors are proposals to argue with):**

| # | Work | trust | first_run | one_way | unlock | size | score |
|---|---|---|---|---|---|---|---|
| 1 | **Launch trust sweep** (§4, with the loader fix §5 riding along) | 5 | 2 | 3 | 1 | S 1 | **11** |
| 2 | **CLI → `frijoles`** (§10) | 3 | 3 | 5 | 1 | S–M 2 | **6** |
| 3 | **Plugin 1.0:** 4 skills + 3 agents, `groom` → `plan`, Grooming → Refining, the two leftovers (§1, §2) | 3 | 4 | 5 | 3 | M 3 | **5** |
| 4 | **SDK 1.0** (§11) | 3 | 4 | 5 | 2 | M 3 | **4.7** |
| 5 | ~~Scenarios freeze~~ → **Scenarios light-up** (decision 3 below) | 2 | 1 | 0 | 1 | S–M 2 | **2** |
| 6 | **Grounded bets:** the hypothesis cascade in `plan` (§6) | 1 | 4 | 2 | 4 | M 3 | **3.7** |
| 7 | **Setup infers the strategy and shows one review** (§9 steps 2–5) | 2 | 5 | 1 | 2 | M 3 | **3.3** |
| 8 | ~~Night garden design system~~ **held** for more refinement (decision 5 below) | | | | | | held |
| 9 | **One bet, wired:** flag ↔ epic ↔ input, TARS reads `flag_evaluated`, "From your flags", Measure default (§7) | 1 | 5 | 2 | 3 | M–L 5 | **2.2** |
| 10 | **Setup instruments and connects** (§9 steps 6–8), needs 9 | 2 | 5 | 0 | 1 | M 3 | **2.7 → after 9** |
| — | **Verification track, in parallel:** owed-ledger wired, smoke account, the agent walkthrough sweep, the Intent form (§3) | | | | | | runs beside 1–10, ends before launch |

Dependencies override the score where they must: 10 needs 9, 9 reads the bet block from 6, 7 feeds 6's "no strategy"
path. Items 2 and 3 ship as **one** release (one breaking change for users). The scores put the cheap, one-way, public
work first and the deep pipeline last, which is the right shape for a launch: fix what strangers see and what's
expensive to change later, then build the value that compounds.

## Decisions for the PO

1. Retire "Grooming" → **Refining** on screen, and `groom` → `plan` for the skill? (§2)
2. The CLI name: **`frijoles`** or `goldenf`? (§10)
3. Does D6 stand (scenarios and drills go to Mutiny), so the freeze ships before launch? (§8)
4. Bring forward the **Measure** flag as the default suggestion for every Feature epic? (§7)
5. Accept the launch score and its factors, then re-score with your numbers? (§12)
6. One production smoke account for the agent's signed-in walkthroughs? (§3)

## Decisions (PO, 2026-10-08)

1. **Retire "Grooming" → "Refining"** on screen. The skill is **`refine`** (not `plan`): it moves an idea from Backlog
   through Refining to Ready, so it carries the stage's name, and "plan" competes with Claude Code's own plan mode in
   natural language ("let's plan this").
2. **CLI: `frijoles`** (kit: `frijoles-kit`), in the same 1.0 release as the skills.
3. **D6 is reversed: scenarios and drills stay and are switched on.** `scenarios-freeze` is dropped. The switches are
   already Golden Frijoles catalog flags (`ops.resilience_scenarios_enabled`, `ops.security_simulations_enabled`,
   `ops.scenario_authoring_enabled`, AGENTS rule 6), and the scenario definitions point at a fault-injector flag version
   in Golden Frijoles' own registry (`scenarios-pm-operable` README). The light-up is a chore, not a flip: the epic's
   own rule is "flip per environment only after a synthetic-cohort run has been verified end to end, including the
   kill path"; its high-risk fresh review is still owed; its one production target is revoked; and the epic is 10/10
   but never closed. The SDK scenario API stays (not deprecated), and so does the Measure entry.
4. **Measure flags are the default suggestion for every Feature epic**, before launch.
5. **The launch score is accepted.** Night garden is **held** for more refinement. The Bean is already built
   (`design-system/bean.tsx`, by result-record S2.3) and shows on the board card, the epic page and the Outcome
   report; the rest of night garden (palette and fonts, icons, control states, density, public pages) is unbuilt.
6. **A production smoke account** for the agent's signed-in walkthroughs: credentials in the macOS Keychain, read
   in-process by the runner, never on disk or in a transcript.

**Order after the decisions:** 1 trust sweep (+ loader) · 2+3 the 1.0 release (`frijoles`, 4 skills + 3 agents,
`refine`, Refining) · 4 SDK 1.0 · 5 grounded bets · 6 setup drafts the strategy · 7 one bet wired (with the Measure
default) · 8 scenarios light-up · 9 setup instruments and connects. Verification track in parallel.
