---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-08T04:12:30Z"
slug: coaches-v2
title: "Coaches v2: a cold read first, then coaches that read each other, save as they go and leave one-pagers"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 3
stories_total: 9   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 72    # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Coaches v2: a cold read first, then coaches that read each other, save as they go and leave one-pagers

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/coaches-v2.md`](../../00-ideas/seeds/coaches-v2.md)
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
The three coaches got this product to an agreed narrative, North Star and riskiest assumption, and surfaced 15 problems a
stranger would hit (dogfood-launch-2026-10). This bet makes the sequence cohesive (a cold read first, coaches that read
each other, save as they go, check the product and offer options), shows progress, and leaves three one-pagers a maker
can consult in seconds. It builds on bet A's names. Pitch: `00-ideas/seeds/coaches-v2.md`. Moves: grounded_bets_share ·
Tests: Value proposition.

## Platform-first note
Strategy lives in files the maker owns (`strategy/`), read by `groom/strategy.mjs`; the engine's North Star sync is
unchanged. The other-family runner exists (`scripts/lib/cross-agent-cli.mjs`). No engine change.

## What already exists (reuse, don't rebuild)
- The three coach skills, their templates and `strategy-templates.test`; `groom/strategy.mjs`
- `scripts/lib/cross-agent-cli.mjs` (Codex, Gemini, Mistral)
- Reference implementations from this run: `00-strategy/blind/2026-10-04-compare.md`, `north-star/nsm.py`,
  `business-model-scenarios.md`, the dogfood log's findings F2–F5, F7–F9, F11, F13–F15, F17, F19, F22

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 The cold-read skill | low |
| 1 | S1.2 The compare | low |
| 2 | S2.1 One shared coach reference | low |
| 2 | S2.2 Options, research and current use cases | low |
| 2 | S2.3 Delegation, the product check and private strategy | low |
| 2 | S2.4 Ladder up: an example becomes a need, with evidence | low |
| 3 | S3.1 Per-coach fixes | low |
| 3 | S3.2 Standalone one-pagers | low |
| 3 | S3.3 Voice, sources and one copy | low |

## Deploy order
After bet A's wave 1 (plugin 0.28.0), as the next plugin minor. No engine deploy. The value proposition sheet ships
without the VPC; the VPC only with Strategyzer's permission (owed to the PO).

## Architecture lock (D1…D13, verified 2026-10-08 against live code, before any builder started)

Groomed 2026-10-04; ten epics shipped since. What the live system changed is corrected here, out loud.

**Deviations from the pitch (scope the live system disproves):**
- **Bet A never shipped.** `plain-outcome-rename` (#71) is `scaffolded`, moved behind launch (`bets/wave-2026-10.md`), and
  its Plain · Outcome words were reverted toward plain agile (dogfood F42, 2026-10-05). The pitch's "build on bet A's
  names (`narrative`, `riskiest-assumption`, `strategy/`)" and "after plugin 0.28.0" are both void. → **D1.**
- **`agreed` is no longer a coach's word.** gates-in-plain-agile (2026-10-07) made the **Strategy gate**'s Approve the
  only writer of `status: agreed` (groom `references/gates.md`). "Each coach regenerates the sheets when its file reaches
  agreed" therefore happens **at the gate**. → **D10.**
- **Setup now writes the three drafts from the repo** (first-run-setup, 2026-10-07) before the gate. The cold read is
  offered by the coaches and the gate, never forced into setup. → **D3.**
- **"Fixture conversations" cannot run in CI** — the coaches are prose, and no model runs in the gate. Every behaviour
  is pinned two ways instead: the SKILL/reference text carries the step (static spec), and every deterministic part
  (seal, compare, private folder, persona labels, one-pagers) is a pure function with fixtures. The S2.4/S3.1 "fixture
  conversation" acceptance is met by worked examples in the shared reference plus those specs, and says so.
- **"The send command's CLI version taken from the kit" is impossible as worded** — the kit does not know the CLI
  version (the CLI pins the kit, not the reverse: CLI 0.8.0 pins kit 0.38.0). Two skills pin the CLI today and both
  are stale (`north-star` @0.3.0, `golden-frijoles` @0.7.0; published 0.8.0). → **D12.**
- **The reference examples are private.** `Roadmap/00-strategy/` is excluded locally (`.git/info/exclude`) in this
  public repo; the PO's strategy, the blind run and `one_pagers.py` are design references only. **No test fixture copies
  them**; fixtures are a synthetic product (public-monorepo D7).

**D1 · Names.** Build on today's names: `pmf-narrative`, `north-star`, `risk-validation`, `Roadmap/00-strategy/`. The new
skill is `cold-read`; new paths are `Roadmap/00-strategy/cold-read/` and `Roadmap/00-strategy/one-pagers/`. Renaming
stays bet A's job, done once there.

**D2 · Cold read = one skill + one kit script.** `skills/.../cold-read/SKILL.md` drives it; the brief (exclusion list,
mandatory sections) is ONE kit file, `cold-read.prompt.md`, read by both `run` and `brief --out` (*amended at review of
#314*: a `references/brief.md` would have been a second copy); `template/scripts/cold-read.mjs` (byte-copied
to `scripts/`, kit-carried via `requires_scripts`) does the deterministic part: `brief` (prints the agent's prompt with
the exclusion list) · `run` (Codex in a read-only sandbox when reachable; exit 3 + one line "no other family reachable"
otherwise, and the skill runs a same-family subagent and records `family: claude (same family)`) · `seal <file>`
(writes `<file>.sha256` in `shasum -a 256` format; refuses to re-seal a different hash, and refuses a read missing its
reading log, contamination or riskiest assumption) · `verify <file>` · `compare <file> --expect <hash>` (verifies, checks
the hash the maker was shown, since a sidecar seal can be replaced, then writes the compare skeleton). *Amended at
review of #314.* The read lives at `Roadmap/00-strategy/cold-read/<date>-cold-read.md`.

**D3 · Where it sits.** The cold read runs before coaching: the shared reference's opening offers it once when no sealed
read exists and no strategy file is agreed; the facilitator never opens it until compare. The compare is offered when
the last coach finishes and a sealed read exists, before the Strategy gate. Setup's own flow is unchanged.

**D4 · The compare.** Refuses (exit 1, naming expected and actual hash) when the seal does not match. The skeleton's
sections are the reference compare's: seal check · how independent · converged · diverged · only the cold read · only
coached · decisions · did it earn its place; frontmatter `kind: cold-read-compare`, `cold_read`, `cold_read_sha256`,
`family`, `coached: […]`. Sections a coach marked `proposed` (D7) are listed as **facilitator-authored** in "how
independent", read from the coached files, never typed.

**D5 · One shared coach reference** at `groom/references/coaching.md` (the home `gates.md` already set: coaches point at
groom's references). Each coach reads it at its start. It owns: the opening play-back (one line per existing strategy
file, with its status), "Step N of X" on every message, save-after-every-step with parked answers, options, research,
delegation, the product check, the ladder-up, the private folder and the voice. Each coach states its X once; a spec
pins X to the count of its `### Step` headings (narrative 8 · north-star 7 · risk-validation 6 — sub-steps never add a
step).

