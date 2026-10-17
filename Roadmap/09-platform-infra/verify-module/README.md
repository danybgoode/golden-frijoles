---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-16T23:20:37Z"
slug: verify-module
title: "Verify module"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 2
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 89   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "Our riskiest code (the delivery outbox, the flag evaluator) is reviewed by people and models, and still hid three bugs a model checker found in one session. Running those checks on every PR that touches it, and nightly in depth, catches the next one before merge. We'll know when Jev's routing log reaches 30 labelled PRs."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: "PRs in Jev's verify-depth shadow log with a builder label"   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: 0   # from what, a number
target_to: 30       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "The product owner, shipping agent-built code to real customers"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "Engineering assurance on our own code; no North Star input counts it, and audit D7 forbids a landing claim until it is product."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 97      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Verify module

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/verify-module.md`](../../00-ideas/seeds/verify-module.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Our riskiest code (the delivery outbox, the flag evaluator) still hid three bugs a model checker found in one
session. This runs those checks on every PR that touches it and nightly in depth, keeps the models from drifting, and
measures Jev's verify-depth routing in shadow. When the shadow log reaches 30 labelled PRs, the product owner is
pinged to refine `verify-for-projects` (Daniel, 2026-10-14).


## Platform-first note
No product surface and no landing claim (audit D7). Everything exists and reproduces in the spike
(`verify-spike/REPRODUCE.md`); this moves it into CI. Rules #1–#6 untouched.


## What already exists (reuse, don't rebuild)
- `Roadmap/09-platform-infra/verify-spike/` (`quint/`, `lean/`, `diff-test/`, `jev-triage/`, `DECISION.md`, `REPRODUCE.md`).
- `.github/workflows/ci.yml` (`changes`, `gate`), `browser-nightly.yml` (a nightly's shape), `scripts/telegram-notify.mjs`,
  `scripts/build-order-sync.mjs` (the `claude/` PR pattern), `scripts/owed-ledger.mjs`.


## Architecture lock (2026-10-16, verified against live code and data)

Read live on `origin/main` 84be973. Each decision is cited by the sprint build contracts; it lives here once.

**Corrections the live system forced (said out loud):**
- **The flag evaluator is `packages/sdk/src/flags.ts`, not `apps/web/lib/flags.ts`.** `lib/flags.ts` is the gate seam
  (rule #6) and evaluates nothing; the Lean model and the differential test mirror the SDK file (`Model.lean` header,
  `diff-test/run.mjs` imports). S1.2's pin and S1.4's path filter use the SDK path.
- **The outbox model mirrors six SQL functions and four TS functions, not two.** The model's header names
  `claim_deliveries`, `settle_delivery`, `release_deliveries`, `delete_destination`, `replay_delivery`,
  `ingest_event` (fan-out) and `delivery-dispatch.ts`/`retry-policy.ts`. Pinning only two would let the model drift
  from the other eight silently, so all are pinned (D3).
- **#87 has merged** (#373, migration `20261016100000_delivery_stale_reclaim_charge.sql`, applied in prod). Its
  stale branch charges one attempt and dead-letters at `attempt_count + 1 >= p_max_attempts`: exactly the model's
  `FIX_STALE_COUNT` variant. S1.1 does not wait.
- **The expected results changed with the fix**, re-measured 2026-10-16 (`quint run`, 10k traces, seed 0x1): with the
  fix, the exhaustion witness `noDeadByExhaustion` is now reached by simulation in both modes (the charge makes it
  shallower), while `sendsBounded` holds. The spike's table described the pre-fix code.
- **Actions could not ask Jev or open a PR**: no `TYPESAFE_API_KEY` secret, and "Allow GitHub Actions to create pull
  requests" was off. Daniel approved both (2026-10-16); both were set that day. A PR opened by `GITHUB_TOKEN` does not
  trigger CI, so a nightly `claude/` PR shows `gate` only after a push or a close/reopen.

**Decisions**
- **D1 — Layout.** `git mv` the spike's `quint/`, `lean/`, `diff-test/`, `jev-triage/` to `verify/` at the repo root
  (traces travel with `quint/`). The spike folder keeps `README.md`, `DECISION.md`, `REPRODUCE.md` (paths updated),
  `jev-triage.md`, `RETROSPECTIVE.md`, `sprint-1.md`, plus a pointer line to `verify/`. Scripts that resolved the repo
  root as `../../../..` resolve `../..`. `verify/README.md` holds the four rules (D6) and the commands.
- **D2 — The model is the shipped code.** `outbox_timed` and `outbox_untimed` import `FIX_STALE_COUNT = true` (the code
  since #373). The pre-#373 code stays as `outbox_timed_prefix` (`FIX_STALE_COUNT = false`), run ONLY by the nightly
  as a teeth check: F2 must still be found at depth 12, or the deep check has lost its reach. `check.sh` stays the
  ONE expected table; per-PR = `check.sh quick`, nightly = `check.sh` full.
  Per-PR table (measured): timed — `noVanish`, `noOrphan`, `attemptsBounded`, `sendsBounded`, `noSendAfterTerminal`
  ok; `noStrandedInFlight` (F1, accepted residual) and `noDeadByExhaustion` (W1 witness) violation. Untimed — the
  first four ok; `noSendAfterTerminal` (F3), `noStrandedInFlight`, `noDeadByExhaustion` violation.
- **D3 — Pins.** `verify/pins.json` + `scripts/verify-pins.mjs` (`--check` default, `--write` re-pins; zero-dep;
  exit 0 ok / 1 drift / 2 could not look). Two groups. **outbox**: model `verify/quint/outbox.qnt`; SQL bodies of the
  six functions from the LATEST migration (filename order) that `CREATE`s each; TS functions `sendAndSettle`,
  `settleDelivery`, `releaseUnsent`, `nextState` (`lib/delivery-dispatch.ts`) and `retryDecision` +
  `MAX_ATTEMPTS` (`lib/retry-policy.ts`). **flags**: model `verify/lean/Flageval/Model.lean`; TS functions
  `sameScalar`, `firstFailingClause`, `clausesMatch`, `rolloutOutcome`, `rolloutAdmits`, `matchesRule`,
  `evaluateFlag`, `explainFlagEvaluation`, and the helpers they call that the model's assumptions rest on —
  `validText` (the `trim()` seam F6 is about), `validScalar`, `validValueForType` (*added 2026-10-16, verifier #386*)
  (`packages/sdk/src/flags.ts`). Code is hashed NORMALISED (comments
  stripped, whitespace collapsed), so a comment-only edit passes (smoke steps 2 and 4); models are hashed as bytes.
  Any mismatch fails, naming the side: code moved alone → "update the model, or re-pin if the change doesn't affect
  it"; model moved alone → "re-pin after re-running the check". A mirrored function that can't be found is drift,
  never a skip. Runs in `typecheck-build` before `npm ci`.
- **D4 — Path filters live in `scripts/ci-changes.mjs`**, the one changes script, as two more outputs
  (`verify_outbox`, `verify_flags`); no third-party filter action. Unsure ⇒ `true`. outbox: any file under
  `apps/web/supabase/migrations/` (a redefinition can have any name), `apps/web/lib/{delivery-dispatch,retry-policy,
  deliveries,webhook-delivery}.ts`, `apps/web/app/api/internal/dispatch-deliveries/`, `verify/quint/`. flags:
  `packages/sdk/src/{flags,bucketing}.ts`, `verify/lean/`, `verify/diff-test/`. Both: `verify/pins.json`,
  `.github/workflows/ci.yml`, `scripts/ci-changes.mjs`, `scripts/ci-gate.mjs`.
- **D5 — Jobs and the gate.** `verify-outbox` (`check.sh quick`, then `check.sh teeth`: a mutant whose
  `delete_destination` no longer drains must make `noOrphan` a found violation — *amended 2026-10-16: the settle-budget
  mutant first locked here is not reached within 25 random steps, so it proved nothing*) and `verify-flags` (`lake build`, axioms = a subset of the three standard ones for
  every theorem in `Proofs.lean`, never `sorryAx` (*amended 2026-10-16, cf9eb51*), diff-test seeds 1–3, then the whitespace mutant built in a temp copy must disagree). Toolchains cached
  (`~/.elan` + `.lake` keyed on toolchain/manifest/sources; `~/.quint`). `gate` needs both; `ci-gate.mjs` gains
  `--filtered job=output,…`: a skip is ok only when `changes` set that output to `false`.
- **D6 — `verify/README.md` rules**: (1) a model mirrors pinned code; (2) protocols get a per-PR simulation; (3) the
  exhaustive check runs nightly, never per PR; (4) **no proof tier without a differential test against the real code**.
- **D7 — The nightly** (`verify-nightly.yml`): `schedule` + `workflow_dispatch`, never `pull_request`; `timeout-minutes:
  150`; Java 21 + cached Apalache. `check.sh` gains `--itf-dir` so a violating `bmc` row writes its trace.
  `scripts/verify-nightly.mjs` reads the rows: an unexpected violation is a finding; a no-result row or a lost
  expected violation turns the run red and files nothing. A finding goes to branch `claude/verify-<invariant>`
  (raw seed `Roadmap/00-ideas/seeds/verify-<invariant>.md` + trace + `summarize-itf.mjs` summary, `build-order` and
  `owed-ledger` regenerated). Already filed = that branch exists on the remote, or the seed exists on `main`: a repeat
  pushes to the branch (opens the PR only if none is open); a seed on `main` files nothing. Never pushes to `main`.
- **D8 — The label.** The PR template gains `Verify depth: off | light | standard | deep`. A body with exactly one
  of the four after `Verify depth:` is labelled; the unfilled template line or anything else is unlabelled.
- **D9 — Jev in shadow.** The spike's `verify_depth` question and `SPECS`, alone (no `obligation_difficulty`). State
  = the PR's title, its file stat, and its diff on the spec paths against the merge commit's first parent (60 KB
  cap). The nightly lists PRs merged into `main` (newest 100), skips `claude/` heads and PRs already in the log (on
  `main` or the open shadow branch), and appends `{pr, merged_at, jev, builder_label}` to `verify/jev-shadow.jsonl`
  on `claude/verify-jev-shadow`. Jev failing writes `jev: null` with the reason. Never gates, never comments.
  **Counted = `builder_label` and `jev` both non-null** (agreement needs both). `run.mjs --report` prints counted,
  exact, within one level.
- **D10 — The 30 ping.** After appending, if counted ≥ 30 and `verify/jev-shadow-30.json` exists neither on `main`
  nor the branch: one `telegram-notify.mjs` ping with the AC's sentence, the marker written, and an owed (judgment)
  line added to this epic's `RETROSPECTIVE.md`, all in the shadow PR. A pure `decidePing` is driven 29 → 30 → 31.
- **D11 — No migration, no flag, no product surface.** CI and repo files only; rules #1–#6 untouched. The epic's
  "Migration: apply before merging" line does not apply (no migration).
- **D12 — Routing.** The architect builds both sprints: S1 is all shared CI surface (WAYS-OF-WORKING: done first, by
  the strongest tier), and S2's three stories share one script. Reviews via `review-route.mjs --builder claude`.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Models in verify/ · S1.2 Drift guard · S1.3 Outbox model check · S1.4 Proofs + differential test | low |
| 2 | S2.1 Nightly deep check · S2.2 Jev in shadow · S2.3 Ping at 30 | low |

## Deploy order
S1.1's model update waits for #87 (`delivery-stale-reclaim-uncounted`) to merge. CI only otherwise; nothing to
deploy. The Telegram ping uses the existing `TELEGRAM_*` secrets.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
