---
title: "The build view tells one story: one status, said once"
slug: build-view-one-story
status: scaffolded
area: "09"
type: feature
appetite: M
underwritten_by: wave-2026-10
risk: low
epic: "09-platform-infra/build-view-one-story"
build_order: 95
updated: 2026-10-14
intent_ask: verbatim
hypothesis: "The build view says the same status on several lines, each from a different source. One headline, one track and one line per fact, with the board as other work, lets a founder read where the build is at a glance. We'll know when the product owner reads it without asking."
persona: "A founder who owns the product, watching an agent build"
grounded: false
grounded_reason: "A terminal surface for the founder watching a build; no North Star input counts it."
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: 87
---

# Pitch — the build view tells one story

Moves · Tests: not grounded (see `grounded_reason`). Tests: Value proposition (the founder always has the context).

## The ask, as given

> As you can see we have many different status communicated at the same time on different lines. Please show me a
> suggested streamlined reorganization, we have the data, lets just make sure its all coherent and telling a story so
> humans always have the context clearly.
> — Daniel, 2026-10-10

The layout proposed and liked in that session:

```
golden-frijoles ▸ One bet, wired                               Building · S1.2 of 6
  Why      <the Why, in full>
  Target   none yet: <grounded_reason> · intent match 88
  Track    Refining ─ Ready ─ ◉ Building ─ QA ─ Shipped    ▰▰▱│▱▱▱  2 of 6 done
  Now      S1.2 <story>: as a founder, I want … so that …
  Spend    ≈$22 of $56–79 · 1 session
  Around   3 ready · 5 in QA · next up: Night garden (#80)  ↗ hub
```

### Claims
1. One status, said once (no competing lines).
2. Every line coherent with the others, telling one story.
3. Humans always have the context.
4. The data already exists; this is a reorganisation.

**Teach-back:** yes — "You want the build view reorganised into one story with each status said once, using the data
we already have." (Daniel liked the layout above, 2026-10-10, and amended it at the Plan gate, 2026-10-14: see
*The design*.)

### Amended at the Plan gate (Daniel, 2026-10-14), in his words

> On the top line, aligned to the left, we could add the sprint number left of the epic name … aligned to the right …
> the ▰▰▱│▱▱▱ 2 of 6 done progress bar … Below that top line i think we should show the link and full url to the
> epic … on the spend line … lets add [the progress bar] back. Id also like to see a mockup of the empty or default
> state. And include coverage for when we are refining. … include more ascii art … where else could we add visuals.
> lets include the M · risk HIGH next to the epic name … shows at top the track … Top line should be Repo name …
> please get creative on the symbols used … ensure that the colors changes that we do still happen and that we dont
> regress

## Problem

Re-read against the code 2026-10-14 (`skills/template/scripts/build-state.mjs`, drawn by
`skills/plugins/golden-frijoles/hooks/build-view.mjs` + `index.tsx`):
- The stage is said on the headline and again with its source ("from docs: status … (snapshot) · phase …",
  `build-state.mjs:907–936`).
- `Why` says "no target set" (`:986`) even when the seed wrote a `grounded_reason`.
- The Story line can say "…and the session journal names none either" (`:784`).
- Other work is spread over `Worktree`, `Open` and `Board` lines (seen today with no epic in flight).
- On `main`, a shipped epic shows "0 of N stories done" (seen 2026-10-10).
- The 5-hour reset was seen as "-1h" for a 9:20 pm reset at 7:51 pm (2026-10-10).
- Intent match isn't shown anywhere in the view.

## Appetite

M: one sprint, one renderer.
quote: $15–34 (M, n=24, p25–p75)

## The design (approved 2026-10-14)

**The rule:** the view answers, top to bottom, *what* is being built, *how far* it has got, *why*, *what is happening
now*, *what it costs* and *what else is going on*. Each fact appears once. A bar is drawn only for an amount against a
known total.

**Building** (fits 100 columns; a long title shortens with `…`, the bar and track never do):

```
golden-frijoles ▶ Sprint 1 of 2 · Funnel truth · L · ▲ risk HIGH      ▰▰▱│▱▱▱▱▱▱  2 of 8 stories done
  Refining ─ Ready ─ ◉ Building ─ QA ─ Shipped
  ↗ https://goldenfrijoles.com/hub/golden-frijoles/epic/funnel-truth
  ❝ Why      A funnel today is one number per period. Showing it by month lets founders judge a
             bet over its whole life. We'll know when members open funnel trends.
  ⌖ Target   members opening a trend: 0 → 3 · read 13 Nov · intent match 84
  ▸ Now      S1.3 The trend on the flag page and the epic page
             As a founder reading a feature, I want the trend where I read its funnel, so that …
  $ Spend    ▰▰▰▱▱▱▱▱▱▱  ≈$22 of the $49–68 quote · 1 session
  ⋯ Around   1 in QA · 6 ready · next up: Drill impact for agents (#93)
```

