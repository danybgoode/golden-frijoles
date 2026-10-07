---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-07T18:38:23Z"
slug: gates-in-plain-agile
title: "Gates in plain agile"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 68      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Gates in plain agile

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/gates-in-plain-agile.md`](../../00-ideas/seeds/gates-in-plain-agile.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
The first run happens in the terminal, and its gates speak our bookkeeping: groom ends with "approve (fund +
scaffold) · approve, don't fund · change something" over a Bet block of cycle, position and displaced; the coaches
ask to mark files `agreed`; the build hand-off says kickoff and epic mode. Each gate has its own shape (F42). This
epic gives the Strategy, Plan and Build gates one shape (where to read it, what's decided for you, the two or three
things only you decide, then Approve · Park it · Change something) in decision 1's plain agile words, and keeps the
bookkeeping words off the screen. Files and their values don't change. Launch epic 7 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md); its own epic, so `coaches-v2` stays
after launch. Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** a founder who knows agile runs setup to the first `/build` without asking what a word means.

## Platform-first note
No runtime change. The gates are text the skills print; the records behind them (`fund.mjs`'s cycle row,
`underwritten_by`, `status: agreed`, the scaffold) stay exactly as they are. Only what a person reads changes.

## Architecture lock (2026-10-07, verified against live code and live data)

**Live facts read before the lock.** The Plan gate's words live in three places today: groom `SKILL.md` Stage 7.1
(the Bet block and "approve (fund + scaffold) · approve, don't fund · change something"), `references/funding.md` (the
Bet block, verbatim) and the WAYS-OF-WORKING template (§ Betting & appetite, "approve, don't fund") plus the three
`SESSION-KICKOFFS.md` copies (root, `skills/Roadmap/`, `skills/template/Roadmap/`), which already differ from each other
in other sections and have no parity check. Groom `SKILL.md` is at **exactly** its 210-line prose budget (skills CI), so
anything added there must be moved out. The canvas (private, read 2026-10-07: `Gates`, `PlanGate`, `StrategyGate`,
`Approved`) is the design source. **No flag is created at grooming** (`kill-switch.md`: a flag is a user story), there is
**no email digest** (the scheduled reports post to Telegram only, setup's *Notify setup*), there are **no one-pagers**
(that is `coaches-v2`), and the epic page is `/hub/<project>/epic/<slug>` (live route), whose base the config already
holds as `board.hubUrl` (`null` by default). A North Star input carries its event only in the sync payload
(`"valueSource": "telemetry_event"`, `"sourceEvent"`), which `strategy.mjs` parses today but drops.

- **D1 — One home: `groom/references/gates.md`.** It holds the shape (Read it · Decided for you · Only you decide, two or
  three · numbered options), the screen-word table (On screen | Behind it, files keep these | Never on screen), the
  retired-options table (Was | Now), and the three gates as fenced blocks: ```` ```gate strategy ````, ```` ```gate plan ````,
  ```` ```gate build ````. Groom Stage 7/8, `funding.md`, setup's routing and the three coaches **point** to it; none
  restate a gate. Groom `SKILL.md` stays ≤ 210 prose lines: the Bet block and the Stage 8 hand-off move out.
- **D2 — The Plan gate is the canvas PlanGate.** In order: the plan's path (the seed, as a path); "We bet that <the
  seed's `hypothesis`>." (no hypothesis → the problem in one sentence; never invented); then aligned lines — Moves (the
  target metric's name, "(your North Star input)" when grounded; omitted with no target), Target (from → to), Read date
  (`read_date`, or "30 days after it ships"), Size (appetite and the quote, "about $lo–hi of agent time"), Sprints (titles
  and the user-story count), Flag (`flag_key`, or "none: <why>"), Measured by (D4); "Decisions only you can make" (the
  two or three still open; none → the line is left out); then **1 Approve the plan · 2 Park it (it stays in the backlog,
  groomed) · 3 Change something**; then "What this pushes back: <what waits>. It builds next | after <title>." The
  budget line follows, unchanged.