**D6 · Save as you go.** After every step the coach writes the file as `status: draft` with what is decided so far;
unfilled headings keep the template placeholder; an answer given early is parked under its future heading as a
`> Parked (step N): …` line, removed when its step uses it. Headings never change (the template contract).

**D7 · Options and delegation.** Each step offers 2–4 numbered options plus "write your own"; present-day facts are
looked up and cited inline, or the coach says "couldn't look" and uses the classic cases; never an invented figure. A
step the maker hands over gets an options brief (candidates, sources, a recommendation), and its section opens with the
line `_Proposed by the coach, not decided yet._` until the maker picks; the Strategy gate lists such sections as
decisions, and its Approve removes the line.

**D8 · The product check.** When the repo has code (a `Roadmap/README.md` poster or source beyond docs), each benefit in
Value proposition and each moat in Competitive advantage ends with `(true today)` or `(aspirational)`, checked against
the poster and the code once per session.

**D9 · Private strategy.** `template/scripts/strategy-private.mjs ensure` (kit-carried) runs before a coach's first write:
on a repo that is public or whose visibility can't be read, with nothing under `Roadmap/00-strategy/` tracked and the
folder not already ignored, it appends `Roadmap/00-strategy/` to `.gitignore` and prints one line saying so and how to
opt in (delete that line). A private repo, a tracked file or an existing ignore: no change, one line saying why. Pure
decision function, specced.

