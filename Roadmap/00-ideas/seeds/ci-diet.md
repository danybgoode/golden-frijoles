---
title: "CI diet: kill the duplicates, skip e2e on docs-only PRs, parallelise, and make every flake leave evidence"
slug: ci-diet
status: scaffolded
area: "09"
type: chore
appetite: M
underwritten_by: wave-backfill
risk: high
epic: "09-platform-infra/ci-diet"
build_order: 59
updated: 2026-10-04
intent_ask: verbatim
intent_match: 92
---

# Pitch — CI diet: kill the duplicates, skip e2e on docs-only PRs, parallelise, and make every flake leave evidence

## The ask, as given

> BTW, lets optimize this ci pipleline, it is so bloated, please review it and bring forward a suggestion. Many things
> should be moved out of there replaced killed etc
> — Daniel, 2026-10-04, after #243 (docs only) was blocked by an unrelated authed-e2e flake. Answer to the review: "yes
> please go ahead"

### Claims
1. The pipeline does less: duplicate workflows and checks are killed, and things that don't belong in the PR path move out.
2. A PR gets its answer faster, and a docs-only PR doesn't wait on (or get blocked by) the browser suite.
3. What stays is easier to maintain: no copy-pasted config, and ci.yml readable again.
4. When CI goes red, the failure can be diagnosed from what the run left behind, and a known flake doesn't block every
   unrelated PR.

**Teach-back:** yes — "You want CI to run only what a change can break, as fast as the runner allows, with no duplicate
or dead parts, so that merging stops waiting on bloat and flakes" (review accepted 2026-10-04).

## Problem

Measured 2026-10-04 on `main` (`cfc14d1`) and on #243's run `37167782795`:
- **12 workflows, 1,661 lines.** `ci.yml` is 550 lines, and 303 of them are comments (incident histories).
- **Every PR pays the full e2e job (~7.5 min)**, docs-only included: `supabase start` 86 s, a second `next build` 58 s,
  the `api` suite 68 s, a Chromium install 28 s, `measure-contract` 31 s, and the whole `authed` project 153 s, all
  sequential. #243 changed only `Roadmap/` and was blocked by `portfolio.authed.spec.ts:161` failing twice.
- **Duplicates.** `design-drift-guard.yml` re-runs a check `ci.yml` already runs on every PR. `scripts-guard.yml`'s node
  tests are a subset of `npm run test:unit`. `build-order-guard.yml` is a 1 s check given its own workflow.
- **The same ~14 gate flags are copied four times** (OFF server, ON server, api step, authed step). The comments record
  the "set in both places" bug biting more than once.
- **No evidence on failure.** `playwright.config.ts` sets no `trace`, `screenshot` or `video`, and only the visual gate's
  screenshots are uploaded. The portfolio flake has been "⚠️ Not proven" since #239 because there is nothing to read.
- **Dead suites.** The `browser` project (11 specs) runs in no pipeline; `landing.browser.spec.ts` is red on `main`.
- **The founding premise is stale.** "Actions minutes are a recurring account-wide constraint" (ci.yml:25,
  dependabot.yml, LEARNINGS) predates `public-monorepo`. The repo is **public** now, and standard GitHub-hosted runners
  are free for public repos. The single-sequential-job design optimises a cost that no longer exists.
- **There is no branch protection on `main`** (`gh api …/branches/main/protection` → 404, no rulesets). "CI blocks the
  merge" is a convention, not a setting.

## Appetite
M. Three sprints that each leave the pipeline green and asserting at least what it asserts today.
quote: $23–36 (M, n=6, p25–p75)

## Outcome & signal
- A docs-only PR's checks finish in about 2 min, with e2e reported as *skipped by rule*, not silently absent.
- A code PR's wall clock goes from ~9.5 min to about 5, and Playwright runs exactly the same tests as before (counted).
- 12 workflows become 8, and `ci.yml` drops to roughly 200 lines.
- The next red e2e run uploads a trace that can be opened. A quarantined flake runs, is reported, and blocks nothing
  until its expiry.

