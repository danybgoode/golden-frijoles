# One flag switch: on or off, the same in the CLI, the SDK, MCP and the page — Retrospective

_Closed: 2026-10-13_
_Quote vs actual: $15–32 (M, n=21, p25–p75) → ≈$57.91 (about 80% over the quote's top; Claude only, reviewers not
measured. It grew from one fix to five stories at the product owner's asks, and S1.1–S1.3 took three verifier rounds.)_
_Crew (actual): claude-opus-5-5 ≈$57.91 · reviewers: the fresh verifier (seven passes across #351–#353, security lens on
the migration), agy GPT-OSS (general + security; Codex capped) · prose: the orchestrator — no Sonnet builders: every story
touched the flags control plane, the money-path switch or a migration._

## What shipped

- **#351 — one switch (S1.1–S1.3).** A flag is **On or Off** per environment, from what the environment serves
  (`flagSwitchState`); "never turned on", the dormant group and "activated" left every screen. The page switch writes
  through the CLI's and MCP's own core (`executeCliFlagWrite`: on = `set`, off = `kill`); the page's second "off"
  (deactivate) is gone. `frijoles flags ls/get` say the same (CLI 1.5.0). The approved flags-list design was amended to
  the product owner's words. Product gates keep their coded fallback for a flag never set (`toGateRows`).
- **#352 — On says who it reaches (S1.4).** `everyone`, `25% of people`, `a segment (not named yet)` (the placeholder
  until named segments), following the evaluator to the end (CLI 1.5.1).
- **#353 — synced flags start as written (S1.5).** A NEW flag pushed by `frijoles flags sync` goes live as written in its
  source file (default and rules), in every environment; an existing flag is never switched by a sync. The sync output
  says what each new flag now serves. The one rule moved into the SDK (1.2.0) so the page, the CLI, MCP and the sync
  output call one function (CLI 1.5.2, plugin + kit 1.7.3). Migration `20261013200000`.

## What went well

- **A parity test between the page and the CLI**, mutation-checked, plus a signed-in round trip (CLI → page → CLI). The
  bug that started this epic was exactly a split between two surfaces, and now a split goes red.
- **The verifier earned every round**: it caught a change to the product's own gate behaviour (a gate never set read off
  instead of its fallback), rule precedence, and a reach line that named only the first rule.

## What we learned

- **When two surfaces show "the same" thing, test them against each other, not each against a spec.** Every screen here
  was tested, and the page and the CLI still disagreed in production, because each was right by its own definition.
- **A display rule silently reaches every reader of its data.** Changing the CLI view's `state` also changed the product's
  gate seam, which read the same rows. Before changing what a shared view says, grep who reads it.

## Gaps / follow-ups

- The flags page fails past a few hundred flags (the registry read sends every flag id in its URL) — on `main` before
  this epic; not yet seeded.
- Named segments, so "a segment (not named yet)" becomes a name — `tars-segments` (after launch).
