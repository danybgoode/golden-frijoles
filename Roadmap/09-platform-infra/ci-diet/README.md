---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-04T02:30:22Z"
slug: ci-diet
title: "CI diet"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 3
stories_total: 9   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 92   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 23    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 36
quote_basis: "M, n=6, p25–p75"
build_order: 59      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: CI diet

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/ci-diet.md`](../../00-ideas/seeds/ci-diet.md)
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
Daniel, 2026-10-04: *"lets optimize this ci pipleline, it is so bloated … Many things should be moved out of there
replaced killed etc"*. #243, a docs-only PR, sat behind a 7.5-minute browser suite and was blocked by a flake that has
nothing to do with docs. After this epic, CI runs only what a change can break, in parallel, with no duplicated checks
or copy-pasted config. Every red run leaves a trace to open, and a known flake reports without blocking everyone.

## Platform-first note
No engine surface: this is `.github/workflows/`, `apps/web/playwright.config.ts` and docs. AGENTS rule 4 still holds:
merge to `main` is the deploy, and nothing here deploys. The seed's Problem section holds every measurement this is
built on (run `37167782795`).

## Decisions proposed at grooming (the architect verifies each against the live workflows at the lock)
- **D1 — The epic changes where and when tests run, never what they assert.** Every sprint proves it by counting
  (`playwright test --list` per project, and the static job's step list) before and after.
- **D2 — Exclusion-only skip.** e2e is skipped only when EVERY changed file matches `Roadmap/**` or `**/*.md`. Anything
  else, or a diff that can't be computed, runs everything.
- **D3 — One gate name: `gate`.** It always runs (`if: always()`), `needs` every job, and is green only when each one
  `succeeded`, or was `skipped` because D2's `changes` output said so. `cancelled`, `failure`, and a skip D2 didn't order
  are all red. The S2 PR proves it by mutation (a failing test, a cancelled job).
- **D4 — One file per gate state:** `ci/gates.on.env`, `ci/gates.off.env`, written to `$GITHUB_ENV` before the matching
  server boots, so the server and test process agree by construction. `scripts/run-local-e2e.mjs` reads the same files.
- **D5 — Parallel e2e jobs:** `e2e-api` (+ the OFF server), `e2e-authed`, `design-contract`. Each starts its own
  Supabase and builds after it (`NEXT_PUBLIC_*` keys are baked at build time from that job's `supabase status`;
  ci.yml:152-156).
- **D6 — Branch protection (Daniel, 2026-10-04):** a ruleset requiring `gate` on `main`, with admin bypass, applied
  after S2's mutation proofs, by Daniel or with his explicit authorization at that moment.
- **D7 — Quarantine** is a `@quarantine(owner, expires: YYYY-MM-DD)` tag, modelled on Jev's shadow expiry. A
  quarantined test runs in a non-blocking job and reports; past its expiry, it makes `gate` red.
- **D8 — `browser` runs nightly (Daniel, 2026-10-04)** in its own scheduled workflow, with a Telegram ping on red
  through `scripts/telegram-notify.mjs`. It never blocks a PR.
- **D9 — The stale minutes premise is rewritten everywhere it appears** (ci.yml header, `dependabot.yml`, LEARNINGS →
  *Working efficiently*): the repo is public, so standard runners are free. ci.yml notes it in one line in case the
  repo ever goes private again.

## Architecture lock (2026-10-04, verified against live code and run `37169885661`)
D1–D9 above stand, as amended here. Every builder cites this section; nothing below is restated in the sprint files.

**Baseline (D1's yardstick)** — run `37169885661` (#245, the newest green PR run on `cfc14d1`'s tree):

| Run | Tests | Passed | Skipped |
|---|---|---|---|
| OFF server (7 files, `--project=api`) | 30 | 30 | 0 |
| `api` (`npm run test:e2e`) | 685 | 648 | 37 |
| `authed` (incl. setup/teardown) | 169 | 163 | 6 |

`--list` locally: api 685 / 94 files, authed 166 / 32 files, browser 65 / 12 files, OFF 30 / 7 files. **D1 is proven
on passed AND skipped**: a skip delta is how a flag mismatch shows up, so equal totals with a different skip count is a
failure. Static job steps today: template-drift, `npm ci`, lint, format(changed), unit, extract-css `--check`,
design-drift, coverage + ratchet, audit (advisory), typecheck, build.

**Corrections — scope the live system disproved:**
- **C1 — "actions v5" is stale.** Current majors are checkout **v7**, setup-node **v7**, upload-artifact **v7**
  (`gh api …/releases/latest`), codeql-action **v4**. Dependabot's #130 (open 33 days) proposes exactly 4→7 and is red
  because it edited the GENERATED `skills-ci.yml` (render `--check` fails). S1.3 bumps at the source
  (`skills/.github/workflows/ci.yml` → `render-skills-ci.mjs`, whose step marker matches `setup-node@v4` literally and
  is updated with it) and closes #130 as superseded. A workflow-only skills edit is not a plugin release
  (`check-release.mjs` watches `plugins/**`, `kit/**` and the script closure). `supabase/setup-cli` v1→v3 moves with
  the CLI pin in S2.
- **C2 — `design-contract` needs no Supabase and no server.** `_harness.mjs:39` opens the prototype at `file://`;
  only Chromium. No authed spec reads `render-reference`'s output (`console-visual.authed.spec.ts:391`: layer 3 not
  built). D5 is amended: `design-contract` = checkout + `npm ci` + cached Chromium + the three scripts.
- **C3 — `run-local-e2e.mjs` is not CI's mirror today.** It never sets `EXPERIMENT_BUILDER_ENABLED`, runs `api` with
  `SIGNUP_ENABLED=false` (CI: true), and has deliberate extras: `SCENARIO_AUTHORING_ENABLED` + `FLAG_DEFINITION_SYNC_ENABLED`
  ON, `CONNECTOR_WRITES_ENABLED` explicit OFF, a third `:3112` sync-without-serving server, and
  `flag-catalog-sync-dark.spec.ts` on its dark list. **Decision:** it reads `ci/gates.*.env` as its BASE and keeps
  its extras as one named `LOCAL_OVERRIDES` object, one reason each, so local ⊇ CI. The two drifts
  (`EXPERIMENT_BUILDER_ENABLED`, `SIGNUP_ENABLED` on `api`) are corrected to CI's values. Stated in the S1 PR body.
- **C4 — push-to-main coverage: no replacement trigger.** The three deleted workflows also ran on `push` to `main`.
  Direct pushes do happen (`cfc14d1`, the only first-parent non-PR commit in the last 40). What they would catch is
  covered elsewhere: Jev shadow rot is a date and `jev-expiry.yml` runs it daily; board drift is the nightly
  `build-order-sync`; and D6's ruleset makes a direct push an explicit admin bypass. `ci.yml` stays
  `pull_request`-only (the ratchet's `COVERAGE_BASE_REF` depends on it, ci.yml:95-100).
- **C5 — workflow count is 11, not 9.** 12 − 3 deleted + `browser-nightly.yml` + `pod-report-push.yml` (S3.3 moves
  the Pod Report OUT of `roadmap-push.yml` into its own file). The seed's "8 + 1" did not count that new file.
- **C6 — the env files hold the 15 gates CI sets today, nothing more.** Every one is read as `=== 'true'`
  (`lib/flags.ts`), so writing an explicit `false` where CI left a gate unset is identical behaviour.
  `CLI_WRITE_API_ENABLED` is the one inverse predicate (`!== 'false'`, default ON) and stays out of both files, as do
  `AGENT_RAIL_ENABLED`, `DESTINATION_DELIVERY_ENABLED`, `CONNECTOR_WRITES_ENABLED` (CI never sets them; specs that need
  them set them in-process). The **Build step runs before either file is loaded**, as today (no gate at build time).

- **C7 — D2's `**/*.md` is too wide (found building S2, 2026-10-04).** `apps/web/design-system/MEASURED-SPEC.md` is
  generated and only `measure-contract --check` (the `design-contract` job) catches a hand-edit; `APPROVED.md` is read
  by `state-contract`/`surface-contract`. A markdown-only PR touching them would have skipped the one job that guards
  them. **D2 as built:** a file is docs iff it is under `Roadmap/`, or it ends in `.md` and is NOT under `apps/` or
  `packages/` (what the e2e jobs build and read). Renames are diffed with `--no-renames`, so a `.ts` moved into
  `Roadmap/` still lists its old path.

**Decisions added at the lock:**
- **D10 — The gate's logic and the docs-only matcher are pure scripts with specs**, not inline YAML expressions:
  `scripts/ci-gate.mjs` (input: `toJSON(needs)` + `docs_only`; exit 1 unless D3 holds) and `scripts/ci-changes.mjs`
  (input: the changed-file list; output `docs_only`). Both specs pin both directions, picked up by `test:unit`'s
  `scripts/**/*.test.mjs` glob. `changes` computes the list with `git diff --name-only <base>...<head>` on a full
  clone; any error, or an empty list, → `docs_only=false`.
- **D11 — Supabase in CI (S2):** CLI pinned to **2.119.0** (what `latest` resolves to today), started with
  `-x realtime,storage-api,imgproxy,mailpit,studio,edge-runtime,logflare,vector,supavisor` (the names are the pinned
  CLI's own `--exclude` list). Kept: postgres, gotrue, kong, postgrest, postgres-meta. Evidence: `auth.setup.ts:87`
  signs in by password grant; nothing reads mail (no `inbucket|mailpit|54324` in `e2e/` or `scripts/`); nothing uses
  storage, realtime or functions (grep of `lib/`, `app/`, `e2e/`).
- **D12 — Each e2e job reproduces today's server setup in full**: Supabase, credentials, build, self key, ON server,
  both seeds (seconds; the authed project is never proven seed-independent). `e2e-api` adds the OFF server first.
- **D13 — Quarantine (S3)** is read from Playwright itself (`--list --reporter=json`: tags + annotations), never
  from a source grep. The annotation is `{ type: 'quarantine', description: 'owner=<who> expires=YYYY-MM-DD' }`.
  The checker fails on: past expiry, more than 30 days out (Jev's `MAX_SHADOW_DAYS` cap), a missing owner or date, or
  an annotation without the tag (or the reverse). It runs in the static job (so `gate` sees it) and in the nightly.
  The `quarantine` job is NOT in `gate`'s `needs`. The builder verifies whether `--grep` filters the `auth-setup`
  dependency before relying on it.
- **D14 — Where to build:** in place. One session, one checkout (`git worktree list`), and CI is the shared surface
  the architect does first (WAYS: *Routing a build by model tier*). Routing: the architect builds all three sprints.
  The fresh `pr-reviewer` is mandatory on every PR (`risk: high`) and re-runs mutation (a) on S2.

**Build contracts:**
- **S1** — cite D1, D4, D9, C1, C3, C4, C6. Proof: the baseline table re-measured on the S1 PR (passed + skipped per
  run), and the static job's step list before/after in the PR body.
- **S2** — cite D1, D2, D3, D5 (as amended by C2), D6, D10, D11, D12. Proof: the four mutation PRs (sprint-2.md 2.3),
  per-job counts equal to the baseline, three wall-clock readings. D6 is asked of Daniel after merge, never applied.
- **S3** — cite D3, D7, D8, D13, C5. Proof: a `workflow_dispatch` nightly run, the expiry spec both ways, a
  `trace.zip` from a deliberately red run.

## What already exists (reuse, don't rebuild)
- `scripts/check-design-drift.mjs`, `scripts/build-order.mjs --check`, `scripts/jev-eval.mjs`,
  `scripts/permissions-smoke.mjs`, `scripts/check-script-parity.mjs`: moved into the static job, not rewritten
- `apps/web/playwright.config.ts` projects (`api`, `browser`, `auth-setup`, `authed`, `auth-teardown`), `retries: 1`
- `jev-expiry.yml` + `jev.config.json` (the expiry pattern); `scripts/telegram-notify.mjs` (the ping)
- `scripts/run-local-e2e.mjs` + memory *Local CI gate recipe* (the local mirror, which must keep matching)
- `scripts/render-skills-ci.mjs` (skills-ci is generated; only its action versions change, at the source)

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Three duplicate workflows and the advisory audit go; their unique checks join the static job | high |
| 1 | S1.2 One env file per gate state replaces the four copied flag lists | high |
| 1 | S1.3 ci.yml reads in one sitting; the stale minutes premise is rewritten; actions v5 | low |
| 2 | S2.1 Docs-only PRs skip e2e by an exclusion rule | high |
| 2 | S2.2 e2e splits into parallel jobs; leaner Supabase; cached browsers | high |
| 2 | S2.3 One `gate` check, proven by mutation; the branch-protection handoff | high |
| 3 | S3.1 Every red run leaves a trace | low |
| 3 | S3.2 Quarantine with expiry; the portfolio loop test is its first tenant | high |
| 3 | S3.3 `browser` runs nightly; the Pod Report push leaves PR events | low |

**Risk note:** high. The blocking merge gate is shared infra, so the review scope includes the security lens on S1–S2
(`risk: high` in the PR body). No kill-switch: nothing runs in production, and rollback is `git revert` of the workflow
commit (the seed's Stage-6b carve-out).

**Model routing:** S2 (D2, D3, D5: the gate's semantics) goes to the stronger builder, and its fresh reviewer re-runs
the mutation proofs rather than reading the PR body. S1 and S3 are mostly mechanical.

## Deploy order
S1 → S2 → S3, stacked (`feat/ci-diet` → `-s2` → `-s3`, as the kickoff names them). Each PR is validated by the CI it introduces, so S2's PR runs
the new `gate`. After S2 merges: Daniel applies the ruleset (D6). Pushing workflow files needs
`gh auth refresh -s workflow` (memory: experiments-for-humans).

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
