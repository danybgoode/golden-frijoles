---
title: "One bet, wired: the flag knows its epic, its funnel and its read"
slug: one-bet-wired
status: scaffolded
area: "01"
type: feature
appetite: L
underwritten_by: wave-2026-10
risk: high
epic: "01-growth-engine/one-bet-wired"
build_order: 78
updated: 2026-10-10
intent_ask: proxy      # reconstructed from the launch-sweep brief and audit §7; Daniel's go: "go ahead one bet wired"
hypothesis: "We believe that wiring each bet's flag to its epic, its adoption event and its funnel with one command, and suggesting a Measure flag for every feature, for founders who build with agents, will make every shipped bet readable on its read date, because today a flag knows nothing about the bet behind it and its funnel stays empty unless someone registers a feature by hand. We'll know when a shipped feature's flag shows a non-empty funnel (targeted, adopted, retained) on its epic page by the read date."
persona: "a founder who owns the product, solo to mid-size, building with agents"
grounded: false
grounded_reason: "no baseline yet: no bet has been proven, so cost per proven bet (the input this moves) is undefined until the first verdict"
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: bets.flag_funnels_enabled
intent_match: 88
---

# Pitch — One bet, wired: the flag knows its epic, its funnel and its read

Moves · Tests: neither — not grounded: `cost_per_proven_bet` (Efficiency: "every change behind a flag with an automatic
readout") has no baseline until a bet is proven

## The ask, as given

> A mechanical pipeline: flags → TARS → journeys → North Star. Flags as a growth tool: "do you want to know if this
> worked?", Measure by default. Journeys and flags: how they relate.
> — Daniel, 2026-10-08, reconstructed from the launch-sweep brief (audit §7, "One bet, wired end to end", and the
> Decisions: Measure flags are the default). Then, 2026-10-10: "go ahead one bet wired".

### Claims
1. A flag is wired to its bet: the epic, the hypothesis, the adoption event, the read.
2. The flag's funnel (Targeted, Adopted, Retained) fills itself from the flag's own evaluations.
3. Measure is the default flag for a feature, so every feature can be read.
4. Journeys show the flags' funnels, and stay separate from flags.

**Teach-back:** yes — "You want a shipped feature's flag to carry its bet and fill its own funnel, with no hand
registration, so the read date has a number; Measure flags by default; and journeys to show those funnels without
creating flags. Right?" (audit §7, agreed in its Decisions section)

## Problem
What is linked today (audit §7, checked again 2026-10-10):
- epic → `flag_key` (one way; the epic page shows the flag's state) and epic → target and read date;
- the feature registry (`/api/v1/features/sync`) carries `targetEvent` / `adoptedEvent` / `retainedEvent` for TARS;
- the SDK records every flag evaluation as `flag_evaluated` with the flag's key as its feature and the variant as a
  tag, and a boolean flag's variants are always `on`/`off`. **TARS never reads it**: a flag's funnel stays empty
  unless someone separately registers a feature with the same key, by hand, with the right events.
- refine's Stage 6b asks "do you want a flag?" by risk (a kill switch); the Measure default was decided 2026-10-08 and
  is not in the text.

## Appetite
L. An engine rule in the TARS read, one CLI command and its route, refine's Stage 6b and the epic's bet fields, and a
read-only journeys section.
quote: $56–79 (L, n=5, p25–p75)

## The TARS model this epic uses (agreed with Daniel, 2026-10-10)

TARS (Reforge: Targeted, Adopted, Retained, Satisfied) reads each stage as a share of the one before:
- **Targeted** is a strategy decision, made before any data: the share of the user base that has the problem the
  feature solves. "Everyone" is 100% of active users; a segment such as "power users" needs a definition and its share
  of the base. It is NOT who was exposed.
- **Adopted**: of the targeted (and, while rolling out, exposed) users, the share who used it meaningfully.
- **Retained**: of the adopters, the share who repeat within the window.
- **Satisfied**: of the retained, the share who say it solved their problem (a rating or survey event).
- **Adopters outside the target** are real evidence of value (and often that the target was too narrow), but they do
  not validate the targeting hypothesis: they are shown **beside** the funnel, never inside its rates.

The flag gives **exposure** (who got it `on`), which is a different thing from the target:

```
Base (active users in the period)
 └─ Targeted: the bet's segment (this epic: `everyone`, 100% of the base)
     └─ Exposed: got the flag on (matters while rolling out)
         └─ Adopted: the bet's adoption event, among targeted ∩ exposed
             └─ Retained: a repeat within the window
                 └─ Satisfied: an optional event, or "not measured", said plainly
     + Adopters outside the target: counted beside the funnel
```

**The engine today diverges** (`lib/tars.ts`, growth-engine-v1): its Targeted counts a "target event" (exposure, such
as viewing a guide), its Adopted is not restricted to the target, and it has no Satisfied stage. This epic builds flag
funnels on the model above; correcting existing features' funnels is the follow-up seed `tars-segments`.

**Segments for later (`tars-segments`):** named segments ("power users": a definition, likely a Journeys cohort, and
its share of the base), the bet's `target_segment` naming one, Adopted computed within it, and the existing TAR
funnels moved to the same model. This epic records `target_segment: everyone` so a bet written now reads unchanged
when segments land.

## Outcome & signal
The epic README carries its bet's measurement: `flag_key`, `target_segment` (`everyone` for now), `adopted_event`,
`retained_event`, `retention_days`, and an optional `satisfied_event` (with the hypothesis, target and read date
already there). `frijoles bet sync <epic>` creates or updates the flag (its
description the hypothesis and the epic) and registers its funnel on the model above: Targeted = the segment (everyone: the project's active users in the period),
Exposed = people who got the flag `on` (`flag_evaluated`, variant `on`), Adopted = the declared event among targeted ∩
exposed, Retained = a repeat within the window, Satisfied = the optional event or "not measured", and adopters outside
the target beside it. The epic page
and a "From your flags" section on Journeys show the funnel. Refine suggests a **Measure** flag (an enablement flag you
roll out) for every feature, and a **Safety** flag (a kill switch) by risk.
**Target:** none yet, honestly: the input this moves is `cost_per_proven_bet`, which is undefined until a bet is proven.

## Stage-2.5 bucket
**Light enhancement on the engine, new on the CLI.** TARS, the feature registry, flag telemetry, the flag CLI, the
epic's result record and the epic page's flag state all exist.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| A flag funnel on the agreed model: base, targeted (segment), exposed (`flag_evaluated` with variant `on`), adopted within targeted ∩ exposed, retained, satisfied (optional), outside adopters beside | a flag's funnel fills from its own evaluations, read the way TARS means it |
| Epic frontmatter `target_segment`, `adopted_event`, `retained_event`, `retention_days`, `satisfied_event`; refine Stage 6b fills them with the flag; scaffold copies; the contract checks | the bet carries what its read needs |
| `frijoles bet sync <epic README>` + a member-gated CLI route: creates or updates the flag and upserts its funnel (feature key = flag key) | one command an agent runs at the Build gate |
| refine Stage 6b: **Measure** (enablement, rolled out) suggested for every Feature epic; **Safety** (kill switch) by risk | "do you want to know if this worked?" |
| Journeys: a read-only "From your flags" section, one funnel per measured flag, named by its epic | journeys show the flags' funnels; creating a journey never creates a flag |
| The epic page shows the flag's funnel beside its state | the read has a number in one place |

## Scope
**Sprint 1 · The funnel fills itself** (S1.1 the flag funnel on the agreed TARS model · S1.2 `bet sync` and its route ·
S1.3 the epic's bet fields through scaffold and the contract) · **Sprint 2 · Measure by default, and seen** (S2.1
refine's Measure/Safety at Stage 6b · S2.2 the epic page and Journeys' "From your flags" · S2.3 CLI 1.2.0, plugin +
kit 1.4.0).

**No-gos:** no migration (the flag funnel reads existing events) · no named segments and no change to existing
features' TAR funnels (both are `tars-segments`, next) · creating a journey never creates a flag ·
no per-user targeting (a flag on for one signed-in person; still open from the UX audit) · no automatic verdicts (the
read date's `epic-read` already drafts them) · no cross-project read: every read is one project's · no change to how a
flag evaluates.

## Rabbit holes
- **Variant names.** Only boolean flags have `on`; a multivariate flag's "targeted" is every evaluation. The rule says so
  rather than guessing.
- **Double counting.** A person evaluated many times counts once (TARS counts distinct users already).
- **The feature registry's key space.** A flag key as a feature key must not collide with a hand-registered feature;
  `bet sync` refuses to overwrite a feature it did not create, and says so.
- **Rollout fairness.** Measure at 10% compares the 10% against nothing unless the read knows the rest are off; the
  first wave reads Adopted ÷ Targeted among the people who got it on, and says it is not an A/B comparison.

## What already exists (reuse, don't rebuild)
- `apps/web/lib/tars.ts` (`computeTars`), `lib/tars-query.ts` (events by `feature_id`), `lib/feature-schema.ts`
- the SDK's flag telemetry (`flag_evaluated`, `tags.flag_key`, `tags.variant`); boolean variants `on`/`off`
- `frijoles flags create|get` and `lib/cli-flag-write.ts`; `lib/cli-auth.ts`
- the epic's result record and `lib/epic-flag.ts`; refine's `references/kill-switch.md` (Stage 6b)
- `apps/web/app/app/journeys/[projectSlug]`, `lib/journey-list-view.ts`

## Visuals

```
 epic README:  flag_key · hypothesis · adopted_event · retained_event · retention_days · target · read_date
      │  frijoles bet sync Roadmap/…/README.md
      ├─▶ flag (Measure, off until rollout; description = the bet)
      └─▶ funnel: Targeted = flag_evaluated where variant = on · Adopted = <event> · Retained = repeat in window
                  ▼
 epic page: flag state + funnel     Journeys › From your flags: one funnel per measured flag
```

## UX heuristics & rails check
Stage 6b's question becomes "Do you want to know if this worked?" (Measure) before "Do you need to switch it off fast?"
(Safety). Funnels are read-only views; nothing on Journeys can drift from the flag.

## Kill-switch / runtime gate (risk:high only — Stage 6b)
**Flag:** `bets.flag_funnels_enabled`, a kill switch (on, so it can be switched off), in every environment, with the
hypothesis as its description. It gates the TARS rule's use on the epic page and the Journeys section, and the bet route.

## Acceptance criteria
- S1.1 A flag's funnel reads base, targeted (everyone), exposed (flag on), adopted within targeted and exposed, retained and satisfied (or not measured), with outside adopters beside it (high)
- S1.2 frijoles bet sync creates or updates the flag and registers its funnel from the epic, and refuses to overwrite a feature it did not create (high)
- S1.3 Epics carry target_segment, adopted_event, retained_event, retention_days and satisfied_event from the seed, checked by the contract (high)
- S2.1 Refine suggests a Measure flag for every feature and a Safety flag by risk, in plain words (high)
- S2.2 The epic page and Journeys' "From your flags" show each measured flag's funnel, read-only (high)
- S2.3 CLI and plugin + kit releases with CHANGELOG entries (low)

## Open risks / research
- Whether the TARS read can filter `flag_evaluated` by tag without a new column or index (decision a).
- The North Star link: the epic's `target_metric` already names the input; the funnel does not need its own link.

## Decisions for the Plan gate
- **a.** Targeted from `flag_evaluated` with variant `on`, as a **rule in the TARS read** (no migration), or a new
  `target_variant` column on the feature registry (a migration, more general)?
- **b.** `bet sync` is **run by the agent at the Build gate** (after the epic is scaffolded; needs sign-in), or automatic
  inside scaffold whenever the account is signed in?
- **c.** The target: fund it **ungrounded** (as written: `cost_per_proven_bet` has no baseline until a bet is proven), or
  target `proving_workspaces` like the setup epics?

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/one-bet-wired.md
  coverage in   0.94  (4 claims)
  coverage out  0.79  (6 criteria)
  clarity       0.77  (6 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 88 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.94,"coverage_out":0.792,"clarity":0.768,"teach_back":1,"total":88} -->

## Decisions at the Plan gate (Daniel, 2026-10-10)
- **Approved.**
- **a.** The flag's `on` evaluations are **exposure**, read as a rule with no migration, inside the TARS model above:
  Targeted is the bet's segment (everyone, for now), Adopted within targeted ∩ exposed, Satisfied optional, adopters
  outside the target beside the funnel. Named segments and correcting existing funnels are the follow-up `tars-segments`.
- **b.** Never a gotcha in the middle of good work: the bet is recorded locally always and synced whenever signed in.
  Sign-in is **suggested where it adds value**: when the founder answers yes to "Do you want to know if this worked?"
  (refine's Measure question), with the value in one sentence and "Later" always there; once per project, and the Plan
  gate's Flag line says "measured once you sign in" while it is pending. Once signed in, the agent runs `bet sync` at
  the Build gate.
- **c.** Funded **not grounded**: `cost_per_proven_bet` has no baseline until a bet is proven.