- **D3 — Park it is "approve, don't fund", word for word in behaviour.** The seed stays `status: ready`; `fund.mjs` and
  `scaffold-epic.mjs` do not run. **Approve the plan** runs exactly today's sequence: `fund.mjs --displaced "<what waits>"
  --next | --after <slug>`, then `scaffold-epic.mjs`, then the one path-scoped commit. The cycle file is chosen by
  `fund.mjs` from the month, as today, and is never shown. `fund.mjs`, `scaffold-epic.mjs` and every key they write are
  unchanged (`scaffold-epic`'s commit message `plan(<slug>): fund + scaffold epic` is a git record and stays).
- **D4 — "Measured by" comes from the North Star file, never from the agent.** `strategy.mjs` keeps `sourceEvent` on
  each input whose `valueSource` is `telemetry_event` and prints it on the inputs line (`key ("name", event x)`), with a
  test. The gate shows the line only when `target_metric` is such an input; otherwise it is left out. This is the
  epic's one script change in S1.
- **D5 — The Build gate is the canvas Approved, with two corrections.** "✓ Plan approved: <title>", its sprints and
  user stories in `<epic dir>`, committed; **Flag: "planned: <key> (one user story creates it, off)"** — not "created"
  (groom creates no flag, D11). "Start building whenever you're ready: `/build <slug>`" (Claude Code with the plugin;
  anywhere else the kit's `emit-epic-kickoff` command, as a command). "Follow it here: `<board.hubUrl>/epic/<slug>`"
  only when `board.hubUrl` is set. Optional items **only when missing**, each detected by a command: gh (`gh auth
  status`), Codex (`command -v codex`), Digest = **the Telegram report** (missing when `TELEGRAM_BOT_TOKEN` is in neither
  the environment nor `.env.local`: a key-name check, never the value; the fix is setup's *Notify setup*), Claude app
  (only when the project is linked to Golden Frijoles: "the console's Setup has your link"; no detection, so it is a
  line, never an option). Options: **1 Start building now · 2 <the first missing item> · 3 Later**; nothing missing →
  **1 Start building now · 2 Later**. Groom stays planning-only: "Start building now" tells the person to type
  `/build <slug>` (or prints the kit command's output elsewhere), as Stage 8 does today.
- **D6 — The Strategy gate is the canvas StrategyGate, in setup's idea route.** Setup Stage 2 (`idea`/`plan` → "the
  strategy coaches first") offers the strategy step; the agent writes the three files from the conversation and the repo
  (each coach's template and its write rules, `status: draft`), then shows the gate: Read them (`Roadmap/00-strategy/`,
  the file count; the one-pagers line is left out until `coaches-v2` makes them); Decided from the repo (the problem,
  the promise, how you charge, from what the files say); up to three decisions (who first, the North Star, the riskiest
  assumption); "Answer them here, or:" **1 Approve the strategy · 2 Change something · 3 Coach me through it, one piece
  at a time**. Approve sets `status: agreed` in each file's frontmatter, nothing else; Change leaves `draft` and revises
  in place; Coach me runs `pmf-narrative` → `north-star` → `risk-validation` in their full step-by-step mode, then shows
  the gate again. The canvas says `Roadmap/strategy/` and "goes to the top of your Home": the folder keeps its name
  (no-go) and nothing is sent to the engine (the North Star sync stays the person's own step), so neither is claimed.
- **D7 — The coaches never ask to mark a file agreed.** Each coach's *Status* line: write `status: draft`, and approval
  happens at the Strategy gate (groom `references/gates.md`). Overwriting a file already approved still shows what would
  change and asks first. `risk-validation`'s hand-off shows the Strategy gate when any strategy file is not yet approved,
  then offers grooming.
- **D8 — The screen words.** On screen: Epic, Sprint, User story, Approve, Park it, Backlog → Grooming → Ready →
  Building → QA → Shipped, Proven · Disproven · Unclear, Flag, "What this pushes back", Start building. Never on screen:
  **fund, scaffold, underwritten, displaced, cycle, kickoff, epic mode, agreed, draft** (and their inflections). "Bet"
  may appear only as "We bet that …". The words are checked inside gate blocks only; inline code (paths, keys, values,
  commands) and `<placeholders>` are exempt, so `Roadmap/00-ideas/seeds/…` and `status: agreed` stay legal.
- **D9 — The check: `skills/scripts/check-gate-words.mjs` + its test** (plugin-repo tooling; it does not ship to
  projects). (a) The never-on-screen list is parsed from `gates.md`'s table, never restated in code; (b) no gate block
  in a scanned file contains one; (c) no scanned file contains a retired option (`gates.md`'s Was column) outside that
  table; (d) a gate block with the same name in two files must be byte-identical. Scanned: every `*.md` under
  `plugins/`, `template/Roadmap/`, `kit/dist/skeleton/` and `skills/Roadmap/`; `--also <path>` adds the root repo's
  `Roadmap/WAYS-OF-WORKING.md`, `WAYS-OF-WORKING.template.md` and `SESSION-KICKOFFS.md`. Wired into
  `skills/.github/workflows/ci.yml` (then `node scripts/render-skills-ci.mjs`) and the root `ci.yml` static gate.
- **D10 — The copies.** The WAYS-OF-WORKING template says "Approve the plan" and "Park it" where it names the options;
  the records it explains (the cycle row, `underwritten_by`) stay, because that doc explains the files, not the screen.
  Then re-render: `skills/Roadmap/`, the root `Roadmap/` (`render-ways-of-working.mjs` in both, the root template
  `cmp`-equal to the skills one) and the kit skeleton (`build-kit.mjs`). The three `SESSION-KICKOFFS.md` copies change
  the same lines the same way (the option names and the "Park it" phrase); their other differences are left alone.
- **D11 — Records and the product are untouched.** No `apps/web` change, no migration, no flag, no new state, no new
  step. File values, keys, folders and script names stay.
- **D12 — Release.** S1 ships plugin + kit **0.35.0**, S2 **0.36.0**, each with its `CHANGELOG.md` section
  (`skills/RELEASING.md`); the template and skeleton copies ride in the same release.
- **D13 — The "groom run on a fixture seed".** No harness drives a skill end to end in CI. Each PR records a builder
  walk in a scratch repo with a fixture seed (and, in S2, fixture strategy files): the gates as printed, and for Park it
  the seed's `status:` and `git status` before and after. The interactive walkthrough stays owed to Daniel.
- **D14 — Routing.** Low risk, prose-heavy, one builder: the architect (Claude) builds both sprints in place (the only
  session in this checkout), stacked `feat/gates-in-plain-agile` → `-s2`. Review per PR through
  `review-route.mjs --builder claude`.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/skills/groom/SKILL.md` (Stages 7 and 8), `groom/references/funding.md` (the Bet
  block), `groom/references/kill-switch.md`, `fund.mjs`, `session-line.mjs`.
