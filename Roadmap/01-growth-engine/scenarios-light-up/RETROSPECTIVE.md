# Scenarios, switched on: an agent can set up a target, run a drill and stop it — Retrospective

_Closed: 2026-10-13_
_Intent: yes_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $56–79 (L, n=5, p25–p75) → ≈$27.17 (under the quote's bottom by about half; Claude only, reviewers not
measured. Two verifier rounds on #348.)_
_Crew (actual): claude-opus-5-5 ≈$27.10 · claude-sonnet-5-5 ≈$0.06 stamped (the three Sonnet builders worked on their own
`build/` branches, which the stamp does not count) · reviewers: the fresh verifier (general + security lens, two rounds),
agy GPT-OSS (security + general; Codex capped) · prose: the orchestrator — as planned: Opus took the engine, the owner
service, the CLI route and the production drill; Sonnet built the CLI commands, the page's target setup and the
connector tool, and two of the three needed a fix after the re-check (a help sentence; a loose test)._

## What shipped

- **Sprint 1 — anyone can make an app a target (#348, merge `805f5cf`).** A new `owner_token_v1` target kind with
  owner-only register and verify: a one-time `gf_target_…` token, stored only as its SHA-256; verification is a fresh
  challenge the app answers with an HMAC keyed by that hash. SDK 1.1.0 ships the app's side
  (`createScenarioOwnershipHandler`). One owner service (`lib/scenario-owner-service.ts`) behind the page and a new CLI
  route; `frijoles scenarios ls · targets add|verify|revoke · define · launch · stop · runs` (CLI 1.4.0); target setup on
  the scenarios page.
- **Sprint 2 — our site, the drill, the switches.** goldenfrijoles.com serves the SDK ownership route and a probe only the
  drill can reach; `scripts/scenario-drill.mjs`; a read-only `list_scenarios` connector tool; the plugin's drills guide
  (1.7.0). In production on 2026-10-13: the target verified for real; an agent defined, launched and stopped a 50%
  1.5 s delay drill through the CLI (3 fault / 5 control probes, then idle); the product owner launched and stopped a run
  from the page; the drill controls were killed and came back (the rollback path, checked live); security drills
  switched on. Drill controls, resilience and security drills are on in production; automatic breakers stay off.

## What went well

- **Rehearsing the whole drill locally before production** caught nothing new, and production still found one bug — but
  the rehearsal meant the production run had only one thing that could be wrong, and it was found in one probe batch.
- **The product owner's "agents first" call reshaped the epic at the right moment**: before any code, when the target gap
  was found, not after a page-only build.

## What we learned

- **`{ baseUrl: undefined }` is not "use the default".** The SDK reads a present-but-empty `baseUrl` as unconfigured
  (SDK 1.0 D1), so the probe silently never fetched in production (#350). Spread optional config (`...(url ? { baseUrl:
  url } : {})`); the local rehearsal hid it because it set the variable.
- **"Built" can mean "built for one customer".** Target setup existed, but only through a Miyagi credential route; the
  page could only say "waiting on target verification". Before switching a surface on, try the whole path as a stranger
  would.

## Gaps / follow-ups

- **The impact comparison (D11)** could not be judged: impact is recorded only for a drill bound to an experiment, through
  a Miyagi-only route. Seeded as `drill-impact-for-agents`.
- **Owed to the product owner:** the _Intent_ word.
- The flags page's "On" disagreeing with the CLI surfaced during this drill and became its own epic, `one-flag-switch`.
