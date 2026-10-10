---
title: "The Why reads as a story, in full, and the plan names its crew"
slug: why-as-a-story
status: ready
area: "09"
type: feature
appetite: M
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-10
intent_ask: verbatim
hypothesis: "Today the Why lists the parts being built and is cut off on screen, so a founder approves bets they cannot easily explain. Written as a short story from the strategy we already agreed, and shown in full, it becomes a bet they can defend. We'll know when every new Why is read in full and approved without a rewrite."
persona: "a founder who owns the product, solo to mid-size, approving and following bets their agent builds"
grounded: false
grounded_reason: "no North Star input measures how readable a Why is; it serves grounded_bets_share only indirectly"
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: 88
---

# Pitch — The Why reads as a story, in full, and the plan names its crew

Tests: Value proposition (a bet you can explain is a bet you can prove)

## The ask, as given

> We must also improve the prose style for the why. Agent writing it must always simplify language and make it
> readable for anyone, the job usually is to tell a story, leverage the artefacts we have like user persona, value
> prop, business model so the language is all connected and coherent a convincing and easy to understand one. Right now
> it reads very much technical, just describing parts sticking together.
> — Daniel, 2026-10-10

> lets scope the claude mod work to just the Why line in terms of prose writing and that the visualisation in the mod
> is correct, meaning it can read in full. The rest of the mod iterations lets seed for after launch. And the crew is
> great, just a follow up, we are supposed to plan, architect and orchestrate with frontier top model like opus 5.5 as
> we are currently, but work can and should be assigned to builders from other models like sonnet 5.5 escalating if
> needed, not sure of thats happenning still.
> — Daniel, 2026-10-10

> Not sure if this output format is deterministically enforced or just something you adopted throughout this session
> but i loved it, lets ensure its SOP of the product. — Daniel, 2026-10-10 (the checkpoint and plan shape)

### Claims
1. The Why is a short story in plain words, connected to the persona, the value proposition and the business model.
2. The build view shows the Why in full, never cut off mid-sentence.
3. A plan shown for approval names its crew: who plans and orchestrates, who builds, who reviews, who writes prose.
4. Well-specified stories are actually built by a cheaper model (Sonnet-class), escalating to the orchestrator when
   needed.
5. The checkpoint and plan shape used in this session is the product's standard, written down.

**Teach-back:** yes — "You want every Why to read like a short story anyone can follow, built from the strategy we
already agreed, and shown in full where you follow the build; plans to say who does what, with cheaper builders really
used; and the checkpoint shape to become standard. The rest of the build view waits until after launch. Right?"