- No target: `⌖ Target   none yet: <grounded_reason> · intent match 81`.
- Between stories: `▸ Now      between stories: S1.3 done, S1.4 next`. Never "session journal".

**Refining** (an idea's branch, before approval): the quote takes the bar's place.

```
golden-frijoles ❧ Idea · Owed on screen · M · ▲ risk HIGH                            quote $15–34
  ◉ Refining ─ Ready ─ Building ─ QA ─ Shipped
  ↗ Roadmap/00-ideas/seeds/owed-on-screen.md
  ❝ Why      Owed checks live only in a file nobody opens. Showing them where you already look
             cuts the open count. We'll know when it falls.
  ▸ Now      plan ready, waiting for your approval
  ⋯ Around   1 building · 6 ready · next up: A delivery whose settle… (#87)
```

`Now` is "shaping the plan" for a `raw` idea and "plan ready, waiting for your approval" for a `ready` one. No
invented count of open decisions.

**Nothing in flight** (the default state):

```
golden-frijoles ○ No epic on this branch · docs/seed-consolidation
  ↗ https://goldenfrijoles.com/hub/golden-frijoles/board
  ⋯ Around   1 building · 1 in QA · 7 ready
             in other worktrees: The outcome report for any product (S1.3, Building) ·
             A golden welcome and recovery pages (QA)
  → Next     /build delivery-stale-reclaim-uncounted   (top of the ready list)
```

**In QA, and shipped:**

```
golden-frijoles ◎ Sprint 2 of 2 · Owed on screen · M · ▲ risk HIGH    ▰▰│▰▰▰▰  6 of 6 stories done
  Refining ─ Ready ─ Building ─ ◉ QA ─ Shipped

golden-frijoles ✓ Sprint 2 of 2 · One bet, wired · L · ▲ risk HIGH    ▰▰▰│▰▰▰  6 of 6 stories done
  Refining ─ Ready ─ Building ─ QA ─ ◉ Shipped
  ↗ https://goldenfrijoles.com/hub/golden-frijoles/epic/one-bet-wired
  ▸ Now      shipped 10 Oct · verdict due 9 Nov
  $ Spend    ▰▰▰▰▰▰▰▰▱▱  ≈$61 of the $49–79 quote
```

**When two sources disagree** (the only time a source is named):

```
  Refining ─ Ready ─ ◉ Building ─ QA ─ Shipped
  ⚑ the epic's docs say Ready, but this branch has story commits
```

**Below the prompt** (the 5-hour line): `5h ▰▰▰▰▰▰▱▱▱▱ 62% · resets 9:20 pm (in 1h 29m)`.

**Symbols**, one per meaning, all single-width (no emoji, so columns stay aligned):

| Symbol | Means | | Symbol | Means |
|---|---|---|---|---|
| `❧` | an idea, being refined | | `❝` | Why |
| `◇` | ready, not started | | `⌖` | Target |
| `▶` | building | | `▸` | Now |
| `◎` | in QA | | `$` | Spend |
| `✓` | shipped | | `⋯` | Around |
| `○` | nothing in flight | | `→` | Next |
| `◉` | where we are, on the track | | `↗` | a link |
| `▲` | risk | | `⚑` | sources disagree |

**Pictures, and where not:** bars for stories done, spend against the quote, and the 5-hour budget; the track for the
stage. No picture for Target (no reading exists until the read date, so a gauge would invent one), intent match (the
score is uncalibrated) or Around (small counts read faster as numbers).

**Colours that must not regress** (today's, from `hooks/index.tsx` `TONE_COLORS` / `RISK_COLORS`):

- the track: the current stage bold in its tone (building yellow, QA cyan, shipped green, blocked red), the rest dim;
- the story bar: done green, not yet dim;
- the Spend bar: green under the quote, full and red when over, the remainder dim;
- `▲ risk` bold in its level's colour (HIGH red, MEDIUM yellow, LOW green);
- the title bold; label glyphs cyan, labels dim;
- the session line's tones and reset times.

New: the repo name dim, then the state symbol in the stage's tone; `⚑` and `% over` red.

## Outcome & signal

The view reads as above in every state. Signal: the product owner's walkthrough, since a terminal band sends no
telemetry.

## Stage-2.5 bucket

Light enhancement: the facts are all in `build-state.mjs --json`. This is the text it renders, plus the band's glyph
and colour map.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| header: repo · state · sprint · title · size · risk, bar on the right | what, and how far, at a glance |
| the track under it, its old row retired | the stage, said once |
| the epic's full link third | clickable, under what it opens |
| a source named only on disagreement (`⚑`) | the noise today |
| `Target` with `grounded_reason` + intent match | "no target set" says less than we know |
| `Now`: the story, or "between stories" | never "session journal" |
| `Around` + `Next` replace Worktree/Open/Board | other work as one line, plus a next step |
| shipped reads as shipped | "0 of 6 done" on main is wrong |
| the 5-hour meter and the reset to the minute | the budget as a bar; "-1h" was wrong |
| symbols + colours pinned by tests | no regression |

## Scope

**In v1:** every state above, in `build-state.mjs` (template, mirrored to the plugin's `hooks/vendor` and this repo's
`scripts/`), `build-view.mjs` (labels, glyphs, tones) and `index.tsx` (the header layout, the 5-hour meter).
**Out of v1 (no-gos):** intent match on the epic page and the board card (a console change, its own idea); any fact
the resolver doesn't already gather; a width-adaptive one-line header (rejected 2026-10-14: a header that changes
shape on resize is harder to scan); the standup's text (it reads `--json`).

## Rabbit holes

- **The band only decorates (D3).** Every row is a resolver line; the mod adds glyphs, layout and tone, never facts.
  The header's right-aligned bar is the one layout addition: the resolver still emits it as text.
- **Narrow terminals.** Under ~90 columns, the bar drops to its own line under the header instead of being cut.
- **"Disagree" needs a rule.** One function, with a spec per disagreeing pair (README status/phase vs live facts).
- **The reset line may already be right** (build-view-upgrade D5). Reproduce it against a real reset first.
- **Single-width symbols.** `⚠`, `✔` and many dingbats render double-width or as emoji in some terminals; the table
  above avoids them. The test's rule: no glyph whose East Asian Width is W or F, and none with Emoji_Presentation
  (so `▶` passes: it shows as text unless asked for emoji). Ambiguous-width glyphs (`◇ ─ │`, already used today) stay
  allowed.
- **Mirror drift.** `check-script-parity` guards the three copies of `build-state.mjs`. One plugin release.

## What already exists (reuse, don't rebuild)

- `skills/template/scripts/build-state.mjs` (lines and `--json`), `scripts/build-state.mjs`,
  `skills/plugins/golden-frijoles/hooks/vendor/build-state.mjs`.
- `skills/plugins/golden-frijoles/hooks/build-view.mjs` (`LABEL_GLYPHS`, `toneOf`, `spendOf`, `barsOf`),
  `hooks/index.tsx` (`TONE_COLORS`, `RISK_COLORS`, the track, the bars, the session line), `build-view.mod.test.ts`,
  `build-view.test.mjs`.
- The epic README's `intent_match`, `grounded_reason`, `appetite`, `risk` (copied by `scaffold-epic`).

## UX heuristics & rails check

- **Visibility of status:** the header says what, where and how far; the track says the stage.
- **One fact, one place:** stage once (the track), link once, sources only on disagreement.
- **Recognition over recall:** a clickable link and a `Next` command instead of a path to remember.
- **Honest pictures:** bars only against a known total.
- **CI guards:** `build-view.test.mjs`, `build-view.mod.test.ts`, `check-script-parity`, skills-ci, `check-gate-words`.

## Kill-switch / runtime gate

**None: carve-out.** A terminal band in the plugin isn't served by Golden Frijoles flags and sends no telemetry.
Rollback is the previous plugin version.

## Acceptance criteria

- **S1.1** (low): the header in every state: repo, state symbol, sprint, title, size, `▲ risk`, the story bar right;
  the track on line 2 and its old row gone; the link on line 3; a long title shortens with `…`; under ~90 columns the
  bar drops to its own line.
- **S1.2** (low): a source is named only when two disagree (`⚑`, a spec per pair); a shipped epic reads shipped
  (`✓`, "N of N stories done", "shipped <day> · verdict due <day>").
- **S1.3** (low): `❝ Why` in full; `⌖ Target` with the target or "none yet: <grounded_reason>", the read date, then
  intent match.
- **S1.4** (low): `▸ Now` shows the story (as a / I want / so that) or "between stories"; refining says "shaping the
  plan" or "plan ready, waiting for your approval"; "session journal" never appears.
- **S1.5** (low): `$ Spend` keeps its bar; `⋯ Around` replaces Worktree/Open/Board; the nothing-in-flight state shows
  the board link and `→ Next /build <top of the ready list>`.
- **S1.6** (low): the 5-hour line as a meter, its reset to the minute, reproduced against a real reset first.
- **S1.7** (low): no regression: a mod test pins every colour in *Colours that must not regress* and the new ones, and
  fails on any wide or emoji-presentation glyph; golden specs render each state above.
- QA: golden specs; the product owner's walkthrough in Claude Code (interactive), one step per state.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/build-view-one-story.md
  coverage in   0.90  (4 claims)
  coverage out  0.77  (8 criteria)
  clarity       0.82  (8 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.58  (advisory, not in the total)
Total 87 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.9,"coverage_out":0.765,"clarity":0.815,"teach_back":1,"total":87} -->