- `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md` (setup, Stage 3 routing), the `pmf-narrative`,
  `north-star` and `risk-validation` skills.
- `skills/template/Roadmap/{WAYS-OF-WORKING,SESSION-KICKOFFS}.md`, `skills/kit/dist/skeleton/`,
  `Roadmap/WAYS-OF-WORKING.md`, `scripts/check-template-drift.mjs`, `scripts/semantic-lint.mjs`,
  `scripts/lib/prose-guard.mjs`.
- From launch epic 4: the target, the read date and the groom question.
- Design source: the private canvas: Gates, StrategyGate, PlanGate, Approved.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 One shape for every gate | low |
| 1 | S1.2 The Plan gate, in plain words | low |
| 1 | S1.3 The Build gate | low |
| 2 | S2.1 The Strategy gate | low |
| 2 | S2.2 The bookkeeping words stay off the screen | low |

**No-gos:** file values, frontmatter keys, folder and script names (the folder move is `plain-outcome-rename` sprint
4) · the Set up gate (epic 2) and the Result gate (epic 4) · the `coaches-v2` improvements · anything in the console ·
new gates or steps.

**Rabbit holes** (detail in the seed): "Park it" is today's "approve, don't fund", no new state · the record still
says what it pushed back · many copies, drift and parity checks stay green · "bet" stays a concept, never a stage or
button · strategy approval writes `status: agreed` per file · "Measured by" never invents event names.

**Flag:** none. Risk low. Rollback is a revert and a plugin release.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green; the plugin release follows `skills/RELEASING.md`, and the template
and kit copies ship in the same release.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