**D10 · One-pagers.** `template/scripts/one-pagers.mjs` (kit-carried, `gf-kit one-pagers`) renders a business model
canvas, a value proposition sheet and a persona poster into `Roadmap/00-strategy/one-pagers/` as `.html` (printable,
A4 landscape, light/dark) and `.md`. Every line is derived from the files; a missing source line renders "not written
yet". Labels: `true today` · `agreed` · `sourced` · `hypothesis`; an **unlabelled persona line renders as
`hypothesis`** (the honest default makes a false claim unrepresentable). A sheet whose source file is `draft` is
watermarked "draft". The canvas carries "Strategyzer.com" under it (CC BY-SA); the value proposition sheet uses no VPC
layout or name. Rendered at the Strategy gate's Approve, at each coach's last write, and on demand. The narrative
template gains a `### Persona` block under Target audience and labelled lines (`**Outcome:**`, `**Motivation:**`,
`**Gaps:**`, `**Tagline:**`, optional canvas lines under Business model); **h2 headings unchanged**, so
`strategy.mjs` and `strategy-templates.test` keep their contract.

**D11 · Voice.** The persona, steps and templates name no outside methodology brand (Reforge, Amplitude, Strategyzer,
"Deliberate Startup Methodology", "7 Powers"); credit stays in each coach's one `> **Sources.**` line and the canvas
footer, where credit is honesty. A spec pins it: brand words appear only on those lines.

**D12 · CLI pin derived.** `scripts/render-plugin-release.mjs` (monorepo, already reads `packages/cli/package.json`)
gains the pin rewrite: every `@golden-frijoles/cli@<v>` in `skills/plugins/**/SKILL.md` is rewritten to the CLI's
version, and `--check` fails while one differs (the monorepo gate; the skills mirror cannot see `packages/`).

**D13 · Release + routing.** One plugin+kit minor per sprint PR: **0.41.0, 0.42.0, 0.43.0**, published by CI
(`RELEASING.md`). Built in place by the architect (Claude; one session, one checkout; Codex is capped). Review per PR:
`review-route.mjs --builder claude` (an other-family general pass) plus a fresh `pr-reviewer`. No engine change, no
migration, no flag, no production mutation. **Owed to the PO:** retire the claude.ai duplicates
(`pmf-narrative-facilitator`, `deliberate-risk-validation`); the Strategyzer VPC permission ask.

### Build contract — Sprint 1 (locked by the architect before the builder started)
`cold-read` skill; the brief is the kit file `cold-read.prompt.md` (D2); `template/scripts/cold-read.mjs` + `cold-read.test.mjs` (pure: `sealLine`,
`parseSealLine`, `verifySeal`, `renderCompare`, `missingSections`, `stampRead`, `deliveryTail`; the marker reader is
`proposedSections` in `lib/strategy-files.mjs`); byte copies in `scripts/`;
`requires_scripts` on `cold-read`; adverts re-rendered; 0.41.0. Cites D1–D4, D13.

### Build contract — Sprint 2
`groom/references/coaching.md` (D5–D9, with worked examples incl. the three-anecdote ladder-up); the three coaches read
it first and state X; `### Step` headings normalised; `template/scripts/strategy-private.mjs` + test (renamed: `strategy-folder.test.mjs` already exists, think-skills D8); specs pinning X,
the reference pointer, D7's marker, D8's labels; gates.md lists `proposed` sections as decisions and Approve clears the
marker; 0.42.0. Cites D5–D9.

### Build contract — Sprint 3
Narrative: distil-and-test in Step 1, one person first + ladder-up in Step 2; north-star: scenario table in Step 4
before the pick; risk-validation: reads the North Star and carries forward `hypothesis`/`aspirational` lines;
`template/scripts/one-pagers.mjs` + test (synthetic fixtures); template persona block; gate + coaches render; D11
rewrite + spec; D12 in `render-plugin-release.mjs`; 0.43.0. Cites D10–D12.

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
