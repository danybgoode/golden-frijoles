# Drill impact for agents — Retrospective

_Closed: 2026-10-16_
_Intent: yes_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $15–34 (M, n=24, p25–p75) → ≈$21.13 (−38% vs the quote's top)_
<!-- The actual is STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_* into
     the README (finops S2.5); copy its numbers here. -->
_Crew (actual): claude-opus-5-5 ≈$19.94 · claude-sonnet-5-5 ≈$1.19 · reviewers: fresh verifier on both PRs; agy gpt-oss-120b-medium (general, scoped passes); vibe (security lens, scoped) · prose: the architect — Codex was capped all run, so agy took the general pass and vibe the security lens; agy needed two scoped passes per PR to fit its context._
<!-- The models are STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_models
     into the README (why-as-a-story D6). Codex, agy, Devin and other outside tools are not in the transcripts; name
     them from the PR's review records. -->

## What shipped
- **S1 · Bind and capture — #382 (`a0cf3ba`).** A drill binds to an experiment at define time (`--experiment <key>@<version>`,
  and an Experiment select on the page listing only that flag version's bound experiments); an unknown key, a missing
  version or an unbound flag version is refused by name. Migration `20261018100000` adds the owner door
  (`owner_get_scenario_impact_source` / `owner_record_scenario_impact_evidence`, owner-only, service-role only, external
  cohort refused), so impact capture no longer needs a Miyagi `flag_admin` key. A stop captures a bound drill's impact
  and never fails because of it; `frijoles scenarios impact <run-id> --capture` retries, idempotently. **S1.4 (added at
  the lock):** golden-frijoles' probe had recorded no drill evidence ever — fixed.
- **S2 · Read — #384 (`fc504cb`).** One pure rule (`lib/scenario-run-impact.ts`) behind `frijoles scenarios impact
  <run-id> [--json]` (control vs treatment, or exactly one state line) and the connector's `impact` per run. CLI 1.10.0,
  plugin + kit 1.10.4 (which also carries the agy 1.4.0 review-rail pin).
- **Side fixes:** #381 extended two expired design deferrals (Daniel's call) that had turned `test:unit` red on every PR.

## What went well
- **The lock's live-data read changed the epic before any code.** Two premises were false: golden-frijoles has no
  experiment (and no agent path makes one), and its drills had never recorded a `scenario_executed` — 14 probe requests,
  zero events. The second was a one-line bug (`createGrowthEngineClient` with no `userId` → `NO_USER`, swallowed by the
  probe's `.catch`), found by running the built SDK against the probe's exact input rather than by reading code.
- **The verifier earned its pass on both PRs.** On #382 it found three tests passing for the wrong reason (the probe test
  never touched the route; the ownership refusal was indistinguishable from the external-cohort one; DB idempotency and
  the cross-project boundary were never exercised) and a stale owed ledger. On #384 it caught the missing paired
  plugin/kit release and a read that derived "not captured" from different facts than the capture.
- **Mutation checks kept honest.** The first SF1 mutation silently didn't apply (Prettier had reshaped the line) and
  "passed"; re-doing it showed the test failing as it should.

## What we learned
- **A swallowed failure plus a fake in the test is a total, silent data loss.** The probe's `track` was faked in its unit
  test, and the real client's `NO_USER` was caught and discarded, so nothing anywhere went red while every drill's
  evidence was dropped. Test the real client at the seam, and build it through the one helper the route uses.
- **A CLI bump is a plugin + kit release here.** Moving the setup skill's `cli@` pin is a shipped-file change;
  `check-release` refuses it without plugin.json, kit, CHANGELOG, every `kit@` pin and the checksums moving too.
- **A mutation that doesn't apply looks exactly like a test that passes.** Confirm the mutation is in the file before
  reading the result.
- **agy's limits are context, not just argv:** a 131 KB code-only attachment overflowed `gpt-oss-120b-medium`
  ("no messages fit within the context token budget"), and an untracked `node_modules` symlink in the review worktree
  aborted it. Scope with `--paths` into two passes; never leave a symlink in the worktree agy reads.

## Gaps / follow-ups
- **Owed to the product owner (Daniel):** build an experiment on `site.drill_fault` in the console (none exists in
  golden-frijoles) and **start** it — a draft experiment has no analysis, so a capture answers
  `lifecycle_unavailable`; publish **CLI 1.10.0** to npm (kit 1.10.4 pins it); then the Sprint 1 steps 2–4 and Sprint 2
  walkthrough, ending in **S2.3 — the D11 judgment** (keep / reword / hide), written into `scenarios-pm-operable` D11.
- The drill's probes also need `SCENARIO_PROBE_SECRET` to run `scripts/scenario-drill.mjs` (a production secret).
- The bet reads ~2026-11-15: stopped drills with impact evidence in golden-frijoles, 0 → 2.
- Not built: an agent path to create an experiment. If S2.3 says "reword", the copy change is a follow-up idea.
- The impact read and connector state follow the dashboard view's newest-100 windows (a very old run reads not found).
