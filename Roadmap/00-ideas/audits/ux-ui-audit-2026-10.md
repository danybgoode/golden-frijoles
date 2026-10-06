# Audit: UX/UI of the human GUI (2026-10)

**Status:** decisions recorded 2026-10-05 by the product owner. Planning only: nothing here is built.
**Brief:** [`HANDOFF-ux-ui-audit-2026-10.md`](HANDOFF-ux-ui-audit-2026-10.md).
**Visual review (private canvas):** https://claude.ai/artifact/5YwHADjrZSQEFrRQzznKSa. Page 0, "The product today",
holds the route map, the words, the navigation and the upgraded pages; pages 1–6 hold the foundation and the journeys.
**Findings:** F35–F46 in [`dogfood-launch-2026-10.md`](dogfood-launch-2026-10.md).

## How this ran

The first pass designed a new console from user journeys and retired pages without checking what exists. On
2026-10-05 the PO stopped it: the Hub and its routes, the Measure and Ship pages, ⌘K, Destinations, Share links and
the shipped Portfolio view (#41) were missing. The work restarted from the code: (1) a map of every route as it is,
(2) one name per thing, (3) one way around, (4) existing pages upgraded in place, each shown next to a list of where
every part comes from. **Rule from here on: every UX proposal starts from the route map, shows today next to the
proposal, and lists what it removes. Nothing is retired without a decision the PO named.**

## Decisions

### 1. Vocabulary: plain agile, with the bet built in
Plain · Outcome ([`naming-spec-plain-outcome-2026-10-04.md`](naming-spec-plain-outcome-2026-10-04.md)) is
superseded **for words on screen**. The PO, a daily user, needed a comparison table to read it; agile-fluent users
would too. The outcome idea stays as framing, not as new names.

| What it is | On screen | Where the bet shows |
|---|---|---|
| A raw ask | Idea, in the backlog | — |
| A piece of work | **Epic** | Every epic carries its bet: why we think it works, the number it should move, when we read it |
| A chunk you can ship | **Sprint** | — |
| What a person gets | **User story** ("As a…, I want…, so that…") | Cut as vertical slices while grooming; never a label |
| Size | Appetite S · M · L | — |
| The approval | **Approve** | The record says what it pushed back (funding and displacement, in one line) |
| Stages | Backlog → Grooming → Ready → Building → QA → Shipped | Then the read date |
| The result | Proven · Disproven · Unclear | "Did the bet pay off?" Gold only for Proven |
| On/off in production | **Flag** | Rolling out to part of the users is what lets the result be read fairly |

Screen words only: file fields (`status: scaffolded`), folders (`00-ideas/seeds/`) and URLs stay.

### 2. One name per thing (screen labels)
Features → **Flags** (and "On in Production" → "Flags on") · Experiments → **A/B tests** · Hub "Report" / "Pod
report" → **Outcome report** · Setup "Destinations" → **Webhooks** (Horizon keeps "destinations") · "Your workspace"
→ **Portfolio** · Tasks → **Agent queue** · Activity → **Flag history** · Board "To groom" → **Backlog**, "Ready to
build" → **Ready**. **Kept:** FinOps, Today, North Star, Journeys, Scenarios & drills, Scheduled changes, Roadmap,
Board, Horizon, and Portfolio's Consider · Operate · Exit (a product's life, labelled "product stage").

### 3. One way around
- One header for `/app` and `/hub`: **Today · Plan · Ship · Measure · Setup**, the loop's order ("Plan, ship and
  prove it paid off").
  - Today: Today, Agent queue.
  - Plan: the Hub's Roadmap, Board, Horizon.
  - Ship: Flags, A/B tests, Scheduled changes, Flag history.
  - Measure: North Star, FinOps, Journeys, Scenarios & drills, Outcome report.
  - Setup: Connect your agent, CLI access, Keys, Webhooks, Share links.
- Portfolio and the board across all products sit at the top of the product switcher.
- ⌘K finds epics and products as well as pages and flags.
- The epic page is the crossroads: links both ways to its flag, A/B test, North Star and FinOps row.
- Removes only the Hub's separate frame and its "back to the product" button. No page, no URL.
- **Reverses** `design-system-rails` DD2 (the Hub kept out of the header).

### 4. One view per epic
The Board's card view (`?card=`) opens the epic page (`/hub/<p>/epic/<e>`). The merged page keeps: the title and
stage, area/risk/appetite/build order (as chips, replacing the tiles), the goal and bet (as "Why we're building
this", plus target and read date), the sprint list, the commands for the stage (one primary line, the rest under
More), spend from FinOps, the documents, the freshness note. New: a stage track and the flag's state.

### 5. Outcome report, at product level
Today's Pod report, renamed and moved under Measure; same URL, share links, and Portfolio's link per product. It
leads with whether the product is paying off (North Star actual against expected over time, epics marked where they
shipped), then four figures with their expected values. Every section says what it is and why to care, and links
to its own page. The epics table: epic and its hypothesis · metric expected → actual with the gap · result · spend
against quote with the gap (from FinOps). The ladder section explains the **Steps of AI Adoption**
([`references/Steps-of-AI-Adoption.md`](../../../references/Steps-of-AI-Adoption.md), which `maturity-lens.mjs`
already scores against): its five steps, the next step's criteria, and a line for the agent to suggest how to move up.

### 6. Design language
Night garden: Night/Soil grounds, Paper text and actions, Moonlight for the agent, Sprout for live, Ember for broken
only, Gold for proven only. Newsreader, Hanken Grotesk, IBM Plex Mono. Beans that look real (proven, growing,
disproven, unclear). One stroke icon set. Every control has rest, hover, focus, pressed, working, done and not-ready
states. Density: one idea per card, a figure or graphic first and one short line, an icon on every card,
explanations behind a disclosure, more space.

