---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
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
