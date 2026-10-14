---
title: "The outcome report for any product"
slug: outcome-report-any-product
status: scaffolded
area: "02-commercial"
type: bug
appetite: S
risk: high
updated: 2026-10-14
intent_ask: verbatim
quote: $6–16 (S, n=8, p25–p75)
hypothesis: null
persona: "A founder (and their agent) running a product other than Golden Frijoles who was promised an outcome report."
grounded: null
grounded_reason: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
intent_match: 89
underwritten_by: wave-2026-10
build_order: 87
epic: "02-commercial/outcome-report-any-product"
---

# Pitch — The outcome report for any product

## The ask, as given

> "Golden Frijoles setup mentions an outcome report as an account benefit, but it does not install
> scripts/pod-report.mjs in aomx, and kit 1.9.2 does not include that command. The console instruction therefore
> exposes a provider setup gap as well as this reporting bug. The generator needs to read actual frontmatter status
> changes before an aomx report is safe to publish." — another agent testing aomx, relayed by the product owner
> (2026-10-14), who chose: next epic, refined first, plan gate before any code.

### Claims
1. Setup and install.md promise an outcome report to every account.
2. Another product cannot generate one: the generator is not in the kit.
3. The console's empty Outcome Report page tells people to run a script they don't have.
4. The generator's shipped dates must come from the epic's real frontmatter status, not a text search, before a
   report for another product can be trusted.

**Teach-back:** "Any product that pushes its roadmap can also make and push its outcome report from the kit, with
shipped dates read from each epic's real `status:` history, and nothing on screen promises a command it doesn't have."

## Problem
The Outcome Report page renders a `pod_report` artifact. Only `scripts/pod-report.mjs` in THIS repo makes one: it is not
in `skills/template/scripts/` (so not in the kit), its libraries (`lib/pod-metrics.mjs`, `lib/maturity-lens.mjs`) aren't
either, it defaults to `http://localhost:3000`, and it reads `POD_REPORT_API_KEY` / `SELF_PROJECT_API_KEY` but not
`GROWTH_ENGINE_API_KEY` — the name `frijoles init --ingest` writes and `roadmap-push` reads. Its epic dates find
`shippedAt` with `git log -S 'status: shipped'`, which misses a quoted value or other spacing, and its own comment
records that a `-G` swap moved the validated numbers (47 epics, 7.2-day median) and that the real fix — parse the
frontmatter at each revision, proven by a fixture — was deferred. Meanwhile setup (`config-registry.mjs`, setup
SKILL.md, install.md) sells "an outcome report you can send", and the console's empty state
(`report-components.tsx:122`) names `node scripts/pod-report.mjs --repo <checkout> --push`.

## Decisions (Plan gate, 2026-10-14)
(a) first ship for lead time + rework as its own number (above); (b) a stranger's push defaults to https://goldenfrijoles.com.

## Appetite
S — one sprint, no migration, no server change (the push and lifecycle routes already take any product's ingest key).
quote: $6–16 (S, n=8, p25–p75)

## Stage-2.5 bucket
**Light enhancement**: the generator, the push route, the renderer and the share links all exist. What's missing is
distribution (the kit), a robust date source, and true copy.

## Bill of materials (What / Why)
| What | Why |
|---|---|
| `pod-report` moves into `skills/template/scripts/` with `lib/pod-metrics.mjs` + `lib/maturity-lens.mjs`, declared in the report skill's `requires_scripts` | `npx -y @golden-frijoles/kit pod-report --push` works in any repo |
| Defaults for a stranger: `--repo` = the project root, `GROWTH_ENGINE_URL` default `https://goldenfrijoles.com`, key order `POD_REPORT_API_KEY` > `SELF_PROJECT_API_KEY` > `GROWTH_ENGINE_API_KEY` | the same env `frijoles init --ingest` + `roadmap-push` already use |
| `shippedAt` / `startedAt` from each README revision's PARSED frontmatter (the extractor's own parser): shipped = the first revision whose `status` reads shipped | a quoted or re-spaced value counts; a changelog edit to the status comment doesn't |
| A fixture proving Golden Frijoles' validated numbers don't move, plus synthetic repos for the edge cases | the date source changes without the headline metric silently changing |
| Console empty state, setup copy, install.md and /agents.md name the kit command | nothing on screen promises a command the reader doesn't have |
| Each epic's status history (date · from → to · commit) and a rework count (re-opened after shipping, and the time to ship again) travel in the artifact; the report shows one line "Re-opened after shipping: n of m" | rework is its own signal, never folded into lead time (the product owner, 2026-10-14) |

## Rabbit holes
- **The validated numbers.** The swap must reproduce today's numbers on this repo exactly, or the difference is named
  and explained in the PR (a real bug the old search had), never silently absorbed.
- **Cost of walking history.** Parsing every revision of every README is O(revisions); use one `git log -p --follow`
  per README (or `--format` + `git show` batched), not one process per revision.
- **A re-opened epic** (shipped → in progress → shipped). Decided (the product owner, 2026-10-14): lead time runs to
  the FIRST ship (validated numbers kept); every status change is kept as data, and rework — epics that left
  `shipped`, with the time to ship again and the re-opening commit's subject — is its own number. No reason is guessed.
- **Repos without `gh`**: PR facts are optional already (`readPullRequests` returns []); keep it so.

## No-gos
- Velocity, cost-per-point, change-failure rate (still NOT_INSTRUMENTED by design).
- A scheduled/CI push for other products (a workflow template is a later bet).
- New server routes or schema (the artifact contract is unchanged).

## Scope
**In:** the table above. **Out:** the no-gos.

## Visuals
```mermaid
flowchart LR
  R[aomx repo: Roadmap/*/*/README.md history] -- npx kit pod-report --push --> K[kit pod-report]
  K -- POST /api/v1/reports/pod/push (ingest key) --> A[(report_artifacts: pod_report)]
  A --> P[/hub/aomx/report + share links/]
```

## UX heuristics & rails check
- Guards: `check-script-parity` (template ↔ scripts copies), `check-skill-scripts` (requires_scripts), the kit build,
  `lib/agents-md.test.ts` (the command it names must exist), the pod-report fixture test.
- Copy is plain and states the one command.

## Kill-switch / runtime gate
None: a Bug fix in a CLI tool and copy; rollback is `git revert` plus a kit patch release.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/outcome-report-any-product.md
  coverage in   0.89  (4 claims)
  coverage out  —     (no acceptance list)
  clarity       —     (no acceptance list)
  teach-back    —     (not recorded)
  agreement     pending  (the optional reader at the architecture lock)
Total 89 / 100 — uncalibrated · signals: coverage in
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.885,"coverage_out":null,"clarity":null,"teach_back":null,"total":89} -->
