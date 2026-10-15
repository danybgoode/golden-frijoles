# Owed on screen — Retrospective

_Closed: 2026-10-15_
_Intent: yes | mostly | no_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $15–34 (M, n=24, p25–p75) → ≈$26.25 (−23% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$23.92 · claude-sonnet-5-5 ≈$2.34 · reviewers Codex (gpt-5.6-terra, general, Clean on #375 and #376), agy gpt-oss-120b-medium (security lens on #375, scoped, Clean), fresh `verifier` ×3 (#375 rounds 1–2, #376) · prose the architect — as planned: Opus built Sprint 1 (contract + authorization boundary), one Sonnet builder built Sprint 2 in its own worktree._

## What shipped
- **Sprint 1 — the data, member-only** (#375, merge `8cb1ec4`; plugin + kit 1.10.0). The roadmap push carries one
  top-level `owed` block, derived live from `owed-ledger.mjs`'s own functions; every report-artifact read strips it
  (`artifactFromRow`), the one raw read has a closed caller registry, and `getOwedForViewer` hands checks to members
  only — the public project's anonymous readers and the connector get none. Live: production v446 stores 96 checks.
- **Sprint 2 — on screen** (#376, merge `635f2dc`). An "Owed" section on the epic page, one "Waiting on you" band on the project board
  (three groups by who can clear it), "N owed" on the portfolio, `owed_viewed` measured — all behind
  `hub.owed_enabled`, `off v1` in production until the product owner switches it on.

## What went well
- The lock disproved the seed's own premise before a line was written: `OWED-LEDGER.json` holds counts only, so
  "read the JSON" became "derive the items live", and per-row `owed` became one top-level block that one strip covers.
- Putting the strip at the read seam meant no existing reader was edited, and the registry spec makes a new raw reader
  a red test instead of a review comment.
- The tenancy source guard (`portfolio-access.spec.ts`) caught the Sprint 2 builder's first `getPortfolio` change; the
  fix restored the guarded line instead of loosening the guard.

## What we learned
- **A push-contract change's first push lands on the OLD deploy.** The merge fires `roadmap-push` and Vercel's deploy in
  parallel; the push won by 29 s, the old non-strict schema dropped `owed` and answered `unchanged`. Re-run the push
  after the deploy reports `success`, and verify the stored artifact, not the run's green.
- **A lazy `import()` doesn't shrink a vendored closure** — `render-hook-vendor.mjs` follows dynamic imports. The
  skills-ci failure was the same lesson LEARNINGS already holds: replay every `run:` step from the workflow file, on
  the subtree split.
- **zsh does not word-split `$CMD args`**: four "mutation checks" written as `T="node --test"; $T file` never ran, and
  printed nothing. A mutation check counts only when the red is on screen.
- **The producer must not send what the validator refuses.** The verifier found ledger items (a `(group)` spec path,
  >100 on one epic, a >300-char path) that would have 400'd a consumer's whole push; the extract now conforms its own
  output to the schema's bounds and says what it left off.

## Gaps / follow-ups
**Owed to the product owner:**
- The _Intent_ answer above.
- Switching `hub.owed_enabled` on in production and the Sprint 2 signed-in walkthrough (steps 2–5 of `sprint-2.md`).
- The result read on the target (open owed checks 96 → 40), due ~2026-11-14: `node scripts/epic-read.mjs --epic owed-on-screen`.

Follow-ups (engineering):
- Make the roadmap push run on the production `deployment_status`, so a contract change's first push reaches the new
  route (this epic's push raced its deploy, the second time — LEARNINGS).
- A signed-in **dark** pass: CI's OFF server runs only the `api` project, so `owed-on-screen-dark.authed.spec.ts`
  self-skips everywhere; the flag-off path for a member is held by the source guard `owed-screens.test.ts`.
- ✅ `apps/web/lib/owed-read*`, `owed-screen*` and `report-artifact*` added to `securityPaths` in the close-out, so an
  edit to the member gate or the strip triggers the security lens.
- The lit band is a new, unapproved visual state (approve it when the flag goes on).
- No screen-level spec for a signed-in non-member of the public project (the code returns `{ ok: false }`; S1's pure
  spec pins `owedForViewer(…, false)`).