## Stage-2.5 bucket
**Light enhancement** of existing infrastructure: every piece already exists (the checks, the specs, Playwright's trace
option, the Jev shadow-expiry pattern). Nothing new is invented; things are deleted, merged, split and configured.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| Delete `design-drift-guard.yml`, `scripts-guard.yml`, `build-order-guard.yml`; fold their unique steps (jev-eval, permissions-smoke, script-parity, build-order `--check`) into the static job | pure duplicates or 1 s checks paying their own checkout |
| Drop `npm audit … \|\| true` | advisory output nobody reads; Dependabot opens the fix PRs |
| `ci/gates.on.env` + `ci/gates.off.env`, loaded once into `$GITHUB_ENV` before each server boots | server and test process agree by construction; ends the four-copy class |
| Trim ci.yml's war stories to one-line reasons, histories to LEARNINGS / git | the file becomes reviewable again |
| A `changes` job: e2e is skipped only when EVERY changed file is `Roadmap/**` or `*.md` (exclusion, never an inclusion list) | docs-only PRs stop paying for, and being blocked by, the browser suite |
| Split e2e into parallel jobs: `api` (+ the OFF server), `authed`, `design-contract` | minutes are free on a public repo; wall clock is what's scarce |
| An always-running `gate` job that fails unless every needed job succeeded or was skipped *by the rule* | one stable check name; a cancelled or failed job can never read as green |
| `supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,storage-api` | the app uses none of them (grep) |
| Cache Playwright browsers; bump actions to v5 | 28 s per job; the runner already warns about Node 20 |
| `trace: 'retain-on-first-failure'`, `screenshot: 'only-on-failure'`, upload `test-results/` on failure | every red run leaves something to open |
| A `@quarantine` tag with owner + expiry (Jev shadow-expiry shape): runs, reports, never blocks, goes red when expired | a known flake stops blocking unrelated PRs without being silently deleted |
| Quarantine `portfolio.authed.spec.ts` "the loop…" with a fix seed | the flake that started this |
| `browser` project: run it nightly with a ping on red (Daniel: nightly) | a suite no pipeline runs decays silently (LEARNINGS) |
| `push-pod-report` moves to its own `deployment_status`-only workflow | stops adding "skipping" rows to every PR's checks |
| Rewrite the "minutes are scarce" lines in ci.yml, dependabot.yml and LEARNINGS | the premise is stale; leaving it steers the next agent wrong |

## Scope
**In v1:** everything in the table, in three sprints (see Slicing), plus the branch-protection decision below.
**Out of v1 (no-gos):**
- **Running e2e against Vercel previews** instead of local Supabase. ci.yml:8-14 explains why (seedable DB, a second
  differently-enved server), and that still holds.
- **Fixing the portfolio flake itself.** This epic quarantines it and gives it a trace; the fix is its own seed once the
  trace exists.
- **Touching `skills-ci.yml`'s content.** It's generated (`render-skills-ci.mjs`) and path-scoped already; at most it
  gets the v5 action bump at its source.
- **Changing what any test asserts.** This epic changes where and when tests run, never what they check.
- **Fixing `landing.browser.spec.ts`.** Nightly makes its redness visible; the fix is a seed.
- **Self-hosted or larger runners.**

## Rabbit holes
- **The aggregate gate's semantics.** `needs:` + `if: always()` — a `skipped` or `cancelled` upstream must not count as
  success unless the `changes` job decided to skip it. Prove it by MUTATION: a scratch PR with a deliberately failing
  test, and one with a cancelled job, must both turn `gate` red (LEARNINGS: *a guard's failing direction is part of the
  guard*; *a fix can be worse than the hole*).
- **Path filters were wrong once already** (ci.yml:79-83). Hence exclusion-only: when in doubt, run everything. A PR that
  touches `Roadmap/` AND a `.ts` file runs the full suite.
- **Splitting e2e re-pays `supabase start` + `next build` per job.** That's fine on free minutes, but the `NEXT_PUBLIC_*`
  values are baked at build time from the job's own `supabase status`, so each job builds after its own Supabase starts.
  Don't share one `.next` across jobs unless the keys are proven identical (ci.yml:152-156: they drifted once).
- **"Same tests run" must be counted, not assumed.** Record `playwright test --list` per project before S2 and assert
  the same counts after; a split that silently drops a project is this repo's most-repeated CI defect (ci.yml:419-465).
- **`supabase start -x`**: confirm auth (gotrue), rest, kong, postgres and inbucket stay up. Inbucket is configured at
  `config.toml:99`; check whether an authed spec reads it before excluding anything near auth.
- **Branch protection is a repo setting, not a file.** It changes how every agent merges (`gh pr merge` would refuse red).
  It's Daniel's decision and Daniel's click (or an explicit authorization), never a builder's.
- **Workflow-file pushes need `gh auth refresh -s workflow`** (memory: experiments-for-humans).