## Problem
- **The Why reads as parts.** Stage 1.5 fills a template ("We believe that <the change> for <persona> will <move the
  input>…") from the epic's mechanics, so it lists components. one-bet-wired's: "wiring each bet's flag to its epic,
  its adoption event and its funnel read…". Nothing asks the writer to read the persona, the value proposition or the
  business model, which the strategy files already hold.
- **The Why is cut off.** The build view clips it to one line at 80 columns ("…its adoption eve…").
- **The plan hides the crew.** WAYS-OF-WORKING routes well-specified stories to a Sonnet-class builder, but no gate
  shows the routing and nothing in the kickoff makes the orchestrator dispatch. In practice the orchestrator built every
  story itself for the last several epics.
- **The checkpoint shape lives in one session's habits.**

## Appetite
M. Prose rules and one guard in refine, one build-view change, two gate/kickoff text changes, one reference.
quote: $15–32 (M, n=20, p25–p75)

## Outcome & signal
Refine drafts the Why from the strategy files as two or three plain sentences: who has the problem, what changes for
them, why it matters to the business, and how we will know. A length and vocabulary guard keeps it readable; a Jev
question judges whether it reads as a story. The build view wraps the Why over as many lines as it needs (at most
four). The Plan gate shows a Crew block from the routing table; the kickoff tells the orchestrator to dispatch each
well-specified story to a Sonnet-class builder and to take it back after a failed attempt; the retrospective records
the crew that actually worked. `refine/references/checkpoint.md` is the checkpoint and plan shape.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `result-record.md` Stage 1.5: read `Roadmap/00-strategy/` (persona, value proposition, business model) first; write the Why as a short story in plain words; a worked before/after (one-bet-wired) | the Why tells a story the founder can defend |
| A Why guard (kit): length ≤ 320 characters, banned internal words (file paths, `flag_key`, "wiring", function names); a Jev question "does it read as a story a stranger could follow?" (advisory) | readable by construction where a script can tell; judged where it cannot |
| Build view: the Why wraps, never clips (`whyLines`), up to four lines | it can be read in full |
| Plan gate: a **Crew** block (planned, may change) from the routing table | the founder sees who does what |
| Kickoff: dispatch rule (well-specified story → Sonnet-class builder; escalate after one failed attempt; shared surface, money/auth/tenancy and high-risk stay with the orchestrator) | the routing actually happens |
| Retrospective template: **Crew (actual)** | planned vs actual is visible |
| `refine/references/checkpoint.md`: the checkpoint and recommendation shape | the shape is standard, not a habit |

## Scope
**Sprint 1 · The Why** (S1.1 the story rule and worked example · S1.2 the Why guard and Jev question · S1.3 the build
view shows the Why in full) · **Sprint 2 · The crew** (S2.1 the Crew block at the Plan gate and in the retro · S2.2 the
dispatch rule in the kickoff · S2.3 the checkpoint reference · S2.4 plugin + kit release).

**No-gos:** no other build-view change (status lines, Target reason, intent match on screen, the 5-hour line: seeded
as `build-view-one-story`, after launch) · no rewrite of shipped epics' Whys · no model calls from the hooks.

## Rabbit holes
- **"Reads as a story" is a judgment.** Only length and vocabulary are deterministic; the Jev question is advisory, as
  intent-match is.
- **Four lines of Why** push the view down; the story rule keeps a Why to ~320 characters, so it wraps to at most four.
- **Dispatch needs a well-specified story.** The rule names what qualifies (a clear acceptance check, no shared
  surface, risk low or medium); the rest stays with the orchestrator.

## What already exists (reuse, don't rebuild)
- `result-record.md` (the bet sentence), `Roadmap/00-strategy/` files, Jev and its question data (compiled-prompts)
- `scripts/build-state.mjs` `whyLines`, `clip`; check-gate-words; WAYS-OF-WORKING's routing table
- the Agent tool's `model` override (Sonnet) for builders; `scripts/epic-actuals.mjs` (sessions and models)

## Acceptance criteria
- S1.1 Refine writes the Why as a short plain-words story from the persona, value proposition and business model, with a worked before/after (high)
- S1.2 A guard rejects a Why over the length limit or with internal words, and a Jev question judges whether it reads as a story (medium)
- S1.3 The build view shows the whole Why, wrapped, never cut mid-sentence (medium)
- S2.1 The Plan gate shows the planned crew and the retrospective records the actual one (medium)
- S2.2 The kickoff tells the orchestrator to dispatch well-specified stories to a Sonnet-class builder and to escalate after a failed attempt (medium)
- S2.3 The checkpoint and recommendation shape is a written reference refine and the kickoff point to (low)
- S2.4 Plugin + kit released with a CHANGELOG entry (low)

## Decisions for the Plan gate
- **a.** The build view wraps the **full** Why (up to four lines; the story rule keeps it short), or shows a separate
  one-line `why_short` and links the full one?
- **b.** Crew (actual) in the retrospective is **written by the orchestrator** from what happened, or stamped from the
  session transcripts' models (finops already reads them)?
- **c.** Funded, not grounded (no input measures readability)?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/why-as-a-story.md
  coverage in   0.94  (5 claims)
  coverage out  0.81  (7 criteria)
  clarity       0.77  (7 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 88 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
Untraced (trace it to the ask or cut it):
  criterion 7 (0.31): "S2.4 Plugin + kit released with a CHANGELOG entry (low)"
```

<!-- intent-match: {"coverage_in":0.94,"coverage_out":0.811,"clarity":0.77,"teach_back":1,"total":88} -->
