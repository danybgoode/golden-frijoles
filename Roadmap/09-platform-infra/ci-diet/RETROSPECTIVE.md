# CI diet — Retrospective

_Closed: 2026-10-04_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $23–36 (M, n=6, p25–p75) → ≈$30.73 (within; −15% vs the quote's top)_

## What shipped
- **S1, less, same behaviour** (#246, `000fc5e`). Three duplicate workflows and the advisory audit are gone, and their
  checks are named steps in the static job. One env file per gate state (`ci/gates.{on,off}.env`) is read by one
  strict parser, both in CI and in the local runner. `ci.yml` went from 550 to 192 lines; its incident histories are
  distilled into LEARNINGS. Actions are on v7, and `jev-eval --no-expiry` shipped in plugin/kit 0.26.2.
- **S2, faster, with a real gate** (#247, `93d9b49`).
  - A `changes` job lets a docs-only PR skip e2e, by exclusion only.
  - `e2e-api`, `e2e-authed` and `design-contract` run in parallel off three composite actions.
  - Supabase CLI is pinned at 2.119.0 with nine services excluded, and Chromium is cached.
  - One `gate` check, proven by four mutation PRs.
  - Docs-only PRs went from 7m38s to 2m10s; a code PR now takes about 6m05s–6m16s.
- **S3, evidence and hygiene** (#258, `a081953`).
  - Traces and screenshots are kept on a CI failure and uploaded.
  - `@quarantine` carries an owner and an expiry ≤ 30 days, read from Playwright's own list. The portfolio loop test is
    its first tenant, until 2026-10-18.
  - `browser` runs nightly with a Telegram ping on red.
  - The Pod Report push has its own workflow.
- **Outside the code, on Daniel's instruction:** Dependabot alerts and security updates were turned on. Within the
  hour they opened five security PRs (#252–#256).

## What went well
- **The lock measured before it decided.** The baseline run's per-project passed AND skipped counts gave D1 a number,
  so every split was proven by equal counts (OFF 30/0, api 648/37, authed 169/6), not by assumption.
- **The mutation PRs were cheap and conclusive.** Four scratch PRs gave (a) a failing test → red, (b) a cancelled run
  → red, (c) docs-only → skipped and green, and (d) docs + `.ts` → everything. The fresh reviewer re-derived (a) from
  the script and from the real run.
- **The folded checks caught real misses in this very epic.** `build-order --check` caught a sprint-status flip I had
  not regenerated, and script parity caught a mirrored spec I had edited once.

## What we learned
- **The lock disproved the groom three times, and the build twice more.** "v5" was stale (v7 was current, and
  dependabot's open #130 was red for editing a generated file). `design-contract` needs no Supabase. `**/*.md` would
  have let a markdown-only PR skip the one job that guards `MEASURED-SPEC.md`. A `deployment_status` workflow can't
  avoid a preview's skipped row. And the local runner was never CI's mirror.
- **A check that "works locally" may only work because of local state.** The quarantine check passed for me because
  `.env.local` existed; in CI it failed closed on every PR. Run a new CI step from a checkout without the developer's
  env before pushing it.
- **Replay the job's whole step list before a push, every time.** I re-learned the existing LEARNINGS rule twice in
  one epic (`build-order`, script parity), each time after running only the unit tests.
- **`set -e` turns a cleanup trap into the step's exit code.** A `kill -9` on an already-exited server made a step red
  with 30/30 passed. Every command in an EXIT trap needs `|| true`.
- **Folding a date-based guard into the blocking gate changes who it blocks.** Jev's shadow expiry would have gone
  red on every PR from 2026-10-15; Daniel moved it to daily-only. A quarantine's expiry stays blocking on purpose.
- **A quarantine can take an authorization proof out of the gate.** The flaky steps were the only end-to-end check
  of a Server Action's authz wiring. The fresh reviewer saw it, and Daniel accepted 14 days rather than 30.

## Gaps / follow-ups
- **Owed to Daniel:**
  - **D6:** a ruleset requiring `gate` on `main` (admin bypass, pinned to GitHub Actions). The exact `gh api` call is
    in #247's body.
  - Open one `trace.zip` in `npx playwright show-trace` (S3 smoke step 3).
  - The `_Intent:_` answer above.
- **The ≤ 6 min code-PR target is missed by seconds.** `e2e-authed` is the critical path; sharding it is the next
  lever.
- **C8:** a preview deploy's `deployment_status` still leaves one skipped Pod Report row on each PR.
- **Seeds:** `portfolio-loop-flake` (fix before 2026-10-18, or `gate` goes red), and `landing-browser-spec-red` (see
  the nightly).
- **Vibe failed three times on this machine,** including with 60 turns and a 60 KB scoped payload, so agy covered
  both lenses. Codex was capped. Both are worth diagnosing before the next HIGH epic.
- **Five Dependabot security PRs (#252–#256) await review,** among them a `next`/`sharp` bump.