## What already exists (reuse, don't rebuild)
- `ci.yml`'s static job order (cheapest first), `concurrency: cancel-in-progress`.
- `scripts/check-design-drift.mjs`, `scripts/build-order.mjs --check`, `scripts/jev-eval.mjs`,
  `scripts/permissions-smoke.mjs`, `scripts/check-script-parity.mjs`: moved, not rewritten.
- `playwright.config.ts` projects `api` / `browser` / `auth-setup` / `authed` / `auth-teardown`; `retries: 1` on CI.
- The Jev shadow-expiry pattern (`jev-expiry.yml`, `jev.config.json`): the model for quarantine expiry.
- `scripts/telegram-notify.mjs`: the ping for the nightly browser run.
- `scripts/run-local-e2e.mjs` (+ memory *Local CI gate recipe*): the local mirror, which must keep matching the new env
  files.

## UX heuristics & rails check
- **CI guards covering this surface:** none watch the workflows themselves except `render-skills-ci --check` (skills only).
  The mutation proofs in S2 are the guard for the gate's own semantics.
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** n/a.

## Kill-switch / runtime gate (risk:high — Stage 6b)
**No flag (carve-out).** Nothing runs in production; the risk is the merge gate's correctness, and rollback is
`git revert` of the workflow commit. Each sprint is one PR that must pass its own new gate plus the mutation proofs
before merging. Daniel's default is no flag (memory: *NO FLAG — ship straight to prod*).

## Decisions (Daniel, 2026-10-04, at the approval gate)
- **Approved** as pitched; build order after north-star-multi-metric-read.
- **Branch protection: yes, a ruleset requiring `gate` on `main`, with admin bypass**, applied after S2's mutation
  proofs. Daniel applies it, or explicitly authorizes the builder to, at that point; it's never inferred from this line.
- **The `browser` project runs nightly with a Telegram ping on red** (never blocks a PR). `landing.browser.spec.ts`'s
  redness gets its own fix seed.

## Slicing (proposed sprints)
- **S1 — Less, same behaviour.** Kill the three duplicate workflows (fold their steps), drop the advisory audit, add the
  gate env files, trim ci.yml's comments, rewrite the stale minutes premise, bump actions to v5. Proof: the same steps
  and test counts run before and after.
- **S2 — Faster, with a real gate.** The `changes` job (docs-only skip), the parallel e2e jobs, the `gate` aggregate,
  `supabase start -x`, browser caching. Proofs: per-project `--list` counts are unchanged; a docs-only scratch PR shows
  e2e skipped and `gate` green; failing and cancelled mutations turn `gate` red. Then Daniel's branch-protection
  decision, applied to `gate`.
- **S3 — Evidence and hygiene.** Trace/screenshot on failure + upload, the `@quarantine` tag with expiry (+ the portfolio
  test quarantined, with a fix seed), the nightly `browser` run , `push-pod-report` moved out of PR events.

## Acceptance criteria
- `ls .github/workflows | wc -l` is 8 + the nightly browser workflow = 9.
- The static job runs every check the three deleted workflows ran (named in its step list).
- Each gate flag appears in exactly one file per state; `grep -c FLAG_CONSOLE_ENABLED .github/workflows/ci.yml` is 0.
- A docs-only PR: e2e jobs `skipped`, `gate` green, total under 3 min.
- A code PR: the `api`, `authed` and `design-contract` jobs run in parallel, Playwright's per-project test counts equal
  the pre-S2 counts, and wall clock is ≤ 6 min on a normal run.
- Mutation proofs recorded in the S2 PR body: a failing test makes `gate` red, and a cancelled job makes `gate` red.
- An e2e failure uploads a `test-results/` artifact containing a `trace.zip`.
- A test tagged `@quarantine` with a past expiry makes CI red; one with a future expiry fails without blocking.

## Open risks / research
- GitHub-hosted standard runners are free for public repositories (GitHub Actions billing docs; the repo is
  `visibility: PUBLIC` per `gh repo view`, 2026-10-04). If the repo ever goes private again, S2's parallelism costs
  minutes. Note that in ci.yml's header.
- `supabase start -x` service names change between CLI versions. Pin them against the CLI the job installs
  (`setup-cli` uses `version: latest` today; consider pinning).

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/ci-diet.md
  coverage in   0.97  (4 claims)
  coverage out  0.90  (8 criteria)
  clarity       0.83  (8 criteria)
  teach-back    1.00  (yes)
  agreement     pending  (the optional reader at the architecture lock)
Total 92 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.968,"coverage_out":0.895,"clarity":0.832,"teach_back":1,"total":92} -->