### 7. Designed for after launch (not in the launch scope)
- **Flags.** A project setting:
  - flags for new epics: the agent suggests per epic (default), every epic, or only when asked;
  - merging: when checks pass, or wait for me.

  QA happens in production with the flag on for the owner only, so no staging is needed. The rollout goes you →
  10% → 50% → everyone, and every change asks for a reason. Auto-off at an error limit and duration; overriding it
  keeps auto-off on and still emails next time.
- **Incidents:** the 3am email, the tripped flag, and the agent's "while you were away" with the fix offered as a
  story. Proposed rule: broken hours are left out of the reading and the read date moves (confirm at grooming).
- **A/B tests:** proposed at grooming when nobody knows which version works. The numbers stay hidden until the test
  can be called (Peek warns), "split is fair" in plain words, and a called result shown as intervals.

## Launch-critical epics, in grooming order

Pages outside these journeys keep their layout and functions at launch. Epics 1 and 3 restyle and rename them, so
nothing looks like a different product.

| # | Epic | Why here | Size |
|---|---|---|---|
| 1 | Night garden in the shared design system (token values, Bean, Icon, states) | Everything sits on it; the whole product changes look at once | M |
| 2 | Account from the terminal: one prompt that reads `install.md` first, `gf login` browser sign-in with Google and GitHub, a connector that writes | The front door; independent of the console; Google has setup time outside the code. Runs alongside 3–6 | L, high |
| 3 | One header and one name per thing (Plan section, ⌘K over epics and products, Portfolio in the switcher, renames) | Joins the two halves; replaces #61's scope | M |
| 4 | The result record: target, read date, verdict per epic | Feeds the epic page, the Outcome report and Today; spend already comes from FinOps | M |
| 5 | One epic page (card → page, Why, stage, stories, commands, spend, docs, flag state) | The centre of the building journey | M |
| 6 | Outcome report v2 | "Did it pay off", for the PO and anyone with the link; needs 4 | S–M |
| 7 | Gates in plain agile in the setup and groom skills | Finishes the first run in the terminal; fold into #62 coaches-v2 | M |
| 8 | Build view upgrade (Why row, progress by sprint, stage track, link to the epic page) | Needs 5 | S |

**After launch, as they are today (restyled and renamed by 1 and 3):**
- Pages: Flags and A/B tests, Scheduled changes, Flag history; North Star, FinOps, Journeys, Scenarios & drills; the
  Setup subpages; Horizon; Agent queue; Portfolio and the board across all products.
- Upgrades: the flag upgrades in decision 7, the incident flow, the A/B flow, several products and a team, and
  phone layouts.

## Groomed (2026-10-05)

All nine launch-critical epics are groomed, funded in `Roadmap/bets/wave-2026-10.md` and scaffolded, in build order:

| # | Epic | Appetite · risk | Flag |
|---|---|---|---|
| 61 | [`night-garden-design-system`](../../02-commercial/night-garden-design-system/README.md) | M · low | none |
| 62 | [`account-from-the-terminal`](../../02-commercial/account-from-the-terminal/README.md) | L · high | `auth.terminal_sign_in_enabled`, kill switch, born on |
| 63 | [`one-header-one-name`](../../02-commercial/one-header-one-name/README.md) | M · low | none |
| 64 | [`result-record`](../../02-commercial/result-record/README.md) | M · low | none |
| 65 | [`one-epic-page`](../../02-commercial/one-epic-page/README.md) | M · low | none |
| 66 | [`outcome-report-v2`](../../02-commercial/outcome-report-v2/README.md) | M · low | none |
| 67 | [`gates-in-plain-agile`](../../02-commercial/gates-in-plain-agile/README.md) | M · low | none |
| 68 | [`first-run-setup`](../../02-commercial/first-run-setup/README.md) | M · low | none |
| 69 | [`build-view-upgrade`](../../02-commercial/build-view-upgrade/README.md) | S · low | none |

The canvas First run flow (page 2) is covered by `account-from-the-terminal` (frames 1–6, amended 2026-10-05),
`first-run-setup` (7, 8a, 8b) and `gates-in-plain-agile` (9–11).

Then `plain-outcome-rename` (#70, sprints 1–4, to be re-groomed) and the rest of the queue, order kept.

## What this supersedes
- [`naming-spec-plain-outcome-2026-10-04.md`](naming-spec-plain-outcome-2026-10-04.md): screen vocabulary (decision 1).
- `plain-outcome-rename` (#61): re-scope to decision 2, as launch epic 3. Groomed 2026-10-05 as a split: the new
  `one-header-one-name` takes its sprint 5; sprints 1–4 wait for after launch and are re-groomed to plain agile first.
- `coaches-v2` (#62): ~~fold the gates in plain agile, launch epic 7~~. Groomed 2026-10-05 as its own epic,
  `gates-in-plain-agile`; `coaches-v2` stays after launch, unchanged.
- The canvas's first console draft (page 3) and the epic frames on pages 4–6: superseded by the page 0, step 4 frames.

## Open questions
1. ~~The epic page's commands as plain lines instead of today's shorthand.~~ **Decided 2026-10-05: plain lines**;
   the shorthand keeps working (`one-epic-page` S1.3).
2. ~~Overspend shown in Ember on the Outcome report.~~ **Decided 2026-10-05: neutral**, "▲ $3.30 over $5–8"; Ember
   stays for broken only (`outcome-report-v2` S1.3).
3. Can a flag be turned on for one signed-in person? Percentage rollout and kill exist in the engine; per-user
   targeting is assumed by the QA design and not yet checked.
4. The incident rule in decision 7.
