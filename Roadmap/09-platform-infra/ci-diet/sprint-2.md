---
epic: ci-diet
sprint: 2
title: "S2 Faster, with a real gate"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Docs-only PRs skip e2e by an exclusion rule"
    as_a: "a planner opening a Roadmap-only PR"
    i_want: "CI to answer in about two minutes"
    so_that: "a docs change never waits on, or is blocked by, the browser suite"
    risk: high
    status: done
  - id: S2.2
    title: "e2e splits into parallel jobs; leaner Supabase; cached browsers"
    as_a: "a builder"
    i_want: "a code PR's CI to finish in about five minutes"
    so_that: "the gate stops being the slowest part of a sprint"
    risk: high
    status: done
  - id: S2.3
    title: "One gate check, proven by mutation; the branch-protection handoff"
    as_a: "the product owner"
    i_want: "one check that is red whenever anything that should have run didn't pass"
    so_that: "a ruleset can require it and a skipped or cancelled job can never read as green"
    risk: high
    status: done
---
# CI diet — Sprint 2: S2 Faster, with a real gate

**Status:** ✅ shipped 2026-10-04: #247 squash-merged as `93d9b49` (stories `58bcf0f` S2.1, `c51ad80` S2.2, `604abd7` S2.3; fixes `f95a3bc` `56d88f9` `c17f61a`). D6 (the ruleset) is owed to Daniel.

## Build contract (locked by the architect before the builder started — README § Architecture lock)
Cite, don't restate: the epic README's **D1, D2, D3, D5, D6**. The lock confirms which Supabase services the suites use
(auth/gotrue, rest, kong, postgres, and inbucket if any spec reads mail) and pins the Supabase CLI version the jobs install.

## Stories

### Story 2.1 — Docs-only PRs skip e2e by an exclusion rule
**As a** planner opening a Roadmap-only PR, **I want** CI to answer in about two minutes, **so that** a docs change never
waits on, or is blocked by, the browser suite.
**Acceptance:**
- A `changes` job outputs `docs_only=true` only when every file in the PR diff matches `Roadmap/**` or `**/*.md`. A diff
  it can't compute → `false`.
- The e2e jobs run `if: needs.changes.outputs.docs_only != 'true'`. The static job always runs (it carries
  build-order `--check`, which docs PRs need).
- A pure-logic spec pins the matcher: `Roadmap/x.md` → docs; `Roadmap/x.md` + `apps/web/a.ts` → not docs;
  `README.md` → docs; `.github/workflows/ci.yml` → not docs; an empty diff → not docs.
**Risk:** high

### Story 2.2 — e2e splits into parallel jobs; leaner Supabase; cached browsers
**As a** builder, **I want** a code PR's CI to finish in about five minutes, **so that** the gate stops being the slowest
part of a sprint.
**Acceptance:**
- Three jobs run in parallel: `e2e-api` (OFF server + `api`), `e2e-authed` (Chromium + `authed`), `design-contract`
  (`measure-contract`, `state-contract`, `render-reference`).
- `supabase start -x <unused services>` per the lock; Playwright browsers are cached by version.
- Per-project `--list` counts equal S1's baseline (PR body table). Wall clock for a code PR is ≤ 6 min on a normal run
  (three runs quoted in the PR body).
**Risk:** high

### Story 2.3 — One `gate` check, proven by mutation; the branch-protection handoff
**As the** product owner, **I want** one check that is red whenever anything that should have run didn't pass, **so
that** a ruleset can require it and a skipped or cancelled job can never read as green.
**Acceptance:**
- `gate` runs `if: always()`, `needs` every job, and implements D3 exactly.
- **Mutation proofs, linked in the PR body** (scratch PRs, closed after): (a) a deliberately failing api test → `gate`
  red; (b) an e2e job cancelled mid-run → `gate` red; (c) a docs-only diff → e2e skipped, `gate` green; (d) a docs +
  `.ts` diff → everything runs.
- After merge, the PR body asks Daniel to apply D6 (ruleset requiring `gate` on `main`, admin bypass), with the exact
  `gh api` call or settings path. The builder does not apply it without his explicit go-ahead in that moment.
**Risk:** high

## Sprint QA
- **gate:** this PR runs the new `gate`; the mutation proofs are the sprint's real QA.
- **browser smoke owed:** no.
- **security lens:** yes (`risk: high`).
- **fresh reviewer:** re-runs mutation (a) themselves rather than reading the PR body.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: GitHub.

1. Open the mutation PR (c) linked in the S2 PR body (docs-only)
   → `e2e-api`, `e2e-authed`, `design-contract` show **Skipped**, `gate` is green, and the whole run took under 3 min.
2. Open mutation PR (a) (failing test)
   → `e2e-api` red, `gate` red.
3. Open the S2 PR's own run
   → the three e2e jobs ran side by side (overlapping timestamps), and `gate` is green.
4. **(owed to Daniel by name: a repo setting)** Apply the ruleset at
   https://github.com/danybgoode/golden-frijoles/settings/rules (require status check `gate` on `main`, admin bypass).
   → a new PR shows `gate` as **Required**.

If any step fails, note the step number + what you saw — that's the bug report.

### Walkthrough as run (2026-10-04, by the builder)
1. **Mutation (c), docs-only** (#250, run [37173081662](https://github.com/danybgoode/golden-frijoles/actions/runs/37173081662)) → `e2e-api`, `e2e-authed`, `design-contract`
   **skipped**; `gate` green; 2m10s total. ✅
2. **Mutation (a), a failing test** (#248, run [37173077330](https://github.com/danybgoode/golden-frijoles/actions/runs/37173077330)) → `e2e-api` red on `zz-gate-mutation.spec.ts`;
   `gate` red. ✅ Also (b), a run cancelled mid-flight (#249, [37173079797](https://github.com/danybgoode/golden-frijoles/actions/runs/37173079797)) → `gate` red; and (d), docs +
   `.ts` (#251, [37173083659](https://github.com/danybgoode/golden-frijoles/actions/runs/37173083659)) → everything ran, `gate` green. ✅
3. **#247's own run** ([37178471860](https://github.com/danybgoode/golden-frijoles/actions/runs/37178471860)) → `e2e-api` 04:57:23–05:01:41, `e2e-authed` 04:57:23–05:02:08 and
   `design-contract` 04:57:23–04:58:29 ran side by side; `gate` green. ✅
4. **The ruleset (D6)**: owed to Daniel by name; the exact `gh api` call is in #247's body. ⏳

**Wall clock:** a code PR is 6m04s–6m16s (baseline 7m38s); docs-only is 2m10s. The ≤ 6 min target is missed by
seconds. `e2e-authed` (about 1.5 min of setup plus a 2.4–2.7 min suite) is the critical path, and getting under 6
would mean sharding it.
**D1:** OFF 30/0, api 648/37, authed 169 with 6 skipped, the same as the baseline.
