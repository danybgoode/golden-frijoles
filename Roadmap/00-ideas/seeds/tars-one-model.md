---
title: "TARS, one model: every funnel reads the same stages"
slug: tars-one-model
status: ready
area: "01"
type: feature
appetite: M
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-10
intent_ask: verbatim
hypothesis: "Today one project reads the same funnel two ways: older features count anyone who saw them as targeted, and newer ones count everyone. Founders cannot compare their features or trust the numbers. Read every funnel one way and say so on screen. We will know when every funnel a founder opens uses the same stages."
persona: "a founder who owns the product, solo to mid-size, reading whether their features worked"
grounded: false
grounded_reason: "a launch fix: one project must read TARS one way; no input measures that"
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: 87
---

# Pitch — TARS, one model: every funnel reads the same stages

Tests: Value proposition (a number you can trust is a number you can act on)

## The ask, as given

> i do think tars segment item 2 goes in before launch please.
> — Daniel, 2026-10-10

Item 2 of `tars-segments`: "The existing TAR funnels (`lib/tars.ts`, growth-engine-v1) count a target event (exposure)
as Targeted, do not restrict Adopted to the target, and have no Satisfied stage. Move them to the same model, so one
project reads one way." Item 4 (the funnel switch tested on and off in a browser) came with it.

### Claims
1. The older feature funnels use the model agreed at one-bet-wired: Targeted is a segment (everyone, until segments
   exist), exposure is its own stage, Adopted is counted among the exposed, adopters without exposure sit beside it.
2. One project reads TARS one way, everywhere it is shown or served.
3. The change in numbers is said on screen.
4. The flag funnel's switch is tested on and off in a browser.

**Teach-back:** yes — "You want the older feature funnels to use the same stages as the new flag funnels, everywhere
they show up, with the change said on screen, and the funnel switch tested in a real browser. Right?"

## Problem
- `computeTars` counts users who fired the feature's `target_event` as **Targeted**: that is exposure, not a segment.
  It counts **Adopted** across everyone, exposed or not, and has no Satisfied stage.
- `computeFlagFunnel` (one-bet-wired) uses the agreed model. A project with both shows two meanings of "Targeted".
- They are read in five places: the flag's feature pane, the funnel API (authed and the public demo), the connector's
  `get_tars_funnel`, the Pod Report table, and the friction rule (adopted ÷ targeted).
- The flag funnel's switch has only a pure-rule test (`funnelBetOf`); no browser spec renders it on and off.

## Appetite
M. One pure model with two kinds of exposure, one read, five consumers, a browser spec.
quote: $15–32 (M, n=20, p25–p75)

## Outcome & signal
`lib/flag-funnel.ts`'s model takes an **exposure rule**: a flag's `on` evaluation, or a registry feature's
`target_event`. `getFeatureFunnel` reads through it (the same bounded, cached reads as flag funnels) and returns the
stages: active users → targeted (everyone) → exposed → adopted → retained → satisfied ("not measured" for a registry
feature) with adopters-without-exposure beside. Every consumer shows those stages, and a one-time note says the
numbers moved and why. The API returns the new `funnel`; the old `tars` object stays one release, marked deprecated.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `computeFlagFunnel` → a model with an exposure rule (flag `on`, or a registry `target_event`) | one model, two sources of exposure |
| `getFeatureFunnel` reads through it: bounded reads, 5-minute cache, the flag funnel's window | one read path, same cost limits |
| Feature pane, funnel page, Pod Report table and friction rule read the new stages | one project reads one way |
| API and connector: `funnel` added; `tars` kept one release, deprecated (a check-deprecations promise) | callers are not broken without warning |
| A one-time "the numbers moved" note where a TAR funnel shows | the cut-over is said on screen |
| A browser spec: an authed-fixture epic with an `adopted_event` renders its funnel with `bets.flag_funnels_enabled` on, and not off | the switch is tested where people see it |

## Scope
**Sprint 1 · One model** (S1.1 the model takes an exposure rule · S1.2 the feature funnel reads through it · S1.3 the
API and connector return `funnel`, `tars` deprecated) · **Sprint 2 · Everywhere it shows** (S2.1 the feature pane and
funnel page · S2.2 the Pod Report and the friction rule · S2.3 the "numbers moved" note · S2.4 the browser spec, on and
off).

**No-gos:** no named segments, no Satisfied for registry features (`tars-segments`, after launch) · no migration (the
registry's fields are enough) · no new event table or route (AGENTS rule 1) · no cross-project read (each funnel is one
project's) · the public demo stays demo-only (rule 2).

## Rabbit holes
- **Fallbacks.** A feature with no `target_event` treats any of its events as exposure, as today; with no
  `adopted_event`, adoption is any event after exposure, so the page says which event to name.
- **A disabled feature** shows what happened (events are facts) and says it is switched off, instead of Targeted 0.
- **The friction rule** compares adopted to exposed now; its threshold stays.
- **Callers of the API**: the SDK and the CLI do not read `tars` (check); the connector's tool description changes.

## What already exists (reuse, don't rebuild)
- `lib/flag-funnel.ts`, `flag-funnel-read.ts`, `getFlagFunnel` (cached), `flag-funnel-view.ts`, `FlagFunnel.tsx`
- `lib/tars.ts` (`computeServedDaily` stays), `lib/tars-query.ts`, `lib/friction-rules.ts`, `check-deprecations.mjs`
- the authed e2e fixture (`e2e/auth.setup.ts`), `ci/gates.*.env`

## Acceptance criteria
- S1.1 One pure funnel model counts exposure from a flag's on evaluation or a registry feature's target event, with adopters outside exposure beside it (high)
- S1.2 A feature's funnel reads through that model with the flag funnel's bounded, cached reads (high)
- S1.3 The funnel API and the connector return the new stages, and the old shape stays one release marked deprecated (high)
- S2.1 The flag's feature pane and the funnel page show the new stages (medium)
- S2.2 The Pod Report table and the friction rule read the new stages (medium)
- S2.3 Where a feature funnel shows, a one-time note says the numbers moved and why (low)
- S2.4 A browser spec renders a measured epic's funnel with its switch on, and not with it off (medium)

## Decisions for the Plan gate
- **a.** The API keeps the old `tars` object for **one release, marked deprecated**, beside the new `funnel`, or
  replaces it now?
- **b.** A feature funnel uses the **flag funnel's window** (from first exposure, at most 90 days), or stays all-time?
- **c.** Funded, not grounded (a launch fix)?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/tars-one-model.md
  coverage in   0.95  (4 claims)
  coverage out  0.83  (7 criteria)
  clarity       0.70  (7 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
  why story     0.66  (advisory, not in the total)
Total 87 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.952,"coverage_out":0.826,"clarity":0.698,"teach_back":1,"total":87} -->
