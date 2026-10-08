---
epic: coaches-v2
sprint: 1
title: "Cold read and compare"
risk: low
phase: Shipped
stories_total: 2
stories:
  - id: S1.1
    title: "The cold-read skill"
    as_a: "a maker about to run the coaches"
    i_want: "a `cold-read` skill that runs a separate agent (another model family when reachable) under an exclusion list and seals its read with a sha256"
    so_that: "I get an independent view before my own answers shape it"
    risk: low
    status: shipped
  - id: S1.2
    title: "The compare"
    as_a: "a maker who finished the coaches"
    i_want: "a compare step that verifies the seal and writes converged · diverged · only-cold-read · only-coached · decisions"
    so_that: "the cold read changes decisions, not just sits there"
    risk: low
    status: shipped
---
# Coaches v2 — Sprint 1: Cold read and compare

**Status:** ✅ shipped 2026-10-08 — #314, merge `d266917` (plugin + kit 0.41.0, published)

## Stories

### Story 1.1 — The cold-read skill ✅ `bfcf841`, review fixes `1f32383` `6d1baad` `2ffc9ae` `604a267`
**As a** a maker about to run the coaches, **I want** a `cold-read` skill that runs a separate agent (another model family when reachable) under an exclusion list and seals its read with a sha256, **so that** I get an independent view before my own answers shape it.
**Acceptance:** The sealed file has a reading log and self-reported contamination; the hash is recorded; with no other family reachable it falls back and says so.
**Risk:** low

### Story 1.2 — The compare ✅ `c575140`, review fixes `66b05a4` `5aa7dad`
**As a** a maker who finished the coaches, **I want** a compare step that verifies the seal and writes converged · diverged · only-cold-read · only-coached · decisions, **so that** the cold read changes decisions, not just sits there.
**Acceptance:** The compare refuses a file whose hash changed; facilitator-authored sections are marked; the template matches `00-strategy/blind/2026-10-04-compare.md`.
**Risk:** low

## Sprint QA
- **specs:** fixture conversations and pure-logic specs per skill (`strategy-templates.test`, `check-skill-scripts`); the seal and the renderer as pure functions.
- **browser smoke owed:** no.
- **deterministic gate:** unit suites + `check-release` and `check-onboarding-parity` green (a plugin release under `skills/RELEASING.md`).

## Sprint 1 — Smoke walkthrough (do these in order)
Env: a local repo with the plugin installed from this branch's release

1. In a repo with a Roadmap, run `/golden-frijoles:cold-read`
   → a sealed file appears under `Roadmap/00-strategy/cold-read/` and its hash is printed.
2. Edit one character of the sealed file, then run the compare
   → it refuses and names the hash mismatch.

If any step fails, note the step number + what you saw — that's the bug report.

**Run 2026-10-08 against the published kit (`npx -y @golden-frijoles/kit@0.41.0`), a scratch repo:** step 1 (the seal
half): `cold-read seal` printed the read's sha256 and wrote the `.sha256` beside the read ✅. Step 2: one character
changed, `cold-read compare` exited 1 naming both hashes (sealed vs now), and wrote no compare ✅. **Owed to the
PO:** step 1 as an interactive `/golden-frijoles:cold-read` run (Codex reachable, or the same-family fallback) in a real
repo.
