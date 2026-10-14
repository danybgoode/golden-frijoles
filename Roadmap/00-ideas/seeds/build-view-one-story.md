---
title: "The build view tells one story: one status, said once"
slug: build-view-one-story
status: ready
area: "09"
type: feature
appetite: M
underwritten_by: null
risk: low
epic: null
build_order: null
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
intent_match: 84
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
we already have." (Daniel liked the layout above, 2026-10-10.)

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

## Outcome & signal

The view is the layout above: a headline with the one stage and story position; `Why`, `Target`, `Track`, `Now`,
`Spend`, `Around`. A source is named only when two sources disagree. Signal: the product owner's walkthrough, since a
terminal band sends no telemetry.

## Stage-2.5 bucket

Light enhancement: the facts are all in `build-state.mjs --json`. This is the text it renders, plus the band's
decoration map.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| headline: title + stage + story position | one status, said once |
| a source only on disagreement | the noise today |
| `Target` with `grounded_reason` + intent match | "no target set" says less than we know |
| `Now`: last story with a commit, or "between stories" | never "session journal" |
| `Around` replaces Worktree/Open/Board | other work, labelled as other work |
| shipped reads as shipped | "0 of 6 done" on main is wrong |
| the reset line to the minute (verify first) | "-1h" was wrong |
| glyph map + golden test updated | the band draws what the resolver says (D3) |

## Scope

**In v1:** items 1–7 of the original seed, in `build-state.mjs` (template, mirrored to the plugin's `hooks/vendor`),
`build-view.mjs` labels and glyphs, and the mod's reset line; intent match on the `Target` line only (the epic page
and board card are out, see no-gos).
**Out of v1 (no-gos):** intent match on the epic page and the board card (a console change, its own idea if wanted);
any new fact the resolver doesn't already gather; the standup's text (it reads `--json`, unchanged).

## Rabbit holes

- **The band only decorates (D3).** Every row is a resolver line; the mod adds glyphs and tone, never facts. The
  rename (Story → Now, Board → Around) changes the glyph map and the mod test together.
- **"Disagree" needs a rule.** Name a source only when the README's `status`/`phase` and the live facts give
  different stages; one function, with a spec of each disagreeing pair.
- **The reset line may already be fixed** (build-view-upgrade D5 redraws each minute). Reproduce it against a real
  reset before changing it; if it's right, record that and drop the item.
- **Mirror drift.** `build-state.mjs` exists in `template/scripts`, the plugin's `hooks/vendor` and this repo's
  `scripts/`; `check-script-parity` guards it. One plugin release (`skills/RELEASING.md`).

## What already exists (reuse, don't rebuild)

- `skills/template/scripts/build-state.mjs` (the five-line view and `--json`), `scripts/build-state.mjs` (this repo's
  copy), `skills/plugins/golden-frijoles/hooks/vendor/build-state.mjs`.
- `skills/plugins/golden-frijoles/hooks/build-view.mjs` (`LABEL_GLYPHS`, `toneOf`), `hooks/index.tsx` (the band, the
  reset countdown), `build-view.mod.test.ts`, `build-view.test.mjs`.
- The epic README's `intent_match`, `grounded_reason` (copied by `scaffold-epic`).

## Visuals

The target layout is the block in *The ask, as given*. Today, with no epic in flight:

```
No epic in flight — docs/seed-consolidation names no epic under Roadmap/ …
  Worktree The outcome report for any product · S1.3 · Building · feat/outcome-report-any-product
  Worktree A golden welcome and recovery pages · In review · feat/brand-reveal-error-pages
  Open     Agent-legible horizon and docs · Building · 02-commercial
  Board    Building 0 · QA 1 · Ready to build 7 · next to pull: A delivery whose settle … (#87)
```

After, with no epic in flight:

```
golden-frijoles ▸ no epic on this branch (docs/seed-consolidation)
  Around   2 in worktrees · 1 building · 1 in QA · 7 ready · next up: A delivery whose settle… (#87)  ↗ hub
```

## UX heuristics & rails check

- **CI guards covering this surface:** `build-view.test.mjs`, `build-view.mod.test.ts`, `check-script-parity`,
  skills-ci (on the split), `check-gate-words` (screen words).
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** none (terminal).

## Kill-switch / runtime gate

**None: carve-out.** A terminal band in the plugin isn't served by Golden Frijoles flags, and it sends no telemetry.
Rollback is the previous plugin version.

## Acceptance criteria

- **S1.1** (low): the headline carries title, stage and story position; the stage appears once; a source is named only
  when two disagree (pure spec per disagreeing pair); a shipped epic reads "Shipped · N of N done".
- **S1.2** (low): `Why` shows the Why in full; `Target` shows the target, or "none yet: <grounded_reason>", then the
  intent match.
- **S1.3** (low): `Now` shows the last story with a commit (as a / I want / so that), or "between stories"; the words
  "session journal" never appear.
- **S1.4** (low): `Around` replaces Worktree/Open/Board in one line plus the hub link; glyph map and mod test updated.
- **S1.5** (low): the reset line, reproduced against a real reset; fixed to "resets 9:20 pm (in 1h 29m)" if still
  wrong, or recorded as already right.
- QA: golden specs on the rendered lines; the product owner's walkthrough in Claude Code (interactive).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/build-view-one-story.md
  coverage in   0.85  (4 claims)
  coverage out  0.76  (6 criteria)
  clarity       0.74  (6 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.52  (advisory, not in the total)
Total 84 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.853,"coverage_out":0.757,"clarity":0.741,"teach_back":1,"total":84} -->
